# AlfaCase — personalized business news insights

An interactive UI mockup and implementation plan for the Alfa-Bank news analytics challenge.

The product has three layers:

1. **Intelligence — required:** company profile → relevant news → Alfa-Bank research.
2. **Business Impact — required:** why it matters → financial exposure → risks and opportunities → evidence.
3. **Decision Intelligence — our differentiator:** compare options → model scenarios → evaluate trade-offs → recommend next steps.

The prototype will demonstrate the third layer with one interactive financing comparison, using explicit inputs and deterministic calculations alongside the cited AI analysis.

- [Interactive mockup](mockup/standalone.html): self-contained HTML; download and open in a browser. Includes live scenario calculations and clearly labeled synthetic content.
- [Run and explore the mockup](mockup/README.md): launch instructions, demo journey, screenshots, and implementation boundaries.
- [Prototype plan](docs/PROTOTYPE_PLAN.md): scope, build order, acceptance checks, and coverage of the challenge requirements.
- [Architecture and workflows](docs/ARCHITECTURE.md): component diagrams, ingestion pipeline, agent loop, user journey, data contracts, and worked example.
- [Agent logic](docs/AGENT_LOGIC.md): explanatory diagrams, shared state, role responsibilities, retry and stopping rules, and the mapping from mockup to future implementation.

The plan is based on the supplied 19-page **«Альфа Хак: Новостная аналитика»** brief. Page references in the documentation refer to that PDF.

**Status:** the frontend mockup works; the Python backend, actual news ingestion, retrieval, approved-model calls, and real bank-research integration are not implemented. Source and agent views are explicitly simulated. The architecture describes the intended implementation.
