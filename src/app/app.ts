import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChatPageComponent } from './features/chat/pages/chat/chat-page.component';
@Component({
  selector: 'mfe-user-journey-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatPageComponent],
  template: `<ngx-chat-page />`,
  styles: [':host { display: block; }'],
})
export class App {}
export default App;
