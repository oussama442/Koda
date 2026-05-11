import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectMemberService {
<<<<<<< HEAD
  private apiUrl = 'http://localhost:5000/api/project-members';
=======
  private apiUrl = '/api/project-members';
>>>>>>> 11e8399 (feat: upload latest version of Koda ERP with full module integration and glassmorphism UI)

  constructor(private http: HttpClient) { }

  getMembers(projectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${projectId}`);
  }

  addMember(memberData: any): Observable<any> {
    return this.http.post(this.apiUrl, memberData);
  }

  removeMember(projectId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${projectId}/${userId}`);
  }
}
