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
import { Category } from '../models';
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
  protected readonly date = signal('');
  protected readonly description = signal('');
  protected readonly categoryId = signal<number | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly loadingData = signal(false);
  protected readonly fieldErrors = signal<FieldError[]>([]);
  protected readonly generalError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadingData.set(true);

    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories.set(data);
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
          const id = Number(idParam);
          this.editId.set(id);
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
        } else {
          this.loadingData.set(false);
        }
      },
      error: () => {
        this.error.set('Failed to load categories.');
        this.loadingData.set(false);
      },
    });
  }

  submit(): void {
    this.fieldErrors.set([]);
    this.generalError.set(null);

    if (!this.amount() || !this.date() || !this.categoryId()) {
      this.error.set('Amount, date, and category are required.');
      return;
    }

    this.error.set(null);
    this.submitting.set(true);

    const payload = {
      amount: this.amount(),
      date: this.date(),
      description: this.description(),
      categoryId: this.categoryId(),
    };

    const request$ = this.isEditMode()
      ? this.expenseService.update(this.editId()!, payload)
      : this.expenseService.create(payload);

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
