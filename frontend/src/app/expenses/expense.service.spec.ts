import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ExpenseService } from './expense.service';
import { Expense } from '../models';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExpenseService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getAll', () => {
    it('should send a GET request to /api/expenses without params when no period', () => {
      const mockExpenses: Expense[] = [
        { id: 1, amount: 50, categoryId: 1, date: '2026-08-01', description: 'Lunch' },
      ];

      service.getAll().subscribe((expenses) => {
        expect(expenses).toEqual(mockExpenses);
      });

      const req = httpTesting.expectOne('/api/expenses');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('period')).toBe(false);
      req.flush(mockExpenses);
    });

    it('should send a GET request with period query param when period is provided', () => {
      const mockExpenses: Expense[] = [];

      service.getAll('2026-08').subscribe((expenses) => {
        expect(expenses).toEqual(mockExpenses);
      });

      const req = httpTesting.expectOne((r) => r.url === '/api/expenses');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('period')).toBe('2026-08');
      req.flush(mockExpenses);
    });
  });

  describe('getById', () => {
    it('should send a GET request to /api/expenses/:id', () => {
      const mockExpense: Expense = {
        id: 1,
        amount: 25.5,
        categoryId: 2,
        date: '2026-07-15',
        description: 'Coffee',
      };

      service.getById(1).subscribe((expense) => {
        expect(expense).toEqual(mockExpense);
      });

      const req = httpTesting.expectOne('/api/expenses/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockExpense);
    });
  });

  describe('create', () => {
    it('should send a POST request to /api/expenses with the expense body', () => {
      const newExpense: Partial<Expense> = {
        amount: 100,
        categoryId: 1,
        date: '2026-08-03',
        description: 'Groceries',
      };
      const created: Expense = { id: 5, ...newExpense } as Expense;

      service.create(newExpense).subscribe((expense) => {
        expect(expense).toEqual(created);
      });

      const req = httpTesting.expectOne('/api/expenses');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newExpense);
      req.flush(created);
    });
  });

  describe('update', () => {
    it('should send a PUT request to /api/expenses/:id with the expense body', () => {
      const updated: Partial<Expense> = { amount: 75, description: 'Updated' };
      const response: Expense = {
        id: 1,
        amount: 75,
        categoryId: 1,
        date: '2026-08-01',
        description: 'Updated',
      };

      service.update(1, updated).subscribe((expense) => {
        expect(expense).toEqual(response);
      });

      const req = httpTesting.expectOne('/api/expenses/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updated);
      req.flush(response);
    });
  });

  describe('delete', () => {
    it('should send a DELETE request to /api/expenses/:id', () => {
      service.delete(3).subscribe();

      const req = httpTesting.expectOne('/api/expenses/3');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
