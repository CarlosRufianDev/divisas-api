function buildFilters(query) {
  const { from, to, minAmount, maxAmount, startDate, endDate } = query;
  const filters = {};

  if (from && typeof from === 'string') {
    filters.from = from.toUpperCase();
  }

  if (to && typeof to === 'string') {
    filters.to = to.toUpperCase();
  }

  if (!isNaN(minAmount)) {
    filters.amount = { ...filters.amount, $gte: Number(minAmount) };
  }

  if (!isNaN(maxAmount)) {
    filters.amount = { ...filters.amount, $lte: Number(maxAmount) };
  }

  if (!isNaN(Date.parse(startDate))) {
    filters.createdAt = { ...filters.createdAt, $gte: new Date(startDate) };
  }

  if (!isNaN(Date.parse(endDate))) {
    filters.createdAt = { ...filters.createdAt, $lte: new Date(endDate) };
  }

  return filters;
}

module.exports = buildFilters;
