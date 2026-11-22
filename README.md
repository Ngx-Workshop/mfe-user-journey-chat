# mfe-user-journey-chat

Angular chat remote for NGX Workshop. Includes conversation navigation, message
feed, composer, connection/retry status, cancellation and extensible typed message
parts. Uses service-ai-chat for persistence, authentication and WebSocket updates.
The backend streams OpenAI responses; A2UI rendering remains a future addition.

Use Node 22 and npm ci. Run npm run dev:bundle for the existing local remote
workflow. The shell can mount /chat or /chat/hello-world. Its HTTP interceptors
and Nginx provide same-origin /api/ai-chat access.

- [Architecture](docs/architecture.md)
- [Development and verification](docs/development.md)
- [Foundation handoff](specs/003-chat-foundation/handoff.md)

The MFE pins published @tmdjr/service-ai-chat-contracts 0.0.5.
Backend changes need deployment before this frontend can use the new endpoints.
