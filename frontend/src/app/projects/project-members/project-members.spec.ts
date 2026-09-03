import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProjectMembersComponent } from './project-members';

describe('ProjectMembersComponent scoped member options', () => {
  let fixture: ComponentFixture<ProjectMembersComponent>;
  let http: HttpTestingController;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const chef = { id: 7, full_name: 'Chef désigné', role: 'User', is_global_admin: 0 };
  const admin = { id: 1, full_name: 'Administrateur', role: 'Admin', is_global_admin: 1 };
  const options = {
    users: [{ id: 24, full_name: 'Collaboratrice exemple' }],
    roles: [{ id: 3, role_name: 'Dev' }],
  };

  beforeEach(async () => {
    localStorage.removeItem('koda_user');
    params = new BehaviorSubject(convertToParamMap({ id: '11' }));
    await TestBed.configureTestingModule({
      imports: [ProjectMembersComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try {
      http.verify();
    } finally {
      TestBed.resetTestingModule();
      localStorage.removeItem('koda_user');
    }
  });

  function open(user = chef) {
    TestBed.inject(AuthService).updateCurrentUser(user);
    fixture = TestBed.createComponent(ProjectMembersComponent);
    fixture.detectChanges();
  }

  function flushProject(id = 11, manager = 7) {
    http.expectOne(request => request.url.endsWith(`/api/projects/${id}`))
      .flush({ id, name: `Projet ${id}`, chef_projet_id: manager, chef_projet_name: 'Chef désigné' });
    http.expectOne(request => request.url.endsWith(`/api/project-members/${id}`)).flush([]);
    fixture.detectChanges();
  }

  function flushOptions(id = 11) {
    http.expectOne(request => request.url.endsWith(`/api/project-members/${id}/options`)).flush(options);
    fixture.detectChanges();
  }

  function addButton(): HTMLButtonElement | undefined {
    return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.trim() === 'Ajouter');
  }

  async function chooseMember() {
    const userTrigger = fixture.nativeElement.querySelector('[aria-label="Choisir un collaborateur"]') as HTMLButtonElement;
    userTrigger.click();
    fixture.detectChanges();
    const userOption = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.trim().endsWith(options.users[0].full_name));
    expect(userOption).toBeDefined();
    userOption!.click();
    fixture.detectChanges();

    const roleTrigger = fixture.nativeElement.querySelector('[aria-label="Choisir un rôle"]') as HTMLButtonElement;
    roleTrigger.click();
    fixture.detectChanges();
    const roleOption = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.trim() === options.roles[0].role_name);
    expect(roleOption).toBeDefined();
    roleOption!.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function expectNoGlobalLists() {
    http.expectNone(request => /\/api\/(users|roles)$/.test(request.url));
  }

  it('lets the designated non-admin Chef choose and add a member using only scoped options', async () => {
    open();
    expectNoGlobalLists();
    http.expectNone(request => request.url.endsWith('/options'));

    flushProject();
    expect(addButton()?.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Chargement des collaborateurs et des rôles');
    flushOptions();
    expect(addButton()?.disabled).toBe(true);
    await chooseMember();
    expect(addButton()?.disabled).toBe(false);
    addButton()!.click();
    fixture.detectChanges();
    expect(addButton()?.disabled).toBe(true);

    const request = http.expectOne(request => request.method === 'POST' && request.url.endsWith('/api/project-members'));
    expect(request.request.body).toEqual({ project_id: 11, user_id: 24, role_id: 3 });
    request.flush({ message: 'Membre ajouté' });
    flushProject();
    flushOptions();
    expect(fixture.componentInstance.selectedUserId).toBeNull();
    expect(fixture.componentInstance.selectedRoleId).toBeNull();
    expectNoGlobalLists();
  });

  it('loads scoped options for an administrator who is not the designated Chef', () => {
    open(admin);
    flushProject(11, 99);
    flushOptions();
    expect(fixture.componentInstance.canManage()).toBe(true);
    expect(addButton()).toBeDefined();
    expectNoGlobalLists();
  });

  it('does not request options or global lists for a nonmanager', () => {
    open();
    flushProject(11, 99);
    http.expectNone(request => request.url.endsWith('/options'));
    expectNoGlobalLists();
    expect(addButton()).toBeUndefined();
    fixture.componentInstance.addMember();
    http.expectNone(request => request.method === 'POST');
  });

  it('clears previous project choices and cancels obsolete option requests when the route changes', async () => {
    open();
    flushProject();
    flushOptions();
    await chooseMember();

    params.next(convertToParamMap({ id: '12' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.project()).toBeNull();
    expect(fixture.componentInstance.selectedUserId).toBeNull();
    expect(fixture.componentInstance.selectedRoleId).toBeNull();
    expect(addButton()).toBeUndefined();
    flushProject(12);
    const obsoleteOptions = http.expectOne(request => request.url.endsWith('/api/project-members/12/options'));

    params.next(convertToParamMap({ id: '13' }));
    fixture.detectChanges();
    expect(obsoleteOptions.cancelled).toBe(true);
    flushProject(13, 99);
    expect(fixture.componentInstance.canManage()).toBe(false);
    expect(fixture.componentInstance.getSelectedUserName()).toBeUndefined();
    expect(fixture.componentInstance.getSelectedRoleName()).toBeUndefined();
    expect(fixture.nativeElement.textContent).not.toContain(options.users[0].full_name);
    http.expectNone(request => request.url.endsWith('/api/project-members/13/options'));
    expectNoGlobalLists();
  });

  it('cancels an old project response before deciding whether options may be loaded', () => {
    open(admin);
    const oldProject = http.expectOne(request => request.url.endsWith('/api/projects/11'));
    const oldMembers = http.expectOne(request => request.url.endsWith('/api/project-members/11'));
    params.next(convertToParamMap({ id: '12' }));
    fixture.detectChanges();
    expect(oldProject.cancelled).toBe(true);
    expect(oldMembers.cancelled).toBe(true);
    flushProject(12);
    flushOptions(12);
    expect(fixture.componentInstance.project().id).toBe(12);
    http.expectNone(request => request.url.endsWith('/api/project-members/11/options'));
    expectNoGlobalLists();
  });

  it('shows an options-loading error without falling back to Admin-only endpoints', async () => {
    open();
    flushProject();
    http.expectOne(request => request.url.endsWith('/api/project-members/11/options'))
      .flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les collaborateurs et les rôles');
    expect(addButton()?.disabled).toBe(true);
    expect((fixture.nativeElement.querySelector('[aria-label="Choisir un collaborateur"]') as HTMLButtonElement).disabled).toBe(true);
    expectNoGlobalLists();
  });

  it('does not load options after a project-loading failure, including for Admin', async () => {
    open(admin);
    http.expectOne(request => request.url.endsWith('/api/projects/11'))
      .flush({}, { status: 404, statusText: 'Not Found' });
    http.expectOne(request => request.url.endsWith('/api/project-members/11')).flush([]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger le projet');
    expect(addButton()).toBeUndefined();
    http.expectNone(request => request.url.endsWith('/options'));
    expectNoGlobalLists();
  });
});
