import { HttpErrorResponse } from '@angular/common/http';

export interface FieldError {
  field: string;
  message: string;
}

export function parseServerErrors(err: HttpErrorResponse): { fieldErrors: FieldError[]; generalError: string | null } {
  const body = err.error;
  if (body?.errors && Array.isArray(body.errors)) {
    return { fieldErrors: body.errors, generalError: null };
  }
  if (body?.message) {
    return { fieldErrors: [], generalError: body.message };
  }
  return { fieldErrors: [], generalError: 'An unexpected error occurred.' };
}
