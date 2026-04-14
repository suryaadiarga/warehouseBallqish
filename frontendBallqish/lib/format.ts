export function formatDateTimeId(value?: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('id-ID');
}

export function formatLongDateId(value = new Date()) {
  return value.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
