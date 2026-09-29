export function formatDate(input) {
  const date = Temporal.PlainDate.from(input);
  return `${date.month}/${date.day}/${date.year}`;
}
