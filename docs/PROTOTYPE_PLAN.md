# Prototype implementation plan

## 1. Goal and interpretation

Build a small, interactive service that answers: **“What does this event change for my company, why, and what should I investigate next?”** It combines external news, company-specific exposures, the user's role, and relevant Alfa-Bank research. It must show its evidence and perform a real, bounded, multi-step analysis.

Treat “easy to rewrite using the models in the brief” as a design constraint: plain Python functions, a small number of modules, explicit JSON contracts, editable prompts, and one replaceable model adapter. The prototype should also support switching between approved inference models. Neither goal requires an agent framework or a distributed system.

This is an implementation plan, not a claim that the service exists. The PDF supplies requirements; its instructions about submission, hosting, and repository access are recorded as future checklist items, not actions authorized by this planning request.

## 2. The smallest complete demonstration

1. Open an Alfa-Business-style demo home page and select a clearly labeled demo user. A visible “Business insights” tile and navigation link remain available.
2. Select an authorized company and a role, such as CFO or head of treasury. Inspect the company context and see which fields are known, inferred, or missing.
3. Open a ranked feed. Each card shows the event, why it matters to this company, evidence freshness, and the ranking explanation.
4. Open an insight with six sections: what happened; why it matters here; possible consequences; possible next actions; the bank's view; supporting evidence.
5. Inspect separate **Facts**, **Alfa-Bank analysis**, and **AI interpretation** labels. Open a source passage or bank PDF page and inspect an activity trace of tools and checks.
6. Ask a follow-up question or switch the view to financing, cash flow, counterparties, or opportunities. Answers reuse the same company and evidence context, with additional retrieval when needed.
7. Switch to another company in the same sector and observe different ranking and interpretation. Change role within one company and observe different emphasis.
8. Import a previously unseen article through the admin/demo input, refresh the feed, and inspect its newly generated analysis. Submit useful/not useful feedback with an optional reason.

Use a Russian interface and Russian insight output by default, matching the case. Keep developer documentation in English. Use a simple bank-style shell; a real internet-bank integration is not required for this prototype.

## 3. Scope and deliberate limits

| Build now | Keep small | Defer |
|---|---|---|
| Company and group context, user roles, company-specific ranking | Four synthetic companies across three sectors, including two in the same sector; two user roles | Exhaustive sector coverage |
| Relationships from group IDs, payment edges, and anonymized person links | One-hop relationships and payment concentration calculations | Graph database and arbitrary graph traversal |
| External-news parser and bank-research importer | One configurable RSS/HTML source plus manual text/URL import; PDF/text research import | Broad crawling, paywalls, continuous scraping |
| Retrieval, structured extraction, deduplication, evidence links | SQLite full-text search, Russian query synonyms, metadata filters, simple near-duplicate matching | Vector database, embedding model, reranking service |
| Handwritten agent with planning, tools, context, self-check, retry | One orchestrator and bounded, read-only analysis tools | Multi-agent framework, autonomous browsing or execution |
| Ranked feed, detailed insight, follow-up questions, feedback | Server-rendered pages and a small amount of JavaScript | Separate SPA and frontend build pipeline |
| Reproducible local/container startup and meaningful evaluation | One application container and one SQLite volume | Kubernetes, Redis, message brokers, production SSO |
| Security boundaries and an extension/maintenance explanation | Basic scoped sessions, input validation, tool restrictions, redacted traces | Bank-grade identity integration and a full security platform |

The case permits security mechanisms to be explained and located in the architecture for the prototype (p. 12). Implement the low-cost boundaries needed for a credible demo and document production replacements. Do not trade away evidence, actual bank research, unseen-news handling, or the agent loop: these are central requirements.

## 4. Inputs and prerequisites

| Input | Source/status | Planned treatment |
|---|---|---|
| Company and relationship data | [Case data folder](https://drive.google.com/drive/folders/1Ep8wWoEHTg5Q8kwrLx2j_xFyxGUEVxFq?usp=sharing), linked on p. 15; contents/access not checked in this planning task | Inspect actual CSV headers, encodings, units, and null conventions; implement explicit mappings; include synthetic equivalents in Git |
| Alfa-Bank research | [Research folder](https://drive.google.com/drive/folders/15xZTLF1lZ65p6o5xpNA_fRbxjoV-UlG1?usp=sharing), linked on p. 17; contents/access not checked | Import a small relevant subset of the supplied research with title, date, page, and passage provenance |
| Model endpoint and access | Brief promises a shared key and ₽500/day limit (p. 12); endpoint, model IDs, authentication, pricing, and current access are unknown | Confirm provider documentation and available approved models before implementing transport; use secure environment configuration for credentials |
| External news | Choose one accessible, permitted RSS/HTML source during implementation | Respect source access conditions; capture source URL, publication time, retrieval time, and original text |
| Demo fixtures | To be authored | Four fictional large companies with revenue above ₽15bn, about 20 news items, research examples, relation edges, noisy inputs, and two user personas |

Important data limits:

- The brief lists the same filename for person links and payments on p. 16. Inspect the supplied files; do not invent a second filename or assume the two schemas match.
- Derive sector, size, products, regions, foreign-trade exposure, group membership, and payment concentration from available fields. A credit-product flag indicates a possible financing exposure; it does not reveal balances, interest terms, or refinancing dates.
- Shared people identify a relationship signal, not verified ownership or control. Payment direction and concentration are observable; a supplier/customer interpretation needs supporting data.
- Company revenue alone does not establish market share. Show share as unavailable unless a dated, sourced market-size denominator exists. A position within the provided sample must be labeled as a sample comparison.
- Do not infer a person's job role from anonymized links. Demo roles are separate, explicitly synthetic user settings. Preserve unfamiliar fields such as `NEGATIVEMARK` without interpreting their names until the data dictionary is confirmed.
- Keep missing values distinct from zero and false. Preserve conflicting source statements rather than silently choosing one.
- Synthetic research must be labeled as synthetic. It supports offline testing but does not satisfy the requirement to use the actual Alfa-Bank materials. The live challenge demonstration needs both real research and an approved live model.

## 5. Technical choice

Use **Python 3.12, FastAPI, Jinja2, minimal vanilla JavaScript, SQLite/FTS5, and Pydantic**. Use `httpx` for model/source HTTP, `feedparser` for RSS, a small HTML extractor, and `pypdf` for text PDFs. Keep the list short and pin the actual versions selected at implementation in `uv.lock`, the Python version file, and the Docker base image.

Run one app process. Ingestion is an explicit CLI/admin operation; insights are generated on demand. Rank all events cheaply, then analyze only the opened event or a small requested set. Cache document extraction and completed analyses. No separate worker is necessary at demo scale.

Use an original Python agent loop and local search. No external AI search service, hosted autonomous agent, or ready-made multi-agent system forms the core. Do not add an unapproved embedding LLM. Full diagrams and contracts are in [ARCHITECTURE.md](ARCHITECTURE.md).

### Approved models and portability

Names below are copied from p. 18; they are not confirmed API model IDs or verified availability.

| Approved model | Potential role |
|---|---|
| Gemma 4 26B A4B | Cheap classification and structured extraction |
| GLM-5.3-Flash | More difficult reasoning, if needed |
| Qwen3.6 35B A3B | Initial general-purpose planning, interpretation, and follow-up |
| DeepSeek-V4.1-Flash | Optional alternative for deeper relationship analysis |
| Qwen3-VL-30B-A3B-Instruct | Optional scanned-page/image processing if the supplied assets require it |
| Kimi-K2.6 | Optional alternative for text analysis |

Start with one available approved general-purpose model to minimize integration work. Add a cheaper approved extractor only if measured cost warrants it. Keep all calls behind `complete_json(task, payload, schema)`; provider transport and model mapping live in one module. Use schema-validated JSON actions so the agent does not depend on provider-native tool calling. Do not assume the endpoint is OpenAI-compatible.

Track input/output tokens, model, latency, and estimated ruble cost per run. Configure actual provider prices and a daily application ceiling below the shared ₽500 limit; reserve expected call cost before sending requests. Set context/output limits, cache by input/model/prompt version, and bound agent steps. If prices or quota status are unknown, show cost as unknown and use an explicit conservative call/token cap. An application counter cannot control spending by other users of the shared key; the provider quota remains authoritative.

## 6. Build order and acceptance gates

Planning estimate: **roughly 18–28 focused engineering hours**, assuming accessible assets and a usable model endpoint. This is an estimate, not a deadline commitment. Build one vertical slice first; use its evidence and contracts to guide the remaining work.

| Step | Effort | Deliverable and exit check |
|---|---:|---|
| 1. Confirm inputs and scaffold | 2–3h | Inspect real file schemas and model API; create pinned Python app, configuration, SQLite initialization, synthetic seed, Dockerfile/Compose; one command starts the home page and health check |
| 2. Prove one insight end to end | 4–6h | One company, one unseen news text, one actual bank-research passage; real model produces a structured, cited insight through planned tool use and a recorded self-check; unsupported claims become caveats |
| 3. Generalize ingestion and ranking | 3–5h | CSV adapters, RSS/HTML parser, PDF passages, deduplication, company/group/relationship features, explainable ranking; reimport is idempotent; two same-sector companies yield different rankings |
| 4. Complete the interaction | 4–6h | Bank-style entry, company/role selection, feed/detail/source views, tool trace, follow-up and alternate lens, feedback, useful loading/error states; scripted demo works in a browser |
| 5. Validate and package | 5–8h | Held-out tests, genuine retry/abstention demonstration, budget/error checks, clean container startup, README, notices, updated architecture, and recorded demo instructions |

If time is tight, reduce the number of news sources, visual polish, and prefetched insights first. Keep a live model run, actual bank material, personalized ranking, citations, self-correction, follow-up, and reproducible startup.

Implementation handoffs should be narrow: “implement these schemas and the CSV importer,” “implement the ranked feed against this response contract,” or “implement the agent loop against these tool functions.” Keep each step runnable before adding the next. Avoid asking a coding model to invent the entire system at once.

## 7. What must be verified

Tests are planned below; none have run because this request is for planning.

| Check | Evidence required |
|---|---|
| Clean start | Fresh local data directory; `docker compose up --build` initializes storage and starts a functional demo; repeat startup preserves data and does not duplicate seed records |
| Personalized selection | At least three annotated events rank differently for same-sector companies with different product, geography, or relationship exposures; role switch changes emphasis without changing facts |
| Context correctness | Missing values remain unknown; group/payment/person links have provenance; no fabricated market share, balances, job roles, or contract terms |
| Ingestion and deduplication | RSS/HTML and PDF input work; two reports of one event share an event group but retain both sources; repeats do not duplicate records; changed content becomes a new version |
| Unseen content | Five held-out articles are ingested through the same parser and analyzed without fixture-specific IDs or handwritten result selection |
| Depth and bank contribution | An interpretation combines at least two supported company/event factors; a relevant actual bank passage demonstrably changes or qualifies the explanation; no matching bank evidence is disclosed |
| Evidence | Every factual assertion and attributed bank view resolves to a stored source passage; every AI implication names its company feature/evidence basis and assumptions; invented citations are rejected |
| Agent behavior | Trace contains a plan, real tool calls, retained context, self-check, and completion; a sparse/conflicting case causes a real new search or revision, then a qualified result or abstention if unresolved |
| Follow-up | Question and alternate lens retain company/user scope, produce cited answers, and can retrieve additional evidence; switching company never reuses another company's private context |
| Robustness | Malformed model JSON, timeout, empty search, unavailable source, noisy input, stale/conflicting research, and exhausted budget lead to explicit recoverable states rather than fabricated output |
| Boundaries | Wrong-company requests are denied; document text cannot select arbitrary tools or URLs; secrets and unnecessary personal data are absent from browser payloads and traces |
| Interaction | Browser smoke test completes entry → company/role → feed → insight → source → follow-up → company switch → feedback; this includes actual responses, not only rendered screenshots |

Automate deterministic importer/ranker/schema/access/budget tests with pytest and a small browser smoke test with Playwright. A clearly labeled fixture model can make these tests repeatable, but it must never count as live agent validation. Run a separate opt-in integration check against an approved model and actual supplied bank research; record model, date, run ID, and outcome.

### Small evaluation and monitoring loop

Prepare a compact evaluation pack: four company profiles, roughly 20 articles including five held-out items, two roles, human relevance labels, and a few missing/conflicting/adversarial examples. Report held-out performance separately from development cases; these numbers are prototype evidence, not statistical proof of generalization.

Record precision@5 for company relevance; citation validity and manually judged support; factual error and unsupported-attribution counts; company-specific usefulness; successful retry/abstention; response latency; and token/ruble usage. Initial release gates: all emitted citation IDs resolve, no unsupported bank attribution or invented company facts in reviewed cases, and at least 4/5 relevant top results on the small labeled demo set. Treat semantic support as a human-reviewed metric, not something proven by source-ID checks.

Store useful/not useful feedback with company, role, insight, and reason. After importer, prompt, model, or scoring changes, rerun the pack and review failures. During the demo, inspect failed runs, daily usage, and negative feedback in a simple admin view/CLI report. Document a weekly expert sample review for continued use. No monitoring platform is necessary.

## 8. Requirement coverage

All twelve success criteria are included; references identify where they are implemented or demonstrated.

| PDF criterion | Prototype response |
|---|---|
| 1. Company context and selection, p. 9 | CSV/profile features, relationships, role-aware explainable ranker; same-sector comparison |
| 2. Substantive interpretation, p. 9 | Structured consequence chain combining company features, news, and bank evidence; risks, opportunities, conditional actions |
| 3. Alfa-Bank expertise and attribution, p. 9 | Actual research retrieval; visible bank/AI separation; no invented bank view |
| 4. Combine, summarize, and preserve sources, p. 9 | Parsers, event grouping, passage-level provenance, citation and contradiction checks |
| 5. Unseen-news quality, p. 9 | Generic ingestion path and held-out evaluation |
| 6. Complete user journey, p. 9 | Demo entry through interpreted event, sources, and a relevant next question/action |
| 7. Extension and maintenance, p. 10 | Configurable source adapters, profile/ranking rules, prompts and model adapter; extension notes below |
| 8. Metrics and review, p. 10 | Evaluation pack, feedback, regression runs, operational counters, expert review |
| 9. Persistent bank-home entry, p. 10 | Home tile and persistent navigation in the demo bank shell |
| 10. Interact with prepared analysis, p. 10 | Follow-up, alternate analytical lens, and source navigation |
| 11. Autonomous multi-step logic, p. 10 | Own bounded planner/tool/check/retry loop; not a single summarization prompt |
| 12. Traceability, p. 10 | Recorded tool actions, source passages, feature IDs, rank reasons, validation and revisions |

The six constraints on pp. 11–12 map directly to these decisions: company-specific causal interpretation rather than summary; actual bank analysis that influences conclusions; feature-level personalization; approved models only; explicit unknown/conflict handling; and documented access, privacy, tool control, logging, and action boundaries. The six quality questions on p. 14 become the insight's six visible sections.

## 9. Documentation and submission package

Keep documentation close to the implementation and use Mermaid diagrams that render on GitHub. These two planning documents establish the design; update them to describe the actual implementation and observed limitations.

| Artifact | Required content |
|---|---|
| `README.md` | Purpose, architecture summary, prerequisites, exact launch/test commands, model configuration and environment-variable names, components, demo journey, known limitations |
| `docs/ARCHITECTURE.md` | Plain-language explanation plus component, pipeline, agent, workflow, and data-model diagrams; evidence and security boundaries; update proposed contracts to actual ones |
| `docs/DEMO.md` | Exact click-through script, company/role comparisons, unseen-input and retry cases, recorded evaluation results, distinction between fixture and live checks |
| `.env.example` | Non-secret placeholders for confirmed provider settings, model IDs, prices/budget, data location, demo mode; never a live key |
| `Dockerfile`, `compose.yaml`, `pyproject.toml`, `uv.lock`, Python version pin | Single reproducible startup and pinned runtime/key dependencies |
| Synthetic fixtures and demo users | Self-contained test journey; provenance and simulated fields clearly marked; data-use/redistribution limits respected |
| `THIRD_PARTY_NOTICES` | Libraries, model names/providers, dataset and research sources, service dependencies, licenses where applicable, simulated bank integration/authentication |
| Git history and release identifier | Reviewable commits and exact deadline commit hash/tag; jury access if private, arranged by the owner |

FastAPI's generated OpenAPI can supply API reference without a separate documentation project. External free hosting is recommended by the brief, not a prerequisite for the local prototype. Deploy only if needed for judging; keep live credentials server-side. Do not grant repository access, publish, or deploy as part of this planning request.

## 10. Extension path and readiness boundary

Add an industry through a profile mapping, a small exposure dictionary, and labeled examples. Add a source through an adapter returning the existing document schema. Change an inference model through the adapter and rerun the same evaluation pack. Keep schema, prompt, and scoring versions in stored runs so changes can be compared.

SQLite and one app process are appropriate for this demo. If actual usage later demands it, move the repository layer to Postgres and expensive jobs to a worker; retain the contracts and original agent logic. There is no reason to build that infrastructure now.

The first implementation actions are to inspect the two linked datasets and confirm model access. Missing credentials are entered securely through environment settings, never chat. Synthetic/fixture mode can unblock UI and parser work, but final live-demo readiness requires actual bank research, approved-model execution, completed acceptance checks, and tested startup instructions. No additional preference decision is needed to begin implementing this plan.
