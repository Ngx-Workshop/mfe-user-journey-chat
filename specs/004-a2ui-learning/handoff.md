# A2UI learning handoff

Status: Implemented and deployed; authenticated production acceptance pending.

## Delivered
Official @a2ui/lit and @a2ui/web_core 0.15.0 render A2UI v1.0 inside the Angular
21.1 chat MFE. Restricted catalog, graph/action/binding validation, scoped processor
lifecycle and stable surface revisions preserve local input across snapshots.
Learning plans/checklists, practice quizzes, workshop recommendations/outlines and
published lab previews are selected through bounded server tools. Checklist and
quiz feedback persist; follow-up buttons submit stored server prompts. Welcome
starters introduce the three main journeys. No model API key reaches the browser.
Published service-ai-chat-contracts 0.0.7 is pinned with verified registry integrity.

## Evidence
- Integration commit c25131bdca1e6c941c6a78872bb218f32a8956ae, Actions run
  https://github.com/Ngx-Workshop/mfe-user-journey-chat/actions/runs/45030161384:
  clean npm ci, architecture checks, 12 ChromeHeadless tests and production build passed.
- Production commit ea5224d0add1809a91eded03b6d0b5990ba153bf, Actions run
  https://github.com/Ngx-Workshop/mfe-user-journey-chat/actions/runs/45030765726:
  same checks passed; complete static deployment promoted successfully, obsolete
  assets removed and Nginx mount verified.
- Renderer tests use real official custom elements: checkbox interaction and
  save action resolve step_0:true, disabled actions are suppressed, equal-revision
  snapshots keep the same processor, quiz choices render, invalid content falls back.
- Local architecture checks and generated-contract test typing were checked.
  Full local renderer build/tests were blocked by package registry DNS and local
  port restrictions; CI executed the actual installed dependency/browser checks.
- A browser navigation to https://beta.ngx-workshop.io/chat/hello-world redirects
  to the auth login page. No signed-in production UI interaction was performed.

## Remaining manual acceptance
Sign in at /chat, request a learning plan, save checklist progress, reload, answer
a practice quiz and verify feedback survives reconnect. Explore Angular workshops,
preview a real outline/lab, and open a workshop. Check keyboard/narrow layout and
shell theme. These live checks require a signed-in browser; CI doubles do not prove
Mongo persistence, actual provider selection or catalog runtime reachability.

Plain text is deliberately escaped; no Markdown HTML renderer is configured.
Full MCP OAuth, graded assessments and code execution remain outside this feature.
