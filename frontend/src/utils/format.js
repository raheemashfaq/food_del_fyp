// Central money formatter for PKR
export const formatPKR = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0, // No .00 unless you want paisa shown
    maximumFractionDigits: 0
  }).format(value);
