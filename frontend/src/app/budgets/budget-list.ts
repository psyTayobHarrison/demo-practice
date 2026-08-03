import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from './budget.service';
import { Budget } from '../models';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './budget-list.html',
  styleUrl: './budget-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetList implements OnInit {
  private readonly budgetService = inject(BudgetService);

  protected readonly budgets = signal<Budget[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly period = signal(this.getCurrentPeriod());
  protected readonly deletingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadBudgets();
  }

  protected loadBudgets(): void {
    this.loading.set(true);
    this.budgetService.getAll(this.period()).subscribe({
      next: (data) => {
        this.budgets.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load budgets.');
        this.loading.set(false);
      },
    });
  }

  deleteBudget(id: number): void {
    if (!confirm('Are you sure you want to delete this item?')) return;

    this.deletingId.set(id);
    this.budgetService.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.loadBudgets();
      },
      error: () => {
        this.deletingId.set(null);
        this.error.set('Failed to delete budget.');
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
