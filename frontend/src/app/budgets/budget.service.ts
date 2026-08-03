import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Budget } from '../models';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/budgets';

  getAll(period?: string): Observable<Budget[]> {
    let params = new HttpParams();
    if (period) {
      params = params.set('period', period);
    }
    return this.http.get<Budget[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.baseUrl}/${id}`);
  }

  create(budget: Partial<Budget>): Observable<Budget> {
    return this.http.post<Budget>(this.baseUrl, budget);
  }

  update(id: number, budget: Partial<Budget>): Observable<Budget> {
    return this.http.put<Budget>(`${this.baseUrl}/${id}`, budget);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
