# CLAUDE.md — Emergent / aimmh

## What this repo is

Emergent is a multi-model AI hub: a FastAPI backend + React frontend that lets users send a single prompt to multiple LLMs simultaneously and work with their combined responses. The `aimmh_lib` directory is a standalone, zero-dependency Python library extracted from that backend — it's the part that gets published to PyPI as `aimmh-lib`.

## Repository layout

```
aimmh_lib/        # pip install aimmh-lib (Apache-2.0, zero runtime deps)
  __init__.py     # public API surface
  conversations.py  # all orchestration logic
  adapters.py     # bridge to the aimmh backend (NOT imported by default)

backend/          # FastAPI service (proprietary)
  server.py       # main app: auth, multi-model chat, EDCM, Stripe, MongoDB
  services/
    llm.py        # generate_response() streaming function + DEFAULT_REGISTRY
  requirements.txt

frontend/         # React app (proprietary)
  src/
    pages/        # ChatPage, AuthPage, SettingsPage
    components/

pyproject.toml    # aimmh-lib package config
LICENSE           # Apache-2.0 (covers aimmh_lib only)
```

## aimmh_lib public API

### Types
- `CallFn` — `async (model_id: str, messages: list[dict]) -> str`. The single abstraction that decouples the library from any particular backend.
- `ModelResult` — dataclass returned by every pattern. Key fields: `model`, `content`, `response_time_ms`, `error`, `round_num`, `step_num`, `role`, `slot_idx`, `initiative`.

### Functional API (pass `call` every time)
| Function | Description |
|---|---|
| `fan_out(call, model_ids, messages)` | Parallel call to N models — async building block |
| `daisy_chain(call, model_ids, prompt)` | A→B→C sequential, each sees previous response |
| `room_all(call, model_ids, prompt)` | All respond, then each sees all, responds again |
| `room_synthesized(call, model_ids, prompt, synthesis_model)` | Fan-out → synthesizer → next round |
| `council(call, model_ids, prompt)` | Each model synthesizes all responses in parallel |
| `roleplay(call, player_models, initial_prompt)` | DM-driven roleplay with initiative + reactions |

### Instantiation API (bind `call` once)
- `MultiModelHub(call)` — all six patterns as methods, call argument bound at construction
- `ModelInstance(call, model_id)` — stateful single-model object with `.send()`, `.history`, `.clear()`

### Adapters (explicit import only)
```python
from aimmh_lib.adapters import make_call_fn
call = make_call_fn(user={"api_keys": {}})
```
Requires backend `services/` on `sys.path`. Not imported by `__init__.py`.

## Key design decisions

- **Zero runtime dependencies** — `aimmh_lib` uses only stdlib + asyncio. Backend deps (fastapi, motor, emergentintegrations) are in `[project.optional-dependencies]`.
- **`slot_contexts`** — list aligned with `model_ids`, lets the same model appear multiple times with different system prompts. `slot_idx` on `ModelResult` tracks position.
- **`step_num=-1`** is a sentinel for synthesis/DM steps between rounds. Filter: `[r for r in results if r.step_num >= 0]` → player responses only.
- **`adapters.py` is not re-exported** from `__init__.py` to keep the install footprint zero.

## Development workflow

```bash
# Editable install from repo root
pip install -e .

# Build for PyPI
pip install build twine
python -m build
twine upload dist/*
```

## PyPI package

- Name: `aimmh-lib`
- Version: `1.1.0`
- Repo: https://github.com/The-Interdependency/aimmh

## Backend architecture notes

- `server.py` handles auth (Google OAuth + JWT), conversation CRUD, multi-model streaming, Stripe payments, and the EDCM analysis engine.
- `services/llm.py` provides `generate_response()` (async generator) and `DEFAULT_REGISTRY` (model ID → provider mapping).
- MongoDB via Motor for all persistence.
- Environment: `MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EMERGENT_LLM_KEY`.

## Git Workflow

- Main branch: `main` (stable; mirrors what's on PyPI)
- Feature branches: `feat/<description>`, `fix/<description>`, `docs/<description>`, and `claude/*` working branches — PR into `main` when complete
- Commit style: Conventional Commits (`feat(aimmh):`, `fix(adapters):`, etc.)
- Author: Erin Patrick Spencer (wayseer@interdependentway.org)
- License: Apache 2.0 (covers `aimmh_lib`; `backend/` and `frontend/` are proprietary)

## Agent module-build doctrine

Before adding a new module, route, service, adapter, schema, worker, engine,
UI panel, migration, or experiment, read:

`./.agents/skills/meta-module-build/SKILL.md`

New module work should start with a `MODULE_BUILD` block. Unknown fields must
be marked `hmmm`, not guessed.
