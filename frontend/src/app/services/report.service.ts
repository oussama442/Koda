import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:5000/api/reports';

  constructor(private http: HttpClient) {}

  exportTasksExcel() {
    return this.http.get(`${this.apiUrl}/tasks/excel`, { responseType: 'blob' });
  }

  exportIncidentsPDF() {
    return this.http.get(`${this.apiUrl}/incidents/pdf`, { responseType: 'blob' });
  }
}
