import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IncidentService } from '../../services/incident.service';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-8 p-2 animate-in fade-in duration-300">
      <!-- Premium Header -->
      <div class="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 class="text-3xl font-black text-gray-900 tracking-tight">Gestion des Incidents</h2>
          <p class="text-sm font-medium text-gray-400 mt-1">Gérez et résolvez les anomalies du système</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="exportPDF()" class="px-5 py-3 bg-white border-2 border-red-600 text-red-600 rounded-2xl text-sm font-black hover:bg-red-50 transition-all">
            Exporter PDF
          </button>
          <a routerLink="/incidents/new" class="px-5 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
            + Incident
          </a>
        </div>
      </div>

      <!-- Incidents Table Card -->
      <div class="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse whitespace-nowrap md:whitespace-normal">
          <thead>
            <tr class="bg-gray-50/50 border-b border-gray-100">
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Titre</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr *ngFor="let item of items()" class="hover:bg-gray-50/50 transition-colors group">
              <td class="px-8 py-5 font-bold text-gray-800">{{ item.title }}</td>
              <td class="px-8 py-5 text-sm text-gray-500 font-medium">{{ item.description }}</td>
              <td class="px-8 py-5">
                <span [class]="getStatusClass(item.status)">
                  {{ item.status }}
                </span>
              </td>
              <td class="px-8 py-5 text-right">
                <div class="flex items-center justify-end gap-3">
                  <a [routerLink]="['/documents', 'incidents', item.id]" class="text-xs font-black text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-3.5 py-2 rounded-xl transition-all">
                    Documents
                  </a>
                  <button (click)="openActionModal(item)" class="text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-3.5 py-2 rounded-xl transition-all">
                    Action corrective
                  </button>
                  <a [routerLink]="['/incidents/edit', item.id]" class="text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3.5 py-2 rounded-xl transition-all">
                    Modifier
                  </a>
                  <button (click)="openDelete(item)" class="text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-3.5 py-2 rounded-xl transition-all">
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="items().length === 0">
              <td colspan="4" class="px-8 py-16 text-center text-gray-400 italic">
                <div class="flex flex-col items-center justify-center gap-2 opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p class="text-xs font-black uppercase tracking-widest">Aucun incident enregistré</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>

    <!-- Action Modal -->
    <div *ngIf="showActionModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-md" (click)="closeActionModal()"></div>
      <div class="relative bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-10">
          <div class="flex items-center gap-5 mb-8">
            <div class="w-16 h-16 rounded-3xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight">Résoudre l'Incident</h3>
              <p class="text-sm font-medium text-gray-400">Consignez et résolvez l'anomalie</p>
            </div>
          </div>

          <div class="space-y-6">
            <div class="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <h4 class="text-sm font-bold text-gray-900">{{ activeIncident?.title }}</h4>
              <p class="text-xs text-gray-500 font-medium leading-relaxed">{{ activeIncident?.description }}</p>
            </div>

            <!-- Corrective Actions History -->
            <div *ngIf="actionsList.length > 0" class="space-y-3">
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Actions menées</label>
              <div class="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                <div *ngFor="let act of actionsList" class="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-1">
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-black text-gray-700">{{ act.executor_name || 'Utilisateur' }}</span>
                    <span class="text-[9px] font-black text-gray-400 uppercase">{{ act.executed_at | date:'short' }}</span>
                  </div>
                  <p class="text-xs text-gray-600 font-medium leading-relaxed">{{ act.description }}</p>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nouvelle Action Corrective</label>
              <textarea 
                [(ngModel)]="actionDesc"
                rows="3" 
                placeholder="Rédigez la description de la solution apportée..."
                class="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="p-8 bg-gray-50/50 backdrop-blur-sm border-t border-gray-100 flex gap-4">
          <button (click)="closeActionModal()" class="flex-1 py-5 text-sm font-black text-gray-400 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">
            ANNULER
          </button>
          <button 
            (click)="submitAction()" 
            [disabled]="!actionDesc.trim()"
            class="flex-[2] py-5 text-sm font-black text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all disabled:opacity-30"
          >
            ENREGISTRER & RÉSOUDRE
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div *ngIf="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-md" (click)="closeDelete()"></div>
      <div class="relative bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-10 text-center">
          <h3 class="text-xl font-black text-gray-900 mb-2">Supprimer l'Incident</h3>
          <p class="text-sm font-medium text-gray-500">Êtes-vous sûr ? Cette action est irréversible.</p>
        </div>
        <div class="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
          <button (click)="closeDelete()" class="flex-1 py-4 text-sm font-black text-gray-400 bg-white border border-gray-200 rounded-2xl">Annuler</button>
          <button (click)="confirmDelete()" class="flex-1 py-4 text-sm font-black text-white bg-red-600 rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700">Supprimer</button>
        </div>
      </div>
    </div>
  `
})
export class IncidentListComponent implements OnInit {
  items = signal<any[]>([]);
  showDeleteModal = false;
  itemToDelete: any = null;

  showActionModal = false;
  activeIncident: any = null;
  actionsList: any[] = [];
  actionDesc = '';

  constructor(
    private service: IncidentService,
    private reportService: ReportService
  ) {}

  ngOnInit() { this.load(); }
  
  load() {
    this.service.getAll().subscribe({ next: data => this.items.set(data) });
  }

  getStatusClass(status: string): string {
    const base = 'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ';
    switch (status) {
      case 'Resolved':
        return base + 'bg-green-50 text-green-600 border-green-200';
      case 'Closed':
        return base + 'bg-gray-50 text-gray-500 border-gray-200';
      default:
        return base + 'bg-red-50 text-red-600 border-red-200';
    }
  }

  openActionModal(item: any) {
    this.activeIncident = item;
    this.actionDesc = '';
    this.actionsList = [];
    this.showActionModal = true;
    this.service.getCorrectiveActions(item.id).subscribe(actions => {
      this.actionsList = actions;
    });
  }

  closeActionModal() {
    this.showActionModal = false;
    this.activeIncident = null;
    this.actionDesc = '';
  }

  submitAction() {
    if (!this.activeIncident || !this.actionDesc.trim()) return;
    this.service.addCorrectiveAction(this.activeIncident.id, this.actionDesc).subscribe({
      next: () => {
        this.closeActionModal();
        this.load();
      },
      error: (e) => {
        alert('Erreur: ' + e.message);
      }
    });
  }

  openDelete(item: any) { this.itemToDelete = item; this.showDeleteModal = true; }
  closeDelete() { this.showDeleteModal = false; this.itemToDelete = null; }
  confirmDelete() {
    if (!this.itemToDelete) return;
    this.service.delete(this.itemToDelete.id).subscribe({
      next: () => { this.closeDelete(); this.load(); },
      error: (e) => { alert('Error: ' + e.message); this.closeDelete(); }
    });
  }

  exportPDF() {
    this.reportService.exportIncidentsPDF().subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incidents_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }
}
