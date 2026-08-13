import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'categories', pathMatch: 'full' },
  {
    path: 'categories',
    loadComponent: () => import('./categories/category-list').then((m) => m.CategoryList),
  },
  {
    path: 'categories/edit/:id',
    loadComponent: () => import('./categories/category-form').then((m) => m.CategoryForm),
  },
  {
    path: 'categories/new',
    loadComponent: () => import('./categories/category-form').then((m) => m.CategoryForm),
  },
];
