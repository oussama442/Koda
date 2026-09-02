import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { ProjectFormComponent } from './project-form';

describe('ProjectFormComponent schema requirements', () => {
  let fixture: ComponentFixture<ProjectFormComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ProjectFormComponent);
    fixture.detectChanges();
    http.expectOne(request => request.url.endsWith('/api/applications')).flush([{ id: 7, name: 'Application Koda' }]);
    http.expectOne(request => request.url.endsWith('/api/users')).flush([{ id: 12, full_name: 'Responsable', username: 'responsable' }]);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    try {
      http.verify();
    } finally {
      TestBed.resetTestingModule();
      vi.restoreAllMocks();
    }
  });

  async function select(controlName: string, index: number) {
    const input = fixture.nativeElement.querySelector(`select[formControlName="${controlName}"]`) as HTMLSelectElement;
    input.selectedIndex = index;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('refuses a project without an application even when a manager is selected', () => {
    const component = fixture.componentInstance;
    component.form.patchValue({ name: 'Projet sans application', chef_projet_id: 12 });
    component.onSubmit();

    expect(component.form.get('application_id')?.hasError('required')).toBe(true);
    http.expectNone(request => request.method === 'POST');
  });

  it('submits a numeric application ID with SQL nulls for the optional manager and dates', async () => {
    fixture.componentInstance.form.patchValue({ name: 'Projet minimal' });
    await select('application_id', 1);

    expect(fixture.componentInstance.form.valid).toBe(true);
    expect(fixture.componentInstance.form.value.application_id).toBe(7);
    fixture.componentInstance.onSubmit();

    const request = http.expectOne(request => request.url.endsWith('/api/projects') && request.method === 'POST');
    expect(request.request.body).toMatchObject({
      application_id: 7,
      chef_projet_id: null,
      start_date: null,
      end_date: null,
    });
    request.flush({ id: 1 });
  });

  it('keeps selected manager IDs numeric and clearing a manager restores null', async () => {
    fixture.componentInstance.form.patchValue({ name: 'Projet' });
    await select('application_id', 1);
    await select('chef_projet_id', 1);
    expect(fixture.componentInstance.form.value.chef_projet_id).toBe(12);

    await select('chef_projet_id', 0);
    expect(fixture.componentInstance.form.value.chef_projet_id).toBeNull();
    expect(fixture.componentInstance.form.valid).toBe(true);
  });
});
