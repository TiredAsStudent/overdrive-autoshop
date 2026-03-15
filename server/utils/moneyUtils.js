const Decimal = require("decimal.js");

// Set global configuration for financial rounding
Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

const moneyUtils = {
  multiply: (val1, val2) => {
    return new Decimal(val1 || 0)
      .times(new Decimal(val2 || 0))
      .toDecimalPlaces(2)
      .toNumber();
  },
  add: (val1, val2) => {
    return new Decimal(val1 || 0)
      .plus(new Decimal(val2 || 0))
      .toDecimalPlaces(2)
      .toNumber();
  },
  applyMarkup: (totalAmount, markupMultiplier) => {
    return new Decimal(totalAmount || 0)
      .times(new Decimal(markupMultiplier))
      .toDecimalPlaces(2)
      .toNumber();
  },
};

module.exports = moneyUtils;
