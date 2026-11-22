# Chat MFE architecture

The remote owns the chat user journey. The shell owns global navigation/session,
the orchestrator loads the remote, and service-ai-chat owns conversation data,
authorization and response runs. No nested remotes or browser model credentials.

## Source map and data flow
features/chat/api/chat-api.service.ts is stateless HTTP transport using generated
contracts. state/chat-connection.service.ts owns WebSocket lifecycle, one-use HTTP
tickets, request correlation, uncertain delivery and bounded reconnect. Stateful
transport intentionally lives in state/ rather than the stateless API directory.
state/chat.store.ts owns shared conversation snapshots, revision ordering and
read orchestration. pages/chat/chat.view-model.ts owns scoped typed forms/drafts,
command streams and view errors. pages/chat/chat-page.component.ts composes the
sidebar, header, message feed and composer. Presentation components have typed
inputs/intent outputs and no API/store dependencies. Tests mirror this tree under
testing/app; fixtures live under testing/fixtures.

All components use OnPush, inline HTML/SCSS, BEM and Material/theme tokens. RxJS
switchMap handles replaceable reads; exhaustMap prevents duplicate sends/creates/
cancels; teardown is tied to DestroyRef. A draft is only cleared after its send is
acknowledged; uncertain delivery retains clientMessageId for a safe retry. Drafts
are scoped by conversation in the view model. They are not persisted across a full
page reload. The feed follows new messages only when near the bottom.

## Boundaries and contracts
HTTP uses /api/ai-chat/conversations and /socket-ticket. WebSocket uses the shell
origin at /api/ai-chat/socket with ws/wss selected from the page scheme. Tickets
are sent in an authenticate frame, never in a URL. There is no Socket.IO wrapper.
See the producer's generated ChatCommandDto, ChatEventDto, ConversationDto,
ChatMessageDto and ChatPartDto. Snapshot events carry full canonical state; higher
revisions replace older state. Reconnect resubscribes to recover missed updates.
On ready, authenticated principal changes clear cached conversations; auth failure
also clears cached content. Backend ownership remains authoritative.

Default socket retries: 6, exponential delay capped at 15 seconds. HTTP/socket
handshake deadlines: 10 seconds; command acknowledgement: 15 seconds. The UI
provides manual reconnect and load retry. Opening the MFE starts its connection;
leaving destroys scoped subscriptions and disconnects, while server runs continue.

Text uses Angular interpolation. A2UI v1.0 surfaces render through official
@a2ui/lit and @a2ui/web_core 0.15.0 inside a standalone Angular host. A scoped view
model owns the processor and teardown; unchanged message/surface/revision keys
preserve local choices across streaming snapshots. The restricted basic catalog
allows Column, Text, Card, Button, CheckBox, ChoicePicker and Divider, with no
renderer functions. Validation bounds the graph, bindings, actions and state;
unsupported content has a readable fallback. Text widgets use the renderer's
escaped plain-text fallback; Markdown HTML rendering is not enabled.

Actions emit typed intent through the feed/page/view model to ChatStore and the
existing authenticated socket. Quiz/checklist feedback is server-persisted; prompt
buttons use stored server prompts. Workshop navigation accepts only the internal
workshop route and validated IDs. Actions are disabled during running/disconnected
states. Welcome starters request plans, quizzes and real workshop recommendations.
Model selection, catalog access and API credentials remain server-side.

## Federation and compatibility
Named/default App, named Routes, remoteEntry.js, ./Component, ./Routes, remote name
mfe-user-journey-chat and dependency sharing retain their public identities.
Both empty path /chat and /chat/hello-world render chat. The host supplies HTTP
and session interceptors. Standalone appConfig remains available for bootstrap.
Angular/Material/CDK 21.1.0 and RxJS 7.8.2 remain aligned with the shell.
Production bundling keeps existing webpack compatibility settings. Font inlining
is disabled so production builds do not require Google Fonts network access.

Consumer pins published @tmdjr/service-ai-chat-contracts 0.0.7. Its reproducible
archive SHA-1 matches publication evidence from backend Actions run #7. No producer
checkout is required for consumer CI installation. The Lit renderer avoids the
Angular ^21.2.5 peer requirement of the current official Angular renderer.
