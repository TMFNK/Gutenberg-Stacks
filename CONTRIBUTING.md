# Contributing to Gutenberg Stacks

Thanks for considering a contribution. This is a small, static-site project — the bar for pitching in is low.

## Getting set up

- **Frontend** (`web/`): `npm install && npm run dev`. Runs against the `books.json` already committed to the repo, no pipeline or API keys needed.
- **Pipeline** (`pipeline/`): `uv sync`, then `uv run python -m gutenberg_galaxy <stage>`. Only needed if you're changing how book data is fetched, embedded, or tagged. The `enrich` stage requires `OPENROUTER_API_KEY`; every other stage runs free and local.

See the [README](README.md#quick-start) for the full rundown.

## Before opening a PR

- **Frontend**: `npm run build` (type-checks with `tsc` and builds with Vite) and `npm test` (Vitest) must pass.
- **Pipeline**: `uv run pytest` must pass.
- Keep changes scoped — small, focused PRs are much easier to review than ones that mix a fix with a refactor.
- Match the existing code style (no linter/formatter is enforced yet; read the surrounding file and follow it).
- If you change frontend behavior, describe how you tested it manually (this repo has no end-to-end test suite).

## Reporting bugs / suggesting features

Open a [GitHub issue](https://github.com/TMFNK/Gutenberg-Stacks/issues) with:
- What you expected vs. what happened (bugs), or the problem you're trying to solve (features)
- Steps to reproduce, if applicable
- Whether it's about the live site, the pipeline, or the data itself

## Design philosophy

This project deliberately improves on the [Winnie Lim prototype](https://winnielim.org/playlists/designing-a-self-directed-learning-network/) it started from — see the README's "[The design](README.md#the-design)" section. Fidelity to the original is an influence, not a constraint: if a change makes the site more usable, it's in scope even if it departs from the prototype.
