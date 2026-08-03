import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense } from '../models';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/expenses';

  getAll(period?: string): Observable<Expense[]> {
    let params = new HttpParams();
    if (period) {
      params = params.set('period', period);
    }
    return this.http.get<Expense[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.baseUrl}/${id}`);
  }

  create(expense: Partial<Expense>): Observable<Expense> {
    return this.http.post<Expense>(this.baseUrl, expense);
  }

  update(id: number, expense: Partial<Expense>): Observable<Expense> {
    return this.http.put<Expense>(`${this.baseUrl}/${id}`, expense);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
