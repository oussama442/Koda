
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-3xl font-black text-gray-900 tracking-tight">System Dashboard</h2>
        <p class="text-sm text-gray-500 mt-1">Overview of your mission critical infrastructure.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="koda-card p-6 flex flex-col justify-between">
          <div class="flex items-center gap-4 text-red-500 mb-4">
            <h3 class="font-bold text-sm tracking-widest uppercase text-gray-500">Critical Incidents</h3>
          </div>
          <p class="text-4xl font-black text-gray-900">{{ overview()?.criticalIncidents || 0 }}</p>
        </div>
        <div class="koda-card p-6 flex flex-col justify-between">
          <div class="flex items-center gap-4 text-blue-500 mb-4">
            <h3 class="font-bold text-sm tracking-widest uppercase text-gray-500">Total Apps</h3>
          </div>
          <p class="text-4xl font-black text-gray-900">{{ overview()?.totalApplications || 0 }}</p>
        </div>
        <div class="koda-card p-6 flex flex-col justify-between">
          <div class="flex items-center gap-4 text-emerald-500 mb-4">
            <h3 class="font-bold text-sm tracking-widest uppercase text-gray-500">Active Projects</h3>
          </div>
          <p class="text-4xl font-black text-gray-900">{{ overview()?.totalProjects || 0 }}</p>
        </div>
      </div>

      <div class="koda-card overflow-hidden mt-8">
        <div class="p-6 bg-gray-50 border-b border-gray-100">
          <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Recent Deployments</h3>
        </div>
        <table class="w-full text-left">
          <tr class="bg-gray-50/50">
            <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Version</th>
            <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">App ID</th>
          </tr>
          <tr *ngFor="let dep of overview()?.recentDeployments || []">
            <td class="px-6 py-4 font-bold text-gray-700">{{ dep.version }}</td>
            <td class="px-6 py-4">{{ dep.application_id }}</td>
          </tr>
        </table>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  overview = signal<any>(null);
  constructor(private dashboardService: DashboardService) {}
  ngOnInit() {
    this.dashboardService.getOverview().subscribe(data => this.overview.set(data));
  }
}
