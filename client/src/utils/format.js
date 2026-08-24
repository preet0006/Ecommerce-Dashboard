export function formatValue(value, format) {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (format === 'percent') return `${value}%`;
  return value;
}
