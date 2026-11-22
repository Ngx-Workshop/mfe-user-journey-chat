# Chat tests

Specs mirror src/app/features/chat under testing/app/features/chat. Fixtures are
synthetic; runtime never imports tests. The suite covers connection authentication,
acknowledgement correlation, uncertain sends/retry, expired auth, revision ordering,
resubscription, draft preservation, empty/loading/error UI and conversation creation.

Run npm test -- --watch=false --browsers=ChromeHeadless. This requires a Chrome
binary and local listening ports. npx tsc --noEmit -p tsconfig.spec.json checks
spec types without executing a browser; report those checks separately.
