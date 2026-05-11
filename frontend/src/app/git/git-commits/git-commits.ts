import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GitService } from '../../services/git.service';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-git-commits',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8 p-2 animate-in fade-in duration-500">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-3xl font-black text-gray-900 tracking-tight uppercase">Git Commits</h2>
          <p class="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Historique des versions</p>
        </div>
        
        <div class="flex items-center gap-4">
          <select class="koda-input w-48" (change)="onAppChange($event)">
            <option value="">Toutes les applications</option>
            <option *ngFor="let app of applications" [value]="app.id">{{ app.name }}</option>
          </select>
          
          <button (click)="sync()" [disabled]="isSyncing" class="px-6 py-3 bg-gray-900 text-white font-black text-xs uppercase rounded-2xl hover:bg-black shadow-xl transition-all flex items-center gap-2">
            <svg *ngIf="isSyncing" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ isSyncing ? 'Synchronisation...' : 'Synchroniser' }}
          </button>
        </div>
      </div>

      <div class="koda-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Application</th>
                <th class="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Commit</th>
                <th class="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Message</th>
                <th class="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr *ngFor="let item of items()" class="hover:bg-gray-50/50 transition-colors">
                <td class="py-4 px-6">
                  <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg">
                    {{ item.application_name }}
                  </span>
                </td>
                <td class="py-4 px-6">
                  <a [href]="item.pull_request_url || '#'" target="_blank" class="text-xs font-mono font-bold text-gray-900 hover:text-[var(--color-primary)]">
                    {{ item.commit_hash | slice:0:7 }}
                  </a>
                  <p class="text-[10px] text-gray-400 font-bold mt-1 uppercase">{{ item.branch }}</p>
                </td>
                <td class="py-4 px-6">
                  <p class="text-sm font-medium text-gray-700 max-w-md truncate" [title]="item.message">{{ item.message }}</p>
                </td>
                <td class="py-4 px-6 text-xs font-bold text-gray-500">
                  {{ item.committed_at | date:'medium' }}
                </td>
              </tr>
              <tr *ngIf="items().length === 0">
                <td colspan="4" class="py-12 text-center text-gray-400 text-xs font-black uppercase tracking-widest">Aucun commit trouvé</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class GitCommitsComponent implements OnInit {
  items = signal<any[]>([]);
  applications: any[] = [];
  selectedAppId: number | null = null;
  isSyncing = false;

  constructor(
    private service: GitService,
    private appService: ApplicationService
  ) {}

  ngOnInit() {
    this.appService.getAll().subscribe(data => this.applications = data);
    this.load();
  }

  load() {
    if (this.selectedAppId) {
      this.service.getCommitsByApplication(this.selectedAppId).subscribe(data => this.items.set(data));
    } else {
      this.service.getAllCommits().subscribe(data => this.items.set(data));
    }
  }

  onAppChange(event: any) {
    this.selectedAppId = event.target.value ? +event.target.value : null;
    this.load();
  }

  sync() {
    if (!this.selectedAppId) {
      alert("Veuillez sélectionner une application pour synchroniser.");
      return;
    }
    this.isSyncing = true;
    this.service.syncCommits(this.selectedAppId).subscribe({
      next: () => {
        this.isSyncing = false;
        this.load();
      },
      error: (e) => {
        this.isSyncing = false;
        alert("Erreur de synchronisation: " + e.message);
      }
    });
  }
}
