const sanitizePlate = (plateInput) => {
  if (!plateInput) return null;
  return plateInput.replace(/[^A-Z0-9]/gi, "").toUpperCase();
};

module.exports = { sanitizePlate };
