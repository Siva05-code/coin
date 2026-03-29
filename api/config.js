const allowedConfig = {
  APP_NAME: process.env.APP_NAME || "CoinCoach",
  APP_ENV: process.env.APP_ENV || "development",
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "support@example.com",
  HAS_API_KEY: Boolean(process.env.API_KEY)
};

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(allowedConfig);
};
