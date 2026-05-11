import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
<<<<<<< HEAD
  private apiUrl = 'http://localhost:5000/api/roles';
=======
  private apiUrl = '/api/roles';
>>>>>>> 11e8399 (feat: upload latest version of Koda ERP with full module integration and glassmorphism UI)

  constructor(private http: HttpClient) { }

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getRole(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getPermissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/permissions`);
  }

  createRole(role: any): Observable<any> {
    return this.http.post(this.apiUrl, role);
  }

  updateRole(id: number, role: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, role);
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
