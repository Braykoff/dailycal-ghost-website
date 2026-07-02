#!/usr/bin/env python3
"""Migrate a Daily Cal (BLOX CMS) article into the local Ghost instance."""

from __future__ import annotations

import html
import io
import json
import os
import re
import sys
import tempfile
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from PIL import Image

GHOST_URL = os.environ.get("GHOST_URL", "http://localhost:2368").rstrip("/")
GHOST_ADMIN_EMAIL = os.environ.get("GHOST_ADMIN_EMAIL", "admin@example.com")
GHOST_ADMIN_PASSWORD = os.environ.get("GHOST_ADMIN_PASSWORD", "bogusAdminP@ssw0rd")
GHOST_API_VERSION = os.environ.get("GHOST_API_VERSION", "v6.46")
CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"


@dataclass
class BloxArticle:
    """Parsed fields from a BLOX article page."""

    title: str
    slug: str
    html_body: str
    authors: list[str]
    published_at: str
    tags: list[str]
    excerpt: str
    feature_image_url: str | None
    feature_image_alt: str | None


class GhostClient:
    """Authenticated client for the local Ghost Admin API."""

    def __init__(self) -> None:
        """Open a session and log in with admin credentials."""
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
        """Base URL for Admin API requests."""
        return f"{GHOST_URL}/ghost/api/admin"

    def _login(self) -> None:
        """Create an admin session using email and password."""
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
        """Send an Admin API request and raise on HTTP errors."""
        response = self.session.request(
            method, f"{self.admin_api}{path}", timeout=60, **kwargs
        )
        if response.status_code >= 400:
            raise RuntimeError(
                f"Ghost API {method} {path} failed ({response.status_code}): {response.text}"
            )
        return response

    def get_user_by_slug(self, slug: str) -> dict[str, Any] | None:
        """Return a Ghost user by slug, or None if not found."""
        response = self._request(
            "GET",
            f"/users/?filter=slug:{slug}&limit=1",
        )
        users = response.json().get("users", [])
        return users[0] if users else None

    def import_author(self, name: str, slug: str, email: str) -> dict[str, Any]:
        """Import a placeholder author via Ghost's JSON import endpoint."""
        payload = {
            "meta": {"exported_on": int(time.time() * 1000), "version": "6.0.0"},
            "data": {
                "users": [
                    {
                        "email": email,
                        "slug": slug,
                        "name": name,
                        "roles": ["Author"],
                    }
                ]
            },
        }
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            json.dump(payload, handle)
            temp_path = handle.name
        try:
            with open(temp_path, "rb") as handle:
                self._request(
                    "POST",
                    "/db/",
                    files={"importfile": ("authors.json", handle, "application/json")},
                )
        finally:
            Path(temp_path).unlink(missing_ok=True)

        user = self.get_user_by_slug(slug)
        if not user:
            raise RuntimeError(f"Failed to import Ghost author '{name}'")
        return user

    def ensure_author(self, name: str) -> dict[str, Any]:
        """Return an existing author or import a new one."""
        slug = slugify(name)
        existing = self.get_user_by_slug(slug)
        if existing:
            return existing
        email = f"{slug}@authors.local"
        return self.import_author(name, slug, email)

    def upload_image(self, image_bytes: bytes, filename: str) -> str:
        """Upload image bytes to Ghost and return the hosted URL."""
        response = self._request(
            "POST",
            "/images/upload/",
            files={"file": (filename, image_bytes, "image/jpeg")},
        )
        images = response.json().get("images", [])
        if not images:
            raise RuntimeError("Ghost image upload returned no images")
        return images[0]["url"]

    def get_post_by_slug(self, slug: str) -> dict[str, Any] | None:
        """Return a Ghost post by slug, or None if not found."""
        response = self.session.get(
            f"{self.admin_api}/posts/slug/{slug}/",
            timeout=30,
        )
        if response.status_code == 404:
            return None
        if response.status_code >= 400:
            raise RuntimeError(
                f"Ghost API GET /posts/slug/{slug}/ failed ({response.status_code}): {response.text}"
            )
        posts = response.json().get("posts", [])
        return posts[0] if posts else None

    def create_post(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Create a published post from an HTML payload."""
        response = self._request(
            "POST",
            "/posts/?source=html",
            json={"posts": [payload]},
            headers={"Content-Type": "application/json"},
        )
        return response.json()["posts"][0]

    def update_post(self, post_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Update an existing post from an HTML payload."""
        response = self._request(
            "PUT",
            f"/posts/{post_id}/?source=html",
            json={"posts": [payload]},
            headers={"Content-Type": "application/json"},
        )
        return response.json()["posts"][0]


def slugify(value: str) -> str:
    """Convert a display name into a URL-safe slug."""
    value = html.unescape(value).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "author"


def extract_slug(url: str) -> str:
    """Extract the article slug from a BLOX article URL."""
    path = urlparse(url).path.strip("/")
    parts = path.split("/")
    filename = parts[-1]
    if filename.startswith("article_") and len(parts) >= 2:
        return parts[-2]
    return filename.removesuffix(".html")


def parse_author_label(raw: str) -> str:
    """Strip role suffixes like '| Staff' from a byline label."""
    return html.unescape(raw.split("|", 1)[0].strip())


def parse_authors(soup: BeautifulSoup) -> list[str]:
    """Extract article author names from the page header."""
    header = soup.select_one(".asset-header")
    if header:
        names = [
            parse_author_label(link.get_text(strip=True))
            for link in header.select('.tnt-byline a[rel="author"]')
            if link.get_text(strip=True)
        ]
        if names:
            return names

    meta_author = soup.find("meta", attrs={"name": "author"})
    if meta_author and meta_author.get("content"):
        return [parse_author_label(meta_author["content"])]

    return []


def parse_published_at(soup: BeautifulSoup) -> str:
    """Return the publish date as a UTC ISO-8601 string."""
    time_el = soup.select_one(".asset-header time.tnt-date.asset-date[datetime]")
    if not time_el or not time_el.get("datetime"):
        raise ValueError("Could not find article publish date")

    parsed = datetime.fromisoformat(time_el["datetime"])
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def parse_tags(soup: BeautifulSoup) -> list[str]:
    """Extract tags from the meta keywords field."""
    keywords = soup.find("meta", attrs={"name": "keywords"})
    if not keywords or not keywords.get("content"):
        return []
    return [html.unescape(tag.strip()) for tag in keywords["content"].split(",") if tag.strip()]


def parse_excerpt(soup: BeautifulSoup) -> str:
    """Extract the excerpt from the meta description field."""
    description = soup.find("meta", attrs={"name": "description"})
    if not description or not description.get("content"):
        return ""
    return html.unescape(description["content"]).strip()


def parse_body_html(soup: BeautifulSoup) -> str:
    """Extract paragraph HTML from the BLOX article body."""
    body = soup.select_one("#article-body")
    if not body:
        raise ValueError("Could not find #article-body in BLOX article")

    for node in body.select(".tncms-region, script, style"):
        node.decompose()

    paragraphs = body.find_all("p")
    if not paragraphs:
        raise ValueError("Article body has no paragraph content")

    return "".join(str(paragraph) for paragraph in paragraphs)


def parse_feature_image(soup: BeautifulSoup) -> tuple[str | None, str | None]:
    """Extract feature image URL and alt text from the page."""
    photo = soup.select_one(".asset-photo")
    if photo:
        content_url = photo.select_one('meta[itemprop="contentUrl"]')
        if content_url and content_url.get("content"):
            image_url = html.unescape(content_url["content"])
            image_url = re.sub(r"\?.*$", "", image_url)
        else:
            image_url = None

        caption = photo.select_one(".caption-text p")
        alt = caption.get_text(strip=True) if caption else None
        if image_url:
            return image_url, alt

    og_image = soup.find("meta", property="og:image")
    if not og_image or not og_image.get("content"):
        return None, None

    image_url = html.unescape(og_image["content"])
    image_url = re.sub(r"\?.*$", "", image_url)

    alt = None
    twitter_alt = soup.find("meta", attrs={"name": "twitter:image:alt"})
    if twitter_alt and twitter_alt.get("content"):
        alt = html.unescape(twitter_alt["content"])

    return image_url, alt


def fetch_blox_article(url: str) -> BloxArticle:
    """Download and parse a BLOX article into structured fields."""
    response = requests.get(url, timeout=60)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    title_el = soup.select_one("h1.headline, h1[itemprop='headline'], h1")
    if not title_el:
        raise ValueError("Could not find article title")

    title = html.unescape(title_el.get_text(strip=True))
    feature_image_url, feature_image_alt = parse_feature_image(soup)

    return BloxArticle(
        title=title,
        slug=extract_slug(url),
        html_body=parse_body_html(soup),
        authors=parse_authors(soup),
        published_at=parse_published_at(soup),
        tags=parse_tags(soup),
        excerpt=parse_excerpt(soup),
        feature_image_url=feature_image_url,
        feature_image_alt=feature_image_alt,
    )


def download_feature_image(url: str) -> tuple[bytes, str]:
    """Download a feature image and normalize it to JPEG bytes."""
    response = requests.get(url, timeout=60)
    response.raise_for_status()

    content_type = response.headers.get("Content-Type", "")
    raw_bytes = response.content

    if "jpeg" in content_type or "jpg" in content_type or url.lower().endswith((".jpg", ".jpeg")):
        return raw_bytes, "feature.jpg"

    if "png" in content_type or url.lower().endswith(".png"):
        image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=90)
        return buffer.getvalue(), "feature.jpg"

    if "webp" in content_type or url.lower().endswith(".webp"):
        image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=90)
        return buffer.getvalue(), "feature.jpg"

    image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=90)
    return buffer.getvalue(), "feature.jpg"


def feature_image_stem(slug: str) -> str:
    """Return the basename (without extension) used for a slug's feature image."""
    return f"{slug}-feature"


def is_feature_image_for_slug(image_url: str | None, slug: str) -> bool:
    """Return True if a Ghost image URL belongs to the given article slug."""
    if not image_url:
        return False
    stem = re.escape(feature_image_stem(slug))
    return bool(re.search(rf"{stem}(-\d+)?\.jpg", image_url))


def find_feature_image_on_disk(slug: str) -> str | None:
    """Return the Ghost URL for an existing feature image file, if present."""
    path = feature_image_path_for_slug(slug)
    if path is None:
        return None

    relative_path = path.relative_to(CONTENT_DIR)
    return f"{GHOST_URL}/content/{relative_path.as_posix()}"


def feature_image_path_for_slug(slug: str) -> Path | None:
    """Return the on-disk path for a slug's feature image, if the file exists."""
    images_dir = CONTENT_DIR / "images"
    if not images_dir.exists():
        return None

    stem = feature_image_stem(slug)
    exact_matches = [
        path for path in images_dir.rglob(f"{stem}.jpg") if not path.name.endswith("_o.jpg")
    ]
    if not exact_matches:
        return None

    return exact_matches[0]


def feature_image_path_from_url(image_url: str) -> Path | None:
    """Map a Ghost content image URL back to its path under content/."""
    prefix = f"{GHOST_URL}/content/"
    if not image_url.startswith(prefix):
        return None
    return CONTENT_DIR / image_url.removeprefix(prefix)


def resolve_feature_image(
    slug: str,
    source_url: str,
    existing_post: dict[str, Any] | None,
    ghost: GhostClient,
) -> str:
    """Reuse an existing feature image or download and upload a new one."""
    on_disk = find_feature_image_on_disk(slug)
    if on_disk:
        return on_disk

    if existing_post:
        existing_image = existing_post.get("feature_image")
        if is_feature_image_for_slug(existing_image, slug):
            existing_path = feature_image_path_from_url(existing_image)
            if existing_path and existing_path.exists():
                return existing_image

    image_bytes, _ = download_feature_image(source_url)
    return ghost.upload_image(image_bytes, f"{slug}-feature.jpg")


def migrate(url: str) -> dict[str, Any]:
    """Fetch a BLOX article and create or update the matching Ghost post."""
    article = fetch_blox_article(url)
    ghost = GhostClient()
    existing = ghost.get_post_by_slug(article.slug)

    author_records = [ghost.ensure_author(name) for name in article.authors]
    if not author_records:
        raise ValueError("No article authors found in BLOX HTML")

    feature_image = None
    if article.feature_image_url:
        feature_image = resolve_feature_image(
            article.slug,
            article.feature_image_url,
            existing,
            ghost,
        )

    payload: dict[str, Any] = {
        "title": article.title,
        "slug": article.slug,
        "html": article.html_body,
        "status": "published",
        "published_at": article.published_at,
        "custom_excerpt": article.excerpt,
        "authors": [{"id": author["id"]} for author in author_records],
        "tags": [{"name": tag} for tag in article.tags],
    }
    if feature_image:
        payload["feature_image"] = feature_image
    if article.feature_image_alt:
        payload["feature_image_alt"] = article.feature_image_alt

    if existing:
        payload["id"] = existing["id"]
        payload["updated_at"] = existing["updated_at"]
        post = ghost.update_post(existing["id"], payload)
        action = "updated"
    else:
        post = ghost.create_post(payload)
        action = "created"

    return {
        "action": action,
        "ghost_id": post["id"],
        "slug": post["slug"],
        "url": post["url"],
        "title": post["title"],
        "authors": [author["name"] for author in author_records],
    }


def main() -> int:
    """CLI entry point: migrate one BLOX article URL."""
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <blox-article-url>", file=sys.stderr)
        return 1

    result = migrate(sys.argv[1])
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
