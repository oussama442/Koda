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
          <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-200">
            {{ user()?.full_name?.charAt(0) }}
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
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error.message || 'Une erreur est survenue';
        this.messageType = 'error';
      }
    });
  }
}
