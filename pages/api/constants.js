/**
 * Constants file
 */
const asanaKey = process.env.ASANA_TOKEN;

// Asana API request header
const asanaRequestHeaders = {
  Authorization: `Bearer ${asanaKey}`,
  'Content-Type': 'application/json; charset=utf-8',
  Cookie: 'TooBusyRedirectCount=0',
};

module.exports = asanaRequestHeaders;
