import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComparisonService } from './comparison.service';
import { ComparisonItem } from '../models';

@Component({
  selector: 'app-comparison-dashboard',
  standalone: true,
  imports: [FormsModule, DecimalPipe, PercentPipe],
  templateUrl: './comparison-dashboard.html',
  styleUrl: './comparison-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparisonDashboard implements OnInit {
  private readonly comparisonService = inject(ComparisonService);

  protected readonly items = signal<ComparisonItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly period = signal(this.getCurrentPeriod());

  ngOnInit(): void {
    this.loadComparison();
  }

  protected loadComparison(): void {
    this.loading.set(true);
    this.comparisonService.getComparison(this.period()).subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load comparison data.');
        this.loading.set(false);
      },
    });
  }

  protected statusClass(status: string): string {
    switch (status) {
      case 'UNDER':
        return 'status-under';
      case 'CLOSE':
        return 'status-close';
      case 'OVER':
        return 'status-over';
      default:
        return '';
    }
  }

  protected progressWidth(percentUsed: number): number {
    return Math.min(percentUsed, 100);
  }

  protected statusLabel(status: string): string {
    switch (status) {
      case 'UNDER':
        return 'Under budget';
      case 'CLOSE':
        return 'Close to budget';
      case 'OVER':
        return 'Over budget';
      default:
        return status;
    }
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
