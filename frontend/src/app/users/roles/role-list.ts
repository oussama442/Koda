import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-black text-gray-900">Les rôles</h2>
          <p class="text-sm text-gray-500">Gérer les rôles et les permissions</p>
        </div>
        <div class="flex gap-2">
          <button (click)="loadRoles()" class="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <a routerLink="/users/roles/new" class="koda-btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
          </a>
        </div>
      </div>

      <div class="koda-card overflow-hidden">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Tous les rôles</h3>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">Afficher</span>
            <select class="text-xs border-gray-200 rounded-md p-1 bg-white outline-hidden">
              <option>25</option>
              <option>50</option>
            </select>
            <span class="text-xs text-gray-400">entrées</span>
          </div>
        </div>
        
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50">
              <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Les rôles</th>
              <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let role of roles()" class="hover:bg-gray-50/50 transition-colors">
              <td class="px-6 py-4">
                <span class="font-bold text-gray-700">{{ role.role_name }}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <a [routerLink]="['/users/roles/edit', role.id]" class="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modifier
                  </a>
                  <button 
                    type="button"
                    (click)="openDeleteModal(role)" 
                    class="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Effacer
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="roles().length === 0">
              <td colspan="2" class="px-6 py-12 text-center text-gray-400 italic">
                Aucun rôle trouvé.
              </td>
            </tr>
          </tbody>
        </table>
        
        <div class="p-6 bg-gray-50/50 flex justify-between items-center text-xs text-gray-500">
          <p>Affiche 1 à {{ roles().length }} sur {{ roles().length }} entrées</p>
          <div class="flex gap-1">
            <button class="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50">Précédent</button>
            <button class="px-3 py-1 bg-[var(--color-primary)] text-white rounded">1</button>
            <button class="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50">Prochain</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmation de Suppression -->
    <div *ngIf="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" (click)="closeDeleteModal()"></div>
      
      <!-- Modal Card -->
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        <div class="p-8 text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-xl font-black text-gray-900 mb-2">Supprimer le rôle</h3>
          <p class="text-sm text-gray-500">
            Êtes-vous sûr de vouloir supprimer le rôle <span class="font-bold text-gray-900">"{{ roleToDelete?.role_name }}"</span> ? 
            Cette action est irréversible.
          </p>
        </div>
        <div class="flex items-center justify-end gap-3 p-6 bg-gray-50/80 border-t border-gray-100">
          <button (click)="closeDeleteModal()" class="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">
            Annuler
          </button>
          <button (click)="confirmDelete()" class="px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-sm shadow-red-200">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  `
})
export class RoleListComponent implements OnInit {
  roles = signal<any[]>([]);
  showDeleteModal = false;
  roleToDelete: any = null;

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    console.log('RoleListComponent initialized');
    this.loadRoles();
  }

  loadRoles(): void {
    console.log('Loading roles from RoleService...');
    this.roleService.getRoles().subscribe({
      next: (data) => {
        console.log('Roles received in component:', data);
        this.roles.set(Array.isArray(data) ? data : []);
      },
      error: (err) => {
        console.error('API Error while loading roles:', err);
        alert('Error loading roles: ' + (err.error?.message || err.message));
      }
    });
  }

  openDeleteModal(role: any): void {
    this.roleToDelete = role;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.roleToDelete = null;
  }

  confirmDelete(): void {
    if (!this.roleToDelete) return;

    this.roleService.deleteRole(this.roleToDelete.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadRoles();
      },
      error: (err) => {
        console.error('Delete error:', err);
        alert('Erreur: ' + (err.error?.message || err.message));
        this.closeDeleteModal();
      }
    });
  }
}
