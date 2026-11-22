import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';
import type { ConversationDto, SocketTicketDto } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/ai-chat';
  list$() { return this.http.get<ConversationDto[]>(`${this.base}/conversations`).pipe(timeout(10000)); }
  get$(id: string) { return this.http.get<ConversationDto>(`${this.base}/conversations/${encodeURIComponent(id)}`).pipe(timeout(10000)); }
  create$() { return this.http.post<ConversationDto>(`${this.base}/conversations`, {}).pipe(timeout(10000)); }
  ticket$() { return this.http.post<SocketTicketDto>(`${this.base}/socket-ticket`, {}).pipe(timeout(10000)); }
}
