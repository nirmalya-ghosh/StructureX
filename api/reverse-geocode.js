const { json, readJson } = require("./_structurex-data");

const DEFAULT_MAP_KEY = "e6jRUxTkKH6UOJQnLqvl";
const LOOKUP_TIMEOUT_MS = 6500;

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return min;
  }
  return Math.max(min, Math.min(max, number));
}

function clean(value) {
  return String(value || "").trim();
}

function uniqueValues(values) {
  const seen = new Set();
  return values.filter((value) => {
    const normalized = clean(value).toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function addressFromProperties(properties = {}) {
  const houseNumber = properties["addr:housenumber"] || properties.housenumber || properties.house_number;
  const street = properties["addr:street"] || properties.street || properties.road;
  const unit = properties["addr:unit"] || properties.unit;
  const city = properties["addr:city"] || properties.city || properties.town;
  const postcode = properties["addr:postcode"] || properties.postcode;
  const primary = [houseNumber, street].filter(Boolean).join(" ");
  return uniqueValues([primary, unit && `Unit ${unit}`, city, postcode]).join(", ");
}

function hasPreciseAddress(properties = {}) {
  return Boolean(
    (properties["addr:housenumber"] || properties.housenumber || properties.house_number) &&
      (properties["addr:street"] || properties.street || properties.road)
  );
}

function areaFromAddress(address = {}) {
  return clean(
    address.neighbourhood ||
      address.suburb ||
      address.city_district ||
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      address.state
  );
}

async function fetchJson(url, timeoutMs = LOOKUP_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "StructureX/1.0 live-building-geocoder",
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function mapTilerReverse(lat, lng, key) {
  const params = new URLSearchParams({
    key: key || DEFAULT_MAP_KEY,
    language: "en",
  });
  const payload = await fetchJson(`https://api.maptiler.com/geocoding/${lng},${lat}.json?${params.toString()}`);
  const feature = payload.features?.[0];
  if (!feature) {
    return null;
  }
  const context = feature.context || [];
  const area =
    context.find((item) => String(item.id || "").startsWith("neighbourhood"))?.text ||
    context.find((item) => String(item.id || "").startsWith("place"))?.text ||
    context.find((item) => String(item.id || "").startsWith("region"))?.text ||
    feature.text;
  return {
    label: clean(feature.text),
    address: clean(feature.place_name),
    area: clean(area),
    source: "MapTiler Geocoding",
    confidence: feature.place_type?.includes("address") ? "high" : "medium",
  };
}

async function nominatimReverse(lat, lng) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    zoom: "18",
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
    "accept-language": "en",
  });
  const payload = await fetchJson(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
  if (!payload?.display_name) {
    return null;
  }
  const address = payload.address || {};
  const precise = [
    address.house_number && address.road ? `${address.house_number} ${address.road}` : "",
    address.building,
    address.amenity,
    address.shop,
    address.office,
  ].find(Boolean);
  return {
    label: clean(payload.name || precise || address.road || "Selected structure"),
    address: clean(payload.display_name),
    area: areaFromAddress(address),
    source: "OpenStreetMap Nominatim",
    confidence: precise ? "high" : "medium",
    osm: {
      type: payload.osm_type,
      id: payload.osm_id,
      category: payload.category,
      type_name: payload.type,
    },
  };
}

async function overpassBuilding(lat, lng) {
  const query = `
    [out:json][timeout:5];
    (
      way(around:10,${lat},${lng})["building"];
      relation(around:10,${lat},${lng})["building"];
      node(around:10,${lat},${lng})["addr:housenumber"];
    );
    out tags center 8;
  `;
  const params = new URLSearchParams({ data: query });
  const payload = await fetchJson(`https://overpass-api.de/api/interpreter?${params.toString()}`, 7000);
  const candidates = Array.isArray(payload.elements) ? payload.elements : [];
  const element = candidates.find((item) => addressFromProperties(item.tags)) || candidates[0];
  if (!element) {
    return null;
  }
  const tags = element.tags || {};
  const address = addressFromProperties(tags);
  return {
    label: clean(tags.name || tags["addr:housename"] || tags.building || "Mapped building"),
    address: clean(address),
    area: clean(tags["addr:suburb"] || tags["addr:city"] || tags["addr:district"]),
    source: "OpenStreetMap Overpass building tags",
    confidence: address ? "high" : "medium",
    osm: {
      type: element.type,
      id: element.id,
      building: tags.building,
    },
  };
}

function chooseBest(candidates, fallback) {
  const usable = candidates.filter((item) => item && (item.address || item.label));
  const high = usable.find((item) => item.confidence === "high" && item.address);
  return high || usable.find((item) => item.address) || usable[0] || fallback;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, { detail: "Method not allowed" }, 405);
  }

  const body = await readJson(req);
  const lat = clamp(body.lat, -90, 90);
  const lng = clamp(body.lng, -180, 180);
  const featureProperties = body.featureProperties || {};
  const preciseFeatureAddress = hasPreciseAddress(featureProperties);
  const featureAddress = clean(body.featureAddress) || addressFromProperties(featureProperties);
  const fallback = {
    label: clean(featureProperties.name) || "Selected structure",
    address: featureAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    area: clean(featureProperties["addr:city"]) || "Mapped zone",
    confidence: preciseFeatureAddress ? "high" : featureAddress ? "medium" : "coordinate",
    source: featureAddress ? "Vector tile address tags" : "Coordinates",
  };

  const lookups = await Promise.allSettled([
    overpassBuilding(lat, lng),
    nominatimReverse(lat, lng),
    mapTilerReverse(lat, lng, clean(body.maptilerKey) || DEFAULT_MAP_KEY),
  ]);
  const sources = lookups.map((result, index) => ({
    name: ["Overpass building tags", "OpenStreetMap Nominatim", "MapTiler Geocoding"][index],
    status: result.status === "fulfilled" && result.value ? "live" : "unavailable",
    error: result.status === "rejected" ? result.reason?.message || "request failed" : undefined,
  }));
  const candidates = [fallback, ...lookups.map((result) => (result.status === "fulfilled" ? result.value : null))];
  const best = chooseBest(candidates, fallback);

  return json(res, {
    label: best.label || fallback.label,
    address: best.address || fallback.address,
    area: best.area || fallback.area,
    confidence: best.confidence || fallback.confidence,
    source: best.source || fallback.source,
    coordinates: { lat, lng },
    osm: best.osm || null,
    sources,
    mapDataFreshness: "Live lookup; no StructureX address cache used",
    checkedAt: new Date().toISOString(),
  });
};
