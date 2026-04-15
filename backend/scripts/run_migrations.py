import subprocess
import sys


def _run_alembic(*args: str) -> subprocess.CompletedProcess[str]:
    cmd = ["python3", "-m", "alembic", *args]
    return subprocess.run(cmd, check=False, capture_output=True, text=True)


def _print_streams(result: subprocess.CompletedProcess[str]) -> None:
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)


def _run() -> None:
    first_upgrade = _run_alembic("upgrade", "head")
    _print_streams(first_upgrade)
    if first_upgrade.returncode != 0:
        raise RuntimeError("alembic upgrade head failed")


if __name__ == "__main__":
    try:
        _run()
    except Exception as exc:  # pragma: no cover
        print(f"Migration bootstrap failed: {exc}", file=sys.stderr)
        raise
