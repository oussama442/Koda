import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImprovementService {
  private apiUrl = '/api/improvements';
  private isBrowser: boolean;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (this.isBrowser) {
      const token = localStorage.getItem('token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  getImprovements(applicationId?: number): Observable<any[]> {
    if (!this.isBrowser) return of([]);
    let url = this.apiUrl;
    if (applicationId) {
      url += `?application_id=${applicationId}`;
    }
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  createImprovement(improvement: any): Observable<any> {
    return this.http.post(this.apiUrl, improvement, { headers: this.getHeaders() });
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status }, { headers: this.getHeaders() });
  }
}
