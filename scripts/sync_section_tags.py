#!/usr/bin/env python3
"""Sync Ghost section tags from theme/sections/data/sections.js.

Usage:
  python3 scripts/sync_section_tags.py
  python3 scripts/sync_section_tags.py path/to/sections.js

For each section tag in the tree:
  - correct slug + label: leave alone
  - correct slug, wrong label: update label (warning)
  - missing: create

For existing Ghost tags whose slug starts with sec_ but are not in the tree:
  - prompt y/n to delete each one

Auth matches scripts/purge_content.py (GHOST_URL / GHOST_ADMIN_EMAIL /
GHOST_ADMIN_PASSWORD).
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from typing import Any

import requests

GHOST_URL = os.environ.get("GHOST_URL", "http://localhost:2368").rstrip("/")
GHOST_ADMIN_EMAIL = os.environ.get("GHOST_ADMIN_EMAIL", "admin@example.com")
GHOST_ADMIN_PASSWORD = os.environ.get("GHOST_ADMIN_PASSWORD", "bogusAdminP@ssw0rd")
GHOST_API_VERSION = os.environ.get("GHOST_API_VERSION", "v6.46")

DEFAULT_SECTIONS_PATH = (
    Path(__file__).resolve().parent.parent / "theme" / "sections" / "data" / "sections.js"
)
SECTION_TAG_PREFIX = "sec_"


class GhostAdminClient:
    """Minimal Ghost Admin API client using staff session cookies."""

    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Accept-Version": GHOST_API_VERSION,
                "Origin": GHOST_URL,
            }
        )
        self._login()

    @property
    def admin_api(self) -> str:
        return f"{GHOST_URL}/ghost/api/admin"

    def _login(self) -> None:
        response = self.session.post(
            f"{self.admin_api}/session/",
            json={"username": GHOST_ADMIN_EMAIL, "password": GHOST_ADMIN_PASSWORD},
            timeout=30,
        )
        if response.status_code != 201:
            raise RuntimeError(
                f"Ghost login failed ({response.status_code}): {response.text}"
            )

    def _request(self, method: str, path: str, **kwargs: Any) -> requests.Response:
        response = self.session.request(
            method, f"{self.admin_api}{path}", timeout=60, **kwargs
        )
        if response.status_code >= 400:
            raise RuntimeError(
                f"Ghost API {method} {path} failed ({response.status_code}): {response.text}"
            )
        return response

    def browse_all_tags(self) -> list[dict[str, Any]]:
        tags: list[dict[str, Any]] = []
        page = 1
        while True:
            response = self._request("GET", f"/tags/?limit=100&page={page}")
            payload = response.json()
            tags.extend(payload.get("tags", []))
            meta = payload.get("meta", {}).get("pagination", {})
            if page >= int(meta.get("pages", 1)):
                break
            page += 1
        return tags

    def create_tag(self, *, name: str, slug: str) -> dict[str, Any]:
        response = self._request(
            "POST",
            "/tags/",
            json={"tags": [{"name": name, "slug": slug}]},
        )
        return response.json()["tags"][0]

    def update_tag(self, tag_id: str, *, name: str, slug: str) -> dict[str, Any]:
        response = self._request(
            "PUT",
            f"/tags/{tag_id}/",
            json={"tags": [{"name": name, "slug": slug}]},
        )
        return response.json()["tags"][0]

    def delete_tag(self, tag_id: str) -> None:
        self._request("DELETE", f"/tags/{tag_id}/")


def js_array_literal_to_json(literal: str) -> str:
    """Normalize a JS array-of-objects literal enough for json.loads."""
    # Remove single line comments "// ..."
    text = re.sub(r"//.*?$", "", literal, flags=re.MULTILINE)
    # Remove multi line comments "/* ... */"
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    # Quote bare keys: { id: ... } / , children:
    text = re.sub(r"([{\[,]\s*)([A-Za-z_][\w]*)\s*:", r'\1"\2":', text)
    # Single-quoted strings to double-quoted
    text = re.sub(r"'([^'\\]*(?:\\.[^'\\]*)*)'", r'"\1"', text)
    # Remove trailing commas before } or ]
    text = re.sub(r",(\s*[}\]])", r"\1", text)
    return text


def load_sections(path: Path) -> list[dict[str, Any]]:
    """Extract the sections array from a JS module via first `[` … last `]`."""
    source = path.read_text(encoding="utf-8")
    start = source.find("[")
    end = source.rfind("]")
    if start < 0 or end < 0 or end <= start:
        raise ValueError(f"Could not find a JSON/JS array in {path}")

    literal = source[start : end + 1]
    try:
        data = json.loads(js_array_literal_to_json(literal))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Failed to parse sections array in {path}: {exc}") from exc

    if not isinstance(data, list):
        raise ValueError(f"Expected a top-level array in {path}")
    return data


def collect_section_tags(nodes: list[dict[str, Any]]) -> dict[str, str]:
    """Return {tagSlug: label} for every node in the section tree."""
    wanted: dict[str, str] = {}

    def walk(node: dict[str, Any]) -> None:
        slug = node.get("tagSlug")
        label = node.get("label")
        if not isinstance(slug, str) or not slug.strip():
            raise ValueError(f"Section node missing tagSlug: {node!r}")
        if not isinstance(label, str) or not label.strip():
            raise ValueError(f"Section node missing label: {node!r}")
        if slug in wanted and wanted[slug] != label:
            raise ValueError(
                f"Duplicate tagSlug {slug!r} with conflicting labels "
                f"{wanted[slug]!r} vs {label!r}"
            )
        wanted[slug] = label
        for child in node.get("children") or []:
            walk(child)

    for node in nodes:
        walk(node)
    return wanted


def prompt_yes_no(message: str) -> bool:
    while True:
        answer = input(f"{message} [y/n] ").strip().lower()
        if answer in {"y", "yes"}:
            return True
        if answer in {"n", "no"}:
            return False
        print("Please answer y or n.")


def sync_section_tags(path: Path) -> int:
    # Load the section tree and flatten it into the desired slug-to-label mapping.
    sections = load_sections(path)
    wanted = collect_section_tags(sections)
    print(f"Loaded {len(wanted)} section tag(s) from {path}")

    # Fetch all existing Ghost tags and index them by slug for quick comparisons.
    client = GhostAdminClient()
    existing = client.browse_all_tags()
    by_slug = {tag["slug"]: tag for tag in existing}

    # Track each synchronization outcome for the final summary.
    already_ok = 0
    fixed = 0
    added = 0
    removed = 0
    kept_orphan = 0

    # Create missing tags, count correct tags, and repair labels that differ.
    for slug, label in wanted.items():
        tag = by_slug.get(slug)
        if tag is None:
            created = client.create_tag(name=label, slug=slug)
            by_slug[slug] = created
            added += 1
            print(f"  add   {slug} ({label})")
            continue

        if tag.get("name") == label:
            already_ok += 1
            continue

        print(
            f"  warn   {slug}: label {tag.get('name')!r} → {label!r}"
        )
        updated = client.update_tag(tag["id"], name=label, slug=slug)
        by_slug[slug] = updated
        fixed += 1

    # Find existing sec_* tags that are no longer defined in the section tree.
    orphans = [
        tag
        for tag in existing
        if isinstance(tag.get("slug"), str)
        and tag["slug"].startswith(SECTION_TAG_PREFIX)
        and tag["slug"] not in wanted
    ]

    # Ask before deleting each orphan section tag.
    for tag in orphans:
        slug = tag["slug"]
        name = tag.get("name")
        if prompt_yes_no(f"Delete orphan section tag {slug!r} ({name!r})?"):
            client.delete_tag(tag["id"])
            removed += 1
            print(f"  remove {slug}")
        else:
            kept_orphan += 1
            print(f"  keep   {slug}")

    # Report how many tags were unchanged, repaired, added, removed, or retained.
    print()
    print("Summary")
    print(f"  already correct : {already_ok}")
    print(f"  labels fixed    : {fixed}")
    print(f"  added           : {added}")
    print(f"  removed         : {removed}")
    print(f"  orphans kept    : {kept_orphan}")
    print(f"  defined in file : {len(wanted)}")
    return 0


def main(argv: list[str]) -> int:
    if len(argv) > 1:
        print(
            "Usage: python3 scripts/sync_section_tags.py [sections.js]",
            file=sys.stderr,
        )
        return 2

    path = Path(argv[0]) if argv else DEFAULT_SECTIONS_PATH
    if not path.is_file():
        print(f"Sections file not found: {path}", file=sys.stderr)
        return 1

    try:
        return sync_section_tags(path)
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
