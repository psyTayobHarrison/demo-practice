import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from './expense.service';
import { CategoryService } from '../categories/category.service';
import { Category, ExpenseRequest } from '../models';
import { FieldError, parseServerErrors } from '../shared/error-utils';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseForm implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly editId = signal<number | null>(null);
  protected readonly isEditMode = computed(() => this.editId() !== null);
  protected readonly amount = signal<number | null>(null);
  protected readonly date = signal(new Date().toISOString().slice(0, 10));
  protected readonly description = signal<string | null>(null);
  protected readonly categoryId = signal<number | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly loadingData = signal(false);
  protected readonly fieldErrors = signal<FieldError[]>([]);
  protected readonly generalError = signal<string | null>(null);

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.error.set('Failed to load categories.'),
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.editId.set(id);
      this.loadingData.set(true);
      this.expenseService.getById(id).subscribe({
        next: (expense) => {
          this.amount.set(expense.amount);
          this.date.set(expense.date);
          this.description.set(expense.description);
          this.categoryId.set(expense.categoryId);
          this.loadingData.set(false);
        },
        error: () => {
          this.error.set('Failed to load expense.');
          this.loadingData.set(false);
        },
      });
    }
  }

  submit(): void {
    this.fieldErrors.set([]);
    this.generalError.set(null);
    this.error.set(null);

    if (!this.amount() || this.amount()! <= 0) {
      this.error.set('Amount must be greater than 0.');
      return;
    }

    if (!this.categoryId()) {
      this.error.set('Please select a category.');
      return;
    }

    this.submitting.set(true);

    const req: ExpenseRequest = {
      amount: this.amount()!,
      date: this.date(),
      description: this.description() || null,
      categoryId: this.categoryId()!,
    };

    const request$ = this.isEditMode()
      ? this.expenseService.update(this.editId()!, req)
      : this.expenseService.create(req);

    request$.subscribe({
      next: () => this.router.navigate(['/expenses']),
      error: (err: HttpErrorResponse) => {
        const parsed = parseServerErrors(err);
        this.fieldErrors.set(parsed.fieldErrors);
        this.generalError.set(parsed.generalError);
        if (!parsed.fieldErrors.length && !parsed.generalError) {
          this.error.set(
            this.isEditMode() ? 'Failed to update expense.' : 'Failed to create expense.',
          );
        }
        this.submitting.set(false);
      },
    });
  }

  protected getFieldError(field: string): string | null {
    const found = this.fieldErrors().find((e) => e.field === field);
    return found ? found.message : null;
  }
}
