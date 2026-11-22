import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { A2uiSurfaceViewModel } from './a2ui-surface.view-model';
import type {
  A2uiSurfaceDto,
  UiActionIntent,
} from '../../models/chat.models';
@Component({
  selector: 'ngx-chat-learning-surface',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [A2uiSurfaceViewModel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="learning"
      [attr.aria-label]="ui().fallback"
      [attr.inert]="disabled() ? '' : null"
    >
      @if (vm.error()) {
        <p class="learning__fallback">{{ ui().fallback }}</p>
        <p class="learning__notice" role="status">
          This interactive content couldn't be displayed. Ask the
          assistant to explain it in text.
        </p>
      } @else if (vm.surface(); as surface) {
        <a2ui-surface [surface]="surface" />
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        margin: 1rem 0;
        --a2ui-color-primary: var(--mat-sys-primary, #405cb5);
        --a2ui-color-surface: var(--mat-sys-surface, #fff);
        --a2ui-color-on-surface: var(--mat-sys-on-surface, #202124);
      }
      .learning {
        padding: 1rem;
        border: 1px solid var(--mat-sys-outline-variant, #ddd);
        border-radius: 1rem;
        overflow-wrap: anywhere;
      }
      .learning[inert] {
        opacity: 0.75;
      }
      .learning__fallback {
        font-weight: 600;
      }
      .learning__notice {
        color: var(--mat-sys-on-surface-variant, #666);
        font-size: 0.85rem;
      }
    `,
  ],
})
export class A2uiSurfaceComponent {
  readonly ui = input.required<A2uiSurfaceDto>();
  readonly messageId = input.required<string>();
  readonly disabled = input(false);
  readonly action = output<UiActionIntent>();
  readonly vm = inject(A2uiSurfaceViewModel);
  constructor() {
    effect(() => this.vm.update(this.ui(), this.messageId()));
    this.vm.actions.pipe(takeUntilDestroyed()).subscribe((action) => {
      if (!this.disabled()) this.action.emit(action);
    });
  }
}
