import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ExpenseForm } from './expense-form';
import { Category, Expense } from '../models';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('ExpenseForm', () => {
  let fixture: ComponentFixture<ExpenseForm>;
  let httpTesting: HttpTestingController;

  function setup(routeId: string | null = null) {
    TestBed.configureTestingModule({
      imports: [ExpenseForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'expenses', component: DummyComponent }]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? routeId : null),
              },
            },
          },
        },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ExpenseForm);
  }

  afterEach(() => {
    httpTesting.verify();
  });

  describe('Create mode (no route id)', () => {
    beforeEach(() => {
      setup(null);
    });

    it('should render in create mode with heading "New Expense"', () => {
      fixture.detectChanges();

      // Flush the categories load request
      const catReq = httpTesting.expectOne('/api/categories');
      catReq.flush([{ id: 1, name: 'Groceries' }]);

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#expense-form-heading')?.textContent).toContain('New Expense');
    });

    it('should disable submit button while submitting', () => {
      const mockCategories: Category[] = [{ id: 1, name: 'Groceries' }];
      fixture.detectChanges();

      const catReq = httpTesting.expectOne('/api/categories');
      catReq.flush(mockCategories);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);

      // Fill form fields via component signals
      const component = fixture.componentInstance as any;
      component.amount.set(50);
      component.categoryId.set(1);
      component.date.set('2026-08-01');
      component.description.set('Test expense');
      fixture.detectChanges();

      // Submit the form
      const form = compiled.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(submitButton.disabled).toBe(true);
      expect(submitButton.textContent).toContain('Saving');

      // Flush the create request
      const createReq = httpTesting.expectOne('/api/expenses');
      createReq.flush({ id: 1, amount: 50, categoryId: 1, date: '2026-08-01', description: 'Test expense' });
    });

    it('should display validation errors from server', () => {
      const mockCategories: Category[] = [{ id: 1, name: 'Groceries' }];
      fixture.detectChanges();

      const catReq = httpTesting.expectOne('/api/categories');
      catReq.flush(mockCategories);
      fixture.detectChanges();

      const component = fixture.componentInstance as any;
      component.amount.set(50);
      component.categoryId.set(1);
      component.date.set('2026-08-01');
      component.description.set('Test');
      fixture.detectChanges();

      const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      // Return server validation errors
      const createReq = httpTesting.expectOne('/api/expenses');
      createReq.flush(
        { errors: [{ field: 'amount', message: 'Amount must be greater than 0' }] },
        { status: 400, statusText: 'Bad Request' }
      );

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const fieldError = compiled.querySelector('.field-error');
      expect(fieldError).toBeTruthy();
      expect(fieldError?.textContent).toContain('Amount must be greater than 0');
    });
  });

  describe('Edit mode (with route id)', () => {
    beforeEach(() => {
      setup('5');
    });

    it('should render in edit mode with heading "Edit Expense"', () => {
      fixture.detectChanges();

      // Flush categories request
      const catReq = httpTesting.expectOne('/api/categories');
      catReq.flush([{ id: 1, name: 'Groceries' }]);

      // Flush expense load request
      const expenseReq = httpTesting.expectOne('/api/expenses/5');
      const mockExpense: Expense = {
        id: 5,
        amount: 100,
        categoryId: 1,
        date: '2026-07-15',
        description: 'Existing expense',
      };
      expenseReq.flush(mockExpense);

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#expense-form-heading')?.textContent).toContain('Edit Expense');
    });

    it('should load existing expense data in edit mode', () => {
      fixture.detectChanges();

      const catReq = httpTesting.expectOne('/api/categories');
      catReq.flush([{ id: 1, name: 'Groceries' }, { id: 2, name: 'Rent' }]);

      const mockExpense: Expense = {
        id: 5,
        amount: 42.5,
        categoryId: 2,
        date: '2026-07-20',
        description: 'My expense',
      };
      const expenseReq = httpTesting.expectOne('/api/expenses/5');
      expenseReq.flush(mockExpense);

      fixture.detectChanges();

      const component = fixture.componentInstance as any;
      expect(component.amount()).toBe(42.5);
      expect(component.categoryId()).toBe(2);
      expect(component.date()).toBe('2026-07-20');
      expect(component.description()).toBe('My expense');
    });
  });
});
