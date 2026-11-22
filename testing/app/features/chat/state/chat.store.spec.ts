import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { ChatApiService } from '../../../../../src/app/features/chat/api/chat-api.service';
import { ChatConnectionService } from '../../../../../src/app/features/chat/state/chat-connection.service';
import { ChatStore } from '../../../../../src/app/features/chat/state/chat.store';
import type { ChatEventDto } from '../../../../../src/app/features/chat/models/chat.models';
import { conversation } from '../../../../fixtures/chat';

describe('Chat snapshot recovery', () => {
  it('ignores old revisions and resubscribes the active conversation after reconnect', () => {
    const events = new Subject<ChatEventDto>(); const ready = new Subject<void>();
    const command = jasmine.createSpy().and.returnValue(of({ type: 'snapshot' }));
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(),
      { provide: ChatApiService, useValue: { list$: () => of([conversation]), get$: () => of(conversation) } },
      { provide: ChatConnectionService, useValue: { events, ready, status: signal('connected'), command$: command, connect() {}, disconnect() {} } },
    ] });
    const store = TestBed.inject(ChatStore); store.start(); store.open$(conversation.id).subscribe();
    events.next({ type: 'snapshot', conversation: { ...conversation, revision: 4, title: 'Recovered response' } });
    events.next({ type: 'snapshot', conversation: { ...conversation, revision: 2, title: 'Outdated' } });
    expect(store.current()?.title).toBe('Recovered response');
    expect(store.conversations()[0].revision).toBe(4);
    ready.next(); expect(command).toHaveBeenCalledTimes(2);
    expect(command.calls.mostRecent().args[0].conversationId).toBe(conversation.id); store.stop();
  });
});
