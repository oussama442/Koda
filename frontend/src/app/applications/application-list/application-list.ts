import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class='space-y-6'>
      <div class='flex justify-between items-center'>
        <div>
          <h2 class='text-2xl font-black text-gray-900'>Applications</h2>
          <p class='text-sm text-gray-500'>Manage your applications</p>
        </div>
        <a routerLink='/applications/new' class='koda-btn-primary'>Add Application</a>
      </div>
      <div class='koda-card overflow-hidden'>
        <table class='w-full text-left'>
          <thead>
            <tr class='bg-gray-50'>
              <th class='px-6 py-4 text-xs font-bold text-gray-500 uppercase'>name</th><th class='px-6 py-4 text-xs font-bold text-gray-500 uppercase'>description</th><th class='px-6 py-4 text-xs font-bold text-gray-500 uppercase'>current status</th><th class='px-6 py-4 text-xs font-bold text-gray-500 uppercase'>github repo url</th>
              <th class='px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right'>Action</th>
            </tr>
          </thead>
          <tbody class='divide-y divide-gray-100'>
            <tr *ngFor='let item of items()' class='hover:bg-gray-50 transition-colors'>
              <td class='px-6 py-4 font-bold text-gray-700'>{{ item.name }}</td><td class='px-6 py-4 font-bold text-gray-700'>{{ item.description }}</td><td class='px-6 py-4 font-bold text-gray-700'>{{ item.current_status }}</td><td class='px-6 py-4 font-bold text-gray-700'>{{ item.github_repo_url }}</td>
              <td class='px-6 py-4 text-right'>
                <div class='flex items-center justify-end gap-2'>
                  <a [routerLink]="['/applications/edit', item.id]" class='text-xs font-bold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg'>Edit</a>
                  <button (click)='openDelete(item)' class='text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg'>Delete</button>
                </div>
              </td>
            </tr>
            <tr *ngIf='items().length === 0'>
              <td colspan='5' class='px-6 py-12 text-center text-gray-400 italic'>No data found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf='showDeleteModal' class='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div class='absolute inset-0 bg-gray-900/40 backdrop-blur-sm' (click)='closeDelete()'></div>
      <div class='relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-0 overflow-hidden'>
        <div class='p-8 text-center'>
          <h3 class='text-xl font-black text-gray-900 mb-2'>Delete Application</h3>
          <p class='text-sm text-gray-500'>Are you sure? This action is irreversible.</p>
        </div>
        <div class='flex items-center justify-end gap-3 p-6 bg-gray-50 border-t border-gray-100'>
          <button (click)='closeDelete()' class='px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl'>Cancel</button>
          <button (click)='confirmDelete()' class='px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl'>Delete</button>
        </div>
      </div>
    </div>
  `
})
export class ApplicationListComponent implements OnInit {
  items = signal<any[]>([]);
  showDeleteModal = false;
  itemToDelete: any = null;

  constructor(private service: ApplicationService) {}

  ngOnInit() { this.load(); }
  load() {
    this.service.getAll().subscribe({ next: data => this.items.set(data) });
  }
  openDelete(item: any) { this.itemToDelete = item; this.showDeleteModal = true; }
  closeDelete() { this.showDeleteModal = false; this.itemToDelete = null; }
  confirmDelete() {
    if (!this.itemToDelete) return;
    this.service.delete(this.itemToDelete.id).subscribe({
      next: () => { this.closeDelete(); this.load(); },
      error: (e) => { alert('Error: ' + e.message); this.closeDelete(); }
    });
  }
}
