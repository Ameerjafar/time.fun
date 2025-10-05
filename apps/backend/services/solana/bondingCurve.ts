interface BondingCurveObject {
  tokensToBuy: number;
  previousTokens: number;
  previousBaseCurrency: number;
}

export const bondingCurve = ({
  tokensToBuy,
  previousTokens,
  previousBaseCurrency,
}: BondingCurveObject) => {
  if (tokensToBuy >= previousTokens) {
    throw new Error("Cannot buy more tokens than available in reserve");
  }
  if (tokensToBuy <= 0) {
    throw new Error("Token amount must be positive");
  }

  const kValue = previousTokens * previousBaseCurrency;
  const newTokenReserve = previousTokens - tokensToBuy;
  const yAfter = kValue / newTokenReserve;
  const amountPaid = yAfter - previousBaseCurrency;
  return { newBaseCurrency: yAfter, amountPaid, newTokenReserve};
};
