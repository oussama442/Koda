import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SprintService } from '../../services/sprint.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sprint-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

          <div class="mt-4">
             <span class="px-2 py-1 text-xs font-bold rounded-lg uppercase"
                [ngClass]="{
                   'bg-green-100 text-green-700': item.status === 'Active',
                   'bg-gray-100 text-gray-700': item.status === 'Completed',
                   'bg-blue-100 text-blue-700': item.status === 'Planned'
                }">
                {{ item.status || 'Planned' }}
             </span>
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
}
