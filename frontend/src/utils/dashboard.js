export const EMPTY_KPIS = {
  total_revenue: 0,
  transaction_count: 0,
  average_transaction_value: 0
};

export function buildDateParams(filters) {
  const params = {};

  if (filters.dateFrom) {
    params.date_from = filters.dateFrom;
  }

  if (filters.dateTo) {
    params.date_to = filters.dateTo;
  }

  return params;
}

export function formatCurrency(value) {
  return Number(value ?? 0).toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2
  });
}

export function formatCompactCurrency(value) {
  const numericValue = Number(value ?? 0);

  if (Math.abs(numericValue) >= 1_000_000) {
    return `₺${(numericValue / 1_000_000).toLocaleString('tr-TR', {
      maximumFractionDigits: 1
    })}M`;
  }

  if (Math.abs(numericValue) >= 1_000) {
    return `₺${(numericValue / 1_000).toLocaleString('tr-TR', {
      maximumFractionDigits: 1
    })}k`;
  }

  return `₺${numericValue.toLocaleString('tr-TR', {
    maximumFractionDigits: 0
  })}`;
}