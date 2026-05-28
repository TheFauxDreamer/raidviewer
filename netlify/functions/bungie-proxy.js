// netlify/functions/bungie-proxy.js
//
// Proxies requests to the Bungie API, injecting the API key from the
// BUNGIE_API_KEY environment variable set in your Netlify site settings.
// The key is never sent to the browser.

const API_ROOT = 'https://www.bungie.net/Platform';

exports.handler = async (event) => {
  const apiKey = process.env.BUNGIE_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'BUNGIE_API_KEY environment variable is not set.' }),
    };
  }

  // The Bungie API path is passed as a query parameter, e.g. ?path=/Destiny2/...
  const bungiePathRaw = event.queryStringParameters?.path;
  if (!bungiePathRaw) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required query parameter: path' }),
    };
  }

  // Ensure only Bungie Platform paths are proxied (security guard)
  const bungiePath = decodeURIComponent(bungiePathRaw);
  if (!bungiePath.startsWith('/')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid path.' }),
    };
  }

  const url = API_ROOT + bungiePath;

  const fetchOptions = {
    method: event.httpMethod === 'POST' ? 'POST' : 'GET',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
  };

  if (fetchOptions.method === 'POST' && event.body) {
    fetchOptions.body = event.body; // already a JSON string from the browser
  }

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Failed to reach Bungie API.', detail: err.message }),
    };
  }
};
