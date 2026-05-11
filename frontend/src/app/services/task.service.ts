import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
<<<<<<< HEAD
  private apiUrl = 'http://localhost:5000/api/tasks';
=======
  private apiUrl = '/api/tasks';
>>>>>>> 11e8399 (feat: upload latest version of Koda ERP with full module integration and glassmorphism UI)

  constructor(private http: HttpClient) { }

  getTasks(projectId?: number, sprintId?: any): Observable<any[]> {
    let params: any = {};
    if (projectId) params.project_id = projectId;
    
    // Only add sprint_id if it's a valid number (not null, not "null", not undefined)
    if (sprintId && sprintId !== 'null' && sprintId !== 'undefined') {
      params.sprint_id = sprintId;
    }
    
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getTask(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createTask(task: any): Observable<any> {
    return this.http.post(this.apiUrl, task);
  }

  updateTask(id: number, task: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  addComment(taskId: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${taskId}/comments`, { comment });
  }
}
