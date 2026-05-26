// Netlify serverless function — proxies Bungie API requests with the API key
// Called as: /.netlify/functions/bungie-api?action=searchPlayer&displayName=...&displayNameCode=...

const BUNGIE_ROOT = 'https://www.bungie.net/Platform';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const { action, ...params } = event.queryStringParameters || {};
    const apiKey = process.env.BUNGIE_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'BUNGIE_API_KEY environment variable not set' }),
      };
    }

    let url = '';
    const bungieHeaders = { 'X-API-Key': apiKey };

    switch (action) {
      case 'searchPlayer': {
        const { displayName, displayNameCode } = params;
        if (!displayName || !displayNameCode) {
          return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing displayName or displayNameCode' }) };
        }
        url = `${BUNGIE_ROOT}/Destiny2/SearchDestinyPlayerByBungieName/All/`;
        break;
      }
      case 'profile': {
        const { membershipType, membershipId, components } = params;
        if (!membershipType || !membershipId) {
          return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing membershipType or membershipId' }) };
        }
        const comps = components || '100,200';
        url = `${BUNGIE_ROOT}/Destiny2/${membershipType}/Profile/${membershipId}/?components=${comps}`;
        break;
      }
      case 'activityHistory': {
        const { membershipType, membershipId, characterId, count, mode, page } = params;
        if (!membershipType || !membershipId || !characterId) {
          return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing membershipType, membershipId, or characterId' }) };
        }
        const c = count || '250';
        const m = mode || '4';
        const p = page || '0';
        url = `${BUNGIE_ROOT}/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?count=${c}&mode=${m}&page=${p}`;
        break;
      }
      case 'pgcr': {
        const { instanceId } = params;
        if (!instanceId) {
          return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing instanceId' }) };
        }
        url = `${BUNGIE_ROOT}/Destiny2/Stats/PostGameCarnageReport/${instanceId}/`;
        break;
      }
      // --- Destiny 1 endpoints ---
      case 'd1Profile': {
        const { membershipType, membershipId } = params;
        if (!membershipType || !membershipId) {
          return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing membershipType or membershipId' }) };
        }
        url = `${BUNGIE_ROOT}/Destiny/${membershipType}/Account/${membershipId}/`;
        break;
      }
      case 'd1ActivityHistory': {
        const { membershipType, membershipId, characterId, count, page } = params;
        if (!membershipType || !membershipId || !characterId) {
          return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing membershipType, membershipId, or characterId' }) };
        }
        const c = count || '250';
        const p = page || '0';
        url = `${BUNGIE_ROOT}/Destiny/Stats/ActivityHistory/${membershipType}/${membershipId}/${characterId}/?mode=Raid&count=${c}&page=${p}`;
        break;
      }
      case 'd1Pgcr': {
        const { instanceId } = params;
        if (!instanceId) {
          return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing instanceId' }) };
        }
        url = `${BUNGIE_ROOT}/Destiny/Stats/PostGameCarnageReport/${instanceId}/`;
        break;
      }
      // --- Linked profiles (cross-save / D1 accounts) ---
      case 'linkedProfiles': {
        const { membershipType, membershipId } = params;
        if (!membershipType || !membershipId) {
          return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing membershipType or membershipId' }) };
        }
        url = `${BUNGIE_ROOT}/Destiny2/${membershipType}/Profile/${membershipId}/LinkedProfiles/`;
        break;
      }
      default:
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Unknown action: ${action}` }),
        };
    }

    const fetch = (await import('node-fetch')).default;
    const resp = await fetch(url, { headers: bungieHeaders });
    const data = await resp.json();

    return {
      statusCode: resp.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
