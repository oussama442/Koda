import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectMemberService } from '../../services/project-member.service';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { RoleService } from '../../services/role.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-8 p-2 animate-in slide-in-from-bottom duration-500">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <a routerLink='/projects' class='text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block'>← Retour aux Projets</a>
          <h2 class="text-3xl font-black text-gray-900 tracking-tight uppercase">Équipe du Projet</h2>
          <p class="text-sm font-bold text-blue-600 mt-1 uppercase tracking-widest">{{ project()?.name }}</p>
        </div>
        <div *ngIf="canManage()" class="flex items-center gap-3 bg-white p-3 rounded-[2rem] border border-gray-100 shadow-sm">
          <select [(ngModel)]="selectedUserId" class="koda-input !py-2 !text-xs border-none bg-gray-50">
            <option [value]="null">Choisir Utilisateur...</option>
            <option *ngFor="let u of allUsers" [value]="u.id">{{ u.full_name }}</option>
          </select>
          <select [(ngModel)]="selectedRoleId" class="koda-input !py-2 !text-xs border-none bg-gray-50">
            <option [value]="null">Choisir Rôle...</option>
            <option *ngFor="let r of allRoles" [value]="r.id">{{ r.role_name }}</option>
          </select>
          <button (click)="addMember()" [disabled]="!selectedUserId || !selectedRoleId" class="px-6 py-2 bg-gray-900 text-white font-black text-[10px] uppercase rounded-xl hover:bg-black transition-all disabled:opacity-20">
            Ajouter
          </button>
        </div>
      </div>

      <!-- Members Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Project Manager Card (Special) -->
        <div class="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p class="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-4">Chef de Projet (Leader)</p>
          <h3 class="text-2xl font-black text-white truncate">{{ project()?.chef_projet_name || 'Non assigné' }}</h3>
          <p class="text-xs font-bold text-blue-100 mt-1 uppercase">Responsable Principal</p>
        </div>

        <!-- Regular Members -->
        <div *ngFor="let member of members()" class="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-6">
              <div class="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-sm font-black text-gray-400 border border-gray-100 uppercase">
                {{ member.full_name.substring(0, 2) }}
              </div>
              <button *ngIf="canManage()" (click)="removeMember(member.user_id)" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <h3 class="text-xl font-black text-gray-900 truncate">{{ member.full_name }}</h3>
            <p class="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">{{ member.role_name }}</p>
          </div>
          <div class="mt-8 pt-6 border-t border-gray-50">
            <p class="text-[10px] font-bold text-gray-400 truncate">{{ member.email }}</p>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="members().length === 0" class="lg:col-span-2 flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 rounded-[2.5rem]">
          <p class="text-sm font-bold text-gray-300 uppercase tracking-widest">Aucun membre assigné à l'équipe</p>
        </div>
      </div>
    </div>
  `
})
export class ProjectMembersComponent implements OnInit {
  projectId: number = 0;
  project = signal<any>(null);
  members = signal<any[]>([]);
  allUsers: any[] = [];
  allRoles: any[] = [];
  currentUser: any = null;

  selectedUserId: number | null = null;
  selectedRoleId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private memberService: ProjectMemberService,
    private projectService: ProjectService,
    private userService: UserService,
    private roleService: RoleService,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.projectId = +params.get('id')!;
      this.loadAll();
    });
  }

  loadAll() {
    this.projectService.getById(this.projectId).subscribe(p => this.project.set(p));
    this.memberService.getMembers(this.projectId).subscribe(m => this.members.set(m));
    this.userService.getUsers().subscribe(u => this.allUsers = u);
    this.roleService.getRoles().subscribe((r: any[]) => this.allRoles = r);
  }

  canManage(): boolean {
    if (!this.currentUser || !this.project()) return false;
    return this.currentUser.role === 'Admin' || this.project().chef_projet_id === this.currentUser.id;
  }

  addMember() {
    if (!this.selectedUserId || !this.selectedRoleId) return;
    this.memberService.addMember({
      project_id: this.projectId,
      user_id: +this.selectedUserId,
      role_id: +this.selectedRoleId
    }).subscribe({
      next: () => {
        this.selectedUserId = null;
        this.selectedRoleId = null;
        this.loadAll();
      },
      error: (e) => alert(e.error?.message || 'Erreur lors de l\'ajout')
    });
  }

  removeMember(userId: number) {
    if (!confirm('Retirer ce membre du projet ?')) return;
    this.memberService.removeMember(this.projectId, userId).subscribe(() => this.loadAll());
  }
}
