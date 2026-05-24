import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImprovementService } from '../services/improvement.service';
import { ApplicationService } from '../services/application.service';
import { DocumentService } from '../services/document.service';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-improvements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 class="text-3xl font-black text-gray-900 tracking-tight">Améliorations</h2>
          <p class="text-sm font-medium text-gray-400 mt-1">Gérez les demandes d'évolution du système</p>
        </div>
        <button (click)="openModal()" class="px-5 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
          Nouvelle Demande
        </button>
      </div>

      <div class="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Titre</th>
                <th class="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Application</th>
                <th class="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Priorité</th>
                <th class="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Statut</th>
                <th class="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr *ngFor="let imp of improvements()" class="hover:bg-blue-50/30 transition-colors group">
                <td class="px-8 py-6">
                  <p class="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{{ imp.title }}</p>
                  <p class="text-[11px] font-medium text-gray-400 mt-1 max-w-xs truncate">{{ imp.description }}</p>
                </td>
                <td class="px-8 py-6">
                  <span class="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    {{ imp.application_name }}
                  </span>
                </td>
                <td class="px-8 py-6">
                  <span [class]="getPriorityClass(imp.priority) + ' px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border'">
                    {{ imp.priority }}
                  </span>
                </td>
                <td class="px-8 py-6">
                  <select 
                    [(ngModel)]="imp.status" 
                    (change)="updateStatus(imp)"
                    class="bg-transparent text-xs font-bold text-gray-700 outline-none border border-gray-200 rounded-lg px-2 py-1"
                  >
                    <option value="Proposed">Proposé</option>
                    <option value="Accepted">Accepté</option>
                    <option value="In Progress">En Cours</option>
                    <option value="Implemented">Implémenté</option>
                    <option value="Rejected">Rejeté</option>
                  </select>
                </td>
                <td class="px-8 py-6 text-right">
                  <div class="flex items-center justify-end gap-3">
                    <span class="text-xs font-bold text-gray-400">Par {{ imp.username }}</span>
                    <a [routerLink]="['/documents', 'improvements', imp.id]" class="text-xs font-black text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-3.5 py-2 rounded-xl transition-all">
                      Documents
                    </a>
                  </div>
                </td>
              </tr>
              <tr *ngIf="improvements().length === 0">
                <td colspan="5" class="px-8 py-20 text-center">
                  <p class="text-sm font-bold text-gray-400">Aucune demande d'amélioration trouvée.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" (click)="closeModal()"></div>
      <div class="relative bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <form (submit)="createImprovement()" class="p-10">
          <h3 class="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight">Nouvelle Demande</h3>
          
          <div class="space-y-6">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Application</label>
              <select [(ngModel)]="newImprovement.application_id" name="appId" required class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10">
                <option [value]="null">Sélectionner une application...</option>
                <option *ngFor="let app of applications()" [value]="app.id">{{ app.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Titre</label>
              <input type="text" [(ngModel)]="newImprovement.title" name="title" required class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10">
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Description</label>
              <textarea [(ngModel)]="newImprovement.description" name="desc" rows="3" required class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none resize-none focus:ring-4 focus:ring-blue-500/10"></textarea>
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Priorité</label>
              <select [(ngModel)]="newImprovement.priority" name="priority" class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10">
                <option value="Low">Basse</option>
                <option value="Medium">Moyenne</option>
                <option value="High">Haute</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Document / Pièce jointe</label>
              <input type='file' (change)="onFileSelected($event)" class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10">
              <p *ngIf="selectedFile" class="text-xs text-orange-600 font-bold mt-2">Fichier sélectionné : {{ selectedFile.name }}</p>
            </div>
          </div>

          <div class="mt-10 flex gap-4">
            <button type="button" (click)="closeModal()" class="flex-1 py-5 text-sm font-black text-gray-400 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">ANNULER</button>
            <button type="submit" [disabled]="isLoading" class="flex-1 py-5 text-sm font-black text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50">
              {{ isLoading ? 'EN COURS...' : 'SOUMETTRE' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ImprovementsComponent implements OnInit {
  improvements = signal<any[]>([]);
  applications = signal<any[]>([]);
  showModal = false;
  selectedFile: File | null = null;
  isLoading = false;
  
  newImprovement: any = {
    application_id: null,
    title: '',
    description: '',
    priority: 'Medium'
  };

  private improvementService = inject(ImprovementService);
  private appService = inject(ApplicationService);
  private documentService = inject(DocumentService);

  constructor() {}

  ngOnInit() {
    this.loadImprovements();
    this.loadApplications();
  }

  loadImprovements() {
    this.improvementService.getImprovements().subscribe((data: any) => this.improvements.set(data));
  }

  loadApplications() {
    this.appService.getAll().subscribe((data: any) => this.applications.set(data));
  }

  getPriorityClass(p: string) {
    if (p === 'High') return 'bg-red-50 text-red-600 border-red-100';
    if (p === 'Medium') return 'bg-orange-50 text-orange-600 border-orange-100';
    return 'bg-blue-50 text-blue-600 border-blue-100';
  }

  openModal() { this.showModal = true; }
  closeModal() { 
    this.showModal = false; 
    this.newImprovement = { application_id: null, title: '', description: '', priority: 'Medium' };
    this.selectedFile = null;
    this.isLoading = false;
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  createImprovement() {
    if (!this.newImprovement.application_id || !this.newImprovement.title) return;
    this.isLoading = true;
    this.improvementService.createImprovement(this.newImprovement).subscribe({
      next: (res: any) => {
        if (this.selectedFile && res.id) {
          this.documentService.upload(this.selectedFile, undefined, undefined, undefined, res.id).subscribe(() => {
            this.loadImprovements();
            this.closeModal();
          });
        } else {
          this.loadImprovements();
          this.closeModal();
        }
      },
      error: () => this.isLoading = false
    });
  }

  updateStatus(imp: any) {
    this.improvementService.updateStatus(imp.id, imp.status).subscribe();
  }
}
