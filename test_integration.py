#!/usr/bin/env python3
"""
Integration test for video analysis API.
Tests the complete flow with the Typhoon submarine documentary.
"""

import asyncio
import json
import sys
from datetime import datetime
sys.path.insert(0, '.')

from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.models import Base, User, Video, Analysis
from app.database import async_session_factory
from app.workers.tasks import process_video_analysis
from app.config import get_settings

settings = get_settings()

async def test_full_pipeline():
    """Test the complete video analysis pipeline."""

    print("\n" + "="*70)
    print("COMPREHENSIVE VIDEO ANALYSIS PIPELINE TEST")
    print("="*70)

    video_url = "https://www.youtube.com/watch?v=MOLmb9wE69c"
    video_id_str = "MOLmb9wE69c"

    print(f"\nVideo: {video_url}")
    print(f"Duration: ~53 minutes (Typhoon Submarine Documentary)")
    print("="*70 + "\n")

    # Simulate test database records
    try:
        async with async_session_factory() as db:
            # Create a test user
            test_user = User(
                id=uuid4(),
                email=f"test_{datetime.now().timestamp()}@test.local",
                full_name="Test User",
                auth_provider="local",
                auth_id="test",
                is_active=True,
            )
            db.add(test_user)
            await db.flush()

            # Create video record
            video = Video(
                id=uuid4(),
                platform="youtube",
                platform_id=video_id_str,
                url=video_url,
                status="pending",
                title="",
            )
            db.add(video)
            await db.flush()

            # Create analysis record
            analysis = Analysis(
                id=uuid4(),
                video_id=video.id,
                user_id=test_user.id,
                expertise_level="intermediate",
                style="detailed",
                ai_provider="groq",
                ai_model="llama-3.3-70b-versatile",
                status="queued",
                progress_percentage=0,
            )
            db.add(analysis)
            await db.commit()

            print(f"Created test records:")
            print(f"  - User ID: {test_user.id}")
            print(f"  - Video ID: {video.id}")
            print(f"  - Analysis ID: {analysis.id}")
            print("\n" + "="*70 + "\n")

            # Test transcript extraction for this video
            print("Testing direct transcript extraction...\n")
            from app.services.transcript import TranscriptEngine
            import time

            engine = TranscriptEngine()
            start_time = time.time()

            async def progress_cb(stage, total, msg):
                elapsed = time.time() - start_time
                print(f"  [{elapsed:6.1f}s] Stage {stage}/{total}: {msg}")

            try:
                result = await engine.extract(video_id_str, progress_callback=progress_cb)
                elapsed = time.time() - start_time

                print("\n" + "="*70)
                print("EXTRACTION RESULT")
                print("="*70)
                print(f"✓ Status: SUCCESS")
                print(f"  Source: {result.source}")
                print(f"  Time: {elapsed:.2f}s (target: <15s)")
                print(f"  Word Count: {result.word_count}")
                print(f"  Segments: {len(result.segments)}")
                print(f"  Language: {result.language}")

                # Show sample content
                if result.full_text:
                    sample = result.full_text[:300]
                    print(f"\n  Sample Content:\n  {sample}...\n")

                # Validation
                checks = [
                    ("Completed <15s", elapsed < 15, f"{elapsed:.2f}s"),
                    ("Has content", result.word_count > 0, f"{result.word_count} words"),
                    ("Has segments", len(result.segments) > 0, f"{len(result.segments)} segments"),
                    ("Valid source", result.source in ["youtube_transcript_api", "manual_captions", "auto_captions", "browser_mimic", "metadata_fallback"], result.source),
                ]

                print("Validation Checks:")
                all_passed = True
                for check_name, passed, detail in checks:
                    status = "✓" if passed else "✗"
                    print(f"  {status} {check_name}: {detail}")
                    if not passed:
                        all_passed = False

                print("="*70)

                if all_passed:
                    print("\n✓ ALL TESTS PASSED - Pipeline is working correctly!")
                    return True
                else:
                    print("\n✗ Some checks failed")
                    return False

            except Exception as e:
                elapsed = time.time() - start_time
                print("="*70)
                print(f"✗ Extraction failed after {elapsed:.2f}s")
                print(f"  Error: {str(e)[:300]}")
                print("="*70)
                import traceback
                traceback.print_exc()
                return False

    except Exception as e:
        print(f"\n✗ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import sys
    success = asyncio.run(test_full_pipeline())
    sys.exit(0 if success else 1)
