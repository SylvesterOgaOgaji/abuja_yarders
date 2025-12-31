export const formatCurrency = (amount: number, currency: "USD" | "NGN" = "NGN") => {
  if (currency === "NGN") {
    return `₦${amount.toFixed(2)}`;
  }
  return `$${amount.toFixed(2)}`;
};

export const getCurrencySymbol = (currency: "USD" | "NGN" = "NGN") => {
  return currency === "NGN" ? "₦" : "$";
};
