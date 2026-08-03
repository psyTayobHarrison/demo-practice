export interface Category {
  id: number;
  name: string;
}

export interface Expense {
  id: number;
  amount: number;
  categoryId: number;
  categoryName?: string;
  date: string; // ISO-8601 yyyy-MM-dd
  description: string;
}

export interface Budget {
  id: number;
  categoryId: number;
  categoryName?: string;
  amount: number;
  period: string; // yyyy-MM
}

export interface ComparisonItem {
  categoryId: number;
  categoryName: string;
  budgetedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentUsed: number;
  status: 'UNDER' | 'CLOSE' | 'OVER';
}
