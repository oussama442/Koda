import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SharedDocumentsComponent } from './shared-documents';

describe('SharedDocumentsComponent attachment parents', () => {
  let fixture: ComponentFixture<SharedDocumentsComponent>;
  let http: HttpTestingController;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const improvements = [{ id: 42, application_id: 7, title: 'Amélioration' }];
  const projects = [
    { id: 11, application_id: 7, name: 'Projet de la même application' },
    { id: 12, application_id: 8, name: 'Projet d’une autre application' },
  ];

  beforeEach(async () => {
    params = new BehaviorSubject(convertToParamMap({ type: 'improvements', id: '42' }));
    await TestBed.configureTestingModule({
      imports: [SharedDocumentsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function open(type = 'improvements', id = '42', availableProjects = projects) {
    params.next(convertToParamMap({ type, id }));
    fixture = TestBed.createComponent(SharedDocumentsComponent);
    fixture.detectChanges();
    http.expectOne(request => request.url.endsWith(`/api/documents/${type}/${id}`)).flush([]);
    // Match optional requests so the old UI fails on missing behavior, not test setup.
    http.match(request => request.url.endsWith('/api/projects')).forEach(request => request.flush(availableProjects));
    http.match(request => request.url === '/api/improvements').forEach(request => request.flush(improvements));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function uploadInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[type="file"]');
  }

  async function chooseProject() {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select, 'improvement attachments must offer a project selector').not.toBeNull();
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function chooseFile() {
    const file = new File(['document'], 'rapport.txt', { type: 'text/plain' });
    const input = uploadInput();
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    return file;
  }

  it('shows only projects of the improvement application and waits for an explicit choice', async () => {
    await open();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.textContent).toContain(projects[0].name);
    expect(select.textContent).not.toContain(projects[1].name);
    expect(uploadInput().disabled).toBe(true);

    await chooseProject();
    expect(uploadInput().disabled).toBe(false);
  });

  it('sends both the chosen project and improvement IDs in the upload', async () => {
    await open();
    await chooseProject();
    const file = chooseFile();

    const request = http.expectOne(request => request.url.endsWith('/api/documents/upload'));
    const body = request.request.body as FormData;
    expect(body.get('file')).toBe(file);
    expect(body.get('project_id')).toBe('11');
    expect(body.get('improvement_id')).toBe('42');
    expect(body.get('task_id')).toBeNull();
    request.flush({ id: 1 });
    http.expectOne(request => request.url.endsWith('/api/documents/improvements/42')).flush([]);
  });

  it('blocks upload without a selected project even if a file change event is triggered', async () => {
    await open();
    chooseFile();
    http.expectNone(request => request.method === 'POST');
  });

  it('forwards the task ID when uploading from a task page', async () => {
    await open('tasks', '55');
    chooseFile();
    const request = http.expectOne(request => request.url.endsWith('/api/documents/upload'));
    expect((request.request.body as FormData).get('task_id')).toBe('55');
    request.flush({ id: 1 });
    http.expectOne(request => request.url.endsWith('/api/documents/tasks/55')).flush([]);
  });

  it('explains when there is no eligible project and keeps upload disabled', async () => {
    await open('improvements', '42', [projects[1]]);
    expect(uploadInput().disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Aucun projet lié à cette application');
  });

  it('displays a French message when project choices cannot be loaded', async () => {
    fixture = TestBed.createComponent(SharedDocumentsComponent);
    fixture.detectChanges();
    http.expectOne(request => request.url.endsWith('/api/documents/improvements/42')).flush([]);
    http.match(request => request.url === '/api/improvements').forEach(request => request.flush(improvements));
    http.match(request => request.url.endsWith('/api/projects')).forEach(request => request.flush({}, { status: 500, statusText: 'Server Error' }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(uploadInput().disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les projets');
  });

  it('shows upload errors and lets the user retry the same file', async () => {
    await open();
    await chooseProject();
    chooseFile();
    http.expectOne(request => request.url.endsWith('/api/documents/upload'))
      .flush({ message: 'Ce projet n’est plus disponible.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Impossible d’envoyer le fichier');
    expect(fixture.nativeElement.textContent).toContain('Ce projet n’est plus disponible.');
    expect(uploadInput().disabled).toBe(false);
    expect(uploadInput().value).toBe('');
  });

  it('clears project selection on a route change and ignores stale project requests', async () => {
    await open();
    await chooseProject();
    params.next(convertToParamMap({ type: 'improvements', id: '43' }));
    fixture.detectChanges();
    expect(uploadInput().disabled).toBe(true);
    const previousProjects = http.match(request => request.url.endsWith('/api/projects'));
    const previousImprovements = http.match(request => request.url === '/api/improvements');
    const previousDocuments = http.match(request => request.url.endsWith('/api/documents/improvements/43'));

    params.next(convertToParamMap({ type: 'improvements', id: '44' }));
    fixture.detectChanges();
    http.expectOne(request => request.url.endsWith('/api/documents/improvements/44')).flush([]);
    http.match(request => request.url.endsWith('/api/projects')).forEach(request => request.flush([{ id: 21, application_id: 9, name: 'Nouveau projet' }]));
    http.match(request => request.url === '/api/improvements').forEach(request => request.flush([{ id: 44, application_id: 9 }]));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(previousProjects.length).toBe(1);
    expect(previousProjects[0].cancelled).toBe(true);
    expect(previousImprovements[0].cancelled).toBe(true);
    expect(previousDocuments[0].cancelled).toBe(true);
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.selectedIndex).toBe(0);
    expect(select.textContent).toContain('Nouveau projet');
    expect(select.textContent).not.toContain(projects[0].name);
    expect(uploadInput().disabled).toBe(true);
  });

  it('reports a failed document listing instead of presenting it as an empty result', async () => {
    params.next(convertToParamMap({ type: 'tasks', id: '55' }));
    fixture = TestBed.createComponent(SharedDocumentsComponent);
    fixture.detectChanges();
    http.expectOne(request => request.url.endsWith('/api/documents/tasks/55'))
      .flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les documents');
    expect(fixture.nativeElement.textContent).not.toContain('Aucun document partagé');
  });

  it('displays a stored Office extension in the file badge', async () => {
    params.next(convertToParamMap({ type: 'tasks', id: '55' }));
    fixture = TestBed.createComponent(SharedDocumentsComponent);
    fixture.detectChanges();
    http.expectOne(request => request.url.endsWith('/api/documents/tasks/55'))
      .flush([{ id: 1, file_name: 'Rapport', file_format: 'docx', storage_path: 'rapport.docx' }]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('docx');
  });
});
