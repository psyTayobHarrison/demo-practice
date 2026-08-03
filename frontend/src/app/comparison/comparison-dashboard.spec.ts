import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComparisonDashboard } from './comparison-dashboard';
import { ComparisonItem } from '../models';

describe('ComparisonDashboard', () => {
  let fixture: ComponentFixture<ComparisonDashboard>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisonDashboard],
    providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ComparisonDashboard);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should render loading state initially', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading')).toBeTruthy();
    expect(compiled.querySelector('.loading')?.textContent).toContain('Loading comparison');

    // Flush the pending request
    const req = httpTesting.expectOne((r) => r.url === '/api/comparison');
    req.flush([]);
  });

  it('should show empty state for no data', () => {
    fixture.detectChanges();

    const req = httpTesting.expectOne((r) => r.url === '/api/comparison');
    req.flush([]);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading')).toBeFalsy();
    expect(compiled.querySelector('.empty')).toBeTruthy();
    expect(compiled.querySelector('.empty')?.textContent).toContain('No comparison data for this period');
  });

  it('should render comparison items with correct status classes', () => {
    const mockItems: ComparisonItem[] = [
      {
        categoryId: 1,
        categoryName: 'Groceries',
        budgetedAmount: 500,
        spentAmount: 300,
        remainingAmount: 200,
        percentUsed: 60,
        status: 'UNDER',
      },
      {
        categoryId: 2,
        categoryName: 'Entertainment',
        budgetedAmount: 100,
        spentAmount: 90,
        remainingAmount: 10,
        percentUsed: 90,
        status: 'CLOSE',
      },
      {
        categoryId: 3,
        categoryName: 'Transport',
        budgetedAmount: 200,
        spentAmount: 250,
        remainingAmount: -50,
        percentUsed: 125,
        status: 'OVER',
      },
    ];

    fixture.detectChanges();

    const req = httpTesting.expectOne((r) => r.url === '/api/comparison');
    req.flush(mockItems);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('.comparison-row');
    expect(rows.length).toBe(3);

    // Check status classes
    expect(rows[0].classList.contains('status-under')).toBe(true);
    expect(rows[1].classList.contains('status-close')).toBe(true);
    expect(rows[2].classList.contains('status-over')).toBe(true);

    // Check category names are rendered
    expect(rows[0].textContent).toContain('Groceries');
    expect(rows[1].textContent).toContain('Entertainment');
    expect(rows[2].textContent).toContain('Transport');

    // Check status badges
    const badges = compiled.querySelectorAll('.status-badge');
    expect(badges[0].textContent).toContain('Under budget');
    expect(badges[1].textContent).toContain('Close to budget');
    expect(badges[2].textContent).toContain('Over budget');
  });

  it('should call service with period parameter', () => {
    fixture.detectChanges();

    const now = new Date();
    const expectedPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const req = httpTesting.expectOne((r) => r.url === '/api/comparison');
    expect(req.request.params.get('period')).toBe(expectedPeriod);
    req.flush([]);
  });

  it('should display progress bars with correct width', () => {
    const mockItems: ComparisonItem[] = [
      {
        categoryId: 1,
        categoryName: 'Food',
        budgetedAmount: 400,
        spentAmount: 200,
        remainingAmount: 200,
        percentUsed: 50,
        status: 'UNDER',
      },
      {
        categoryId: 2,
        categoryName: 'Overspent',
        budgetedAmount: 100,
        spentAmount: 150,
        remainingAmount: -50,
        percentUsed: 150,
        status: 'OVER',
      },
    ];

    fixture.detectChanges();

    const req = httpTesting.expectOne((r) => r.url === '/api/comparison');
    req.flush(mockItems);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const progressBars = compiled.querySelectorAll('.progress-bar-fill');

    // 50% width for first item
    expect((progressBars[0] as HTMLElement).style.width).toBe('50%');
    // Capped at 100% for the over-budget item
    expect((progressBars[1] as HTMLElement).style.width).toBe('100%');
  });
});
