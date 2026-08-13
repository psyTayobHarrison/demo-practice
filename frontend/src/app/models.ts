export interface Category {
  id: number;
  name: string;
}

export interface Expense {
  id: number;
  amount: number;
  date: string;
  description: string | null;
  categoryId: number;
}

export interface ExpenseRequest {
  amount: number;
  date: string;
  description: string | null;
  categoryId: number;
}
