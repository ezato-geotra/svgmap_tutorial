// License: MPL-2.0

export const GSI_SOURCE_PAGE = "https://www.gsi.go.jp/BOUSAI/20260728_kumamoto_earthquake.html";

export const GSI_LAYERS = Object.freeze([
  {
    id: "ortho-yatsushiro",
    kind: "raster",
    title: "正射画像 八代地区（7/29撮影）",
    url: "https://maps.gsi.go.jp/xyz/20260729kumamoto_yatsushiro_0729do/{z}/{x}/{y}.png",
    minZoom: 10,
    maxZoom: 18,
    center: { lat: 32.44532, lng: 130.584183 },
    bounds: { west: 130.42, east: 130.78, south: 32.22, north: 32.63 }
  },
  {
    id: "ortho-kumamoto3",
    kind: "raster",
    title: "正射画像 熊本3地区（7/31・8/1撮影）",
    url: "https://maps.gsi.go.jp/xyz/20260729kumamoto_kumamoto3_0731_0801do/{z}/{x}/{y}.png",
    minZoom: 10,
    maxZoom: 18,
    center: { lat: 32.687643, lng: 130.702286 },
    bounds: { west: 130.52, east: 130.84, south: 32.54, north: 32.84 }
  },
  {
    id: "slope-yatsushiro",
    kind: "vector",
    title: "斜面崩壊・堆積 八代地区",
    url: "https://maps.gsi.go.jp/xyz/20260729kumamoto_syamenhoukai_dosekiryu_taiseki_yatsushiro/2/3/1.geojson",
    updated: "2026-07-29 23:50"
  },
  {
    id: "slope-kumamoto3",
    kind: "vector",
    title: "斜面崩壊・堆積 熊本3地区",
    url: "https://maps.gsi.go.jp/xyz/20260729kumamoto_syamenhoukai_taiseki_kumamoto3/2/3/1.geojson",
    updated: "2026-08-04 13:40"
  }
]);

export function getLayer(id) {
  return GSI_LAYERS.find((layer) => layer.id === id) ?? null;
}

export function isAllowedGsiUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.origin === "https://maps.gsi.go.jp" &&
      url.pathname.startsWith("/xyz/20260729kumamoto_");
  } catch {
    return false;
  }
}

export function chooseZoom(scale, minZoom, maxZoom) {
  const numericScale = Number(scale);
  const raw = Number.isFinite(numericScale) && numericScale > 0
    ? Math.floor(Math.log2(numericScale) + 7.5)
    : minZoom;
  return Math.max(minZoom, Math.min(maxZoom, raw));
}

export function tileBounds(x, y, zoom) {
  const count = 2 ** zoom;
  const west = x / count * 360 - 180;
  const east = (x + 1) / count * 360 - 180;
  const north = tileYToLatitude(y, count);
  const south = tileYToLatitude(y + 1, count);
  return { west, east, north, south };
}

export function tilesForView(viewBox, zoom, maxTiles = 180) {
  if (!viewBox || !Number.isFinite(zoom)) return [];
  const west = clamp(Number(viewBox.x), -180, 180);
  const east = clamp(Number(viewBox.x) + Number(viewBox.width), -180, 180);
  const south = clamp(Number(viewBox.y), -85.05112878, 85.05112878);
  const north = clamp(Number(viewBox.y) + Number(viewBox.height), -85.05112878, 85.05112878);
  if (![west, east, south, north].every(Number.isFinite) || east < west || north < south) return [];

  const count = 2 ** zoom;
  const minX = clamp(Math.floor((west + 180) / 360 * count), 0, count - 1);
  const maxX = clamp(Math.floor((east + 180) / 360 * count), 0, count - 1);
  const minY = clamp(latitudeToTileY(north, count), 0, count - 1);
  const maxY = clamp(latitudeToTileY(south, count), 0, count - 1);
  const tiles = [];
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (tiles.length >= maxTiles) return tiles;
      tiles.push({ x, y, zoom, key: `${zoom}/${x}/${y}`, ...tileBounds(x, y, zoom) });
    }
  }
  return tiles;
}

export function expandTileUrl(template, tile) {
  return template
    .replace("{z}", String(tile.zoom))
    .replace("{x}", String(tile.x))
    .replace("{y}", String(tile.y));
}

export function intersectView(viewBox, bounds) {
  if (!viewBox || !bounds) return null;
  const west = Math.max(Number(viewBox.x), bounds.west);
  const east = Math.min(Number(viewBox.x) + Number(viewBox.width), bounds.east);
  const south = Math.max(Number(viewBox.y), bounds.south);
  const north = Math.min(Number(viewBox.y) + Number(viewBox.height), bounds.north);
  if (![west, east, south, north].every(Number.isFinite) || east <= west || north <= south) return null;
  return { x: west, y: south, width: east - west, height: north - south };
}

export function validateFeatureCollection(data) {
  if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw new Error("GeoJSONの形式が不正です");
  }
  return data.features.filter((feature) => feature?.geometry && ["Polygon", "MultiPolygon"].includes(feature.geometry.type));
}

export function geometryToPathData(geometry) {
  if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) return "";
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const commands = [];
  for (const polygon of polygons ?? []) {
    for (const ring of polygon ?? []) {
      const valid = (ring ?? []).filter((point) =>
        Array.isArray(point) && Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1]))
      );
      if (valid.length < 3) continue;
      commands.push(`M${valid[0][0] * 100},${-valid[0][1] * 100}`);
      for (let index = 1; index < valid.length; index += 1) {
        commands.push(`L${valid[index][0] * 100},${-valid[index][1] * 100}`);
      }
      commands.push("Z");
    }
  }
  return commands.join(" ");
}

function latitudeToTileY(latitude, count) {
  const radians = latitude * Math.PI / 180;
  return Math.floor((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * count);
}

function tileYToLatitude(y, count) {
  return Math.atan(Math.sinh(Math.PI * (1 - 2 * y / count))) * 180 / Math.PI;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
