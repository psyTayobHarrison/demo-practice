import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CategoryService } from './category.service';
import { FieldError, parseServerErrors } from '../shared/error-utils';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryForm implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly editId = signal<number | null>(null);
  protected readonly isEditMode = computed(() => this.editId() !== null);
  protected readonly name = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly loadingData = signal(false);
  protected readonly fieldErrors = signal<FieldError[]>([]);
  protected readonly generalError = signal<string | null>(null);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.editId.set(id);
      this.loadingData.set(true);
      this.categoryService.getById(id).subscribe({
        next: (category) => {
          this.name.set(category.name);
          this.loadingData.set(false);
        },
        error: () => {
          this.error.set('Failed to load category.');
          this.loadingData.set(false);
        },
      });
    }
  }

  submit(): void {
    this.fieldErrors.set([]);
    this.generalError.set(null);

    const nameValue = this.name().trim();
    if (!nameValue) {
      this.error.set('Category name is required.');
      return;
    }

    this.error.set(null);
    this.submitting.set(true);

    const request$ = this.isEditMode()
      ? this.categoryService.update(this.editId()!, { name: nameValue })
      : this.categoryService.create({ name: nameValue });

    request$.subscribe({
      next: () => this.router.navigate(['/categories']),
      error: (err: HttpErrorResponse) => {
        const parsed = parseServerErrors(err);
        this.fieldErrors.set(parsed.fieldErrors);
        this.generalError.set(parsed.generalError);
        if (!parsed.fieldErrors.length && !parsed.generalError) {
          this.error.set(this.isEditMode() ? 'Failed to update category.' : 'Failed to create category.');
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
