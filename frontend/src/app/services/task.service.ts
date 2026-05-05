import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:5000/api/tasks';

  constructor(private http: HttpClient) { }

  getTasks(projectId?: number, sprintId?: number): Observable<any[]> {
    let url = this.apiUrl;
    const params = [];
    if (projectId) params.push(`project_id=${projectId}`);
    if (sprintId) params.push(`sprint_id=${sprintId}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get<any[]>(url);
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
