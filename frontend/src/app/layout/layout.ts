import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html'
})
export class LayoutComponent implements OnInit {
  user: any;
  isSidebarOpen = true;
  showNotifDropdown = false;
  notifications: any[] = [];
  unreadCount = 0;

  menuItems = [
    { label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', route: '/dashboard', exact: true },
    { label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', route: '/users', exact: true },
    { label: 'Roles', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', route: '/users/roles', exact: true },
    { label: 'Applications', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z', route: '/applications', exact: true },
    { label: 'Projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', route: '/projects', exact: true },
    { label: 'Sprints', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', route: '/sprints', exact: true },
    { label: 'Incidents', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', route: '/incidents', exact: true },
    { label: 'Deployments', icon: 'M5 13l4 4L19 7', route: '/deployments', exact: true },
    { label: 'Git Commits', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z', route: '/git-commits', exact: true },
    { label: 'Tâches', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', route: '/tasks/board', exact: true },
    { label: 'Improvements', icon: 'M13 10V3L4 14h7v7l9-11h-7z', route: '/improvements', exact: true },
  ];

  constructor(
    private authService: AuthService, 
    private router: Router,
    private notifService: NotificationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => this.user = user);
    this.notifService.unreadCount$.subscribe(count => this.unreadCount = count);
    this.loadNotifications();
  }

  loadNotifications() {
    this.notifService.getNotifications().subscribe(data => {
      this.notifications = data;
      this.notifService.updateUnreadCount(data);
    });
  }

  toggleNotifDropdown(event: Event) {
    event.stopPropagation();
    this.showNotifDropdown = !this.showNotifDropdown;
    if (this.showNotifDropdown) this.loadNotifications();
  }

  @HostListener('document:click')
  closeNotif() { this.showNotifDropdown = false; }

  markAsRead(n: any) {
    if (n.is_read) {
        if (n.link) this.router.navigateByUrl(n.link);
        return;
    }
    this.notifService.markAsRead(n.id).subscribe(() => {
      this.loadNotifications();
      if (n.link) this.router.navigateByUrl(n.link);
    });
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe(() => this.loadNotifications());
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
