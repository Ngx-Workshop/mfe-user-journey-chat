import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { A2uiSurfaceComponent } from '../../../../../../src/app/features/chat/components/a2ui/a2ui-surface.component';
import { plan, quiz } from '../../../../../fixtures/a2ui';
import type { UiActionIntent } from '../../../../../../src/app/features/chat/models/chat.models';
function elements(root: Element): Element[] {
  return [
    root,
    ...Array.from(root.children).flatMap(elements),
    ...(root.shadowRoot
      ? Array.from(root.shadowRoot.children).flatMap(elements)
      : []),
  ];
}
async function find(
  root: Element,
  predicate: (e: Element) => boolean
) {
  for (let i = 0; i < 80; i++) {
    const found = elements(root).find(predicate);
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('A2UI component did not render');
}
describe('Official A2UI renderer in Angular', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [A2uiSurfaceComponent],
      providers: [provideZonelessChangeDetection()],
    })
  );
  it('renders a real checklist, resolves bound values and emits a typed action', async () => {
    const fixture = TestBed.createComponent(A2uiSurfaceComponent);
    fixture.componentRef.setInput('ui', structuredClone(plan));
    fixture.componentRef.setInput('messageId', 'assistant-message');
    fixture.detectChanges();
    const actions: UiActionIntent[] = [];
    fixture.componentInstance.action.subscribe((action) =>
      actions.push(action)
    );
    const host = fixture.nativeElement as HTMLElement;
    const checkbox = (await find(
      host,
      (e) => e instanceof HTMLInputElement && e.type === 'checkbox'
    )) as HTMLInputElement;
    checkbox.click();
    const button = (await find(
      host,
      (e) =>
        e instanceof HTMLButtonElement &&
        e.textContent?.includes('Save checklist') === true
    )) as HTMLButtonElement;
    button.click();
    expect(actions.at(-1)).toEqual({
      messageId: 'assistant-message',
      surfaceId: plan.surfaceId,
      actionId: 'save_progress',
      uiRevision: 0,
      values: { step_0: true },
    });
    const surface = fixture.componentInstance.vm.surface();
    fixture.componentRef.setInput('ui', structuredClone(plan));
    fixture.detectChanges();
    expect(fixture.componentInstance.vm.surface()).toBe(surface);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    button.click();
    expect(actions.length).toBe(1);
  });
  it('renders quiz choices and rejects unsupported saved content with readable fallback', async () => {
    const fixture = TestBed.createComponent(A2uiSurfaceComponent);
    fixture.componentRef.setInput('ui', structuredClone(quiz));
    fixture.componentRef.setInput('messageId', 'quiz-message');
    fixture.detectChanges();
    await find(
      fixture.nativeElement,
      (e) =>
        (e.textContent?.includes('What does Angular inject?') ===
          true &&
          e.tagName === 'LABEL') ||
        e instanceof HTMLInputElement
    );
    const unsafe = { ...quiz, version: 'unsupported' as '1.0' };
    fixture.componentRef.setInput('ui', unsafe);
    fixture.componentRef.setInput('messageId', 'bad-message');
    fixture.detectChanges();
    expect(fixture.componentInstance.vm.error()).toBeTrue();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "couldn't be displayed"
    );
  });
});
