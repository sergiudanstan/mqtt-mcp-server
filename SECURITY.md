# Security Policy

mqtt-mcp-server provides MQTT client tools to an MCP client, in two implementations: a
TypeScript server over stdio (`src/index.ts`), a Python FastMCP server
(`mqtt_mcp_server.py`), plus a small web app (`src/web-server.ts`, `public/`) that shows
colours received over MQTT. The MCP client (an LLM, in practice) chooses every tool
argument, so **tool inputs are untrusted**, and so is every message that arrives from a
broker.

## Supported versions

| Version | Supported |
|---|---|
| 1.1.x | Current |

Single maintainer; only the latest release receives fixes.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.** Report it privately:
**[Report a vulnerability](https://github.com/sergiudanstan/mqtt-mcp-server/security/advisories/new)**
(Security -> Advisories -> Report a vulnerability).

| Stage | Target |
|---|---|
| Acknowledgement | within 3 business days |
| Triage | within 10 business days |
| Fix, or a documented decision not to fix | within 90 days |

These are best-effort targets from a single unpaid maintainer, not a contractual SLA.
There is no bug bounty; credit is offered in the advisory and changelog.

## Scope and attack surface

- **Network reach chosen by the client.** `mqtt_connect` connects to whatever broker URL
  (TypeScript: any scheme the `mqtt` package accepts; Python: host and port) the client
  supplies, from the machine running the server. A prompt-injected client can therefore
  make the server open connections to hosts and ports reachable from that machine,
  including internal ones. There is no allow-list. Run the server where that reach is
  acceptable, or restrict it with network policy.
- **Physical and data effects.** `mqtt_publish` can publish (optionally retained) to any
  topic the broker allows, and `mqtt_subscribe` can read any topic it allows, including
  wildcards. If the broker fronts devices, a publish can actuate them. Use broker-side
  ACLs and a dedicated account; do not expose production topics to an untrusted client.
- **Credentials.** Username and password are passed as tool arguments, so they pass through
  the MCP client and its transcript. Plain `mqtt://` is unencrypted; use `mqtts://` where
  the broker supports it. The README's public test brokers are for synthetic data only.
- **Untrusted broker content.** Received payloads are written to stderr by both servers
  and are not sanitised; treat them as untrusted input to whatever displays or reads them.
- **Web app has no authentication.** `src/web-server.ts` binds `127.0.0.1` by default;
  setting `HOST=0.0.0.0` makes it accept connections on all interfaces. `POST /api/publish` and the WebSocket
  are unauthenticated, accept any colour string, and have no rate limit: anyone who can
  reach the port can publish to the configured topic and see its traffic. Run it on
  localhost or behind your own authentication. The page writes received values with
  `textContent` and `style.backgroundColor` (no HTML injection path was found).
- **Python deployment.** `mqtt_mcp_server.py` keeps one MQTT connection in module-level
  state, so every caller of one running instance shares it. If you host it (for example on
  FastMCP Cloud, see `FASTMCP_DEPLOYMENT.md`), authentication and tenancy are the hosting
  provider's; this repository implements none.
- **File system and code execution.** Neither server reads or writes files or runs
  commands on behalf of the client.

In scope: a tool argument that causes behaviour beyond the documented MQTT operations
(file access, command execution, crashes of the server from malformed input), the web app
being reachable or exploitable in ways described above but not documented here, and
anything in this repository's workflows that could publish a release not built from `main`.
Out of scope: vulnerabilities in a broker, in the `mqtt`, `paho-mqtt`, FastMCP or MCP SDK
libraries themselves (report upstream), and misconfigured public brokers.

## Supply chain

CI builds and tests the TypeScript server and web app against an in-process broker, lints
and tests the Python server, and runs `npm audit` and `pip-audit` on the dependencies,
`pip-audit` on the hash-pinned CI toolchain, CodeQL (JavaScript/TypeScript, Python, Actions)
and `zizmor` on the workflows. Actions are pinned to full commit SHAs and kept current by
Dependabot. The Python requirements are version ranges without a lockfile, so installs
resolve to the newest releases. Releases attach a source archive and a CycloneDX SBOM of
the npm runtime dependencies with Sigstore build provenance:

```
gh attestation verify mqtt-mcp-server-v1.1.0.tar.gz --repo sergiudanstan/mqtt-mcp-server
```
