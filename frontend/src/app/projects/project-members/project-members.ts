import { Component, OnDestroy, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectMemberOptions, ProjectMemberService } from '../../services/project-member.service';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-10 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <!-- Header -->
      <div class="relative bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <div class="absolute top-0 right-0 w-80 h-80 bg-blue-50/40 rounded-full -mr-40 -mt-40 blur-3xl"></div>
        
        <div class="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div class="space-y-4 max-w-2xl">
            <a routerLink='/projects' class='inline-flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:gap-4 transition-all'>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
              Retour aux Projets
            </a>
            <h2 class="text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              Équipe <span class="text-blue-600 font-outline-2">Koda</span>
            </h2>
            <p class="text-xs font-black text-gray-400 uppercase tracking-[0.3em] pl-1 border-l-4 border-blue-600">{{ project()?.name }}</p>
            <p *ngIf="projectLoading()" role="status" class="text-sm text-gray-500">Chargement du projet...</p>
            <p *ngIf="projectError()" role="alert" class="text-sm text-red-600">{{ projectError() }}</p>
          </div>

          <!-- CUSTOM DROPDOWNS ACTION BAR -->
          <div *ngIf="canManage()" class="w-full lg:w-auto bg-gray-50 border border-gray-100 p-3 rounded-[2.5rem] flex flex-wrap flex-col sm:flex-row items-center gap-3">
            <p *ngIf="optionsLoading()" role="status" class="w-full text-sm text-gray-500 px-3">Chargement des collaborateurs et des rôles...</p>
            <p *ngIf="optionsError()" role="alert" class="w-full text-sm text-red-600 px-3">{{ optionsError() }}</p>
            
            <!-- Custom User Select -->
            <div class="relative w-full sm:w-64">
              <button type="button" aria-label="Choisir un collaborateur" [attr.aria-expanded]="showUserDropdown" [disabled]="!optionsReady() || saving()" (click)="toggleUserDropdown($event)"
                   class="w-full text-left px-6 py-4 flex flex-col cursor-pointer bg-white rounded-2xl border border-transparent hover:border-blue-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Collaborateur</span>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-black text-gray-800 truncate">
                    {{ getSelectedUserName() || 'Choisir...' }}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 transition-transform duration-300" [class.rotate-180]="showUserDropdown" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </div>
              </button>
              
              <!-- Dropdown List -->
              <div *ngIf="showUserDropdown" class="absolute z-50 left-0 right-0 mt-2 bg-white rounded-[1.5rem] border border-gray-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto">
                <button type="button" *ngFor="let u of allUsers()"
                     (click)="selectUser(u)"
                     class="w-full text-left px-6 py-4 hover:bg-blue-50 cursor-pointer flex items-center gap-3 group transition-colors">
                  <div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-white group-hover:text-blue-500 transition-all">
                    {{ u.full_name.substring(0, 1) }}
                  </div>
                  <span class="text-sm font-bold text-gray-700 group-hover:text-blue-600">{{ u.full_name }}</span>
                </button>
              </div>
            </div>

            <!-- Custom Role Select -->
            <div class="relative w-full sm:w-48">
              <button type="button" aria-label="Choisir un rôle" [attr.aria-expanded]="showRoleDropdown" [disabled]="!optionsReady() || saving()" (click)="toggleRoleDropdown($event)"
                   class="w-full text-left px-6 py-4 flex flex-col cursor-pointer bg-white rounded-2xl border border-transparent hover:border-blue-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Responsabilité</span>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-black text-gray-800 truncate">
                    {{ getSelectedRoleName() || 'Rôle...' }}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 transition-transform duration-300" [class.rotate-180]="showRoleDropdown" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </div>
              </button>
              
              <!-- Dropdown List -->
              <div *ngIf="showRoleDropdown" class="absolute z-50 left-0 right-0 mt-2 bg-white rounded-[1.5rem] border border-gray-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button type="button" *ngFor="let r of allRoles()"
                     (click)="selectRole(r)"
                     class="w-full text-left px-6 py-4 hover:bg-blue-50 cursor-pointer flex items-center gap-3 group transition-colors">
                  <span class="text-sm font-bold text-gray-700 group-hover:text-blue-600">{{ r.role_name }}</span>
                </button>
              </div>
            </div>

            <button (click)="addMember()" [disabled]="!canAddMember()"
                    class="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-black text-[11px] uppercase rounded-[2rem] hover:bg-black hover:translate-y-[-2px] transition-all duration-300 disabled:opacity-20 active:scale-95 shadow-xl shadow-blue-100">
              Ajouter
            </button>
          </div>
        </div>
      </div>

      <p *ngIf="membersLoading()" role="status" class="text-sm text-gray-500">Chargement de l’équipe...</p>
      <p *ngIf="membersError()" role="alert" class="text-sm text-red-600">{{ membersError() }}</p>
      <p *ngIf="actionError()" role="alert" class="text-sm text-red-600">{{ actionError() }}</p>

      <!-- Team Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <!-- Chef de Projet -->
        <div class="bg-gradient-to-br from-gray-900 to-blue-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
          <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div class="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span class="text-[9px] font-black text-blue-300 uppercase tracking-widest block mb-2">Manager Principal</span>
              <h3 class="text-3xl font-black text-white leading-tight mb-2 truncate">{{ project()?.chef_projet_name || 'En attente' }}</h3>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-widest opacity-80">Chef de Projet</p>
            </div>
            
            <div class="mt-12 pt-8 border-t border-white/5 flex items-center gap-4">
              <div class="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[11px] font-black text-white border border-white/10">
                {{ project()?.chef_projet_name?.substring(0, 1) }}
              </div>
              <div class="text-[9px] font-black text-white/40 uppercase tracking-tighter">Accès Administration</div>
            </div>
          </div>
        </div>

        <!-- Regular Members -->
        <div *ngFor="let member of members()" class="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-300 group relative">
          <div class="flex justify-between items-start mb-10">
            <div class="w-20 h-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-3xl font-black text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all duration-500 shadow-inner">
              {{ member.full_name.substring(0, 1) }}
            </div>
            <button *ngIf="canManage()" (click)="removeMember(member.user_id)"
                    class="opacity-0 group-hover:opacity-100 p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div class="space-y-1 mb-10">
            <h3 class="text-3xl font-black text-gray-900 tracking-tighter">{{ member.full_name }}</h3>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-blue-600 shadow-sm shadow-blue-200"></span>
              <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest">{{ member.role_name }}</p>
            </div>
          </div>

          <div class="pt-8 border-t border-gray-50">
            <p class="text-[10px] font-bold text-gray-400 truncate">{{ member.email }}</p>
          </div>
        </div>

        <!-- Empty State Helper -->
        <div *ngIf="members().length === 0 && !membersLoading() && !membersError() && !projectError()" class="md:col-span-2 flex flex-col items-center justify-center py-20 border-4 border-dashed border-gray-50 rounded-[3.5rem] opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <p class="text-xs font-black text-gray-300 uppercase tracking-[0.4em]">Team Under Construction</p>
        </div>
      </div>
    </div>
  `
})
export class ProjectMembersComponent implements OnInit, OnDestroy {
  projectId: number = 0;
  project = signal<any>(null);
  members = signal<any[]>([]);
  allUsers = signal<ProjectMemberOptions['users']>([]);
  allRoles = signal<ProjectMemberOptions['roles']>([]);
  currentUser: any = null;
  projectLoading = signal(false);
  membersLoading = signal(false);
  optionsLoading = signal(false);
  optionsReady = signal(false);
  saving = signal(false);
  projectError = signal('');
  membersError = signal('');
  optionsError = signal('');
  actionError = signal('');
  private subscriptions = new Subscription();
  private loadRequests = new Subscription();
  private mutationRequest?: Subscription;

  selectedUserId: number | null = null;
  selectedRoleId: number | null = null;

  // Custom Dropdown State
  showUserDropdown = false;
  showRoleDropdown = false;

  constructor(
    private route: ActivatedRoute,
    private memberService: ProjectMemberService,
    private projectService: ProjectService,
    private authService: AuthService
  ) {
    this.subscriptions.add(this.authService.currentUser$.subscribe(u => this.currentUser = u));
  }

  ngOnInit() {
    this.subscriptions.add(this.route.paramMap.subscribe(params => {
      this.mutationRequest?.unsubscribe();
      this.saving.set(false);
      this.projectId = +params.get('id')!;
      this.loadAll();
    }));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.loadRequests.unsubscribe();
    this.mutationRequest?.unsubscribe();
  }

  loadAll() {
    this.loadRequests.unsubscribe();
    this.loadRequests = new Subscription();
    this.project.set(null);
    this.members.set([]);
    this.allUsers.set([]);
    this.allRoles.set([]);
    this.selectedUserId = null;
    this.selectedRoleId = null;
    this.closeDropdowns();
    this.optionsReady.set(false);
    this.optionsLoading.set(false);
    this.projectLoading.set(true);
    this.membersLoading.set(true);
    this.projectError.set('');
    this.membersError.set('');
    this.optionsError.set('');
    this.actionError.set('');
    const projectId = this.projectId;
    this.loadRequests.add(this.projectService.getById(projectId).subscribe({
      next: project => {
        this.project.set(project);
        this.projectLoading.set(false);
        if (this.canManage()) this.loadOptions(projectId);
      },
      error: () => {
        this.projectLoading.set(false);
        this.projectError.set('Impossible de charger le projet. Actualisez la page pour réessayer.');
      },
    }));
    this.loadRequests.add(this.memberService.getMembers(projectId).subscribe({
      next: members => {
        this.members.set(members);
        this.membersLoading.set(false);
      },
      error: () => {
        this.membersLoading.set(false);
        this.membersError.set('Impossible de charger l’équipe. Actualisez la page pour réessayer.');
      },
    }));
  }

  private loadOptions(projectId: number) {
    this.optionsLoading.set(true);
    this.loadRequests.add(this.memberService.getMemberOptions(projectId).subscribe({
      next: options => {
        this.allUsers.set(options.users);
        this.allRoles.set(options.roles);
        this.optionsLoading.set(false);
        this.optionsReady.set(true);
        if (!options.users.length || !options.roles.length) {
          this.optionsError.set('Aucun collaborateur ou rôle disponible pour ce projet.');
        }
      },
      error: () => {
        this.optionsLoading.set(false);
        this.optionsError.set('Impossible de charger les collaborateurs et les rôles. Actualisez la page pour réessayer.');
      },
    }));
  }

  canManage(): boolean {
    if (!this.currentUser || !this.project()) return false;
    const isAdmin = this.currentUser.is_global_admin || this.currentUser.role === 'Admin';
    const isChef = this.project().chef_projet_id == this.currentUser.id;
    return Boolean(isAdmin || isChef);
  }

  canAddMember(): boolean {
    return this.canManage() && this.optionsReady() && !this.saving()
      && this.allUsers().some(user => user.id === this.selectedUserId)
      && this.allRoles().some(role => role.id === this.selectedRoleId);
  }

  // Dropdown Logic
  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    if (!this.canManage() || !this.optionsReady() || this.saving()) return;
    this.showUserDropdown = !this.showUserDropdown;
    this.showRoleDropdown = false;
  }

  toggleRoleDropdown(event: Event) {
    event.stopPropagation();
    if (!this.canManage() || !this.optionsReady() || this.saving()) return;
    this.showRoleDropdown = !this.showRoleDropdown;
    this.showUserDropdown = false;
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.showUserDropdown = false;
    this.showRoleDropdown = false;
  }

  selectUser(user: ProjectMemberOptions['users'][number]) {
    this.selectedUserId = Number(user.id);
    this.showUserDropdown = false;
  }

  selectRole(role: ProjectMemberOptions['roles'][number]) {
    this.selectedRoleId = Number(role.id);
    this.showRoleDropdown = false;
  }

  getSelectedUserName() {
    return this.allUsers().find(u => u.id === this.selectedUserId)?.full_name;
  }

  getSelectedRoleName() {
    return this.allRoles().find(r => r.id === this.selectedRoleId)?.role_name;
  }

  addMember() {
    if (!this.canAddMember()) return;
    this.saving.set(true);
    this.actionError.set('');
    this.closeDropdowns();
    this.mutationRequest = this.memberService.addMember({
      project_id: this.projectId,
      user_id: this.selectedUserId,
      role_id: this.selectedRoleId
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadAll();
      },
      error: () => {
        this.saving.set(false);
        this.actionError.set('Impossible d’ajouter ce membre. Vérifiez votre sélection et réessayez.');
      },
    });
  }

  removeMember(userId: number) {
    if (!confirm('Retirer ce membre du projet ?')) return;
    this.memberService.removeMember(this.projectId, userId).subscribe(() => this.loadAll());
  }
}
