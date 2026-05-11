import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
<<<<<<< HEAD
  private apiUrl = 'http://localhost:5000/api/documents';
  public uploadUrl = 'http://localhost:5000/uploads';
=======
  private apiUrl = '/api/documents';
  public uploadUrl = '/uploads';
>>>>>>> 11e8399 (feat: upload latest version of Koda ERP with full module integration and glassmorphism UI)

  constructor(private http: HttpClient) {}

  getProjectDocuments(projectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/project/${projectId}`);
  }

  upload(file: File, projectId?: number, taskId?: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('project_id', projectId.toString());
    if (taskId) formData.append('task_id', taskId.toString());

    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
