#!/usr/bin/env python3
"""Bulk-delete content from a Ghost site via the Admin API.

The Content API is read-only. Deleting posts, pages, tags, or authors requires
the Admin API.

Usage:
  python3 scripts/purge_content.py                 # print usage; delete nothing
  python3 scripts/purge_content.py articles
  python3 scripts/purge_content.py tags pages
  python3 scripts/purge_content.py articles pages tags authors

Types may appear in any order. When multiple are listed, they always run in
this fixed order: articles → pages → tags → authors.

Auth (see module docstring / README notes):
  Session login via GHOST_ADMIN_EMAIL + GHOST_ADMIN_PASSWORD (default here,
  matching scripts/copy_blox_article.py for local Docker).
"""

from __future__ import annotations

import os
import sys
from typing import Any, Callable

import requests

GHOST_URL = os.environ.get("GHOST_URL", "http://localhost:2368").rstrip("/")
GHOST_ADMIN_EMAIL = os.environ.get("GHOST_ADMIN_EMAIL", "admin@example.com")
GHOST_ADMIN_PASSWORD = os.environ.get("GHOST_ADMIN_PASSWORD", "bogusAdminP@ssw0rd")
GHOST_API_VERSION = os.environ.get("GHOST_API_VERSION", "v6.46")

VALID_TYPES = ("articles", "pages", "tags", "authors")


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

    def browse_all(self, resource: str, key: str) -> list[dict[str, Any]]:
        """Return every record for an Admin API resource (paginated)."""
        items: list[dict[str, Any]] = []
        page = 1
        while True:
            response = self._request(
                "GET",
                f"/{resource}/?limit=100&page={page}",
            )
            payload = response.json()
            batch = payload.get(key, [])
            items.extend(batch)

            meta = payload.get("meta", {}).get("pagination", {})
            if page >= int(meta.get("pages", 1)):
                break
            page += 1
        return items

    def delete(self, resource: str, item_id: str) -> None:
        self._request("DELETE", f"/{resource}/{item_id}/")


def _purge_resource(
    client: GhostAdminClient,
    *,
    label: str,
    resource: str,
    key: str,
    keep: Callable[[dict[str, Any]], bool] | None = None,
) -> int:
    """Delete every browsable item for a resource; return deleted count."""
    items = client.browse_all(resource, key)
    deleted = 0
    skipped = 0

    for item in items:
        if keep is not None and keep(item):
            skipped += 1
            print(f"  skip {label} {item.get('slug') or item.get('name')} ({item['id']})")
            continue
        print(f"  delete {label} {item.get('slug') or item.get('name')} ({item['id']})")
        client.delete(resource, item["id"])
        deleted += 1

    print(f"{label}: deleted {deleted}" + (f", skipped {skipped}" if skipped else ""))
    return deleted


def purge_articles(client: GhostAdminClient) -> int:
    """Delete all posts (articles)."""
    return _purge_resource(client, label="article", resource="posts", key="posts")


def purge_pages(client: GhostAdminClient) -> int:
    """Delete all pages."""
    return _purge_resource(client, label="page", resource="pages", key="pages")


def purge_tags(client: GhostAdminClient) -> int:
    """Delete all tags."""
    return _purge_resource(client, label="tag", resource="tags", key="tags")


def purge_authors(client: GhostAdminClient) -> int:
    """Delete all staff users except the Owner (Ghost forbids deleting Owner)."""

    def keep_owner(user: dict[str, Any]) -> bool:
        roles = user.get("roles") or []
        return any(role.get("name") == "Owner" for role in roles)

    return _purge_resource(
        client,
        label="author",
        resource="users",
        key="users",
        keep=keep_owner,
    )


def _print_usage() -> None:
    print(
        "Usage: python3 scripts/purge_content.py [articles] [pages] [tags] [authors]\n"
        "\n"
        "Pass one or more content types in any order. Nothing is deleted if none\n"
        "are specified. When multiple types are listed, purge order is always:\n"
        "  articles → pages → tags → authors\n"
        "\n"
        "Requires Ghost Admin API access (Content API cannot delete).\n"
        "Auth defaults match local Docker: GHOST_URL, GHOST_ADMIN_EMAIL,\n"
        "GHOST_ADMIN_PASSWORD."
    )


def main(argv: list[str]) -> int:
    selected = [arg.lower() for arg in argv]
    unknown = sorted({arg for arg in selected if arg not in VALID_TYPES})
    if unknown:
        print(f"Unknown content type(s): {', '.join(unknown)}", file=sys.stderr)
        _print_usage()
        return 2

    if not selected:
        _print_usage()
        return 0

    # Fixed purge order regardless of argv order.
    client = GhostAdminClient()
    if "articles" in selected:
        purge_articles(client)
    if "pages" in selected:
        purge_pages(client)
    if "tags" in selected:
        purge_tags(client)
    if "authors" in selected:
        purge_authors(client)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
