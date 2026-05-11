import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SprintService {
<<<<<<< HEAD
  private apiUrl = 'http://localhost:5000/api/sprints';
=======
  private apiUrl = '/api/sprints';
>>>>>>> 11e8399 (feat: upload latest version of Koda ERP with full module integration and glassmorphism UI)

  constructor(private http: HttpClient) { }

  getSprints(projectId?: number): Observable<any[]> {
    const url = projectId ? `${this.apiUrl}?project_id=${projectId}` : this.apiUrl;
    return this.http.get<any[]>(url);
  }

  getSprint(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createSprint(sprint: any): Observable<any> {
    return this.http.post(this.apiUrl, sprint);
  }

  updateSprint(id: number, sprint: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, sprint);
  }

  deleteSprint(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
