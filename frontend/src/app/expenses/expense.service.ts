import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense, ExpenseRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/expenses';

  getAll(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.baseUrl);
  }

  getById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.baseUrl}/${id}`);
  }

  create(req: ExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(this.baseUrl, req);
  }

  update(id: number, req: ExpenseRequest): Observable<Expense> {
    return this.http.put<Expense>(`${this.baseUrl}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
