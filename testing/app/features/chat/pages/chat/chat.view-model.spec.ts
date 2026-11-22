import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ChatViewModel } from '../../../../../../src/app/features/chat/pages/chat/chat.view-model';
import { ChatStore } from '../../../../../../src/app/features/chat/state/chat.store';
import { conversation } from '../../../../../fixtures/chat';

describe('Chat draft delivery', () => {
  it('preserves a failed draft, retries the same message identity and clears only on acknowledgement', () => {
    const send = jasmine.createSpy().and.returnValue(throwError(() => new Error('Connection lost')));
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), ChatViewModel,
      { provide: ChatStore, useValue: {
        conversations: signal([conversation]), current: signal(conversation), loading: signal(false), error: signal(''),
        connectionStatus: signal('connected'), activeRun: signal(undefined), send$: send, start() {}, stop() {},
      } },
    ] });
    const vm = TestBed.inject(ChatViewModel); vm.form.controls.text.setValue('Explain Angular DI'); vm.send();
    expect(vm.form.controls.text.value).toBe('Explain Angular DI'); expect(vm.sending()).toBeFalse();
    const id = send.calls.mostRecent().args[1];
    send.and.returnValue(of({ type: 'snapshot' })); vm.send();
    expect(send.calls.mostRecent().args[1]).toBe(id); expect(vm.form.controls.text.value).toBe('');
  });
});
