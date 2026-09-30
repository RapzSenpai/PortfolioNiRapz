/** A value the user has not filled in yet. Unfilled values are written as a
 *  literal marker in src/data/*.ts and listed by scripts/check-todo.mjs.
 *  Optional fields should be omitted rather than set to the marker, so treat
 *  undefined and the marker alike.
 *
 *  Note: this file must not contain the marker text itself, the todo scanner
 *  greps source for it and would report this comment as a missing field. */
export function isPlaceholder(value: string | undefined): value is undefined {
  return value === undefined || value.startsWith("TODO(")
}
