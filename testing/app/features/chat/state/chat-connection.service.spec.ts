import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ChatApiService } from '../../../../../src/app/features/chat/api/chat-api.service';
import { CHAT_SOCKET_FACTORY, ChatConnectionService } from '../../../../../src/app/features/chat/state/chat-connection.service';

class FakeSocket {
  readyState = 1;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];
  send(value: string) { this.sent.push(value); }
  close() { this.readyState = 3; }
  emit(value: unknown) { this.onmessage?.({ data: JSON.stringify(value) }); }
}
describe('Chat connection', () => {
  let api: { ticket$: jasmine.Spy };
  let sockets: FakeSocket[];
  let transport: ChatConnectionService;
  beforeEach(() => {
    jasmine.clock().install(); sockets = [];
    api = { ticket$: jasmine.createSpy().and.returnValue(of({ ticket: 'one-use-ticket', expiresAt: '' })) };
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(),
      { provide: ChatApiService, useValue: api }, { provide: CHAT_SOCKET_FACTORY, useValue: () => {
        const socket = new FakeSocket(); sockets.push(socket); return socket as unknown as WebSocket;
      } },
    ] });
    transport = TestBed.inject(ChatConnectionService);
  });
  afterEach(() => { transport.disconnect(); jasmine.clock().uninstall(); });
  it('authenticates in a frame, correlates acknowledgements and rejects uncertain sends on disconnect', () => {
    transport.connect(); const socket = sockets[0]; socket.onopen?.();
    expect(JSON.parse(socket.sent[0])).toEqual({ type: 'authenticate', ticket: 'one-use-ticket' });
    socket.emit({ type: 'ready' }); expect(transport.status()).toBe('connected');
    let acknowledged = false;
    transport.command$({ type: 'subscribe', requestId: 'request', conversationId: 'conversation' }).subscribe(() => { acknowledged = true; });
    socket.emit({ type: 'snapshot', requestId: 'request' }); expect(acknowledged).toBeTrue();
    let failure = '';
    transport.command$({ type: 'send_message', requestId: 'send', conversationId: 'conversation', clientMessageId: 'message', text: 'Hello' }).subscribe({ error: error => { failure = error.message; } });
    socket.onclose?.(); expect(failure).toContain('draft is kept'); expect(transport.status()).toBe('reconnecting');
    jasmine.clock().tick(1000); expect(sockets.length).toBe(2); expect(api.ticket$).toHaveBeenCalledTimes(2);
  });
  it('stops reconnecting when authentication expires', () => {
    api.ticket$.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    transport.connect(); expect(transport.status()).toBe('sign-in-required');
    jasmine.clock().tick(60000); expect(api.ticket$).toHaveBeenCalledTimes(1);
  });
  it('times out uncertain acknowledgements and cleans up on navigation', () => {
    transport.connect(); sockets[0].emit({ type: 'ready' });
    let failure = '';
    transport.command$({ type: 'subscribe', requestId: 'request', conversationId: 'conversation' }).subscribe({ error: error => { failure = error.message; } });
    jasmine.clock().tick(15000); expect(failure).toContain('uncertain');
    transport.disconnect(); jasmine.clock().tick(60000); expect(sockets.length).toBe(1);
  });
});
