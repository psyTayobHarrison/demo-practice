import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CategoryList } from './category-list';
import { Category } from '../models';

describe('CategoryList', () => {
  let fixture: ComponentFixture<CategoryList>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CategoryList);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should render loading state initially', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    expect(compiled.querySelector('.loading')).toBeTruthy();
    expect(compiled.querySelector('.loading')?.textContent).toContain('Loading categories');

    // Flush the pending request so httpTesting.verify() passes
    const req = httpTesting.expectOne('/api/categories');
    req.flush([]);
  });

  it('should render list of categories after data loads', () => {
    const mockCategories: Category[] = [
      { id: 1, name: 'Groceries' },
      { id: 2, name: 'Rent' },
      { id: 3, name: 'Transport' },
    ];

    fixture.detectChanges();

    const req = httpTesting.expectOne('/api/categories');
    req.flush(mockCategories);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading')).toBeFalsy();
    const listItems = compiled.querySelectorAll('.list-item');
    expect(listItems.length).toBe(3);
    expect(listItems[0].querySelector('.list-item-name')?.textContent).toContain('Groceries');
    expect(listItems[1].querySelector('.list-item-name')?.textContent).toContain('Rent');
    expect(listItems[2].querySelector('.list-item-name')?.textContent).toContain('Transport');
  });

  it('should render empty state when no categories', () => {
    fixture.detectChanges();

    const req = httpTesting.expectOne('/api/categories');
    req.flush([]);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading')).toBeFalsy();
    expect(compiled.querySelector('.empty')).toBeTruthy();
    expect(compiled.querySelector('.empty')?.textContent).toContain('No categories yet');
  });

  it('should call delete with confirmation', () => {
    const mockCategories: Category[] = [{ id: 1, name: 'Groceries' }];

    fixture.detectChanges();
    const loadReq = httpTesting.expectOne('/api/categories');
    loadReq.flush(mockCategories);
    fixture.detectChanges();

    // Mock window.confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const deleteButton = fixture.nativeElement.querySelector('.btn-danger') as HTMLButtonElement;
    deleteButton.click();

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this item?');

    const deleteReq = httpTesting.expectOne('/api/categories/1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);

    // After delete, it reloads categories
    const reloadReq = httpTesting.expectOne('/api/categories');
    reloadReq.flush([]);
  });

  it('should not delete when confirmation is cancelled', () => {
    const mockCategories: Category[] = [{ id: 1, name: 'Groceries' }];

    fixture.detectChanges();
    const loadReq = httpTesting.expectOne('/api/categories');
    loadReq.flush(mockCategories);
    fixture.detectChanges();

    // Mock window.confirm to return false
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const deleteButton = fixture.nativeElement.querySelector('.btn-danger') as HTMLButtonElement;
    deleteButton.click();

    expect(window.confirm).toHaveBeenCalled();
    // No DELETE request should be made
    httpTesting.expectNone('/api/categories/1');
  });
});
