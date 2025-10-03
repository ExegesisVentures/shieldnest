// Shared utility functions for ShieldNest

export const formatTokenAmount = (amount: string, decimals: number): string => {
  const num = parseFloat(amount) / Math.pow(10, decimals);
  return num.toFixed(6);
};

export const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

export const truncateAddress = (address: string, start = 6, end = 4): string => {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const isValidAddress = (address: string): boolean => {
  // Basic validation for Cosmos/OSMO addresses
  return /^[a-z0-9]{39,45}$/.test(address);
};
