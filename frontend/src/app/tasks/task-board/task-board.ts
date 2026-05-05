import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { SprintService } from '../../services/sprint.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 p-2">
      <!-- Premium Header -->
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 class="text-3xl font-black text-gray-900 tracking-tight">Tableau Kanban</h2>
          <p class="text-sm font-medium text-gray-400 mt-1">Gérez le flux de travail de vos projets</p>
        </div>
        
        <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div class="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-3 py-1 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <span class="text-[10px] font-black text-gray-400 uppercase mr-2">Projet</span>
            <select 
              [(ngModel)]="selectedProjectId" 
              (change)="onProjectChange()"
              class="bg-transparent py-2 text-sm font-bold text-gray-700 outline-none min-w-[120px]"
            >
              <option [value]="null">Sélectionner...</option>
              <option *ngFor="let p of projects()" [value]="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div class="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-3 py-1 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <span class="text-[10px] font-black text-gray-400 uppercase mr-2">Sprint</span>
            <select 
              [(ngModel)]="selectedSprintId" 
              (change)="loadTasks()"
              [disabled]="!selectedProjectId"
              class="bg-transparent py-2 text-sm font-bold text-gray-700 outline-none min-w-[120px] disabled:opacity-50"
            >
              <option [value]="null">Tous / Backlog</option>
              <option *ngFor="let s of sprints()" [value]="s.id">{{ s.name }}</option>
            </select>
          </div>

          <div class="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

          <button 
            (click)="openSprintModal()" 
            [disabled]="!selectedProjectId"
            class="px-5 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl text-sm font-black hover:bg-blue-50 transition-all disabled:opacity-30 disabled:border-gray-200 disabled:text-gray-400"
          >
            + Sprint
          </button>

          <button 
            (click)="openTaskModal()" 
            [disabled]="!selectedProjectId"
            class="px-5 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-30 disabled:bg-gray-200"
          >
            + Tâche
          </button>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Columns Logic (To Do, In Progress, Done) -->
        <ng-container *ngFor="let col of columns">
          <div [class]="col.bgClass + ' rounded-[2.5rem] p-6 border flex flex-col min-h-[650px] transition-all'" [class.border-gray-200]="col.id === 'To Do'" [class.border-blue-100]="col.id === 'In Progress'" [class.border-green-100]="col.id === 'Done'">
            <div class="flex items-center justify-between mb-8 px-2">
              <h3 [class]="col.textClass + ' text-base font-black uppercase tracking-widest flex items-center gap-3'">
                <span [class]="col.dotClass + ' w-2.5 h-2.5 rounded-full shadow-sm'"></span>
                {{ col.label }}
                <span class="bg-white/80 backdrop-blur-sm border border-inherit px-3 py-1 rounded-full text-xs font-black shadow-sm">{{ getTasksByStatus(col.id).length }}</span>
              </h3>
            </div>
            
            <div class="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-1">
              <div *ngFor="let task of getTasksByStatus(col.id)" (click)="openStatusModal(task)" 
                   class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] hover:border-blue-200 transition-all cursor-pointer group">
                <div class="flex justify-between items-start mb-3">
                  <span class="text-[10px] font-black text-gray-300 group-hover:text-blue-400 transition-colors">#{{ task.id }}</span>
                  <div *ngIf="task.sprint_id" class="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-500 rounded-md border border-gray-100">
                    {{ task.sprint_name }}
                  </div>
                  <div *ngIf="!task.sprint_id" class="px-2 py-0.5 bg-orange-50 text-[9px] font-black text-orange-500 rounded-md border border-orange-100">
                    Backlog
                  </div>
                </div>
                <h4 class="text-sm font-bold text-gray-800 leading-relaxed mb-4 group-hover:text-blue-600 transition-colors" [class.line-through]="col.id === 'Done'">
                  {{ task.title }}
                </h4>
                <div class="flex justify-between items-center pt-4 border-t border-gray-50">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-2xl bg-blue-50 flex items-center justify-center text-[11px] font-black text-blue-600 border border-blue-100">
                      {{ task.assigned_user_name ? task.assigned_user_name.substring(0, 2).toUpperCase() : '?' }}
                    </div>
                    <span class="text-[11px] font-bold text-gray-500">{{ task.assigned_user_name || 'Non assigné' }}</span>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div *ngIf="getTasksByStatus(col.id).length === 0" class="flex flex-col items-center justify-center py-20 opacity-20 grayscale">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span class="text-xs font-black uppercase tracking-widest">Vide</span>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>

    <!-- Modal Status & Sprint Update -->
    <div *ngIf="showStatusModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-md" (click)="closeStatusModal()"></div>
      <div class="relative bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-10">
          <div class="flex items-center gap-5 mb-10">
            <div class="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight">Gestion de Tâche</h3>
              <p class="text-sm font-medium text-gray-400">Modifiez le statut ou changez de sprint</p>
            </div>
          </div>

          <div class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sprint / Planning</label>
                <select 
                  [(ngModel)]="tempSprintId" 
                  class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                >
                  <option [value]="null">📦 Backlog Produit</option>
                  <option *ngFor="let s of sprints()" [value]="s.id">🚀 {{ s.name }}</option>
                </select>
              </div>
              
              <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">État Actuel</label>
                <div class="flex p-1 bg-gray-100 rounded-2xl gap-1">
                  <button *ngFor="let s of ['To Do', 'In Progress', 'Done']" 
                    (click)="tempStatus = s"
                    [class.bg-white]="tempStatus === s"
                    [class.shadow-md]="tempStatus === s"
                    [class.text-blue-600]="tempStatus === s"
                    class="flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all text-gray-500 hover:text-gray-900"
                  >
                    {{ s === 'To Do' ? 'À Faire' : s === 'In Progress' ? 'En Cours' : 'Fini' }}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Mise à jour (Daily Scrum)</label>
              <textarea 
                [(ngModel)]="statusComment"
                rows="4" 
                placeholder="Rédigez un court commentaire sur l'avancement..."
                class="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="p-8 bg-gray-50/50 backdrop-blur-sm border-t border-gray-100 flex gap-4">
          <button (click)="closeStatusModal()" class="flex-1 py-5 text-sm font-black text-gray-400 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">
            ANNULER
          </button>
          <button 
            (click)="updateTaskStatus()" 
            class="flex-[2] py-5 text-sm font-black text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all"
          >
            METTRE À JOUR
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Nouveau Sprint -->
    <div *ngIf="showSprintModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" (click)="closeSprintModal()"></div>
      <div class="relative bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <form (submit)="createSprint()" class="p-10">
          <h3 class="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight">Nouveau Sprint</h3>
          
          <div class="space-y-6">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Nom du Sprint</label>
              <input type="text" [(ngModel)]="newSprint.name" name="sName" required class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Début</label>
                <input type="date" [(ngModel)]="newSprint.start_date" name="sStart" class="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none">
              </div>
              <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Fin</label>
                <input type="date" [(ngModel)]="newSprint.end_date" name="sEnd" class="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none">
              </div>
            </div>
          </div>

          <div class="mt-10 flex gap-4">
            <button type="button" (click)="closeSprintModal()" class="flex-1 py-5 text-sm font-black text-gray-400 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">ANNULER</button>
            <button type="submit" class="flex-1 py-5 text-sm font-black text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700">CRÉER SPRINT</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Nouvelle Tâche -->
    <div *ngIf="showTaskModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" (click)="closeTaskModal()"></div>
      <div class="relative bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <form (submit)="createTask()" class="p-10">
          <h3 class="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight">Nouvelle Tâche</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="md:col-span-2">
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Titre</label>
              <input type="text" [(ngModel)]="newTask.title" name="tTitle" required class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10">
            </div>

            <div class="md:col-span-2">
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Description</label>
              <textarea [(ngModel)]="newTask.description" name="tDesc" rows="3" class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none resize-none"></textarea>
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Assignation</label>
              <select [(ngModel)]="newTask.user_id" name="tUser" class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold">
                <option [value]="null">Non assigné</option>
                <option *ngFor="let u of users()" [value]="u.id">{{ u.full_name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Sprint</label>
              <select [(ngModel)]="newTask.sprint_id" name="tSprint" class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold">
                <option [value]="null">Backlog Produit</option>
                <option *ngFor="let s of sprints()" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>

          <div class="mt-10 flex gap-4">
            <button type="button" (click)="closeTaskModal()" class="flex-1 py-5 text-sm font-black text-gray-400 bg-white border border-gray-200 rounded-2xl">ANNULER</button>
            <button type="submit" class="flex-1 py-5 text-sm font-black text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700">CRÉER TÂCHE</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .kanban-column { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
    .animate-in { animation: zoomIn 0.3s ease-out; }
  `]
})
export class TaskBoardComponent implements OnInit {
  projects = signal<any[]>([]);
  sprints = signal<any[]>([]);
  tasks = signal<any[]>([]);
  users = signal<any[]>([]);

  columns = [
    { id: 'To Do', label: 'À Faire', bgClass: 'bg-gray-50/50', textClass: 'text-gray-900', dotClass: 'bg-gray-400' },
    { id: 'In Progress', label: 'En Cours', bgClass: 'bg-blue-50/30', textClass: 'text-blue-900', dotClass: 'bg-blue-500' },
    { id: 'Done', label: 'Terminé', bgClass: 'bg-green-50/30', textClass: 'text-green-900', dotClass: 'bg-green-500' }
  ];

  selectedProjectId: number | null = null;
  selectedSprintId: number | null = null;

  showTaskModal = false;
  showStatusModal = false;
  showSprintModal = false;
  
  // For Status/Sprint Update
  activeTask: any = null;
  tempStatus: string = '';
  tempSprintId: number | null = null;
  statusComment: string = '';

  newTask: any = { title: '', description: '', user_id: null, sprint_id: null, status: 'To Do' };
  newSprint: any = { name: '', start_date: '', end_date: '', status: 'Planned' };

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private sprintService: SprintService,
    private userService: UserService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProjects();
    this.loadUsers();
    
    // Check for project_id in query params (from Project Card "Board" button)
    this.route.queryParams.subscribe(params => {
      if (params['project_id']) {
        this.selectedProjectId = +params['project_id'];
        this.onProjectChange();
      }
    });
  }

  loadProjects() {
    this.projectService.getAll().subscribe(data => this.projects.set(data));
  }

  loadUsers() {
    this.userService.getUsers().subscribe(data => this.users.set(data));
  }

  onProjectChange() {
    this.selectedSprintId = null;
    this.loadSprints();
    this.loadTasks();
  }

  loadSprints() {
    if (!this.selectedProjectId) {
      this.sprints.set([]);
      return;
    }
    this.sprintService.getSprints(this.selectedProjectId).subscribe(data => this.sprints.set(data));
  }

  loadTasks() {
    if (!this.selectedProjectId) {
      this.tasks.set([]);
      return;
    }
    this.taskService.getTasks(this.selectedProjectId, this.selectedSprintId).subscribe(data => {
      this.tasks.set(data);
    });
  }

  getTasksByStatus(status: string) {
    return this.tasks().filter(t => t.status === status);
  }

  openTaskModal() { this.showTaskModal = true; }
  closeTaskModal() { this.showTaskModal = false; this.newTask = { title: '', description: '', user_id: null, sprint_id: null, status: 'To Do' }; }

  openSprintModal() { this.showSprintModal = true; }
  closeSprintModal() { this.showSprintModal = false; this.newSprint = { name: '', start_date: '', end_date: '', status: 'Planned' }; }

  createSprint() {
    this.sprintService.createSprint({ ...this.newSprint, project_id: this.selectedProjectId }).subscribe(() => {
      this.loadSprints();
      this.closeSprintModal();
    });
  }

  createTask() {
    this.taskService.createTask({ ...this.newTask, project_id: this.selectedProjectId }).subscribe(() => {
      this.loadTasks();
      this.closeTaskModal();
    });
  }

  openStatusModal(task: any) {
    this.activeTask = task;
    this.tempStatus = task.status;
    this.tempSprintId = task.sprint_id;
    this.statusComment = '';
    this.showStatusModal = true;
  }

  closeStatusModal() { this.showStatusModal = false; this.activeTask = null; }

  updateTaskStatus() {
    if (!this.activeTask) return;
    const updateData = { 
      ...this.activeTask, 
      status: this.tempStatus, 
      sprint_id: this.tempSprintId,
      comment: this.statusComment 
    };
    this.taskService.updateTask(this.activeTask.id, updateData).subscribe(() => {
      this.loadTasks();
      this.closeStatusModal();
    });
  }
}
