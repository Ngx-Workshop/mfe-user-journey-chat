# Chat development

Use Node 22 (Docker/CI baseline) and the committed lockfile. Keep builder
@angular-devkit/build-angular 21.2.26 and webpack override 5.105.2 for federation
license extraction compatibility. Keep license extraction enabled.

| Purpose | Command |
| --- | --- |
| Install | npm ci |
| Serve | npm start |
| Bundle watcher | npm run dev:bundle |
| Architecture | npm run check:architecture |
| Types | npx tsc --noEmit --noUnusedLocals --noUnusedParameters -p tsconfig.app.json |
| Test types | npx tsc --noEmit -p tsconfig.spec.json |
| Tests | npm test -- --watch=false --browsers=ChromeHeadless |
| Isolated production build | npm run build -- --output-path dist/chat-verification |

Do not overwrite an active watcher's dist output during verification. Existing
session-local remote override can serve localhost:4201/remoteEntry.js in the shell.
Direct standalone serving needs an explicit local gateway for /api; there is no
hardcoded production-service URL or fake backend in this remote.

Tests use HTTP/WebSocket doubles; frontend tests do not authenticate against the
real service. The normal Karma/Chrome suite requires permission to open local
ports. In the implementation sandbox the test runner aborted (exit 134) during
startup; test types and production build are separate successful checks, not a
substitute for executed browser tests. See specs/003-chat-foundation/handoff.md.

Published @tmdjr/service-ai-chat-contracts 0.0.7 is pinned in package/lockfile.
The generated preview tarball was removed after successful publication.

Manual integration acceptance: sign in, create a conversation, send input, confirm
it persists after reload, inspect a failed unconfigured-provider response, and
verify ownership with a different account. Disconnect/reconnect during a streaming run and stop a partial response. Test keyboard
submission, Shift+Enter, narrow layout, load errors and draft retention.

## A2UI verification
The integration workflow runs npm ci, architecture checks, real ChromeHeadless
tests and a production build before promotion. Fixtures are server-built A2UI
plans, quizzes and cards. Browser tests render the official custom elements,
check a checkbox, click Save checklist, assert bound values and preserve the
processor across equal-revision snapshots. Validation rejects unsupported
components, functions, navigation and cyclic graphs. Full production acceptance
requires a signed-in browser; the automation browser currently redirects to login.
See specs/004-a2ui-learning/handoff.md for run IDs and actual results.
