import re
import time

import httpx

from .catalog import UA
from .paths import EXCERPTS_DIR

START_RE = re.compile(r"\*\*\* ?START OF.*?\*\*\*", re.S)
END_RE = re.compile(r"\*\*\* ?END OF.*?\*\*\*", re.S)


def strip_boilerplate(text: str) -> str:
    m = START_RE.search(text)
    if m:
        text = text[m.end():]
    m = END_RE.search(text)
    if m:
        text = text[:m.start()]
    return text.strip()


def excerpt(text: str, words: int = 2000) -> str:
    return " ".join(text.split()[:words])


def plain_text_url(book: dict) -> str | None:
    for mime, url in book["formats"].items():
        if mime.startswith("text/plain"):
            return url
    return None


def fetch_all(books: list[dict]) -> None:
    EXCERPTS_DIR.mkdir(parents=True, exist_ok=True)
    with httpx.Client(headers=UA, timeout=60, follow_redirects=True) as client:
        for book in books:
            out = EXCERPTS_DIR / f"{book['id']}.txt"
            if out.exists():
                continue
            url = plain_text_url(book)
            if url is None:
                out.write_text("")  # marker: no plain text available
                continue
            try:
                r = client.get(url)
                r.raise_for_status()
                out.write_text(excerpt(strip_boilerplate(r.text)))
            except httpx.HTTPError as e:
                print(f"skip {book['id']}: {e}")
                out.write_text("")
            time.sleep(0.5)
