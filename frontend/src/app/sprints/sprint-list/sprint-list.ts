import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SprintService } from '../../services/sprint.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sprint-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-8 p-2 animate-in fade-in duration-500">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-3xl font-black text-gray-900 tracking-tight uppercase">Sprints</h2>
          <p class="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Gestion des itérations Koda</p>
        </div>
        <a *ngIf="isAdmin()" routerLink='/sprints/new' class="px-8 py-4 bg-[var(--color-primary)] text-white font-black text-xs uppercase rounded-2xl hover:bg-[var(--color-primary-hover)] shadow-xl transition-all">
          + Nouveau Sprint
        </a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div *ngFor="let item of items()" class="group koda-card p-8 hover:shadow-2xl hover:translate-y-[-5px] transition-all duration-300">
          <div class="flex justify-between items-start mb-6">
            <div class="px-3 py-1 bg-purple-50 text-[10px] font-black text-purple-600 rounded-lg uppercase tracking-tighter">
              {{ item.project_name || 'Projet inconnu' }}
            </div>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <a [routerLink]="['/sprints/edit', item.id]" *ngIf="isAdmin()" class="p-2 text-gray-400 hover:text-[var(--color-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </a>
              <button (click)="openDelete(item)" *ngIf="isAdmin()" class="p-2 text-gray-400 hover:text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <h3 class="text-2xl font-black text-gray-900 mb-2 truncate">{{ item.name }}</h3>
          
          <div class="grid grid-cols-2 gap-4 mb-4 mt-6">
             <div class="p-4 bg-gray-50 rounded-2xl">
              <p class="text-[9px] font-black text-gray-400 uppercase mb-1">Date de début</p>
              <p class="text-xs font-bold text-gray-700">{{ item.start_date | date:'shortDate' }}</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-2xl">
              <p class="text-[9px] font-black text-gray-400 uppercase mb-1">Date de fin</p>
              <p class="text-xs font-bold text-gray-700">{{ item.end_date | date:'shortDate' }}</p>
            </div>
          </div>

          <div class="mt-4 flex justify-between items-center">
             <span class="px-2 py-1 text-xs font-bold rounded-lg uppercase"
                [ngClass]="{
                   'bg-green-100 text-green-700': item.status === 'Active',
                   'bg-gray-100 text-gray-700': item.status === 'Completed',
                   'bg-blue-100 text-blue-700': item.status === 'Planned'
                }">
                {{ item.status || 'Planned' }}
             </span>
             <button (click)="openDetails(item)" class="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
               Détails & Checklist
             </button>
          </div>

        </div>
      </div>

      <!-- Sprint Details Modal -->
      <div *ngIf="showDetailsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" (click)="closeDetails()"></div>
        <div class="relative bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full p-8 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-start mb-8">
            <div>
              <h3 class="text-3xl font-black text-gray-900 uppercase tracking-tight">{{ selectedSprint?.name }}</h3>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">{{ selectedSprint?.project_name }}</p>
            </div>
            <div class="flex items-center gap-4">
              <button *ngIf="selectedSprint?.status !== 'Completed'" (click)="closeSprint()" 
                      class="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-all">
                Clôturer le Sprint
              </button>
              <button (click)="closeDetails()" class="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <!-- Left Column -->
            <div class="space-y-8">
              <!-- Checklist Section -->
              <div class="space-y-6">
                <div class="flex justify-between items-center">
                  <div>
                    <h4 class="text-xs font-black text-gray-900 uppercase tracking-widest">Pré-requis (Checklist)</h4>
                    <p class="text-[9px] font-bold text-gray-400 uppercase mt-1">Éléments obligatoires</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span *ngIf="isSaving" class="text-[9px] font-black text-blue-600 uppercase animate-pulse">Sauvegarde...</span>
                    <button (click)="addChecklistItem()" class="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1">
                      + AJOUTER
                    </button>
                  </div>
                </div>
                
                <div class="space-y-3">
                  <div *ngFor="let item of checklist; let i = index" class="group flex items-center gap-3 p-4 bg-gray-50 rounded-2xl transition-all hover:bg-white border border-transparent hover:border-blue-100 shadow-sm">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="item.is_checked" 
                      (change)="updateChecklist()"
                      class="w-5 h-5 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-100"
                    >
                    <input 
                      type="text" 
                      [(ngModel)]="item.item_name" 
                      (blur)="updateChecklist()"
                      class="flex-1 bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0"
                      [class.line-through]="item.is_checked"
                      [class.opacity-40]="item.is_checked"
                      placeholder="Nouveau pré-requis..."
                    >
                    <button (click)="removeChecklistItem(i)" class="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <div *ngIf="checklist.length === 0" class="text-center py-8 text-xs text-gray-400 italic bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    Aucun pré-requis défini.
                  </div>
                </div>
              </div>

              <!-- Delay Section -->
              <div class="pt-8 border-t border-gray-100">
                <h4 class="text-xs font-black text-red-600 uppercase tracking-widest mb-4">Reporter le Sprint</h4>
                <div class="p-6 bg-red-50 rounded-3xl space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <label class="text-[9px] font-black text-red-300 uppercase">Nouvelle date début</label>
                      <input type="date" [(ngModel)]="delayData.new_start_date" class="w-full bg-white border-none rounded-xl text-xs font-bold p-3">
                    </div>
                    <div class="space-y-1">
                      <label class="text-[9px] font-black text-red-300 uppercase">Nouvelle date fin</label>
                      <input type="date" [(ngModel)]="delayData.new_end_date" class="w-full bg-white border-none rounded-xl text-xs font-bold p-3">
                    </div>
                  </div>
                  <div class="space-y-1">
                    <label class="text-[9px] font-black text-red-300 uppercase">Raison du report</label>
                    <textarea [(ngModel)]="delayData.reason" rows="2" class="w-full bg-white border-none rounded-xl text-xs font-bold p-3" placeholder="Ex: Ressources non disponibles..."></textarea>
                  </div>
                  <button (click)="delaySprint()" class="w-full py-3 bg-red-600 text-white font-black text-[10px] uppercase rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all">
                    Confirmer le report
                  </button>
                </div>
              </div>
            </div>

            <!-- Right: History -->
            <div class="space-y-6">
              <h4 class="text-xs font-black text-gray-900 uppercase tracking-widest">Historique & Logs</h4>
              <div class="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                <div *ngFor="let log of history" class="relative pl-6 pb-6 border-l-2 border-gray-100 last:border-0 last:pb-0">
                  <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full shadow-sm" 
                       [class.bg-red-500]="log.action === 'DELAYED'"
                       [class.bg-emerald-500]="log.action === 'CLOSED'"
                       [class.bg-blue-500]="log.action !== 'DELAYED' && log.action !== 'CLOSED'">
                  </div>
                  <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div class="flex justify-between items-start mb-2">
                      <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" 
                            [class.bg-red-100]="log.action === 'DELAYED'"
                            [class.text-red-600]="log.action === 'DELAYED'"
                            [class.bg-emerald-100]="log.action === 'CLOSED'"
                            [class.text-emerald-600]="log.action === 'CLOSED'"
                            [class.bg-blue-100]="log.action !== 'DELAYED' && log.action !== 'CLOSED'"
                            [class.text-blue-600]="log.action !== 'DELAYED' && log.action !== 'CLOSED'">
                        {{ log.action }}
                      </span>
                      <span class="text-[9px] font-bold text-gray-400">{{ log.changed_at | date:'short' }}</span>
                    </div>
                    <p class="text-xs font-bold text-gray-700 leading-relaxed">{{ log.details }}</p>
                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-3">Modifié par {{ log.user_name || 'Utilisateur' }}</p>
                  </div>
                </div>
                <div *ngIf="history.length === 0" class="text-center py-8 text-xs text-gray-400 italic">
                  Aucun historique disponible.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Modal -->
      <div *ngIf="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" (click)="closeDelete()"></div>
        <div class="relative bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 animate-in zoom-in duration-300">
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-2xl font-black text-gray-900 uppercase">Suppression</h3>
            <p class="text-sm font-medium text-gray-400 mt-2">Voulez-vous vraiment supprimer ce sprint ?</p>
          </div>
          <div class="flex gap-4">
            <button (click)="closeDelete()" class="flex-1 py-4 bg-gray-50 text-gray-400 font-black text-xs uppercase rounded-2xl hover:bg-gray-100 transition-all">Annuler</button>
            <button (click)="confirmDelete()" class="flex-1 py-4 bg-red-600 text-white font-black text-xs uppercase rounded-2xl hover:bg-red-700 shadow-xl shadow-red-100 transition-all">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SprintListComponent implements OnInit {
  items = signal<any[]>([]);
  showDeleteModal = false;
  itemToDelete: any = null;
  user: any = null;

  // Details Modal
  showDetailsModal = false;
  selectedSprint: any = null;
  checklist: any[] = [];
  history: any[] = [];
  delayData = { new_start_date: '', new_end_date: '', reason: '' };
  isSaving = false;

  constructor(private service: SprintService, private authService: AuthService) {
    this.authService.currentUser$.subscribe(u => this.user = u);
  }

  ngOnInit() { this.load(); }
  
  load() {
    this.service.getSprints().subscribe({ next: (data: any) => this.items.set(data) });
  }

  isAdmin() { 
    return this.user?.is_global_admin || this.user?.role === 'Admin' || this.user?.role === 'Project Manager'; 
  }

  openDelete(item: any) { this.itemToDelete = item; this.showDeleteModal = true; }
  closeDelete() { this.showDeleteModal = false; this.itemToDelete = null; }
  
  confirmDelete() {
    if (!this.itemToDelete) return;
    this.service.deleteSprint(this.itemToDelete.id).subscribe({
      next: () => { this.closeDelete(); this.load(); },
      error: (e: any) => { alert('Erreur: ' + e.message); this.closeDelete(); }
    });
  }

  openDetails(item: any) {
    this.selectedSprint = item;
    this.showDetailsModal = true;
    this.loadDetails(item.id);
    
    // Set default delay dates (next week)
    const startDate = new Date(item.start_date);
    const endDate = new Date(item.end_date);
    startDate.setDate(startDate.getDate() + 7);
    endDate.setDate(endDate.getDate() + 7);
    
    this.delayData = {
      new_start_date: startDate.toISOString().split('T')[0],
      new_end_date: endDate.toISOString().split('T')[0],
      reason: ''
    };
  }

  loadDetails(id: number) {
    this.service.getChecklist(id).subscribe(data => this.checklist = data);
    this.loadHistory(id);
  }

  loadHistory(id: number) {
    this.service.getHistory(id).subscribe(data => this.history = data);
  }

  closeDetails() {
    this.showDetailsModal = false;
    this.selectedSprint = null;
  }

  addChecklistItem() {
    this.checklist.push({ item_name: '', is_checked: false });
  }

  updateChecklist() {
    if (!this.selectedSprint) return;
    this.isSaving = true;
    this.service.updateChecklist(this.selectedSprint.id, this.checklist).subscribe({
      next: () => {
        setTimeout(() => this.isSaving = false, 500);
        this.loadHistory(this.selectedSprint.id);
      },
      error: () => this.isSaving = false
    });
  }

  removeChecklistItem(index: number) {
    this.checklist.splice(index, 1);
    this.updateChecklist();
  }

  delaySprint() {
    if (!this.selectedSprint || !this.delayData.reason) {
      alert('Veuillez indiquer une raison pour le report.');
      return;
    }

    this.service.delaySprint(this.selectedSprint.id, this.delayData).subscribe({
      next: () => {
        alert('Sprint reporté avec succès !');
        this.load();
        this.loadHistory(this.selectedSprint.id);
        this.delayData.reason = '';
      },
      error: (err) => alert('Erreur lors du report: ' + err.message)
    });
  }

  closeSprint() {
    if (!this.selectedSprint) return;
    if (!confirm('Êtes-vous sûr de vouloir clôturer ce sprint ? Toutes les tâches non terminées seront renvoyées au backlog.')) return;

    this.service.closeSprint(this.selectedSprint.id).subscribe({
      next: (res) => {
        alert(`Sprint clôturé avec succès ! ${res.tasksMoved} tâches ont été renvoyées au backlog.`);
        this.load();
        this.loadDetails(this.selectedSprint.id);
      },
      error: (err) => alert('Erreur lors de la clôture: ' + err.message)
    });
  }
}

