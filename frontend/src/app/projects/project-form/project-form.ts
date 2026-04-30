import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class='max-w-3xl space-y-6'>
      <div class='mb-4'><a routerLink='/projects' class='text-sm font-bold text-gray-400'>Back to Projects</a></div>
      <h2 class='text-2xl font-black text-gray-900'>{{ isEdit ? 'Edit' : 'Create' }} Project</h2>
      <div class='koda-card py-6'>
        <form [formGroup]='form' (ngSubmit)='onSubmit()'>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>Project Name</label><input type='text' formControlName='name' class='koda-input' placeholder='Enter project name'></div>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>Description</label><input type='text' formControlName='description' class='koda-input' placeholder='Enter description'></div>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>Start Date</label><input type='date' formControlName='start_date' class='koda-input' placeholder='Enter start date'></div>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>End Date</label><input type='date' formControlName='end_date' class='koda-input' placeholder='Enter end date'></div>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>Linked Application (Optional)</label><select formControlName='application_id' class='koda-input'><option value=''>Select Application...</option><option *ngFor='let app of apps' [value]='app.id'>{{app.name}}</option></select></div>          <div class='p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3'>
            <a routerLink='/projects' class='px-4 py-2 bg-white text-gray-600 font-bold border rounded-lg'>Cancel</a>
            <button type='submit' class='koda-btn-primary'>Save</button>
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
  apps: any[] = [];

  constructor(private fb: FormBuilder, private service: ProjectService, private router: Router, private route: ActivatedRoute, private appService: ApplicationService) {
    this.form = this.fb.group({
      name: [''],
      description: [''],
      start_date: [''],
      end_date: [''],
      application_id: ['']
    });
  }

  ngOnInit() {
    this.appService.getAll().subscribe(d => this.apps = d);
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true; this.itemId = +id;
        this.service.getById(this.itemId).subscribe(data => this.form.patchValue(data));
      }
    });
  }

  onSubmit() {
    if (this.isEdit && this.itemId) {
      this.service.update(this.itemId, this.form.value).subscribe({ next: () => this.router.navigate(['/projects']) });
    } else {
      this.service.create(this.form.value).subscribe({ next: () => this.router.navigate(['/projects']) });
    }
  }
}
