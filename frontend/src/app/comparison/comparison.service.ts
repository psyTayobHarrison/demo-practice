import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComparisonItem } from '../models';

@Injectable({ providedIn: 'root' })
export class ComparisonService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/comparison';

  getComparison(period: string): Observable<ComparisonItem[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ComparisonItem[]>(this.baseUrl, { params });
  }
}
