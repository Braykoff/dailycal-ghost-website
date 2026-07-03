#!/usr/bin/env python3
"""Compare a SQLite .db file to its last committed version and open a diff UI."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def find_repo_root(start: Path) -> Path | None:
    """Return the git repository root containing ``start``, if any."""
    path = start.resolve()
    if path.is_file():
        path = path.parent
    for candidate in [path, *path.parents]:
        if (candidate / ".git").exists():
            return candidate
    return None


def git_path_exists(repo_root: Path, rel_path: str, ref: str = "HEAD") -> bool:
    """Return True if ``rel_path`` exists at ``ref`` in the repository."""
    result = subprocess.run(
        ["git", "-C", str(repo_root), "cat-file", "-e", f"{ref}:{rel_path}"],
        capture_output=True,
        check=False,
    )
    return result.returncode == 0


def extract_committed_db(repo_root: Path, rel_path: str, dest: Path) -> None:
    """Write the committed version of ``rel_path`` at HEAD to ``dest``."""
    result = subprocess.run(
        ["git", "-C", str(repo_root), "show", f"HEAD:{rel_path}"],
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        stderr = result.stderr.decode().strip()
        raise RuntimeError(f"Could not read HEAD:{rel_path} from git ({stderr})")
    dest.write_bytes(result.stdout)


def files_differ_from_head(repo_root: Path, rel_path: str) -> bool:
    """Return True if the working tree copy differs from HEAD."""
    result = subprocess.run(
        ["git", "-C", str(repo_root), "diff", "--quiet", "HEAD", "--", rel_path],
        check=False,
    )
    return result.returncode != 0


def find_sqldiff() -> Path | None:
    """Locate the sqldiff binary, including common Homebrew install paths."""
    for candidate in (
        shutil.which("sqldiff"),
        "/opt/homebrew/bin/sqldiff",
        "/usr/local/bin/sqldiff",
    ):
        if candidate and Path(candidate).is_file():
            return Path(candidate)
    return None


def find_editor_cli() -> Path | None:
    """Locate a Cursor or VS Code CLI for opening files and diffs."""
    for candidate in (
        shutil.which("cursor"),
        shutil.which("code"),
        "/Applications/Cursor.app/Contents/Resources/app/bin/cursor",
        "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
    ):
        if candidate and Path(candidate).is_file():
            return Path(candidate)
    return None


def run_sqldiff(sqldiff: Path, old_db: Path, new_db: Path) -> str:
    """Return SQL statements that transform ``old_db`` into ``new_db``."""
    result = subprocess.run(
        [str(sqldiff), str(old_db), str(new_db)],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "sqldiff failed")
    return result.stdout


def dump_db(db_path: Path, dest: Path) -> None:
    """Write a SQL dump of ``db_path`` to ``dest``."""
    with dest.open("w", encoding="utf-8") as handle:
        result = subprocess.run(
            ["sqlite3", str(db_path), ".dump"],
            stdout=handle,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"sqlite3 dump failed for {db_path}")


def open_in_editor(editor: Path, path: Path) -> None:
    """Open a single file in Cursor/VS Code."""
    subprocess.Popen([str(editor), str(path)])


def open_side_by_side_diff(editor: Path | None, left: Path, right: Path) -> None:
    """Open a side-by-side diff UI."""
    if editor is not None:
        subprocess.Popen([str(editor), "--diff", str(left), str(right)])
        return

    opendiff = shutil.which("opendiff")
    if opendiff:
        subprocess.Popen([opendiff, str(left), str(right)])
        return

    raise RuntimeError(
        "No diff viewer found. Install Cursor/VS Code or use macOS FileMerge (opendiff)."
    )


def parse_args(argv: list[str]) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description=(
            "Compare a SQLite .db file against its last committed version "
            "and open a UI showing what changed."
        )
    )
    parser.add_argument(
        "db_file",
        type=Path,
        help="Path to the .db file (e.g. content/data/ghost.db)",
    )
    parser.add_argument(
        "--keep-artifacts",
        action="store_true",
        help="Print paths to generated SQL files instead of using a temp directory.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """CLI entry point."""
    args = parse_args(argv or sys.argv[1:])
    db_path = args.db_file.expanduser().resolve()

    if not db_path.is_file():
        print(f"Error: file not found: {db_path}", file=sys.stderr)
        return 1

    if db_path.suffix.lower() != ".db":
        print(f"Error: expected a .db file, got: {db_path.name}", file=sys.stderr)
        return 1

    if shutil.which("sqlite3") is None:
        print("Error: sqlite3 is required but was not found on PATH.", file=sys.stderr)
        return 1

    repo_root = find_repo_root(db_path)
    if repo_root is None:
        print(f"Error: {db_path} is not inside a git repository.", file=sys.stderr)
        return 1

    rel_path = db_path.relative_to(repo_root).as_posix()

    if not git_path_exists(repo_root, rel_path):
        print(
            f"Error: {rel_path} has no committed version at HEAD.",
            file=sys.stderr,
        )
        print("Track and commit the file first, then modify it.", file=sys.stderr)
        return 1

    if not files_differ_from_head(repo_root, rel_path):
        print(f"No changes since last commit: {rel_path}")
        return 0

    artifact_dir = Path(tempfile.mkdtemp(prefix=f"sql-diff-{db_path.stem}-"))
    committed_db = artifact_dir / f"{db_path.stem}.committed.db"
    changes_sql = artifact_dir / f"{db_path.stem}.changes.sql"
    committed_dump = artifact_dir / f"{db_path.stem}.committed.sql"
    current_dump = artifact_dir / f"{db_path.stem}.working.sql"

    try:
        extract_committed_db(repo_root, rel_path, committed_db)
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    editor = find_editor_cli()
    sqldiff = find_sqldiff()

    if sqldiff is not None:
        try:
            diff_sql = run_sqldiff(sqldiff, committed_db, db_path)
        except RuntimeError as exc:
            print(f"Warning: sqldiff failed ({exc}); falling back to SQL dumps.", file=sys.stderr)
            sqldiff = None
        else:
            changes_sql.write_text(diff_sql, encoding="utf-8")
            if not diff_sql.strip():
                print(f"No schema or row changes detected in {rel_path}.")
                print("(Git reports a binary difference, likely page layout or metadata.)")
                if args.keep_artifacts:
                    print(f"Artifacts: {artifact_dir}")
                return 0

            print(f"Opened SQL diff for {rel_path} ({len(diff_sql.splitlines())} lines).")
            if args.keep_artifacts:
                print(f"Changes: {changes_sql}")
            elif editor is not None:
                open_in_editor(editor, changes_sql)
            else:
                print(changes_sql.read_text(encoding="utf-8"))
            return 0

    try:
        dump_db(committed_db, committed_dump)
        dump_db(db_path, current_dump)
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    if sqldiff is None:
        print(
            "Tip: install sqldiff for a concise change summary (`brew install sqlite`).",
            file=sys.stderr,
        )

    print(f"Opened side-by-side SQL dump diff for {rel_path}.")
    if args.keep_artifacts:
        print(f"Committed dump: {committed_dump}")
        print(f"Working dump:   {current_dump}")
        return 0

    try:
        open_side_by_side_diff(editor, committed_dump, current_dump)
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        print(f"Diff files were written to: {artifact_dir}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
