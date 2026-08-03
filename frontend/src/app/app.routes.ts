import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'expenses', pathMatch: 'full' },
  {
    path: 'categories',
    loadComponent: () =>
      import('./categories/category-list').then((m) => m.CategoryList),
  },
  {
    path: 'categories/edit/:id',
    loadComponent: () =>
      import('./categories/category-form').then((m) => m.CategoryForm),
  },
  {
    path: 'categories/new',
    loadComponent: () =>
      import('./categories/category-form').then((m) => m.CategoryForm),
  },
  {
    path: 'expenses',
    loadComponent: () =>
      import('./expenses/expense-list').then((m) => m.ExpenseList),
  },
  {
    path: 'expenses/edit/:id',
    loadComponent: () =>
      import('./expenses/expense-form').then((m) => m.ExpenseForm),
  },
  {
    path: 'expenses/new',
    loadComponent: () =>
      import('./expenses/expense-form').then((m) => m.ExpenseForm),
  },
  {
    path: 'budgets',
    loadComponent: () =>
      import('./budgets/budget-list').then((m) => m.BudgetList),
  },
  {
    path: 'budgets/edit/:id',
    loadComponent: () =>
      import('./budgets/budget-form').then((m) => m.BudgetForm),
  },
  {
    path: 'budgets/new',
    loadComponent: () =>
      import('./budgets/budget-form').then((m) => m.BudgetForm),
  },
  {
    path: 'comparison',
    loadComponent: () =>
      import('./comparison/comparison-dashboard').then(
        (m) => m.ComparisonDashboard,
      ),
  },
];
