import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { Category } from '../models';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getAll', () => {
    it('should send a GET request to /api/categories', () => {
      const mockCategories: Category[] = [
        { id: 1, name: 'Groceries' },
        { id: 2, name: 'Rent' },
      ];

      service.getAll().subscribe((categories) => {
        expect(categories).toEqual(mockCategories);
      });

      const req = httpTesting.expectOne('/api/categories');
      expect(req.request.method).toBe('GET');
      req.flush(mockCategories);
    });
  });

  describe('getById', () => {
    it('should send a GET request to /api/categories/:id', () => {
      const mockCategory: Category = { id: 1, name: 'Groceries' };

      service.getById(1).subscribe((category) => {
        expect(category).toEqual(mockCategory);
      });

      const req = httpTesting.expectOne('/api/categories/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockCategory);
    });
  });

  describe('create', () => {
    it('should send a POST request to /api/categories with the category body', () => {
      const newCategory: Partial<Category> = { name: 'Transport' };
      const created: Category = { id: 3, name: 'Transport' };

      service.create(newCategory).subscribe((category) => {
        expect(category).toEqual(created);
      });

      const req = httpTesting.expectOne('/api/categories');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCategory);
      req.flush(created);
    });
  });

  describe('update', () => {
    it('should send a PUT request to /api/categories/:id with the category body', () => {
      const updated: Partial<Category> = { name: 'Updated' };
      const response: Category = { id: 1, name: 'Updated' };

      service.update(1, updated).subscribe((category) => {
        expect(category).toEqual(response);
      });

      const req = httpTesting.expectOne('/api/categories/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updated);
      req.flush(response);
    });
  });

  describe('delete', () => {
    it('should send a DELETE request to /api/categories/:id', () => {
      service.delete(1).subscribe();

      const req = httpTesting.expectOne('/api/categories/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
