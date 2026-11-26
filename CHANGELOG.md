# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.2] - 2026-11-26

### Fixed
- Python server: paho callbacks printed diagnostics to stdout, which is the JSON-RPC channel
  of a stdio MCP server; they now go to stderr. A test fails if anything non-JSON reaches stdout.
- Web app binds `127.0.0.1` by default (`HOST` overrides it) instead of all interfaces, since
  `POST /api/publish` is unauthenticated. The README says the web app is a demo and that the
  default public broker is world-writable.
- README config example no longer contains a personal path; `package.json` author is set.

## [1.1.1] - 2026-11-25

### Fixed
- The release workflow builds the SBOM from `package-lock.json` (`npm sbom --package-lock-only`).
  It used to run after an install without devDependencies, and `npm sbom` refused the incomplete
  tree, so the `v1.1.0` tag never produced a release. That tag is kept as it is; this is the first
  published release.

## [1.1.0] - 2026-11-25

First tagged release (`package.json` already declared 1.0.0). An MCP server with six MQTT
tools (connect, publish, subscribe, unsubscribe, disconnect, status) in a TypeScript
implementation (stdio) and a Python FastMCP implementation, plus a web app that changes
its background colour from MQTT messages. The application code is unchanged in this release.

### Added
- Tests: the TypeScript server over a real MCP stdio session and the web app (HTTP and
  WebSocket) against an in-process MQTT broker (`npm test`, `aedes` as a dev dependency);
  the Python server through FastMCP's in-memory client with a faked paho client (`pytest`).
  All run in CI.
- CI (Node build and tests, Python lint and tests, `npm audit`, `pip-audit`, `zizmor`),
  CodeQL for JavaScript/TypeScript, Python and Actions, OpenSSF Scorecard and a
  tag-triggered release workflow with an SBOM and build provenance; Dependabot for actions,
  npm and pip.
- `SECURITY.md` (private reporting; scope for an MCP server with network reach and an
  unauthenticated web app), `CONTRIBUTING.md` and this changelog.

### Security
- Updated locked dependencies to clear all advisories reported by `npm audit`
  (`@modelcontextprotocol/sdk`, `hono`, `qs`, `ws`, `body-parser` and others); `package.json`
  ranges for runtime dependencies are unchanged.

[Unreleased]: https://github.com/sergiudanstan/mqtt-mcp-server/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/sergiudanstan/mqtt-mcp-server/releases/tag/v1.1.1
[1.1.0]: https://github.com/sergiudanstan/mqtt-mcp-server/releases/tag/v1.1.0
