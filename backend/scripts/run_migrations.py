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
    if first_upgrade.returncode == 0:
        _print_streams(first_upgrade)
        return

    combined_output = f"{first_upgrade.stdout}\n{first_upgrade.stderr}".lower()
    duplicate_users_table = (
        "relation \"users\" already exists" in combined_output
        or "duplicate table" in combined_output
    )

    if not duplicate_users_table:
        _print_streams(first_upgrade)
        raise RuntimeError("alembic upgrade head failed")

    stamp = _run_alembic("stamp", "head")
    _print_streams(stamp)
    if stamp.returncode != 0:
        raise RuntimeError("alembic stamp head failed")

    second_upgrade = _run_alembic("upgrade", "head")
    _print_streams(second_upgrade)
    if second_upgrade.returncode != 0:
        raise RuntimeError("alembic upgrade head failed after stamp")


if __name__ == "__main__":
    try:
        _run()
    except Exception as exc:  # pragma: no cover
        print(f"Migration bootstrap failed: {exc}", file=sys.stderr)
        raise
