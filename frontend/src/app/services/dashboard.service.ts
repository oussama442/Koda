import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
<<<<<<< HEAD
  private apiUrl = 'http://localhost:5000/api/dashboard';
=======
  private apiUrl = '/api/dashboard';
>>>>>>> 11e8399 (feat: upload latest version of Koda ERP with full module integration and glassmorphism UI)
  constructor(private http: HttpClient) {}
  getOverview(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/overview');
  }
}
