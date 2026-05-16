import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';
import { ReportService } from '../services/report.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-10 p-2 animate-in fade-in duration-500">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-4xl font-black text-gray-900 tracking-tight uppercase">Cockpit Global</h2>
          <p class="text-sm font-medium text-gray-400 mt-1 uppercase tracking-widest">Vue d'ensemble de l'infrastructure Koda</p>
        </div>
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button (click)="syncGit()" class="px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Sync GitLab
          </button>
          <button (click)="exportPDF()" [disabled]="isExportingPdf" class="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2 disabled:opacity-50">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {{ isExportingPdf ? '...' : 'Export PDF' }}
          </button>
          <button (click)="exportExcel()" [disabled]="isExportingExcel" class="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2 disabled:opacity-50">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {{ isExportingExcel ? '...' : 'Export Excel' }}
          </button>
        </div>
      </div>

      <!-- Main Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Stat Card 1 -->
        <div class="group relative bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:translate-y-[-5px] transition-all duration-300 overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
          <div class="relative z-10">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Projets Actifs</p>
            <div class="flex items-end gap-2">
              <h3 class="text-5xl font-black text-gray-900">{{ overview()?.stats?.totalProjects || 0 }}</h3>
              <span class="text-xs font-bold text-blue-600 mb-1">+2 ce mois</span>
            </div>
          </div>
        </div>

        <!-- Stat Card 2 -->
        <div class="group relative bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:translate-y-[-5px] transition-all duration-300 overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
          <div class="relative z-10">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Incidents Critiques</p>
            <div class="flex items-end gap-2">
              <h3 class="text-5xl font-black text-red-600">{{ overview()?.stats?.criticalIncidents || 0 }}</h3>
              <span class="text-xs font-bold text-red-400 mb-1" *ngIf="overview()?.stats?.criticalIncidents > 0">Action requise</span>
            </div>
          </div>
        </div>

        <!-- Stat Card 3 -->
        <div class="group relative bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:translate-y-[-5px] transition-all duration-300 overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
          <div class="relative z-10">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Applications</p>
            <div class="flex items-end gap-2">
              <h3 class="text-5xl font-black text-gray-900">{{ overview()?.stats?.totalApplications || 0 }}</h3>
              <span class="text-xs font-bold text-emerald-600 mb-1">Système stable</span>
            </div>
          </div>
        </div>

        <!-- Stat Card 4 -->
        <div class="group relative bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:translate-y-[-5px] transition-all duration-300 overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
          <div class="relative z-10">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Collaborateurs</p>
            <div class="flex items-end gap-2">
              <h3 class="text-5xl font-black text-gray-900">{{ overview()?.stats?.totalUsers || 0 }}</h3>
              <span class="text-xs font-bold text-purple-600 mb-1">En ligne</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary Info Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Task Distribution -->
        <div class="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">Distribution des Tâches</h4>
          <div class="space-y-6">
            <div *ngFor="let stat of overview()?.stats?.tasks">
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-black text-gray-700 uppercase">{{ stat.status === 'In Progress' ? 'En Cours' : stat.status === 'Done' ? 'Terminé' : 'À Faire' }}</span>
                <span class="text-xs font-black text-blue-600">{{ stat.count }}</span>
              </div>
              <div class="w-full h-3 bg-gray-50 rounded-full overflow-hidden">
                <div 
                   class="h-full rounded-full transition-all duration-1000"
                  [style.width.%]="(stat.count / getTotalTasks()) * 100"
                  [class]="stat.status === 'Done' ? 'bg-emerald-500' : stat.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-300'"
                ></div>
              </div>
            </div>
            <div *ngIf="!overview()?.stats?.tasks?.length" class="text-center py-10 opacity-30 italic text-sm">
              Aucune tâche enregistrée
            </div>
          </div>
        </div>

        <!-- Recent Activity Feed -->
        <div class="lg:col-span-2 bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
          <div class="absolute top-0 right-0 p-8 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-32 w-32 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h4 class="text-xs font-black text-blue-400 uppercase tracking-widest mb-8 relative z-10">Activité Récente</h4>
          
          <div class="space-y-4 relative z-10">
            <!-- Deployment Activity -->
            <div *ngFor="let dep of overview()?.recent?.deployments" class="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
              <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-bold text-white">Déploiement {{ dep.version }}</p>
                <p class="text-[10px] text-gray-500 uppercase font-black">{{ dep.app_name }} • {{ dep.deployed_at | date:'short' }}</p>
              </div>
            </div>

            <!-- Task Activity -->
            <div *ngFor="let task of overview()?.recent?.tasks" class="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-bold text-white">{{ task.title }}</p>
                <p class="text-[10px] text-gray-500 uppercase font-black">Nouvelle tâche • {{ task.project_name }}</p>
              </div>
            </div>

            <div *ngIf="!overview()?.recent?.deployments?.length && !overview()?.recent?.tasks?.length" class="text-center py-20 text-gray-600 italic text-sm">
              Aucune activité récente à afficher
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  overview = signal<any>(null);
  isExportingPdf = false;
  isExportingExcel = false;

  constructor(
    private dashboardService: DashboardService,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.dashboardService.getOverview().subscribe(data => {
      this.overview.set(data);
    });
  }

  getTotalTasks(): number {
    const tasks = this.overview()?.stats?.tasks || [];
    return tasks.reduce((acc: number, curr: any) => acc + curr.count, 0) || 1;
  }

  syncGit() {
    alert('Synchronization GitLab en cours...');
  }

  exportPDF() {
    this.isExportingPdf = true;
    this.reportService.exportIncidentsPDF().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'incidents_report.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        this.isExportingPdf = false;
      },
      error: () => {
        alert('Erreur lors de la génération du PDF');
        this.isExportingPdf = false;
      }
    });
  }

  exportExcel() {
    this.isExportingExcel = true;
    this.reportService.exportTasksExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks_report.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.isExportingExcel = false;
      },
      error: () => {
        alert('Erreur lors de la génération du fichier Excel');
        this.isExportingExcel = false;
      }
    });
  }
}
