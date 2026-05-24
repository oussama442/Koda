import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div class="mb-10">
        <h2 class="text-4xl font-black text-gray-900 tracking-tight uppercase">Mon Profil</h2>
        <p class="text-sm font-medium text-gray-400 mt-1 uppercase tracking-widest">Gérez vos informations personnelles</p>
      </div>

      <div class="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32"></div>
        
        <div class="flex items-center gap-6 mb-10 relative z-10">
          <div class="relative group">
            <div *ngIf="!user()?.avatar" class="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-200 overflow-hidden">
              {{ user()?.full_name?.charAt(0) }}
            </div>
            <img *ngIf="user()?.avatar" [src]="'http://localhost:5000' + user()?.avatar" class="w-24 h-24 rounded-3xl object-cover shadow-2xl shadow-blue-200 border-2 border-white" alt="Profile Picture">
            
            <label class="absolute inset-0 bg-black/50 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)">
            </label>
          </div>
          <div>
            <h3 class="text-2xl font-black text-gray-900">{{ user()?.full_name }}</h3>
            <p class="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">{{ user()?.role || 'Utilisateur' }}</p>
          </div>
        </div>
        
        <form (ngSubmit)="updateProfile()" #profileForm="ngForm" class="relative z-10 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nom Complet</label>
              <input 
                type="text" 
                [(ngModel)]="profile.full_name" 
                name="full_name" 
                required 
                class="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="Votre nom complet"
              >
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Adresse Email</label>
              <input 
                type="email" 
                [(ngModel)]="profile.email" 
                name="email" 
                required 
                class="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="email@example.com"
              >
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Rôle (Lecture seule)</label>
              <input 
                type="text" 
                [value]="user()?.role" 
                disabled
                class="w-full px-6 py-4 bg-gray-100 border-none rounded-2xl text-sm font-bold text-gray-400 cursor-not-allowed"
              >
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nouveau Mot de Passe</label>
              <input 
                type="password" 
                [(ngModel)]="profile.password" 
                name="password" 
                class="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="Laisser vide pour ne pas changer"
              >
            </div>
          </div>

          <div class="flex justify-end pt-6">
            <button 
              type="submit" 
              [disabled]="loading"
              class="px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              <span *ngIf="!loading">Mettre à jour le profil</span>
              <span *ngIf="loading">Mise à jour...</span>
              <svg *ngIf="!loading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            </button>
          </div>
        </form>

        <div *ngIf="message" [class]="'mt-8 p-6 rounded-[2rem] text-xs font-bold uppercase tracking-widest text-center ' + (messageType === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')">
          {{ message }}
        </div>
      </div>
      
      <!-- Placeholder for future security features -->
      <div class="mt-8 p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 flex items-center gap-6">
        <div class="p-4 bg-white rounded-2xl text-blue-600 shadow-sm">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <div>
          <h4 class="text-xs font-black text-blue-900 uppercase tracking-widest">Prochainement : Connexion Sociale</h4>
          <p class="text-[10px] text-blue-600 font-bold uppercase opacity-70">Bientôt, connectez-vous avec Google ou GitHub pour plus de sécurité.</p>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  user = signal<any>(null);
  profile = {
    full_name: '',
    email: '',
    password: ''
  };
  loading = false;
  message = '';
  messageType = 'success';

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user.set(user);
        this.profile.full_name = user.full_name;
        this.profile.email = user.email;
      }
    });
  }

  updateProfile() {
    this.loading = true;
    this.message = '';
    
    this.userService.updateProfile(this.profile).subscribe({
      next: (res) => {
        this.loading = false;
        this.message = 'Profil mis à jour avec succès !';
        this.messageType = 'success';
        this.profile.password = '';
        
        const updatedUser = { ...this.user(), full_name: this.profile.full_name, email: this.profile.email };
        this.user.set(updatedUser);
        this.authService.updateCurrentUser(updatedUser);
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error.message || 'Une erreur est survenue';
        this.messageType = 'error';
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.userService.uploadAvatar(file).subscribe({
        next: (res) => {
          const updatedUser = { ...this.user(), avatar: res.avatar };
          this.user.set(updatedUser);
          this.authService.updateCurrentUser(updatedUser);
          this.message = 'Photo de profil mise à jour avec succès !';
          this.messageType = 'success';
        },
        error: (err) => {
          this.message = err.error?.message || 'Erreur lors de la mise à jour de la photo';
          this.messageType = 'error';
        }
      });
    }
  }
}
