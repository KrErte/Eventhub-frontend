import { HttpErrorResponse } from '@angular/common/http';
import { FieldTree, ValidationError } from '@angular/forms/signals';

/** RFC 9457 problem details as returned by the API (`application/problem+json`). */
export interface ProblemDetail {
  title?: string;
  status?: number;
  detail?: string;
  /** Field errors: field name → message (400 validation, some 409 conflicts). */
  errors?: Record<string, string>;
  [property: string]: unknown;
}

/** First error message of a field, shown only after the user has touched it or tried to submit. */
export function fieldError<T>(field: FieldTree<T>): string | null {
  const state = field();
  if (!state.touched() || !state.invalid()) {
    return null;
  }
  return state.errors()[0]?.message ?? null;
}

/** The problem details body of a failed API call, if there is one. */
export function problemOf(error: unknown): ProblemDetail | null {
  return error instanceof HttpErrorResponse && error.error && typeof error.error === 'object'
    ? (error.error as ProblemDetail)
    : null;
}

/**
 * Maps the API's `errors` (`field → message`) onto form fields, for use as the result of `submit()`.
 * Returns an empty list when the response has no errors for any of the given fields.
 */
export function serverFieldErrors<T extends object>(
  error: unknown,
  form: FieldTree<T>,
  fieldNames: readonly (keyof T & string)[],
): ValidationError.WithOptionalFieldTree[] {
  const errors = problemOf(error)?.errors ?? {};
  return fieldNames
    .filter((name) => typeof errors[name] === 'string')
    .map((name) => ({
      kind: 'server',
      message: errors[name],
      fieldTree: (form as Record<string, FieldTree<unknown>>)[name],
    }));
}
