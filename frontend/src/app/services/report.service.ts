import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = '/api/reports';

  constructor(private http: HttpClient) {}

  exportTasksExcel() {
    return this.http.get(`${this.apiUrl}/export/tasks/excel`, { responseType: 'blob' });
  }

  exportIncidentsPDF() {
    return this.http.get(`${this.apiUrl}/export/incidents/pdf`, { responseType: 'blob' });
  }
}
