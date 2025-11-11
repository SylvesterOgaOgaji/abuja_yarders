export const formatCurrency = (amount: number, currency: "USD" | "NGN" = "USD") => {
  if (currency === "NGN") {
    return `₦${amount.toFixed(2)}`;
  }
  return `$${amount.toFixed(2)}`;
};

export const getCurrencySymbol = (currency: "USD" | "NGN" = "USD") => {
  return currency === "NGN" ? "₦" : "$";
};
