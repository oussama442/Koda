import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:5000/api/notifications';
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // Poll for notifications immediately and then every 10 seconds
    timer(0, 10000).pipe(
      switchMap(() => this.getNotifications())
    ).subscribe(notifs => {
      this.updateUnreadCount(notifs);
    });
  }

  getNotifications(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/mark-all-read`, {});
  }

  updateUnreadCount(notifs: any[]) {
    console.log('Received notifications:', notifs);
    const count = notifs.filter(n => !n.is_read).length;
    console.log('Calculated unread count:', count);
    this.unreadCountSubject.next(count);
  }
}
