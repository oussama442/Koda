import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <!-- Welcome Card -->
      <div class="koda-card p-10 bg-linear-to-br from-white to-orange-50 border-orange-100">
         <h2 class="text-3xl font-black mb-4">Good morning, {{ user?.full_name }}! 👋</h2>
         <p class="text-gray-500 max-w-2xl leading-relaxed">The dashboard is currently under construction, but your authentication is working perfectly. You are logged in as an <strong>{{ user?.is_global_admin ? 'Administrator' : 'User' }}</strong>.</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="koda-card p-8 bg-white hover:border-orange-200 transition-all">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Projects</h3>
          <p class="text-4xl font-black">12</p>
        </div>
        <div class="koda-card p-8 bg-white hover:border-orange-200 transition-all">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Active Tasks</h3>
          <p class="text-4xl font-black">48</p>
        </div>
        <div class="koda-card p-8 bg-white hover:border-orange-200 transition-all">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Open Incidents</h3>
          <p class="text-4xl font-black text-red-600">3</p>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  user: any;

  constructor(private authService: AuthService, private router: Router) {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
