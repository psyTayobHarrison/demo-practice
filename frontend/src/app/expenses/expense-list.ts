import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from './expense.service';
import { Expense } from '../models';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseList implements OnInit {
  private readonly expenseService = inject(ExpenseService);

  protected readonly expenses = signal<Expense[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly period = signal(this.getCurrentPeriod());
  protected readonly deletingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadExpenses();
  }

  protected loadExpenses(): void {
    this.loading.set(true);
    this.expenseService.getAll(this.period()).subscribe({
      next: (data) => {
        this.expenses.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load expenses.');
        this.loading.set(false);
      },
    });
  }

  deleteExpense(id: number): void {
    if (!confirm('Are you sure you want to delete this item?')) return;

    this.deletingId.set(id);
    this.expenseService.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.loadExpenses();
      },
      error: () => {
        this.deletingId.set(null);
        this.error.set('Failed to delete expense.');
      },
    });
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
