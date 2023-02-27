/**
 * Constants file
 */
// Asana token for API requests
const asanaKey = process.env.ASANA_TOKEN;

// Bynder token for API requests
const bynderKey = process.env.BYNDER_TOKEN;

// Base URL for Bynder API and domain
const bynderUrl = process.env.BYNDER_URL;
const bynderApiUrl = `${bynderUrl}/api`;

// Base URL for Vercel App
const vercelUrl = process.env.VERCEL_URL;

// Base URL for Asana API
const asanaApiUrl = process.env.ASANA_API_URL;

// Asana API request header
const asanaRequestHeaders = {
  Authorization: `Bearer ${asanaKey}`,
  'Content-Type': 'application/json; charset=utf-8',
};

// Bynder API request header
const bynderRequestHeaders = {
  Authorization: `Bearer ${bynderKey}`,
};

const bynderMultiPartRequestHeaders = {
  Authorization: `Bearer ${bynderKey}`,
  'Content-Type': 'multipart/form-data',
};

module.exports = {
  vercelUrl,
  asanaApiUrl,
  bynderApiUrl,
  bynderUrl,
  asanaRequestHeaders,
  bynderRequestHeaders,
  bynderMultiPartRequestHeaders,
};
