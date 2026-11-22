import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'ngx-chat-composer',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="composer" [formGroup]="form()" (ngSubmit)="send.emit()">
      <mat-form-field class="composer__field" appearance="outline">
        <mat-label>Message the workshop assistant</mat-label>
        <textarea matInput formControlName="text" rows="3" maxlength="8000" [readOnly]="sending()"
          (keydown)="onKeydown($event)" aria-describedby="composer-help"></textarea>
        <mat-hint id="composer-help">Enter to send · Shift+Enter for a new line</mat-hint>
      </mat-form-field>
      <div class="composer__actions">
        <span class="composer__note">AI responses may contain mistakes.</span>
        @if (running()) {
          <button mat-stroked-button type="button" [disabled]="stopping() || !connected()" (click)="stop.emit()">
            {{ stopping() ? 'Stopping…' : 'Stop response' }}</button>
        } @else {
          <button mat-flat-button type="submit" [disabled]="!enabled() || form().invalid || !form().controls.text.value.trim()">
            {{ sending() ? 'Sending…' : 'Send message' }}</button>
        }
      </div>
    </form>
  `,
  styles: [`
    :host { display: block; }
    .composer { padding: 1rem 1.5rem; border-top: 1px solid var(--mat-sys-outline-variant, #ddd); }
    .composer__field { width: 100%; }
    .composer__actions { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
    .composer__note { font-size: .75rem; color: var(--mat-sys-on-surface-variant, #666); }
    @media (max-width: 600px) { .composer { padding: .75rem; } .composer__note { max-width: 9rem; } }
  `],
})
export class ChatComposerComponent {
  readonly form = input.required<FormGroup<{ text: FormControl<string> }>>();
  readonly enabled = input(false);
  readonly connected = input(false);
  readonly sending = input(false);
  readonly running = input(false);
  readonly stopping = input(false);
  readonly send = output<void>();
  readonly stop = output<void>();
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (this.enabled() && this.form().valid && this.form().controls.text.value.trim()) this.send.emit();
    }
  }
}
