import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Middleware for large payload images (base64 receipts)
  app.use(express.json({ limit: '25mb' }));

  // Serve public static assets (PWA manifest, service worker, icons, screenshots)
  app.use(express.static(path.resolve(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('manifest.json') || filePath.endsWith('manifest.webmanifest')) {
        res.setHeader('Content-Type', 'application/manifest+json');
      } else if (filePath.endsWith('sw.js')) {
        res.setHeader('Content-Type', 'text/javascript');
        res.setHeader('Service-Worker-Allowed', '/');
      } else if (filePath.endsWith('assetlinks.json')) {
        res.setHeader('Content-Type', 'application/json');
      }
    }
  }));

  // Google Play Store Digital Asset Links for PWABuilder / TWA verification
  app.get('/.well-known/assetlinks.json', (_req, res) => {
    res.type('application/json');
    res.sendFile(path.resolve(__dirname, 'public/.well-known/assetlinks.json'));
  });

  // AI Vision receipt / item scanner endpoint
  app.post('/api/scan-receipt', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Signal client to use pure offline local engine
        return res.status(503).json({
          error: 'No GEMINI_API_KEY available',
          fallbackToOffline: true
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a financial receipt and item scanner AI for an NYC personal finance app.
Analyze this image (which may be a store receipt, an item like a coffee/metrocard/food, an invoice, or a product).
Extract the transaction details and return ONLY a valid JSON object with this exact structure:
{
  "merchant": "Store or merchant name (e.g., 'Duane Reade', 'Joe\\'s Pizza', 'MTA OMNY', 'Target')",
  "amount": 12.34 (number, positive float),
  "category": "Food & Drink" | "Transportation" | "Shopping" | "Entertainment" | "Groceries" | "Health" | "Utilities" | "Other",
  "date": "YYYY-MM-DD",
  "type": "expense" | "income",
  "paymentMethod": "NYC Card" | "Cash" | "OMNY Card" | "Apple Pay" | "Chase Bank",
  "items": ["list of detected items with prices if available"],
  "note": "Brief description of the purchase or item recognized",
  "confidence": 0.95
}
If it is a single item (e.g. cup of coffee, subway train, pizza slice, laptop), infer a realistic NYC price and appropriate category.
Return ONLY raw JSON, with no markdown code blocks.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      const responseText = response.text || '';
      // Clean possible markdown code fences
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleaned);

      return res.json({ success: true, data: parsedData, source: 'gemini-3.8-flash' });
    } catch (err: any) {
      console.error('Scan error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to scan image',
        fallbackToOffline: true,
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', localOnly: true, timestamp: new Date().toISOString() });
  });

  // Google Maps Reverse Geocoding API proxy (solves CORS and protects server logic)
  // Major NYC Subway Stations with precise coordinates for multi-source transit fusion
  // Major NYC Subway Stations with precise coordinates and full Google Maps addresses
  const MAJOR_NYC_SUBWAY_STATIONS = [
    { name: 'Times Sq - 42 St', fullAddress: 'Times Sq - 42 St, Broadway & W 42nd St, New York, NY 10036', lat: 40.7553, lng: -73.9870, lines: '1, 2, 3, 7, N, Q, R, W, S', borough: 'Manhattan' },
    { name: 'Grand Central - 42 St', fullAddress: 'Grand Central - 42 St, 89 E 42nd St, New York, NY 10017', lat: 40.7517, lng: -73.9767, lines: '4, 5, 6, 7, S', borough: 'Manhattan' },
    { name: '34 St - Herald Sq', fullAddress: '34 St - Herald Sq, Broadway & W 34th St, New York, NY 10001', lat: 40.7497, lng: -73.9878, lines: 'B, D, F, M, N, Q, R, W', borough: 'Manhattan' },
    { name: '34 St - Penn Station', fullAddress: '34 St - Penn Station, 2 Pennsylvania Plaza, New York, NY 10001', lat: 40.7505, lng: -73.9934, lines: '1, 2, 3, A, C, E', borough: 'Manhattan' },
    { name: '14 St - Union Sq', fullAddress: '14 St - Union Sq, Broadway & E 14th St, New York, NY 10003', lat: 40.7348, lng: -73.9906, lines: '4, 5, 6, L, N, Q, R, W', borough: 'Manhattan' },
    { name: 'Lexington Ave - 59 St', fullAddress: 'Lexington Ave - 59 St, 750 Lexington Ave, New York, NY 10022', lat: 40.7628, lng: -73.9678, lines: '4, 5, 6, N, R, W', borough: 'Manhattan' },
    { name: 'Fulton St', fullAddress: 'Fulton St, 200 Broadway, New York, NY 10038', lat: 40.7103, lng: -74.0076, lines: '2, 3, 4, 5, A, C, J, Z', borough: 'Manhattan' },
    { name: 'W 4 St - Wash Sq', fullAddress: 'W 4 St - Wash Sq, W 4th St & 6th Ave, New York, NY 10014', lat: 40.7323, lng: -74.0005, lines: 'A, B, C, D, E, F, M', borough: 'Manhattan' },
    { name: 'Columbus Circle - 59 St', fullAddress: 'Columbus Circle - 59 St, 10 Columbus Circle, New York, NY 10019', lat: 40.7682, lng: -73.9819, lines: '1, A, B, C, D', borough: 'Manhattan' },
    { name: 'Canal St', fullAddress: 'Canal St, Canal St & Broadway, New York, NY 10013', lat: 40.7183, lng: -74.0007, lines: '6, J, N, Q, R, W, Z', borough: 'Manhattan' },
    { name: 'Brooklyn Bridge - City Hall', fullAddress: 'Brooklyn Bridge - City Hall, Centre St & Chambers St, New York, NY 10007', lat: 40.7130, lng: -74.0041, lines: '4, 5, 6, J, Z', borough: 'Manhattan' },
    { name: 'Wall St', fullAddress: 'Wall St, Wall St & Broadway, New York, NY 10005', lat: 40.7068, lng: -74.0091, lines: '2, 3, 4, 5', borough: 'Manhattan' },
    { name: 'Atlantic Av - Barclays Ctr', fullAddress: 'Atlantic Av - Barclays Ctr, 625 Atlantic Ave, Brooklyn, NY 11217', lat: 40.6844, lng: -73.9774, lines: '2, 3, 4, 5, B, D, N, Q, R', borough: 'Brooklyn' },
    { name: 'Jay St - MetroTech', fullAddress: 'Jay St - MetroTech, 370 Jay St, Brooklyn, NY 11201', lat: 40.6923, lng: -73.9873, lines: 'A, C, F, R', borough: 'Brooklyn' },
    { name: 'Bedford Ave', fullAddress: 'Bedford Ave, N 7th St & Bedford Ave, Brooklyn, NY 11211', lat: 40.7173, lng: -73.9569, lines: 'L', borough: 'Brooklyn' },
    { name: 'Jackson Heights - Roosevelt Ave', fullAddress: 'Jackson Heights - Roosevelt Ave, 74-01 Roosevelt Ave, Jackson Heights, NY 11372', lat: 40.7466, lng: -73.8913, lines: '7, E, F, M, R', borough: 'Queens' },
    { name: 'Flushing - Main St', fullAddress: 'Flushing - Main St, Roosevelt Ave & Main St, Flushing, NY 11354', lat: 40.7596, lng: -73.8300, lines: '7', borough: 'Queens' },
    { name: 'Court Sq', fullAddress: 'Court Sq, 45-40 23rd St, Long Island City, NY 11101', lat: 40.7471, lng: -73.9453, lines: '7, E, G, M', borough: 'Queens' },
    { name: '86 St - Upper East Side', fullAddress: '86 St - Upper East Side, 86th St & Lexington Ave, New York, NY 10028', lat: 40.7795, lng: -73.9556, lines: '4, 5, 6, Q', borough: 'Manhattan' },
    { name: 'Astoria - Ditmars Blvd', fullAddress: 'Astoria - Ditmars Blvd, 31-01 Ditmars Blvd, Astoria, NY 11105', lat: 40.7750, lng: -73.9120, lines: 'N, W', borough: 'Queens' },
    { name: '125 St - Harlem', fullAddress: '125 St - Harlem, W 125th St & Lenox Ave, New York, NY 10027', lat: 40.8041, lng: -73.9375, lines: '2, 3, 4, 5, 6', borough: 'Manhattan' },
    { name: '161 St - Yankee Stadium', fullAddress: '161 St - Yankee Stadium, 161st St & River Ave, Bronx, NY 10451', lat: 40.8279, lng: -73.9256, lines: '4, B, D', borough: 'Bronx' },
    { name: 'St. George Terminal', fullAddress: 'St. George Ferry Terminal, 1 Ferry Terminal Dr, Staten Island, NY 10301', lat: 40.6437, lng: -74.0736, lines: 'SIR', borough: 'Staten Island' },
  ];

  function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  // Detect whether an address is bare borough/city (e.g. just "Brooklyn", "Manhattan", "Brooklyn, NY")
  function isBareBoroughOrIncomplete(addr: string): boolean {
    if (!addr || !addr.trim()) return true;
    const clean = addr.trim().replace(/, USA$/i, '').trim();
    // Bare borough/city names or bare borough + state/zip
    if (/^(brooklyn|manhattan|queens|the bronx|bronx|staten island|new york|nyc)(,\s*(ny|new york))?(\s*\d{5})?$/i.test(clean)) {
      return true;
    }
    // Check if it lacks any street or POI indicator (no street number, intersection &, or street suffix)
    const hasStreetIndicator = /\b(st|street|ave|avenue|blvd|boulevard|rd|road|way|plaza|pkwy|parkway|dr|drive|ct|court|broadway|lane|ln|terminal|station|pier|concourse|center|ctr)\b/i.test(clean);
    const hasHouseOrIntersection = /\d+\s+[a-z]|&|\b(corner|at)\b/i.test(clean);
    if (!hasStreetIndicator && !hasHouseOrIntersection) {
      return true;
    }
    return false;
  }

  function getClosestStation(lat?: number, lng?: number, boroughHint?: string) {
    if (lat !== undefined && lng !== undefined) {
      let closest = MAJOR_NYC_SUBWAY_STATIONS[0];
      let minD = getDistanceMeters(lat, lng, closest.lat, closest.lng);
      for (const st of MAJOR_NYC_SUBWAY_STATIONS) {
        const d = getDistanceMeters(lat, lng, st.lat, st.lng);
        if (d < minD) {
          minD = d;
          closest = st;
        }
      }
      return closest;
    }
    if (boroughHint) {
      const match = MAJOR_NYC_SUBWAY_STATIONS.find(s => s.borough.toLowerCase() === boroughHint.toLowerCase());
      if (match) return match;
    }
    return MAJOR_NYC_SUBWAY_STATIONS[0];
  }

  // Helper to format clean, authentic, standard NYC and US addresses from OSM data
  function buildFullAddressFromOsm(osmData: any, fallbackLat?: number, fallbackLng?: number): { fullAddress: string; zip: string } {
    if (!osmData) {
      const closest = getClosestStation(fallbackLat, fallbackLng);
      return { fullAddress: closest.fullAddress, zip: closest.fullAddress.match(/\b\d{5}\b/)?.[0] || '10036' };
    }
    const a = osmData.address || {};
    const houseNumber = (a.house_number || '').trim();
    const road = (a.road || a.street || a.pedestrian || a.footway || a.path || a.subway || a.amenity || '').trim();
    let street = [houseNumber, road].filter(Boolean).join(' ');

    if (!street) {
      const poiName = (osmData.name || a.amenity || a.station || a.subway || a.railway || a.building || a.shop || a.tourism || '').trim();
      if (poiName) {
        street = poiName;
      }
    }

    const neighborhood = (a.neighbourhood || a.suburb || a.residential || a.quarter || a.hamlet || '').trim();
    let borough = (a.borough || a.city_district || '').trim();
    const county = (a.county || '').trim();
    let city = (a.city || a.town || a.village || a.municipality || '').trim();
    let state = (a.state || a.state_code || '').trim();
    const zip = (a.postcode || '').trim();

    // Map NYC administrative counties to authentic NYC boroughs
    if (/kings county/i.test(county) || /kings county/i.test(borough) || /kings/i.test(county)) {
      borough = 'Brooklyn';
    } else if (/new york county/i.test(county) || /new york county/i.test(borough) || /manhattan/i.test(borough)) {
      borough = 'Manhattan';
    } else if (/queens county/i.test(county) || /queens county/i.test(borough) || /queens/i.test(borough)) {
      borough = 'Queens';
    } else if (/bronx county/i.test(county) || /bronx county/i.test(borough) || /bronx/i.test(borough)) {
      borough = 'Bronx';
    } else if (/richmond county/i.test(county) || /richmond county/i.test(borough) || /staten island/i.test(borough)) {
      borough = 'Staten Island';
    }

    if (state.toLowerCase() === 'new york') {
      state = 'NY';
    }

    // If street is still missing, resolve from closest transit landmark to avoid bare borough names like "Brooklyn" or "Manhattan"
    if (!street) {
      const closest = getClosestStation(fallbackLat, fallbackLng, borough || city);
      return {
        fullAddress: closest.fullAddress,
        zip: closest.fullAddress.match(/\b\d{5}\b/)?.[0] || zip,
      };
    }

    const parts: string[] = [];
    if (street) parts.push(street);
    if (neighborhood && neighborhood !== borough && neighborhood !== city && !parts.includes(neighborhood)) {
      parts.push(neighborhood);
    }
    if (borough && !parts.includes(borough)) {
      parts.push(borough);
    } else if (city && !parts.includes(city) && !/city of new york/i.test(city)) {
      parts.push(city);
    }

    const stateZip = [state || 'NY', zip].filter(Boolean).join(' ');
    if (stateZip) parts.push(stateZip);

    let address = parts.join(', ').trim();

    // Strip redundant county and country strings
    address = address
      .replace(/Kings County,?\s*/gi, '')
      .replace(/New York County,?\s*/gi, '')
      .replace(/Queens County,?\s*/gi, '')
      .replace(/Bronx County,?\s*/gi, '')
      .replace(/Richmond County,?\s*/gi, '')
      .replace(/City of New York,?\s*/gi, '')
      .replace(/,\s*New York,\s*New York/gi, ', New York, NY')
      .replace(/,\s*USA$/i, '')
      .replace(/,\s*United States$/i, '')
      .trim();

    // If address somehow still only has borough or city name without street, fallback to closest transit address
    if (isBareBoroughOrIncomplete(address)) {
      const closest = getClosestStation(fallbackLat, fallbackLng, borough || city);
      address = closest.fullAddress;
    }

    return {
      fullAddress: address,
      zip: address.match(/\b\d{5}\b/)?.[0] || zip,
    };
  }

  // Instant network-level location fallback using real client IP geolocation + reverse geocoding
  app.get('/api/maps/ip-location', async (req, res) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || '';
      const ipUrl = clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1'
        ? `http://ip-api.com/json/${clientIp}`
        : 'http://ip-api.com/json/';
      const ipRes = await fetch(ipUrl);
      if (ipRes.ok) {
        const data = await ipRes.json();
        if (data.status === 'success') {
          const city = data.city || '';
          const region = data.region || data.regionName || '';
          const zip = data.zip || '';
          let fullAddress = '';

          // For IP geolocation, query at neighborhood/district zoom level (zoom 14) to avoid false house numbers
          if (data.lat && data.lon) {
            try {
              const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.lat}&lon=${data.lon}&zoom=14&addressdetails=1`;
              const osmRes = await fetch(osmUrl, {
                headers: { 'User-Agent': 'NYCLedgerExpenseApp/1.0 (transit-omny)' },
              });
              if (osmRes.ok) {
                const osmData = await osmRes.json();
                const built = buildFullAddressFromOsm(osmData, data.lat, data.lon);
                if (built.fullAddress && !isBareBoroughOrIncomplete(built.fullAddress)) {
                  fullAddress = built.fullAddress;
                }
              }
            } catch (e) {
              console.warn('IP reverse geocode fallback failed:', e);
            }
          }

          // If still bare or empty, resolve to full Google Maps address for that NYC area
          if (!fullAddress || isBareBoroughOrIncomplete(fullAddress)) {
            const closest = getClosestStation(data.lat, data.lon, city);
            fullAddress = closest.fullAddress;
          }

          return res.json({
            success: true,
            lat: data.lat,
            lng: data.lon,
            formatted_address: fullAddress,
            nearest_station: fullAddress,
            city,
            region,
            zip: zip || fullAddress.match(/\b\d{5}\b/)?.[0] || '10036',
            source: 'ip_geo_real',
          });
        }
      }
    } catch (err) {
      console.warn('IP location fetch failed:', err);
    }
    const defaultHub = MAJOR_NYC_SUBWAY_STATIONS[0];
    res.json({
      success: true,
      formatted_address: defaultHub.fullAddress,
      nearest_station: defaultHub.fullAddress,
      source: 'default_local',
    });
  });

  // Multi-Source Reverse Geocoding API proxy (Google Maps + OpenStreetMap Nominatim + MTA Transit Proximity)
  app.get('/api/maps/geocode/reverse', async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ error: 'lat and lng query parameters are required' });
      }

      const numLat = parseFloat(lat as string);
      const numLng = parseFloat(lng as string);

      // Check distance to major NYC subway stations
      let closestStation = MAJOR_NYC_SUBWAY_STATIONS[0];
      let minDistance = getDistanceMeters(numLat, numLng, closestStation.lat, closestStation.lng);
      for (const st of MAJOR_NYC_SUBWAY_STATIONS) {
        const d = getDistanceMeters(numLat, numLng, st.lat, st.lng);
        if (d < minDistance) {
          minDistance = d;
          closestStation = st;
        }
      }

      // Proximity check: Only treat as an MTA subway station if user is actually within 800 meters!
      const isNearMTA = minDistance <= 800;

      let resolvedAddress = '';
      let placeId = '';
      let zipCode = '';

      // Tier 1: Google Maps Geocoding if key is provided and valid
      const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
      if (apiKey && apiKey !== 'MY_GOOGLE_MAPS_API_KEY') {
        try {
          const gmpUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&solution_id=gmp_mcp_codeassist_v1_aistudio`;
          const gRes = await fetch(gmpUrl);
          const gData = await gRes.json();
          if (gData.results && gData.results.length > 0) {
            resolvedAddress = gData.results[0].formatted_address;
            placeId = gData.results[0].place_id;
            const zComp = gData.results[0].address_components?.find((c: any) => c.types.includes('postal_code'));
            if (zComp) zipCode = zComp.short_name;
          }
        } catch (e) {
          console.warn('Google Maps reverse geocode failed:', e);
        }
      }

      // Tier 2: OpenStreetMap Nominatim reverse geocoding (accurate worldwide, no key required)
      if (!resolvedAddress) {
        try {
          const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${numLat}&lon=${numLng}&zoom=18&addressdetails=1`;
          const osmRes = await fetch(osmUrl, {
            headers: { 'User-Agent': 'NYCLedgerExpenseApp/1.0 (transit-omny)' },
          });
          if (osmRes.ok) {
            const osmData = await osmRes.json();
            const formatted = buildFullAddressFromOsm(osmData, numLat, numLng);
            if (formatted.fullAddress) {
              resolvedAddress = formatted.fullAddress;
              if (formatted.zip) zipCode = formatted.zip;
            }
          }
        } catch (e) {
          console.warn('Nominatim reverse geocode failed:', e);
        }
      }

      let cleanAddress = resolvedAddress ? resolvedAddress.replace(/, USA$/i, '').trim() : '';

      // Guarantee full address: If cleanAddress is empty or bare borough (e.g. "Brooklyn" or "Manhattan"), use closest station full address
      if (!cleanAddress || isBareBoroughOrIncomplete(cleanAddress)) {
        cleanAddress = closestStation.fullAddress;
      }

      if (!zipCode && cleanAddress) {
        const m = cleanAddress.match(/\b\d{5}\b/);
        if (m) zipCode = m[0];
      }

      // If near MTA subway station, use the station's full address; otherwise use the verified full local address
      const finalFullAddress = isNearMTA ? closestStation.fullAddress : cleanAddress;

      return res.json({
        success: true,
        formatted_address: finalFullAddress,
        nearest_station: closestStation.fullAddress,
        station_name: closestStation.name,
        is_near_transit: isNearMTA,
        distance_meters: minDistance,
        place_id: placeId,
        lat: numLat,
        lng: numLng,
        zip: zipCode || finalFullAddress.match(/\b\d{5}\b/)?.[0] || '10036',
        source: isNearMTA ? 'mta_transit_proximity' : 'real_device_geocoding',
      });
    } catch (err: any) {
      console.error('Reverse geocoding error:', err);
      return res.status(500).json({ error: err.message || 'Geocoding request failed' });
    }
  });

  // Google Maps / Nominatim Forward Geocoding API proxy (search addresses/stations/ZIPs)
  app.get('/api/maps/geocode/forward', async (req, res) => {
    try {
      const { address } = req.query;
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: 'address query parameter is required' });
      }

      const queryStr = address.trim();

      // Check if user queried a station name or borough directly
      const qLower = queryStr.toLowerCase();
      const directStationMatch = MAJOR_NYC_SUBWAY_STATIONS.find(
        (st) =>
          st.name.toLowerCase().includes(qLower) ||
          qLower.includes(st.name.toLowerCase()) ||
          st.fullAddress.toLowerCase().includes(qLower)
      );

      if (directStationMatch) {
        return res.json({
          success: true,
          formatted_address: directStationMatch.fullAddress,
          nearest_station: directStationMatch.fullAddress,
          place_id: `station_${directStationMatch.name.replace(/\s+/g, '_')}`,
          lat: directStationMatch.lat,
          lng: directStationMatch.lng,
          zip: directStationMatch.fullAddress.match(/\b\d{5}\b/)?.[0] || '10036',
          results: [{
            formatted_address: directStationMatch.fullAddress,
            place_id: `station_${directStationMatch.name.replace(/\s+/g, '_')}`,
            geometry: { location: { lat: directStationMatch.lat, lng: directStationMatch.lng } }
          }]
        });
      }

      // If user typed a bare borough like "Brooklyn", "Manhattan", "Queens", "Bronx", "Staten Island"
      if (/^(brooklyn|manhattan|queens|bronx|staten island)$/i.test(qLower)) {
        const hub = MAJOR_NYC_SUBWAY_STATIONS.find((s) => s.borough.toLowerCase() === qLower) || MAJOR_NYC_SUBWAY_STATIONS[0];
        return res.json({
          success: true,
          formatted_address: hub.fullAddress,
          nearest_station: hub.fullAddress,
          place_id: `hub_${hub.borough}`,
          lat: hub.lat,
          lng: hub.lng,
          zip: hub.fullAddress.match(/\b\d{5}\b/)?.[0] || '10036',
          results: [{
            formatted_address: hub.fullAddress,
            place_id: `hub_${hub.borough}`,
            geometry: { location: { lat: hub.lat, lng: hub.lng } }
          }]
        });
      }

      let foundLat: number | null = null;
      let foundLng: number | null = null;
      let formattedAddress = '';
      let placeId = '';
      let zipCode = '';

      const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
      if (apiKey && apiKey !== 'MY_GOOGLE_MAPS_API_KEY') {
        try {
          const gmpUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryStr)}&key=${apiKey}&solution_id=gmp_mcp_codeassist_v1_aistudio`;
          const gRes = await fetch(gmpUrl);
          const gData = await gRes.json();
          if (gData.results && gData.results.length > 0) {
            const first = gData.results[0];
            formattedAddress = first.formatted_address;
            placeId = first.place_id;
            foundLat = first.geometry?.location?.lat;
            foundLng = first.geometry?.location?.lng;
            const zComp = first.address_components?.find((c: any) => c.types.includes('postal_code'));
            if (zComp) zipCode = zComp.short_name;
          }
        } catch (e) {
          console.warn('Google Maps forward search error:', e);
        }
      }

      // Fallback: OpenStreetMap Nominatim forward search
      if (!formattedAddress || foundLat === null || foundLng === null) {
        try {
          const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&addressdetails=1&limit=3`;
          const osmRes = await fetch(osmUrl, {
            headers: { 'User-Agent': 'NYCLedgerExpenseApp/1.0 (transit-omny)' },
          });
          if (osmRes.ok) {
            const list = await osmRes.json();
            if (list && list.length > 0) {
              const item = list[0];
              foundLat = parseFloat(item.lat);
              foundLng = parseFloat(item.lon);
              placeId = item.place_id ? String(item.place_id) : '';
              if (item.address?.postcode) zipCode = item.address.postcode;
              const built = buildFullAddressFromOsm(item, foundLat, foundLng);
              if (built.fullAddress && !isBareBoroughOrIncomplete(built.fullAddress)) {
                formattedAddress = built.fullAddress;
              } else if (item.display_name) {
                formattedAddress = item.display_name.replace(/, United States$/i, '').trim();
              }
            }
          }
        } catch (e) {
          console.warn('Nominatim forward search error:', e);
        }
      }

      if (formattedAddress && foundLat !== null && foundLng !== null) {
        let clean = formattedAddress.replace(/, USA$/i, '').trim();
        if (isBareBoroughOrIncomplete(clean)) {
          const closest = getClosestStation(foundLat, foundLng);
          clean = closest.fullAddress;
        }
        if (!zipCode) {
          const m = clean.match(/\b\d{5}\b/);
          if (m) zipCode = m[0];
        }
        return res.json({
          success: true,
          formatted_address: clean,
          nearest_station: clean,
          place_id: placeId,
          lat: foundLat,
          lng: foundLng,
          zip: zipCode || clean.match(/\b\d{5}\b/)?.[0] || '10036',
          results: [{
            formatted_address: clean,
            place_id: placeId,
            geometry: { location: { lat: foundLat, lng: foundLng } }
          }]
        });
      }

      // Graceful fallback: return closest station matching query or first hub
      const fallbackStation = getClosestStation(undefined, undefined, queryStr);
      return res.json({
        success: true,
        formatted_address: fallbackStation.fullAddress,
        nearest_station: fallbackStation.fullAddress,
        lat: fallbackStation.lat,
        lng: fallbackStation.lng,
        zip: fallbackStation.fullAddress.match(/\b\d{5}\b/)?.[0] || '10036',
        results: [{
          formatted_address: fallbackStation.fullAddress,
          geometry: { location: { lat: fallbackStation.lat, lng: fallbackStation.lng } }
        }]
      });
    } catch (err: any) {
      console.error('Forward geocoding error:', err);
      return res.status(500).json({ error: err.message || 'Geocoding request failed' });
    }
  });

  // Dev server or static files
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`NYC Ledger Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
