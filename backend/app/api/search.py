"""Global search API routes — search across videos, analyses, and transcripts."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.models import Analysis, User, Video, TranscriptChunk
from app.schemas.schemas import AnalysisResponse, VideoResponse

router = APIRouter()

@router.get("/")
async def global_search(
    q: str = Query(..., min_length=1),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 10,
):
    """
    Search across videos (title), analyses (overview), and transcripts.
    Returns a unified list of results.
    """
    # 1. Search Videos
    video_stmt = (
        select(Video)
        .join(Analysis, Analysis.video_id == Video.id)
        .where(
            Analysis.user_id == user.id,
            or_(
                Video.title.ilike(f"%{q}%"),
                Video.channel.ilike(f"%{q}%")
            )
        )
        .limit(limit)
    )
    video_res = await db.execute(video_stmt)
    videos = video_res.scalars().all()

    # 2. Search Analyses Content
    analysis_stmt = (
        select(Analysis)
        .where(
            Analysis.user_id == user.id,
            Analysis.overview.ilike(f"%{q}%")
        )
        .limit(limit)
    )
    analysis_res = await db.execute(analysis_stmt)
    analyses = analysis_res.scalars().all()

    # 3. Search Transcript Chunks (Keyword search fallback for now, vector search is in chat)
    chunk_stmt = (
        select(TranscriptChunk)
        .join(Video, Video.id == TranscriptChunk.video_id)
        .join(Analysis, Analysis.video_id == Video.id)
        .where(
            Analysis.user_id == user.id,
            TranscriptChunk.text.ilike(f"%{q}%")
        )
        .limit(limit)
    )
    chunk_res = await db.execute(chunk_stmt)
    chunks = chunk_res.scalars().all()

    # Unified Mapped Results
    results = []
    
    seen_video_ids = set()
    
    for v in videos:
        results.append({
            "type": "video",
            "id": str(v.id),
            "title": v.title,
            "subtitle": v.channel,
            "thumbnail": v.thumbnail_url,
            "platform_id": v.platform_id,
        })
        seen_video_ids.add(v.id)

    for a in analyses:
        if a.video_id in seen_video_ids: continue
        results.append({
            "type": "analysis",
            "id": str(a.id),
            "title": "Analysis Result",
            "subtitle": a.overview[:100] + "..." if a.overview else "",
            "video_id": str(a.video_id),
        })
        seen_video_ids.add(a.video_id)

    for c in chunks:
        if c.video_id in seen_video_ids: continue
        results.append({
            "type": "transcript",
            "id": str(c.id),
            "title": "Transcript Match",
            "subtitle": c.text[:100] + "...",
            "video_id": str(c.video_id),
            "timestamp": c.start_time,
        })
        seen_video_ids.add(c.video_id)

    return results
