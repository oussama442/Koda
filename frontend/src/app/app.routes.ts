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
      { path: 'applications', loadComponent: () => import('./applications/application-list/application-list').then(m => m.ApplicationListComponent) },
      { path: 'applications/new', loadComponent: () => import('./applications/application-form/application-form').then(m => m.ApplicationFormComponent) },
      { path: 'applications/edit/:id', loadComponent: () => import('./applications/application-form/application-form').then(m => m.ApplicationFormComponent) },

      { path: 'projects', loadComponent: () => import('./projects/project-list/project-list').then(m => m.ProjectListComponent) },
      { path: 'projects/new', loadComponent: () => import('./projects/project-form/project-form').then(m => m.ProjectFormComponent) },
      { path: 'projects/edit/:id', loadComponent: () => import('./projects/project-form/project-form').then(m => m.ProjectFormComponent) },
      { path: 'projects/:id/members', loadComponent: () => import('./projects/project-members/project-members').then(m => m.ProjectMembersComponent), canActivate: [authGuard] },
      { path: 'projects/:id/documents', loadComponent: () => import('./projects/project-documents/project-documents').then(m => m.ProjectDocumentsComponent), canActivate: [authGuard] },

      { path: 'incidents', loadComponent: () => import('./incidents/incident-list/incident-list').then(m => m.IncidentListComponent) },
      { path: 'incidents/new', loadComponent: () => import('./incidents/incident-form/incident-form').then(m => m.IncidentFormComponent) },
      { path: 'incidents/edit/:id', loadComponent: () => import('./incidents/incident-form/incident-form').then(m => m.IncidentFormComponent) },

      { path: 'deployments', loadComponent: () => import('./deployments/deployment-list/deployment-list').then(m => m.DeploymentListComponent) },
      { path: 'deployments/new', loadComponent: () => import('./deployments/deployment-form/deployment-form').then(m => m.DeploymentFormComponent) },
      { path: 'deployments/edit/:id', loadComponent: () => import('./deployments/deployment-form/deployment-form').then(m => m.DeploymentFormComponent) },
      { path: 'tasks/board', loadComponent: () => import('./tasks/task-board/task-board').then(m => m.TaskBoardComponent) },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
