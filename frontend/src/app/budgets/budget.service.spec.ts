import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BudgetService } from './budget.service';
import { Budget } from '../models';

describe('BudgetService', () => {
  let service: BudgetService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BudgetService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getAll', () => {
    it('should send a GET request to /api/budgets without params when no period', () => {
      const mockBudgets: Budget[] = [
        { id: 1, categoryId: 1, amount: 500, period: '2026-08' },
      ];

      service.getAll().subscribe((budgets) => {
        expect(budgets).toEqual(mockBudgets);
      });

      const req = httpTesting.expectOne('/api/budgets');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('period')).toBe(false);
      req.flush(mockBudgets);
    });

    it('should send a GET request with period query param when period is provided', () => {
      const mockBudgets: Budget[] = [
        { id: 1, categoryId: 1, categoryName: 'Groceries', amount: 500, period: '2026-07' },
      ];

      service.getAll('2026-07').subscribe((budgets) => {
        expect(budgets).toEqual(mockBudgets);
      });

      const req = httpTesting.expectOne((r) => r.url === '/api/budgets');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('period')).toBe('2026-07');
      req.flush(mockBudgets);
    });
  });

  describe('getById', () => {
    it('should send a GET request to /api/budgets/:id', () => {
      const mockBudget: Budget = { id: 2, categoryId: 3, amount: 200, period: '2026-08' };

      service.getById(2).subscribe((budget) => {
        expect(budget).toEqual(mockBudget);
      });

      const req = httpTesting.expectOne('/api/budgets/2');
      expect(req.request.method).toBe('GET');
      req.flush(mockBudget);
    });
  });

  describe('create', () => {
    it('should send a POST request to /api/budgets with the budget body', () => {
      const newBudget: Partial<Budget> = { categoryId: 1, amount: 300, period: '2026-08' };
      const created: Budget = { id: 4, categoryId: 1, amount: 300, period: '2026-08' };

      service.create(newBudget).subscribe((budget) => {
        expect(budget).toEqual(created);
      });

      const req = httpTesting.expectOne('/api/budgets');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newBudget);
      req.flush(created);
    });
  });

  describe('update', () => {
    it('should send a PUT request to /api/budgets/:id with the budget body', () => {
      const updated: Partial<Budget> = { amount: 600 };
      const response: Budget = { id: 1, categoryId: 1, amount: 600, period: '2026-08' };

      service.update(1, updated).subscribe((budget) => {
        expect(budget).toEqual(response);
      });

      const req = httpTesting.expectOne('/api/budgets/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updated);
      req.flush(response);
    });
  });

  describe('delete', () => {
    it('should send a DELETE request to /api/budgets/:id', () => {
      service.delete(2).subscribe();

      const req = httpTesting.expectOne('/api/budgets/2');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
