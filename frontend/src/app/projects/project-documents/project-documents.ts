import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-project-documents',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-10 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <!-- Header -->
      <div class="relative bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <div class="absolute top-0 right-0 w-80 h-80 bg-orange-50/40 rounded-full -mr-40 -mt-40 blur-3xl"></div>
        
        <div class="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div class="space-y-4 max-w-2xl">
            <a routerLink='/projects' class='inline-flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest hover:gap-4 transition-all'>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
              Retour aux Projets
            </a>
            <h2 class="text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              Documents <span class="text-orange-600 font-outline-2">Koda</span>
            </h2>
            <p class="text-xs font-black text-gray-400 uppercase tracking-[0.3em] pl-1 border-l-4 border-orange-600">{{ project()?.name }}</p>
          </div>

          <!-- Upload Trigger Area -->
          <div class="w-full lg:w-auto">
            <label class="group flex items-center gap-4 bg-gray-900 px-8 py-5 rounded-[2.5rem] cursor-pointer hover:bg-orange-600 transition-all duration-500 shadow-2xl shadow-gray-200 active:scale-95">
              <input type="file" (change)="onFileSelected($event)" class="hidden">
              <div class="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
              </div>
              <span class="text-[11px] font-black text-white uppercase tracking-widest">Nouveau Fichier</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Filters & Stats -->
      <div class="flex flex-wrap gap-4 items-center">
        <div class="bg-white px-6 py-3 rounded-2xl border border-gray-100 flex items-center gap-3">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
          <span class="text-sm font-black text-gray-900">{{ documents().length }} Fichiers</span>
        </div>
        <div class="bg-white px-6 py-3 rounded-2xl border border-gray-100 flex items-center gap-3">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Volume</span>
          <span class="text-sm font-black text-gray-900">{{ getTotalSize() }}</span>
        </div>
      </div>

      <!-- Document Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        
        <div *ngFor="let doc of documents()" class="group relative bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-orange-200 transition-all duration-500">
          
          <div class="flex justify-between items-start mb-8">
            <div class="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
              <svg *ngIf="isImage(doc.file_type)" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <svg *ngIf="!isImage(doc.file_type)" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400 group-hover:text-orange-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <a [href]="getFileUrl(doc.file_path)" target="_blank" class="p-3 bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </a>
              <button (click)="deleteDoc(doc.id)" class="p-3 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <h3 class="text-xl font-black text-gray-900 truncate tracking-tight">{{ doc.name }}</h3>
            <div class="flex items-center gap-3">
              <span class="text-[9px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full">
                {{ doc.file_type.split('/')[1] }}
              </span>
              <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                {{ documentService.formatBytes(doc.file_size) }}
              </span>
            </div>
          </div>

          <div class="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                {{ doc.user_name.substring(0, 1) }}
              </div>
              <div class="text-[10px] font-bold text-gray-500 truncate max-w-[100px]">{{ doc.user_name }}</div>
            </div>
            <span class="text-[9px] font-bold text-gray-300 uppercase">{{ doc.created_at | date:'shortDate' }}</span>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="documents().length === 0" class="col-span-full py-40 border-4 border-dashed border-gray-50 rounded-[3.5rem] flex flex-col items-center justify-center grayscale opacity-50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-gray-200 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          <p class="text-sm font-black text-gray-300 uppercase tracking-[0.3em]">Aucun document partagé</p>
        </div>

      </div>
    </div>
  `
})
export class ProjectDocumentsComponent implements OnInit {
  projectId: number = 0;
  project = signal<any>(null);
  documents = signal<any[]>([]);

  constructor(
    private route: ActivatedRoute,
    public documentService: DocumentService,
    private projectService: ProjectService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.projectId = +params.get('id')!;
      this.loadAll();
    });
  }

  loadAll() {
    this.projectService.getById(this.projectId).subscribe(p => this.project.set(p));
    this.documentService.getProjectDocuments(this.projectId).subscribe(d => this.documents.set(d));
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.documentService.upload(file, this.projectId).subscribe(() => {
        this.loadAll();
      });
    }
  }

  getTotalSize() {
    const total = this.documents().reduce((acc, curr) => acc + curr.file_size, 0);
    return this.documentService.formatBytes(total);
  }

  getFileUrl(path: string) {
    return `${this.documentService.uploadUrl}/${path}`;
  }

  isImage(type: string) {
    return type.startsWith('image/');
  }

  deleteDoc(id: number) {
    if (confirm('Supprimer ce document définitivement ?')) {
      this.documentService.delete(id).subscribe(() => this.loadAll());
    }
  }
}
