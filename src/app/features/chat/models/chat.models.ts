export type { A2uiSurfaceDto, A2uiActionDto, ChatCommandDto, ChatEventDto, ChatMessageDto, ChatPartDto,
  ConversationDto, SocketTicketDto } from '@tmdjr/service-ai-chat-contracts';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'sign-in-required';

export type UiActionIntent = { messageId: string; surfaceId: string; actionId: string; uiRevision: number; values: Record<string, unknown> };
