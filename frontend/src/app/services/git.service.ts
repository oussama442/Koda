import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GitService {
  private apiUrl = '/api/git';

  constructor(private http: HttpClient) {}

  getAllCommits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/commits`);
  }

  getCommitsByApplication(appId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/commits/application/${appId}`);
  }

  syncCommits(appId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sync`, { application_id: appId });
  }
}
