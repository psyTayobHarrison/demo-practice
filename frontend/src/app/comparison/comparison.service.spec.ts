import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComparisonService } from './comparison.service';
import { ComparisonItem } from '../models';

describe('ComparisonService', () => {
  let service: ComparisonService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ComparisonService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getComparison', () => {
    it('should send a GET request to /api/comparison with period query param', () => {
      const mockItems: ComparisonItem[] = [
        {
          categoryId: 1,
          categoryName: 'Groceries',
          budgetedAmount: 500,
          spentAmount: 350,
          remainingAmount: 150,
          percentUsed: 70,
          status: 'UNDER',
        },
        {
          categoryId: 2,
          categoryName: 'Rent',
          budgetedAmount: 1200,
          spentAmount: 1200,
          remainingAmount: 0,
          percentUsed: 100,
          status: 'CLOSE',
        },
        {
          categoryId: 3,
          categoryName: 'Entertainment',
          budgetedAmount: 100,
          spentAmount: 150,
          remainingAmount: -50,
          percentUsed: 150,
          status: 'OVER',
        },
      ];

      service.getComparison('2026-08').subscribe((items) => {
        expect(items).toEqual(mockItems);
        expect(items.length).toBe(3);
      });

      const req = httpTesting.expectOne((r) => r.url === '/api/comparison');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('period')).toBe('2026-08');
      req.flush(mockItems);
    });

    it('should correctly pass different period values', () => {
      service.getComparison('2025-12').subscribe();

      const req = httpTesting.expectOne((r) => r.url === '/api/comparison');
      expect(req.request.params.get('period')).toBe('2025-12');
      req.flush([]);
    });
  });
});
