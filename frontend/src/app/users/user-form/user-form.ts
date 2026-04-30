import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-3xl space-y-6">
      <div class="mb-4">
        <a routerLink="/users" class="inline-flex items-center text-sm font-bold text-gray-400 hover:text-[var(--color-primary)] transition-colors">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Users
        </a>
      </div>
      <div>
        <h2 class="text-2xl font-black text-gray-900">{{ isEditMode ? 'Edit User' : 'Create New User' }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ isEditMode ? 'Update existing user profile and settings' : 'Add a new member to the system' }}</p>
      </div>

      <div class="koda-card">
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="flex flex-col">
          
          <!-- Alert for form errors broadly -->
          <div *ngIf="userForm.invalid && userForm.touched" class="mx-6 mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Please fill out all required fields correctly.
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Full Name <span class="text-red-500">*</span></label>
              <input formControlName="full_name" type="text" class="koda-input" placeholder="Enter full name">
              <span class="text-xs text-red-500 mt-1" *ngIf="userForm.get('full_name')?.invalid && userForm.get('full_name')?.touched">Full name is required.</span>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Username <span class="text-red-500">*</span></label>
              <input formControlName="username" type="text" class="koda-input" placeholder="Choose a username">
              <span class="text-xs text-red-500 mt-1" *ngIf="userForm.get('username')?.invalid && userForm.get('username')?.touched">Username is required.</span>
            </div>
          </div>

          <div class="px-6 pb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2">Email Address <span class="text-red-500">*</span></label>
            <input formControlName="email" type="email" class="koda-input" placeholder="contact@company.com">
            <span class="text-xs text-red-500 mt-1" *ngIf="userForm.get('email')?.invalid && userForm.get('email')?.touched">Valid email is required.</span>
          </div>

          <div class="px-6 pb-6" *ngIf="!isEditMode">
            <label class="block text-sm font-bold text-gray-700 mb-2">Password <span class="text-red-500">*</span></label>
            <input formControlName="password" type="password" class="koda-input" placeholder="Enter a secure password">
            <span class="text-xs text-red-500 mt-1" *ngIf="userForm.get('password')?.invalid && userForm.get('password')?.touched">Password is required for new users.</span>
          </div>

          <div class="px-6 pb-6">
            <div class="p-4 bg-gray-50/80 rounded-lg border border-gray-200 flex items-center gap-4">
              <input type="checkbox" formControlName="is_global_admin" class="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded outline-hidden">
              <div>
                <h4 class="font-bold text-gray-900 text-sm">Global Admin Privileges</h4>
                <p class="text-xs text-gray-500">Grant full access to system configuration and user management.</p>
              </div>
            </div>
          </div>

          <div class="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl">
            <a routerLink="/users" class="px-4 py-2 bg-white text-gray-600 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</a>
            <button type="submit" [disabled]="isSubmitting" class="koda-btn-primary">
              <span *ngIf="isSubmitting">Saving...</span>
              <span *ngIf="!isSubmitting">{{ isEditMode ? 'Save Changes' : 'Create User' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  userId: number | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userForm = this.fb.group({
      full_name: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      is_global_admin: [false]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.userId = +id;
        // Don't require password when editing
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
        this.loadUser();
      } else {
        // Require password for new users
        this.userForm.get('password')?.setValidators(Validators.required);
        this.userForm.get('password')?.updateValueAndValidity();
      }
    });
  }

  loadUser() {
    if (!this.userId) return;
    this.userService.getUser(this.userId).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          full_name: user.full_name,
          username: user.username,
          email: user.email,
          is_global_admin: user.is_global_admin === 1 || user.is_global_admin === true
        });
      },
      error: (err) => {
        alert('Failed to load user details.');
        this.router.navigate(['/users']);
      }
    });
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const userData = this.userForm.value;

    if (this.isEditMode && this.userId) {
      // Remove password from payload if empty during edit
      if (!userData.password) delete userData.password;

      this.userService.updateUser(this.userId, userData).subscribe({
        next: () => {
          this.router.navigate(['/users']);
        },
        error: (err) => {
          this.isSubmitting = false;
          alert('Update failed: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.router.navigate(['/users']);
        },
        error: (err) => {
          this.isSubmitting = false;
          alert('Creation failed: ' + (err.error?.message || err.message));
        }
      });
    }
  }
}
