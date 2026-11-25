# Contributing

Contributions are welcome. This is a single-maintainer project, so please open an issue
before starting anything substantial.

**Security problems do not belong in issues.** Follow [SECURITY.md](SECURITY.md).

## Branches, pull requests and releases

- `main` is the only long-lived branch and is protected: changes land through a pull
  request with the required checks green, commits on `main` are signed, and force-pushes
  are refused. Pull requests are squash-merged; GitHub deletes the branch on merge.
- Branch names: `<type>/<topic>` (`feat/`, `fix/`, `docs/`, `chore/`, `release/`);
  agents use `agent/<name>/<topic>`.
- A release is a pull request that bumps `version` in `package.json` (the single version
  source, shared by the Python server, which declares none) and moves `[Unreleased]` in
  [CHANGELOG.md](CHANGELOG.md) to a dated version. After it merges, a signed `vX.Y.Z` tag
  on that commit triggers `release.yml`, which refuses to run if the tag, `package.json`
  and the changelog disagree. Tags are never moved or deleted.

## Running it locally

TypeScript server and web app (Node.js 22 or newer):

```bash
npm ci
npm test                 # tsc build, then node --test against an in-process MQTT broker (aedes)
node build/index.js      # stdio MCP server
npm run start:web        # web app on http://localhost:3000
```

Python FastMCP server:

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt pytest ruff
ruff check --select E9,F63,F7,F82 mqtt_mcp_server.py tests
pytest -q tests          # paho's Client is faked; no broker needed
python mqtt_mcp_server.py
```

Neither test suite needs a network or an external broker. Keep any change to a tool's
behaviour in step across both implementations, or say in the pull request why not.
