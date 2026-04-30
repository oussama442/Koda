import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { IncidentService } from '../../services/incident.service';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-incident-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class='max-w-3xl space-y-6'>
      <div class='mb-4'><a routerLink='/incidents' class='text-sm font-bold text-gray-400'>Back to Incidents</a></div>
      <h2 class='text-2xl font-black text-gray-900'>{{ isEdit ? 'Edit' : 'Create' }} Incident</h2>
      <div class='koda-card py-6'>
        <form [formGroup]='form' (ngSubmit)='onSubmit()'>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>Incident Title</label><input type='text' formControlName='title' class='koda-input' placeholder='Enter incident title'></div>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>Detailed Description</label><input type='text' formControlName='description' class='koda-input' placeholder='Enter detailed description'></div>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>Severity Status</label><select formControlName='status' class='koda-input'><option value=''>Select option...</option><option value='Low'>Low</option><option value='Medium'>Medium</option><option value='High'>High</option><option value='Critical'>Critical</option></select></div>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>Linked Application (Required)</label><select formControlName='application_id' class='koda-input'><option value=''>Select Application...</option><option *ngFor='let app of apps' [value]='app.id'>{{app.name}}</option></select></div>          <div class='p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3'>
            <a routerLink='/incidents' class='px-4 py-2 bg-white text-gray-600 font-bold border rounded-lg'>Cancel</a>
            <button type='submit' class='koda-btn-primary'>Save</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class IncidentFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  itemId: number | null = null;
  apps: any[] = [];

  constructor(private fb: FormBuilder, private service: IncidentService, private router: Router, private route: ActivatedRoute, private appService: ApplicationService) {
    this.form = this.fb.group({
      title: [''],
      description: [''],
      status: [''],
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
      this.service.update(this.itemId, this.form.value).subscribe({ next: () => this.router.navigate(['/incidents']) });
    } else {
      this.service.create(this.form.value).subscribe({ next: () => this.router.navigate(['/incidents']) });
    }
  }
}
