"""
Background worker tasks using ARQ (async Redis queue).

Tasks:
  - process_video_analysis: Full pipeline for YouTube URL analysis
  - process_upload: File upload → audio extraction → Whisper → analysis
"""

import logging
from uuid import UUID

from sqlalchemy import select

from app.config import get_settings
from app.database import async_session_factory
from app.models.models import Analysis, Transcript, TranscriptChunk, Video, Document, DocumentChunk
from app.services.ai_pipeline import (
    chunk_transcript,
    generate_embeddings,
    synthesize_content,
)
from app.services.transcript import TranscriptEngine, extract_metadata, TranscriptResult, TranscriptSegment

logger = logging.getLogger(__name__)
settings = get_settings()

transcript_engine = TranscriptEngine()


# ──────────────────────────────────────────────
# ENQUEUE HELPERS (called from API routes)
# ──────────────────────────────────────────────

async def _get_redis_pool():
    """Create an ARQ Redis connection pool."""
    from arq import create_pool
    from arq.connections import RedisSettings
    import urllib.parse

    parsed = urllib.parse.urlparse(settings.REDIS_URL)
    redis_settings = RedisSettings(
        host=parsed.hostname or "localhost",
        port=parsed.port or 6379,
    )
    return await create_pool(redis_settings)


async def enqueue_video_analysis(
    analysis_id: str,
    video_ids: list[str],
    expertise: str = "intermediate",
    style: str = "detailed",
    language: str = "English",
    full_analysis: bool = False,
):
    """Enqueue a video analysis job via ARQ Redis queue."""
    pool = await _get_redis_pool()
    await pool.enqueue_job(
        "process_video_analysis",
        analysis_id, video_ids, expertise, style, language, full_analysis,
    )
    await pool.close()


async def enqueue_upload_processing(
    video_id: str,
    analysis_id: str,
    file_path: str,
    user_id: str,
):
    """Enqueue an upload processing job via ARQ Redis queue."""
    pool = await _get_redis_pool()
    await pool.enqueue_job(
        "process_upload",
        video_id, analysis_id, file_path, user_id,
    )
    await pool.close()


async def enqueue_document_processing(
    document_id: str,
    file_path: str,
    file_type: str,
):
    """Enqueue a document processing job via ARQ Redis queue."""
    pool = await _get_redis_pool()
    await pool.enqueue_job(
        "process_document",
        document_id, file_path, file_type,
    )
    await pool.close()



# ──────────────────────────────────────────────
# WORKER TASKS
# ──────────────────────────────────────────────

async def process_video_analysis(
    ctx: dict,
    analysis_id: str,
    video_ids: list[str],
    expertise: str,
    style: str,
    language: str,
    full_analysis: bool = False,
):
    """
    Fast video analysis with early transcript delivery.

    Phase 1 (Fast): Extract transcript + chunks (8-15s)
    Phase 2 (Background): AI synthesis (30-60s)

    User gets transcript immediately, AI synthesis updates async.
    """
    async with async_session_factory() as db:
        try:
            analysis = await _get_analysis(db, analysis_id)
            if not analysis:
                logger.error(f"Analysis {analysis_id} not found")
                return

            analysis.status = "processing"
            analysis.progress_percentage = 5
            await db.commit()

            import asyncio
            import time
            start_time = time.time()

            # PHASE 1: FAST TRANSCRIPT EXTRACTION (8-15s)
            logger.info(f"Analysis {analysis_id}: PHASE 1 - Transcript extraction starting...")

            async def process_single_video_transcript_only(vid_wid_str: str):
                """Extract transcript only - fast path for quick delivery."""
                async with async_session_factory() as vid_db:
                    vid_uuid = UUID(vid_wid_str)
                    video = await _get_video(vid_db, vid_uuid)
                    if not video:
                        return None, None

                    video.status = "processing"
                    video.progress_percentage = 10
                    await vid_db.commit()

                    platform_id = video.platform_id
                    if not platform_id and video.url:
                        import re
                        match = re.search(r"[?&]v=([a-zA-Z0-9_-]{11})", video.url or "")
                        if match:
                            platform_id = match.group(1)

                    # PARALLEL METADATA + TRANSCRIPT EXTRACTION
                    # Both happen concurrently to maximize speed
                    import asyncio
                    metadata = {}
                    transcript_result = None

                    try:
                        metadata, transcript_result = await asyncio.gather(
                            extract_metadata(platform_id),
                            transcript_engine.extract(platform_id),
                            return_exceptions=True
                        )

                        # Handle exceptions from gather
                        if isinstance(metadata, Exception):
                            logger.debug(f"Metadata extraction failed: {metadata}")
                            metadata = {}
                        if isinstance(transcript_result, Exception):
                            logger.error(f"[{platform_id}] Transcript extraction error: {type(transcript_result).__name__}: {transcript_result}")
                            transcript_result = None

                        # Update video with metadata (always safe to do)
                        if metadata:
                            video.title = metadata.get("title", video.title)
                            video.channel = metadata.get("channel", video.channel)
                            video.duration_seconds = metadata.get("duration_seconds", video.duration_seconds)
                            video.thumbnail_url = metadata.get("thumbnail_url", video.thumbnail_url)
                            video.description = metadata.get("description", video.description)
                            await vid_db.commit()
                            logger.info(f"[{platform_id}] Metadata stored: {video.title}")

                    except Exception as e:
                        logger.error(f"[{platform_id}] Parallel extraction outer error: {e}", exc_info=True)
                        # Don't return None - continue with what we have (metadata might be partial)

                    # Store transcript (fallback to metadata if extraction failed)
                    if not transcript_result:
                        logger.warning(f"[{platform_id}] Transcript extraction failed, creating metadata fallback transcript")
                        # Create fallback transcript from metadata
                        if metadata:
                            fallback_text = f"VIDEO: {metadata.get('title', 'Unknown')}\n\n"
                            fallback_text += f"DESCRIPTION:\n{metadata.get('description', 'No description available')}"

                            # Create pseudo-segments from chapters
                            segments = []
                            for ch in metadata.get('chapters', []):
                                try:
                                    time_str = ch.get('time', '0:00')
                                    parts = time_str.split(':')
                                    start = 0
                                    if len(parts) == 3: start = int(parts[0])*3600 + int(parts[1])*60 + int(parts[2])
                                    elif len(parts) == 2: start = int(parts[0])*60 + int(parts[1])

                                    segments.append({
                                        "start": float(start),
                                        "end": float(start + 60),
                                        "text": f"Chapter: {ch.get('label', 'Chapter')}"
                                    })
                                except:
                                    pass

                            # Create fallback TranscriptResult
                            from app.services.transcript import TranscriptResult, TranscriptSegment
                            transcript_result = TranscriptResult(
                                full_text=fallback_text,
                                segments=[TranscriptSegment(**seg) for seg in segments] if segments else [TranscriptSegment(start=0, end=60, text="Metadata Analysis")],
                                language="en",
                                source="metadata_fallback",
                                word_count=len(fallback_text.split())
                            )
                            logger.info(f"[{platform_id}] Created fallback transcript with {len(segments)} chapters")
                        else:
                            logger.error(f"[{platform_id}] No metadata available for fallback")
                            return None, metadata

                    # Store transcript
                    transcript_result_obj = await vid_db.execute(
                        select(Transcript).where(Transcript.video_id == vid_uuid)
                    )
                    existing_transcript = transcript_result_obj.scalar_one_or_none()

                    if existing_transcript:
                        existing_transcript.full_text = transcript_result.full_text
                        existing_transcript.language = transcript_result.language
                        existing_transcript.source = transcript_result.source
                        existing_transcript.word_count = transcript_result.word_count
                        existing_transcript.timestamps_json = [{"start": s.start, "end": s.end, "text": s.text} for s in transcript_result.segments]
                    else:
                        transcript_record = Transcript(
                            video_id=vid_uuid,
                            full_text=transcript_result.full_text,
                            language=transcript_result.language,
                            source=transcript_result.source,
                            word_count=transcript_result.word_count,
                            timestamps_json=[{"start": s.start, "end": s.end, "text": s.text} for s in transcript_result.segments],
                        )
                        vid_db.add(transcript_record)

                    # Chunk transcript
                    chunks = chunk_transcript(transcript_result.full_text)
                    from sqlalchemy import delete
                    await vid_db.execute(delete(TranscriptChunk).where(TranscriptChunk.video_id == vid_uuid))

                    for chunk_data in chunks:
                        chunk_record = TranscriptChunk(
                            video_id=vid_uuid,
                            chunk_index=chunk_data["chunk_index"],
                            text=chunk_data["text"],
                            start_time=chunk_data.get("start_time"),
                            end_time=chunk_data.get("end_time"),
                            token_count=chunk_data.get("token_count"),
                            embedding=None,
                        )
                        vid_db.add(chunk_record)

                    video.status = "ready"
                    await vid_db.commit()

                    return transcript_result.full_text, metadata

            # Extract transcripts for all videos
            tasks_phase1 = [process_single_video_transcript_only(vid_id) for vid_id in video_ids]
            results_phase1 = await asyncio.gather(*tasks_phase1, return_exceptions=True)

            all_transcripts = [r[0] for r in results_phase1 if r and r[0] and not isinstance(r, Exception)]
            all_metadata = [r[1] for r in results_phase1 if r and r[1] and not isinstance(r, Exception)]

            # CRITICAL: Always mark Phase 1 as complete at 50%, even if some extraction failed
            # This ensures user sees whatever we extracted (chapters from metadata)
            phase1_elapsed = time.time() - start_time
            logger.info(f"Analysis {analysis_id}: PHASE 1 complete in {phase1_elapsed:.1f}s (transcripts: {len(all_transcripts)}, metadata: {len(all_metadata)})")

            # MARK ANALYSIS AS TRANSCRIPT-READY (50% complete) + STORE CHAPTERS
            analysis.status = "completed"  # Mark as ready even if AI synthesis pending
            analysis.progress_percentage = 50
            analysis.status_message = "Transcript extracted. Generating AI insights..."

            # STORE CHAPTERS FROM METADATA (from Phase 1)
            if all_metadata and len(all_metadata) > 0:
                primary_metadata = all_metadata[0]
                # Store chapters/timestamps from metadata so they're immediately available
                if primary_metadata.get("chapters"):
                    analysis.timestamps = primary_metadata.get("chapters")

            await db.commit()  # SAVE NOW - user gets results here regardless of Phase 2

            # PHASE 2: AI SYNTHESIS (Background, 30-60s)
            # This continues but doesn't block the user from seeing transcript
            logger.info(f"Analysis {analysis_id}: PHASE 2 - AI synthesis starting (async)...")

            # Safety check: if still no transcripts, skip synthesis
            if not all_transcripts:
                logger.warning(f"Analysis {analysis_id}: No transcripts available even after fallbacks, skipping Phase 2")
                return

            combined_transcript = "\n\n---\n\n".join(all_transcripts)
            word_count = len(combined_transcript.split())
            is_ultra_scale = word_count > 50000

            primary_metadata = all_metadata[0] if all_metadata else {}

            try:
                # Shorter timeout for synthesis
                async with asyncio.timeout(30.0 if not is_ultra_scale else 60.0):
                    ai_result = await synthesize_content(
                        transcript_text=combined_transcript,
                        metadata=primary_metadata,
                        expertise=expertise,
                        style=style,
                        language=language,
                        is_multi_video=len(video_ids) > 1,
                        minimal_mode=not full_analysis,
                    )

                # Store AI results
                mappingFields = [
                    "overview", "key_points", "takeaways", "timestamps", "tags",
                    "roadmap", "quiz", "mind_map", "flashcards", "glossary",
                    "resources", "podcast", "learning_context"
                ]
                for field in mappingFields:
                    val = ai_result.get(field)
                    if val:
                        setattr(analysis, field, val)

                phase2_elapsed = time.time() - start_time - phase1_elapsed
                logger.info(f"Analysis {analysis_id}: PHASE 2 complete in {phase2_elapsed:.1f}s ✓")

            except asyncio.TimeoutError:
                logger.warning(f"Analysis {analysis_id}: AI synthesis timeout (user still has transcript)")
            except Exception as ai_err:
                logger.warning(f"Analysis {analysis_id}: AI synthesis failed: {str(ai_err)[:200]}")

            analysis.progress_percentage = 100
            await db.commit()

            total_elapsed = time.time() - start_time
            logger.info(f"Analysis {analysis_id}: Complete in {total_elapsed:.1f}s (Phase1: {phase1_elapsed:.1f}s, Phase2: {total_elapsed-phase1_elapsed:.1f}s)")

        except Exception as e:
            logger.error(f"Analysis {analysis_id} failed: {e}", exc_info=True)
            try:
                analysis = await _get_analysis(db, analysis_id)
                if analysis:
                    analysis.status = "completed"
                    analysis.progress_percentage = 50
                    analysis.error_message = str(e)[:1000]
                    await db.commit()
            except Exception:
                pass


async def process_upload(
    ctx: dict,
    video_id: str,
    analysis_id: str,
    file_path: str,
    user_id: str,
):
    """Process an uploaded file: transcribe → analyze with granular progress."""
    async with async_session_factory() as db:
        try:
            vid_uuid = UUID(video_id)
            ana_uuid = UUID(analysis_id)
            
            video = await _get_video(db, vid_uuid)
            analysis = await db.scalar(select(Analysis).where(Analysis.id == ana_uuid))
            
            if not video or not analysis:
                logger.error(f"Upload processing aborted: Video {vid_uuid} or Analysis {ana_uuid} not found")
                return

            analysis.status = "processing"
            analysis.progress_percentage = 5
            await db.commit()
            
            import time
            start_time = time.time()

            async def update_prog(p: int):
                video.progress_percentage = p
                await db.commit()
                # 60% for transcription, 40% for analysis
                global_p = int(5 + (p / 100.0 * 55))
                analysis.progress_percentage = global_p
                elapsed = time.time() - start_time
                if global_p > 5:
                    total_est = elapsed / (global_p / 100.0)
                    analysis.estimated_remaining_seconds = max(0, int(total_est - elapsed))
                await db.commit()

            video.status = "processing"
            await update_prog(10)

            # Transcription - uses cloud APIs first, then local Whisper
            engine = TranscriptEngine()
            
            async def transcribe_progress(stage: int, total: int, msg: str):
                # Scale stages 1-3 to progress 10-90
                p = int(10 + (stage / total) * 80)
                await update_prog(p)

            transcript_result = await engine.transcribe_file(file_path, progress_callback=transcribe_progress)
            if not transcript_result:
                video.status = "failed"
                video.error_message = "Transcription failed"
                analysis.status = "failed"
                await db.commit()
                return

            # Store transcript
            transcript_record = Transcript(
                video_id=vid_uuid,
                full_text=transcript_result.full_text,
                language=transcript_result.language,
                source="whisper",
                word_count=transcript_result.word_count,
                timestamps_json=[{"start": s.start, "end": s.end, "text": s.text} for s in transcript_result.segments],
            )
            db.add(transcript_record)
            video.status = "ready"
            await update_prog(100)

            # AI Synthesis
            word_count = transcript_result.word_count
            analysis.progress_percentage = 70
            est_seconds = 20 + int(word_count / 625)
            analysis.estimated_remaining_seconds = est_seconds
            await db.commit()

            ai_result = await synthesize_content(
                transcript_text=transcript_result.full_text,
                metadata={"title": video.title, "channel": "Uploaded Video"},
            )

            # Store core analysis results
            mappingFields = [
                "overview", "key_points", "takeaways", "timestamps", "tags",
                "roadmap", "quiz", "mind_map", "flashcards", "glossary", 
                "resources", "podcast", "learning_context"
            ]
            for field in mappingFields:
                val = ai_result.get(field)
                if val:
                    setattr(analysis, field, val)
            analysis.timestamps = ai_result.get("timestamps")
            analysis.learning_context = ai_result.get("learning_context")
            analysis.tags = ai_result.get("tags")
            
            # Note: specialized tools (roadmap, quiz, mind_map, flashcards, podcast) 
            # are NOT populated here. They are generated on-demand via the generate_tool endpoint.
            
            analysis.status = "completed"
            analysis.progress_percentage = 100
            await db.commit()
            logger.info(f"Upload processing for video {video_id} completed")

        except Exception as e:
            logger.error(f"Upload processing failed: {e}", exc_info=True)
            try:
                video = await _get_video(db, UUID(video_id))
                analysis = await db.scalar(select(Analysis).where(Analysis.id == UUID(analysis_id)))
                if video:
                    video.status = "failed"
                    video.error_message = str(e)[:1000]
                if analysis:
                    analysis.status = "failed"
                    analysis.error_message = str(e)[:1000]
                await db.commit()
            except Exception:
                pass


async def process_document(
    ctx: dict,
    document_id: str,
    file_path: str,
    file_type: str,
):
    """Process an uploaded document: extract text → chunk → embed."""
    async with async_session_factory() as db:
        try:
            doc_uuid = UUID(document_id)
            document = await db.scalar(select(Document).where(Document.id == doc_uuid))
            if not document:
                logger.error(f"Document {document_id} not found")
                return

            document.status = "processing"
            await db.commit()

            # Extract text
            text = await _extract_text_from_file(file_path, file_type)
            if not text:
                document.status = "failed"
                document.error_message = f"Text extraction failed for {file_type}"
                await db.commit()
                return

            # Chunk and Embed
            chunks = chunk_transcript(text)  # reuse the same chunking logic
            chunk_texts = [c["text"] for c in chunks]
            embeddings = await generate_embeddings(chunk_texts)

            for chunk_data, embedding in zip(chunks, embeddings):
                chunk_record = DocumentChunk(
                    document_id=doc_uuid,
                    chunk_index=chunk_data["chunk_index"],
                    text=chunk_data["text"],
                    embedding=embedding if any(e != 0.0 for e in embedding) else None,
                )
                db.add(chunk_record)

            document.status = "ready"
            await db.commit()
            logger.info(f"Document {document_id} processed successfully")

        except Exception as e:
            logger.error(f"Document processing failed: {e}", exc_info=True)
            try:
                document = await db.scalar(select(Document).where(Document.id == UUID(document_id)))
                if document:
                    document.status = "failed"
                    document.error_message = str(e)[:1000]
                    await db.commit()
            except Exception:
                pass


async def _extract_text_from_file(file_path: str, file_type: str) -> str | None:
    """Helper to extract text based on file type. Handles missing optional dependencies gracefully."""
    try:
        if file_type == "pdf":
            try:
                from pypdf import PdfReader
            except ImportError:
                logger.error("pypdf not installed. Install with: pip install pypdf")
                return None
                
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += (page.extract_text() or "") + "\n"
            
            # OCR Fallback if text is too short (likely a scanned document)
            if len(text.strip()) < 50:
                logger.info(f"PDF text extraction minimal ({len(text.strip())} chars). Attempting OCR...")
                try:
                    from pdf2image import convert_from_path
                    import pytesseract
                    
                    # Convert PDF to images
                    images = convert_from_path(file_path)
                    ocr_text = ""
                    for i, image in enumerate(images):
                        ocr_text += f"--- PAGE {i+1} ---\n"
                        ocr_text += pytesseract.image_to_string(image) + "\n"
                    
                    if len(ocr_text.strip()) > len(text.strip()):
                        return ocr_text.strip()
                except ImportError:
                    logger.warning("OCR dependencies not installed. Install with: pip install pytesseract pdf2image")
                except Exception as ocr_err:
                    logger.warning(f"OCR fallback failed: {ocr_err}")
            
            return text.strip()
            
        elif file_type == "docx":
            try:
                import docx
            except ImportError:
                logger.error("python-docx not installed. Install with: pip install python-docx")
                return None
            doc = docx.Document(file_path)
            return "\n".join([para.text for para in doc.paragraphs]).strip()
            
        elif file_type == "txt":
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read().strip()
                
        return None
    except Exception as e:
        logger.error(f"Extraction error for {file_path}: {e}")
        return None


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

async def _get_analysis(db, analysis_id: str) -> Analysis | None:
    result = await db.execute(select(Analysis).where(Analysis.id == UUID(analysis_id)))
    return result.scalar_one_or_none()


async def _get_video(db, video_id: UUID) -> Video | None:
    result = await db.execute(select(Video).where(Video.id == video_id))
    return result.scalar_one_or_none()


# ──────────────────────────────────────────────
# ARQ WORKER CONFIG (for production deployment)
# ──────────────────────────────────────────────

class WorkerSettings:
    """ARQ worker settings — run with: arq app.workers.tasks.WorkerSettings"""
    functions = [process_video_analysis, process_upload, process_document]
    
    # Use the Redis URL from settings
    from arq.connections import RedisSettings
    import urllib.parse
    
    parsed = urllib.parse.urlparse(settings.REDIS_URL)
    redis_settings = RedisSettings(host=parsed.hostname or 'localhost', port=parsed.port or 6379)

    @staticmethod
    async def on_startup(ctx):
        logger.info("ARQ worker started")

    @staticmethod
    async def on_shutdown(ctx):
        logger.info("ARQ worker stopped")
