import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { LayoutComponent } from './layout/layout';
import { DashboardComponent } from './dashboard/dashboard';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { 
        path: 'users/roles', 
        loadComponent: () => import('./users/roles/role-list').then(m => m.RoleListComponent) 
      },
      { 
        path: 'users/roles/new', 
        loadComponent: () => import('./users/roles/role-form').then(m => m.RoleFormComponent) 
      },
      { 
        path: 'users/roles/edit/:id', 
        loadComponent: () => import('./users/roles/role-form').then(m => m.RoleFormComponent) 
      },
      { 
        path: 'users', 
        loadComponent: () => import('./users/user-list/user-list').then(m => m.UserListComponent),
        canActivate: [adminGuard]
      },
      { 
        path: 'users/new', 
        loadComponent: () => import('./users/user-form/user-form').then(m => m.UserFormComponent),
        canActivate: [adminGuard]
      },
      { 
        path: 'users/edit/:id', 
        loadComponent: () => import('./users/user-form/user-form').then(m => m.UserFormComponent),
        canActivate: [adminGuard]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
