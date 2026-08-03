import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BudgetService } from './budget.service';
import { CategoryService } from '../categories/category.service';
import { Category } from '../models';
import { FieldError, parseServerErrors } from '../shared/error-utils';

@Component({
  selector: 'app-budget-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './budget-form.html',
  styleUrl: './budget-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetForm implements OnInit {
  private readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly editId = signal<number | null>(null);
  protected readonly isEditMode = computed(() => this.editId() !== null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly amount = signal<number | null>(null);
  protected readonly categoryId = signal<number | null>(null);
  protected readonly period = signal(this.getCurrentPeriod());
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
      this.budgetService.getById(id).subscribe({
        next: (budget) => {
          this.amount.set(budget.amount);
          this.categoryId.set(budget.categoryId);
          this.period.set(budget.period);
          this.loadingData.set(false);
        },
        error: () => {
          this.error.set('Failed to load budget.');
          this.loadingData.set(false);
        },
      });
    }
  }

  submit(): void {
    this.fieldErrors.set([]);
    this.generalError.set(null);

    if (!this.amount() || !this.categoryId() || !this.period()) {
      this.error.set('All fields are required.');
      return;
    }

    this.error.set(null);
    this.submitting.set(true);
    const payload = {
      amount: this.amount()!,
      categoryId: this.categoryId()!,
      period: this.period(),
    };

    const request$ = this.isEditMode()
      ? this.budgetService.update(this.editId()!, payload)
      : this.budgetService.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/budgets']),
      error: (err: HttpErrorResponse) => {
        const parsed = parseServerErrors(err);
        this.fieldErrors.set(parsed.fieldErrors);
        this.generalError.set(parsed.generalError);
        if (!parsed.fieldErrors.length && !parsed.generalError) {
          this.error.set(this.isEditMode() ? 'Failed to update budget.' : 'Failed to create budget.');
        }
        this.submitting.set(false);
      },
    });
  }

  protected getFieldError(field: string): string | null {
    const found = this.fieldErrors().find((e) => e.field === field);
    return found ? found.message : null;
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
