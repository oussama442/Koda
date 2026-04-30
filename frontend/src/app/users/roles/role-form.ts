import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <a routerLink="/users/roles" class="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </a>
        <h2 class="text-2xl font-black text-gray-900">{{ isEdit ? 'Modifier le rôle' : 'Ajouter un rôle' }}</h2>
      </div>

      <div class="koda-card bg-white p-8">
        <form [formGroup]="roleForm" (ngSubmit)="onSubmit()" class="space-y-8">
          <div class="space-y-2 max-w-md">
            <label class="block text-sm font-bold text-gray-700">Nom de rôle:<span class="text-red-500">*</span></label>
            <input 
              type="text" 
              formControlName="role_name" 
              placeholder="Nom de rôle"
              class="koda-input"
            >
          </div>

          <div class="space-y-6">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Autorisations:</h3>
            
            <div *ngFor="let group of permissionGroups" class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start py-6 border-b border-gray-50 last:border-0">
              <div class="md:col-span-2">
                <p class="font-bold text-gray-700">{{ group.name }}</p>
              </div>
              
              <div class="md:col-span-2">
                <label class="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    [checked]="isGroupSelected(group)" 
                    (change)="toggleGroup(group)"
                    class="w-5 h-5 rounded-md border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] transition-all cursor-pointer"
                  >
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-gray-600 group-hover:text-gray-900">Tout</span>
                    <span class="text-[10px] text-gray-400 font-bold uppercase">sélectionner</span>
                  </div>
                </label>
              </div>

              <div class="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label *ngFor="let perm of group.permissions" class="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    [checked]="selectedPermissions.has(perm.id)"
                    (change)="togglePermission(perm.id)"
                    class="w-5 h-5 rounded-md border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] transition-all cursor-pointer"
                  >
                  <span class="text-sm text-gray-600 group-hover:text-gray-900">{{ perm.description }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <a routerLink="/users/roles" class="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">Annuler</a>
            <button type="submit" class="koda-btn-primary px-8">
              {{ isEdit ? 'Enregistrer les modifications' : 'Créer le rôle' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class RoleFormComponent implements OnInit {
  roleForm: FormGroup;
  isEdit = false;
  roleId: number | null = null;
  allPermissions: any[] = [];
  permissionGroups: any[] = [];
  selectedPermissions = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.roleForm = this.fb.group({
      role_name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.roleId = this.route.snapshot.params['id'];
    this.isEdit = !!this.roleId;

    this.roleService.getPermissions().subscribe(perms => {
      this.allPermissions = perms;
      this.groupPermissions();
      
      if (this.isEdit && this.roleId) {
        this.roleService.getRole(this.roleId).subscribe(role => {
          this.roleForm.patchValue({ role_name: role.role_name });
          this.selectedPermissions = new Set(role.permissions);
        });
      }
    });
  }

  groupPermissions(): void {
    const groups: { [key: string]: any[] } = {};
    
    this.allPermissions.forEach(p => {
      let groupName = 'Others';
      if (p.permission_name.includes('user')) groupName = 'Users';
      else if (p.permission_name.includes('role')) groupName = 'Roles';
      else if (p.permission_name.includes('application')) groupName = 'Applications';
      else if (p.permission_name.includes('project')) groupName = 'Projects';
      
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(p);
    });

    const order = ['Users', 'Roles', 'Applications', 'Projects'];
    this.permissionGroups = order
      .filter(name => groups[name])
      .map(name => ({
        name,
        permissions: groups[name]
      }));
    
    // Add "Others" or any other groups if they exist and are not in the order list
    Object.keys(groups).forEach(name => {
      if (!order.includes(name)) {
        this.permissionGroups.push({ name, permissions: groups[name] });
      }
    });
  }

  isGroupSelected(group: any): boolean {
    return group.permissions.every((p: any) => this.selectedPermissions.has(p.id));
  }

  toggleGroup(group: any): void {
    const allSelected = this.isGroupSelected(group);
    group.permissions.forEach((p: any) => {
      if (allSelected) this.selectedPermissions.delete(p.id);
      else this.selectedPermissions.add(p.id);
    });
  }

  togglePermission(id: number): void {
    if (this.selectedPermissions.has(id)) this.selectedPermissions.delete(id);
    else this.selectedPermissions.add(id);
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      console.error('Form is invalid:', this.roleForm.errors);
      return;
    }

    const roleData = {
      ...this.roleForm.value,
      permissions: Array.from(this.selectedPermissions)
    };

    console.log('Submitting role data:', roleData);

    if (this.isEdit && this.roleId) {
      this.roleService.updateRole(this.roleId, roleData).subscribe({
        next: () => {
          console.log('Role updated successfully');
          this.router.navigate(['/users/roles']);
        },
        error: (err) => {
          console.error('Error updating role:', err);
          alert('Error updating role: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.roleService.createRole(roleData).subscribe({
        next: () => {
          console.log('Role created successfully');
          this.router.navigate(['/users/roles']);
        },
        error: (err) => {
          console.error('Error creating role:', err);
          alert('Error creating role: ' + (err.error?.message || err.message));
        }
      });
    }
  }
}
