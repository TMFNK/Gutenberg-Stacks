# Gutenberg Galaxy

An interactive star-map of Project Gutenberg books. Every book is a star, positioned by semantic similarity; similar books cluster into constellations named by an LLM. Click a star to see an LLM-generated hook, mood, themes, and difficulty, plus a link to read the book free on gutenberg.org.

Currently mapping the 1,000 most-downloaded books on Project Gutenberg (M1). Scaling to the full catalog (~75,000 books) is planned.

## How it works

A Python pipeline builds the map data once, offline:

1. **Catalog** — fetch book metadata (title, author, subjects, download counts) from the [Gutendex](https://gutendex.com/) API.
2. **Excerpts** — download each book's plain text, strip the Project Gutenberg boilerplate, keep the first ~2,000 words.
3. **Embed** — embed title + subjects + excerpt locally with `sentence-transformers` (multilingual, runs on-device — no API cost).
4. **Layout** — project embeddings to 2D with UMAP, group into clusters with HDBSCAN.
5. **Enrich** — an LLM (via [OpenRouter](https://openrouter.ai/)) names each cluster and tags every book with a mood, themes, difficulty, and one-line hook.
6. **Export** — write compact JSON consumed by the frontend.

The frontend is a static site: Vite + TypeScript + [deck.gl](https://deck.gl/) rendering the books as a zoomable, searchable point map. No server required.

## Project layout

```
pipeline/   Python data pipeline (uv-managed)
  src/gutenberg_galaxy/
    catalog.py    Gutendex catalog fetch + cache
    excerpts.py   book text download + boilerplate stripping
    embed.py      local sentence-transformers embeddings
    layout.py     UMAP projection + HDBSCAN clustering
    enrich.py     LLM cluster labels + per-book tags
    export.py     writes web/public/data/*.json
    openrouter.py thin OpenRouter chat client
  tests/        pytest suite
web/        Vite + TypeScript + deck.gl frontend
  src/
    map.ts      deck.gl scatterplot + cluster labels
    card.ts     book detail panel
    search.ts   fly-to-book search
docs/       design spec and implementation plan
```

## Running the pipeline

```bash
cd pipeline
uv sync
export OPENROUTER_API_KEY=...   # required for the enrich stage
uv run python -m gutenberg_galaxy all       # runs every stage
uv run python -m gutenberg_galaxy catalog   # or run one stage at a time
uv run pytest                                # run tests
```

Each stage caches its output under `data/` and skips work already done, so the pipeline is safe to re-run or resume after an interruption.

## Running the frontend

```bash
cd web
npm install
npm run dev
```

Requires `web/public/data/books.json` and `clusters.json`, produced by the `export` pipeline stage.

## Design & planning docs

- [docs/design.md](docs/design.md) — approved design spec
- [docs/superpowers/plans/2026-07-04-m1-pipeline-and-map.md](docs/superpowers/plans/2026-07-04-m1-pipeline-and-map.md) — M1 implementation plan
