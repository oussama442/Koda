import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class='max-w-3xl space-y-6'>
      <div class='mb-4'><a routerLink='/applications' class='text-sm font-bold text-gray-400'>Back to Applications</a></div>
      <h2 class='text-2xl font-black text-gray-900'>{{ isEdit ? 'Edit' : 'Create' }} Application</h2>
      <div class='koda-card py-6'>
        <form [formGroup]='form' (ngSubmit)='onSubmit()'>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>Application Name</label><input type='text' formControlName='name' class='koda-input' placeholder='Enter application name'></div>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>Description</label><input type='text' formControlName='description' class='koda-input' placeholder='Enter description'></div>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>Status</label><select formControlName='current_status' class='koda-input'><option value=''>Select option...</option><option value='Study'>Study</option><option value='Development'>Development</option><option value='Production'>Production</option></select></div>
<div class='px-6 mb-6'><label class='block text-sm font-bold text-gray-700 mb-2'>GitHub Repository</label><input type='text' formControlName='github_repo_url' class='koda-input' placeholder='Enter github repository'></div>          <div class='p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3'>
            <a routerLink='/applications' class='px-4 py-2 bg-white text-gray-600 font-bold border rounded-lg'>Cancel</a>
            <button type='submit' class='koda-btn-primary'>Save</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ApplicationFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  itemId: number | null = null;
  apps: any[] = [];

  constructor(private fb: FormBuilder, private service: ApplicationService, private router: Router, private route: ActivatedRoute) {
    this.form = this.fb.group({
      name: [''],
      description: [''],
      current_status: [''],
      github_repo_url: ['']
    });
  }

  ngOnInit() {
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
      this.service.update(this.itemId, this.form.value).subscribe({ next: () => this.router.navigate(['/applications']) });
    } else {
      this.service.create(this.form.value).subscribe({ next: () => this.router.navigate(['/applications']) });
    }
  }
}
