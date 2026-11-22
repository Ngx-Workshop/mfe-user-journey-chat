import {
  DestroyRef,
  Injectable,
  inject,
  signal,
} from '@angular/core';
import { Subject } from 'rxjs';
import '@a2ui/lit';
import { MessageProcessor } from '@a2ui/web_core';
import {
  basicCatalog,
  injectBasicCatalogStyles,
} from '@a2ui/web_core/v1_0';
import type {
  A2uiSurfaceDto,
  UiActionIntent,
} from '../../models/chat.models';
import {
  LEARNING_COMPONENTS,
  validateLearningSurface,
} from '../../utils/a2ui-validation';
function processor(
  onAction: (name: string, context: Record<string, unknown>) => void
) {
  const catalog = basicCatalog.withEntries(
    [...basicCatalog.components.values()].filter((component) =>
      LEARNING_COMPONENTS.includes(component.name)
    ),
    []
  );
  return new MessageProcessor([catalog], (action) =>
    onAction(action.name, action.context || {})
  );
}
@Injectable()
export class A2uiSurfaceViewModel {
  readonly surface = signal<unknown>(null);
  readonly error = signal(false);
  readonly actions = new Subject<UiActionIntent>();
  private processor?: ReturnType<typeof processor>;
  private key = '';
  constructor() {
    injectBasicCatalogStyles();
    inject(DestroyRef).onDestroy(() => {
      this.processor?.dispose();
      this.actions.complete();
    });
  }
  update(ui: A2uiSurfaceDto, messageId: string) {
    const key = `${messageId}:${ui.surfaceId}:${ui.revision}`;
    if (key === this.key) return;
    this.key = key;
    this.processor?.dispose();
    this.surface.set(null);
    this.error.set(false);
    try {
      validateLearningSurface(ui);
      this.processor = processor((name, context) => {
        if (!ui.actions.some((action) => action.id === name)) return;
        this.actions.next({
          messageId,
          surfaceId: ui.surfaceId,
          actionId: name,
          uiRevision: ui.revision,
          values: context,
        });
      });
      this.processor.processMessages(
        ui.messages as Parameters<
          typeof this.processor.processMessages
        >[0]
      );
      const surface = this.processor.getSurfaces().get(ui.surfaceId);
      if (!surface) throw new Error('Surface unavailable');
      this.surface.set(surface);
    } catch {
      this.processor?.dispose();
      this.error.set(true);
    }
  }
}
