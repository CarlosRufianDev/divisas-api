function buildFilters(query, userId) {
  const { from, to, minAmount, maxAmount, startDate, endDate } = query;
  const filters = { user: userId };

  if (from) filters.from = from.toUpperCase();
  if (to) filters.to = to.toUpperCase();
  if (minAmount) filters.amount = { ...filters.amount, $gte: Number(minAmount) };
  if (maxAmount) filters.amount = { ...filters.amount, $lte: Number(maxAmount) };
  if (startDate || endDate) {
    filters.date = {};
    if (startDate) filters.date.$gte = startDate;
    if (endDate) filters.date.$lte = endDate;
  }

  return filters;
}

module.exports = buildFilters;
