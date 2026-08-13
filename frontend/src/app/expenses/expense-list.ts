import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ExpenseService } from './expense.service';
import { CategoryService } from '../categories/category.service';
import { Expense } from '../models';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseList implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);

  protected readonly expenses = signal<Expense[]>([]);
  protected readonly categories = signal<Map<number, string>>(new Map());
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly deletingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    forkJoin({
      expenses: this.expenseService.getAll(),
      categories: this.categoryService.getAll(),
    }).subscribe({
      next: ({ expenses, categories }) => {
        this.expenses.set(expenses);
        const map = new Map<number, string>();
        for (const cat of categories) {
          map.set(cat.id, cat.name);
        }
        this.categories.set(map);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load expenses.');
        this.loading.set(false);
      },
    });
  }

  getCategoryName(id: number): string {
    return this.categories().get(id) ?? 'Unknown';
  }

  deleteExpense(id: number): void {
    if (!confirm('Are you sure you want to delete this item?')) return;

    this.deletingId.set(id);
    this.expenseService.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.loadData();
      },
      error: () => {
        this.deletingId.set(null);
        this.error.set('Failed to delete expense.');
      },
    });
  }
}
