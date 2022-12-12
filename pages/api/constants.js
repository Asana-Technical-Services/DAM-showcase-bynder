/**
 * Constants file
 */
const asanaKey = process.env.ASANA_TOKEN;

// Base URL for Vercel App
const vercelUrl = process.env.VERCEL_URL;

// Base URL for Asana API
const asanaApiUrl = process.env.ASANA_API_URL;

// Asana API request header
const asanaRequestHeaders = {
  Authorization: `Bearer ${asanaKey}`,
  'Content-Type': 'application/json; charset=utf-8',
  Cookie: 'TooBusyRedirectCount=0',
};

module.exports = {
  vercelUrl,
  asanaApiUrl,
  asanaRequestHeaders,
};
