#!/usr/bin/env python3
"""
Test script for transcript optimization.
Tests the ultra-fast extraction pipeline with a real YouTube video.
"""

import asyncio
import sys
import time
from app.services.transcript import TranscriptEngine

async def test_video_extraction():
    """Test transcript extraction for the video."""
    video_id = "MOLmb9wE69c"  # Typhoon submarine documentary

    print(f"\n{'='*60}")
    print(f"Testing Ultra-Fast Transcript Extraction")
    print(f"{'='*60}")
    print(f"Video ID: {video_id}")
    print(f"URL: https://www.youtube.com/watch?v={video_id}")
    print(f"Expected Duration: 53 minutes")
    print(f"{'='*60}\n")

    engine = TranscriptEngine()
    start_time = time.time()

    # Track progress
    progress_log = []

    async def progress_callback(stage: int, total: int, msg: str):
        elapsed = time.time() - start_time
        progress_log.append(f"[{elapsed:.1f}s] Stage {stage}/{total}: {msg}")
        print(f"[{elapsed:.1f}s] Stage {stage}/{total}: {msg}")

    try:
        print("Starting extraction...\n")
        result = await engine.extract(video_id, progress_callback=progress_callback)

        elapsed = time.time() - start_time

        print(f"\n{'='*60}")
        print(f"✓ EXTRACTION SUCCESS")
        print(f"{'='*60}")
        print(f"Total Time: {elapsed:.2f} seconds")
        print(f"Source: {result.source}")
        print(f"Language: {result.language}")
        print(f"Word Count: {result.word_count}")
        print(f"Segments: {len(result.segments)}")
        print(f"First 200 chars:\n{result.full_text[:200]}...")
        print(f"{'='*60}\n")

        # Verify requirements
        checks = [
            ("⏱  Completed in <15 seconds", elapsed < 15),
            ("✓ Has transcript content", result.word_count > 0),
            ("✓ Has segments", len(result.segments) > 0),
            ("✓ Valid language", result.language in ["en", "translated", "official", "auto"]),
        ]

        print("Validation Checks:")
        all_passed = True
        for check_name, passed in checks:
            status = "✓" if passed else "✗"
            print(f"  {status} {check_name}")
            if not passed:
                all_passed = False

        if all_passed:
            print("\n🎉 All checks passed! (<15s extraction working perfectly)")
        else:
            print("\n⚠ Some checks failed")

        return all_passed, elapsed

    except Exception as e:
        elapsed = time.time() - start_time
        print(f"\n{'='*60}")
        print(f"✗ EXTRACTION FAILED")
        print(f"{'='*60}")
        print(f"Error: {str(e)}")
        print(f"Time elapsed: {elapsed:.2f}s")
        print(f"{'='*60}\n")
        return False, elapsed

async def main():
    """Run tests."""
    try:
        success, elapsed = await test_video_extraction()

        print("\n" + "="*60)
        print("FINAL RESULT")
        print("="*60)
        if success:
            print("✓ ULTRA-FAST EXTRACTION WORKING")
            print(f"  - Completed in {elapsed:.2f} seconds (target: <15s)")
            print(f"  - Ready for production deployment")
        else:
            print("✗ EXTRACTION FAILED - NEEDS DEBUG")
        print("="*60 + "\n")

        sys.exit(0 if success else 1)

    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
