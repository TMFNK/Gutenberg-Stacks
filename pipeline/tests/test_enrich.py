import pydantic
import pytest

from gutenberg_galaxy import enrich
from gutenberg_galaxy.enrich import BookTags, chunk, parse_tags


def test_cluster_prompt_contains_titles():
    p = enrich.cluster_prompt(3, ["Moby Dick", "The Sea-Wolf"])
    assert "Moby Dick" in p and "JSON" in p


def test_parse_label():
    assert enrich.parse_label({"label": "Sea Adventures"}) == "Sea Adventures"


def test_chunk():
    assert chunk([1, 2, 3, 4, 5], 2) == [[1, 2], [3, 4], [5]]


def test_book_tags_validation():
    ok = {"id": 1, "mood": "dark", "themes": ["revenge"], "difficulty": "hard",
          "hook": "A whale."}
    assert BookTags(**ok).id == 1
    with pytest.raises(pydantic.ValidationError):
        BookTags(**{**ok, "difficulty": "impossible"})


def test_parse_tags_expects_all_ids():
    resp = {"books": [{"id": 1, "mood": "dark", "themes": ["x"],
                       "difficulty": "easy", "hook": "h"}]}
    assert parse_tags(resp, expected_ids={1})[1]["mood"] == "dark"
    with pytest.raises(ValueError):
        parse_tags(resp, expected_ids={1, 2})
