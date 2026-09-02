import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { ApplicationService } from '../../services/application.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class='max-w-3xl space-y-8 p-2 animate-in fade-in duration-300'>
      <div class='mb-4'><a routerLink='/projects' class='text-sm font-bold text-gray-400 uppercase tracking-widest'>← Retour aux Projets</a></div>
      
      <div class="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <h2 class='text-3xl font-black text-gray-900 uppercase tracking-tight mb-8'>{{ isEdit ? 'Modifier' : 'Nouveau' }} Projet</h2>
        
        <form [formGroup]='form' (ngSubmit)='onSubmit()' class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class='md:col-span-2'>
              <label class='block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2'>Nom du Projet</label>
              <input type='text' formControlName='name' class='koda-input w-full' placeholder='Ex: Refonte ERP 2026'>
            </div>

            <div class='md:col-span-2'>
              <label class='block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2'>Description</label>
              <textarea formControlName='description' rows="3" class='koda-input w-full resize-none' placeholder='Objectifs du projet...'></textarea>
            </div>

            <div>
              <label class='block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2'>Date de début</label>
              <input type='date' formControlName='start_date' class='koda-input w-full'>
            </div>

            <div>
              <label class='block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2'>Date de fin</label>
              <input type='date' formControlName='end_date' class='koda-input w-full'>
            </div>

            <div>
              <label for='project-application' class='block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2'>Application liée (obligatoire)</label>
              <select id='project-application' formControlName='application_id' required class='koda-input w-full'>
                <option [ngValue]="null">Sélectionner Application...</option>
                <option *ngFor='let app of apps()' [ngValue]='app.id'>{{app.name}}</option>
              </select>
              <p *ngIf="form.get('application_id')?.touched && form.get('application_id')?.hasError('required')" class='text-xs text-red-600 mt-2'>Sélectionnez une application pour ce projet.</p>
            </div>

            <div>
              <label for='project-manager' class='block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2'>Chef de Projet (facultatif)</label>
              <select id='project-manager' formControlName='chef_projet_id' class='koda-input w-full border-blue-200 bg-blue-50/30'>
                <option [ngValue]="null">Aucun chef de projet assigné</option>
                <option *ngFor='let u of users()' [ngValue]='u.id'>{{u.full_name}} ({{u.username}})</option>
              </select>
              <p class="text-[10px] text-blue-500 font-bold mt-2">L'administrateur choisit le responsable principal.</p>
            </div>
          </div>

          <div class='pt-8 flex justify-end gap-4'>
            <a routerLink='/projects' class='px-8 py-4 bg-white text-gray-400 font-black text-xs uppercase border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all'>Annuler</a>
            <button type='submit' [disabled]="form.invalid" class='px-8 py-4 bg-blue-600 text-white font-black text-xs uppercase rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-30'>
              {{ isEdit ? 'Sauvegarder' : 'Créer le Projet' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProjectFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  itemId: number | null = null;
  apps = signal<any[]>([]);
  users = signal<any[]>([]);

  constructor(
    private fb: FormBuilder, 
    private service: ProjectService, 
    private router: Router, 
    private route: ActivatedRoute, 
    private appService: ApplicationService,
    private userService: UserService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      start_date: [''],
      end_date: [''],
      application_id: [null, Validators.required],
      chef_projet_id: [null]
    });
  }

  ngOnInit() {
    this.appService.getAll().subscribe(d => this.apps.set(d));
    this.userService.getUsers().subscribe(u => this.users.set(u));
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true; 
        this.itemId = +id;
        this.service.getById(this.itemId).subscribe(data => {
          this.form.patchValue({
            ...data,
            start_date: data.start_date ? data.start_date.split('T')[0] : '',
            end_date: data.end_date ? data.end_date.split('T')[0] : ''
          });
        });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = {
      ...this.form.value,
      start_date: this.form.value.start_date || null,
      end_date: this.form.value.end_date || null,
      chef_projet_id: this.form.value.chef_projet_id ?? null,
    };
    
    const obs = (this.isEdit && this.itemId) 
      ? this.service.update(this.itemId, data)
      : this.service.create(data);

    obs.subscribe({ 
      next: () => this.router.navigate(['/projects']),
      error: (e) => alert(e.error?.message || 'Erreur lors de la sauvegarde')
    });
  }
}
