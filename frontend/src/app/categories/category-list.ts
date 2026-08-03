import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryService } from './category.service';
import { Category } from '../models';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryList implements OnInit {
  private readonly categoryService = inject(CategoryService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly deletingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load categories.');
        this.loading.set(false);
      },
    });
  }

  deleteCategory(id: number): void {
    if (!confirm('Are you sure you want to delete this item?')) return;

    this.deletingId.set(id);
    this.categoryService.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.loadCategories();
      },
      error: () => {
        this.deletingId.set(null);
        this.error.set('Failed to delete category.');
      },
    });
  }
}
