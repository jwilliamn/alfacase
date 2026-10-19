# Mockup validation

Validated on **20 October 2026 (Europe/Moscow)** with Chromium, Node 24 and Puppeteer Core 25.14.0.

**18 automated browser checks passed**, with no uncaught browser errors or external service requests:

| Check | Result |
|---|---|
| Initial feed and visible synthetic-data label | Passed |
| Intelligence and Business Impact layer navigation | Passed |
| Company/role changes affect ranking and context | Passed |
| Event filtering and source provenance | Passed |
| Drawer keyboard focus trap, Escape and restored focus | Passed |
| Agent diagram, simulated missing-evidence branch and replay | Passed |
| Contextual follow-up and safe rendering of markup input | Passed |
| Feedback scoped to company and role | Passed |
| Scenario costs and break-even match independent expected values | Passed |
| Objective and fee constraint change the preferred option | Passed |
| Input edits recalculate and remain separate per company | Passed |
| Missing, zero and invalid essential parameters show errors | Passed |
| Zero-rate/equal-cost case produces a valid tie | Passed |
| Bank-home entry and source-library navigation | Passed |
| New text enters the feed without executing markup | Passed |
| No horizontal page overflow across four views at 1440, 1024, 768, 390 and 320 pixels | Passed |
| Standalone export works without requesting CSS/JS/assets | Passed |
| No uncaught browser errors or external service calls | Passed |

Additionally, the three JavaScript files pass syntax checks, local Markdown links resolve, and all **eight Mermaid diagrams** across `ARCHITECTURE.md` and `AGENT_LOGIC.md` rendered successfully with Mermaid 11.17.2. Desktop, decision, agent-logic and mobile screenshots were captured from the running mockup; the desktop and agent views were visually inspected.

## Reproduce browser checks

Keep the mockup server running on port 8080 as described in [README.md](README.md). The optional test runner needs Node 24 and an installed Chromium executable. It is separate from the mockup's zero-dependency runtime.

From the repository root:

```sh
npm install --prefix /tmp/alfacase-browser-check --cache /tmp/alfacase-browser-cache --ignore-scripts --no-audit --no-fund puppeteer-core@25.14.0
MOCKUP_TEST_PACKAGE=/tmp/alfacase-browser-check/package.json CHROMIUM_PATH=/usr/bin/chromium node mockup/smoke.mjs
```

`MOCKUP_URL` can override the default server root on port 8080. `MOCKUP_REPORT_PATH` optionally writes the successful check list to JSON. The runner returns a nonzero exit status on failure.

## What these results do not establish

No live news collection, database, semantic retrieval, approved-model call, genuine agent retry, real bank material or bank authentication was exercised. The production architecture's Python Decimal calculator is not implemented; this mockup uses JavaScript arithmetic. The source and interpretation content remains explicitly synthetic or user-entered and unverified.

The next implementation step remains a real vertical slice: one company, unseen news, an actual bank-research passage, approved-model tool use, and a grounded insight, followed by the full acceptance gates in the [prototype plan](../docs/PROTOTYPE_PLAN.md).
