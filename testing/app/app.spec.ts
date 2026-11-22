import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject, of } from 'rxjs';
import { App } from '../../src/app/app';
import { ChatConnectionService } from '../../src/app/features/chat/state/chat-connection.service';
import { conversation } from '../fixtures/chat';

describe('Chat journey', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [App], providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(),
      { provide: ChatConnectionService, useValue: { events: new Subject(), ready: new Subject(), status: signal('connected'),
        connect() {}, disconnect() {}, command$: () => of({ type: 'snapshot' }) } },
    ] }); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('renders an empty state, creates a conversation and provides a labeled composer', async () => {
    const fixture = TestBed.createComponent(App); fixture.detectChanges();
    http.expectOne('/api/ai-chat/conversations').flush([]); fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Start a conversation');
    const button = [...element.querySelectorAll('button')].find(item => item.textContent?.includes('Start a conversation'))!;
    button.click(); http.expectOne('/api/ai-chat/conversations').flush(conversation); fixture.detectChanges();
    expect(element.querySelector('textarea')).toBeTruthy();
    expect(element.textContent).toContain('Angular DI');
    fixture.destroy();
  });
  it('offers retry when conversation loading fails', () => {
    const fixture = TestBed.createComponent(App); fixture.detectChanges();
    http.expectOne('/api/ai-chat/conversations').flush({}, { status: 503, statusText: 'Unavailable' }); fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Could not load');
    [...element.querySelectorAll('button')].find(item => item.textContent?.includes('Retry loading'))!.click();
    http.expectOne('/api/ai-chat/conversations').flush([]); fixture.destroy();
  });
});
