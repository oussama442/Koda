import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SprintService } from '../../services/sprint.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-sprint-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto space-y-8 p-2 animate-in fade-in duration-500">
      <div class="flex items-center gap-4">
        <a routerLink="/sprints" class="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all text-gray-400 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </a>
        <div>
          <h2 class="text-3xl font-black text-gray-900 tracking-tight uppercase">{{ isEditMode ? 'Modifier le Sprint' : 'Nouveau Sprint' }}</h2>
          <p class="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Configuration de l'itération</p>
        </div>
      </div>

      <div class="koda-card p-8">
        <form (ngSubmit)="save()" class="space-y-6">
          
          <div class="space-y-2">
            <label class="text-xs font-black text-gray-900 uppercase tracking-widest">Nom du Sprint</label>
            <input type="text" [(ngModel)]="item.name" name="name" required
              class="koda-input"
              placeholder="ex: Sprint 1 - Authentification">
          </div>

          <div class="space-y-2">
            <label class="text-xs font-black text-gray-900 uppercase tracking-widest">Projet Associé</label>
            <select [(ngModel)]="item.project_id" name="project_id" required class="koda-input">
              <option *ngFor="let p of projects" [value]="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-black text-gray-900 uppercase tracking-widest">Date de début</label>
              <input type="date" [(ngModel)]="item.start_date" name="start_date" class="koda-input">
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-gray-900 uppercase tracking-widest">Date de fin</label>
              <input type="date" [(ngModel)]="item.end_date" name="end_date" class="koda-input">
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-black text-gray-900 uppercase tracking-widest">Statut</label>
            <select [(ngModel)]="item.status" name="status" class="koda-input">
              <option value="Planned">Planned (Planifié)</option>
              <option value="Active">Active (En cours)</option>
              <option value="Completed">Completed (Terminé)</option>
            </select>
          </div>

          <div class="pt-6">
            <button type="submit" class="w-full koda-btn-primary py-4 text-xs uppercase tracking-widest shadow-xl">
              {{ isEditMode ? 'Mettre à jour' : 'Créer le Sprint' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class SprintFormComponent implements OnInit {
  item: any = { status: 'Planned' };
  isEditMode = false;
  projects: any[] = [];

  constructor(
    private service: SprintService,
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.projectService.getAll().subscribe(data => this.projects = data);

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.service.getSprint(+id).subscribe({
        next: (data: any) => {
           this.item = data;
           if(this.item.start_date) this.item.start_date = this.item.start_date.split('T')[0];
           if(this.item.end_date) this.item.end_date = this.item.end_date.split('T')[0];
        }
      });
    }
  }

  save() {
    const ob = this.isEditMode 
      ? this.service.updateSprint(this.item.id, this.item)
      : this.service.createSprint(this.item);
      
    ob.subscribe({
      next: () => this.router.navigate(['/sprints']),
      error: (e: any) => alert('Erreur: ' + (e.error?.message || e.message))
    });
  }
}
