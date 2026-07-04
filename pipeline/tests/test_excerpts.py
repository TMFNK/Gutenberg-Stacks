from pathlib import Path

from gutenberg_galaxy import excerpts

RAW = (Path(__file__).parent / "fixtures/pg_text.txt").read_text()


def test_strip_boilerplate():
    body = excerpts.strip_boilerplate(RAW)
    assert body.startswith("Actual story text")
    assert "END OF THE PROJECT" not in body and "junk header" not in body


def test_strip_boilerplate_no_markers_returns_all():
    assert excerpts.strip_boilerplate("just text") == "just text"


def test_excerpt_word_cap():
    assert excerpts.excerpt("a b c d e", words=3) == "a b c"


def test_plain_text_url():
    book = {"formats": {"text/plain; charset=utf-8": "http://x/t.txt", "text/html": "h"}}
    assert excerpts.plain_text_url(book) == "http://x/t.txt"
    assert excerpts.plain_text_url({"formats": {"text/html": "h"}}) is None
