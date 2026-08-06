import {
  chooseZoom,
  expandTileUrl,
  geometryToPathData,
  intersectView,
  isAllowedGsiUrl,
  tileBounds,
  tilesForView,
  validateFeatureCollection
} from "../gsiDamageData.js";

describe("gsiDamageData", () => {
  test("許可対象を熊本地震の地理院タイルに限定する", () => {
    expect(isAllowedGsiUrl("https://maps.gsi.go.jp/xyz/20260729kumamoto_x/2/3/1.geojson")).toBe(true);
    expect(isAllowedGsiUrl("https://maps.gsi.go.jp/xyz/std/2/3/1.png")).toBe(false);
    expect(isAllowedGsiUrl("https://example.com/xyz/20260729kumamoto_x/2/3/1.geojson")).toBe(false);
  });

  test("ズーム値を配信範囲に収める", () => {
    expect(chooseZoom(0, 10, 18)).toBe(10);
    expect(chooseZoom(1024, 10, 18)).toBe(17);
    expect(chooseZoom(1e9, 10, 18)).toBe(18);
  });

  test("表示範囲から有限個のタイルを作る", () => {
    const tiles = tilesForView({ x: 130.5, y: 32.4, width: 0.2, height: 0.2 }, 12);
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.length).toBeLessThan(30);
    expect(expandTileUrl("https://a/{z}/{x}/{y}.png", tiles[0])).toMatch(/12\/\d+\/\d+\.png$/);
    expect(tileBounds(3533, 1657, 12).north).toBeGreaterThan(tileBounds(3533, 1657, 12).south);
  });

  test("配信範囲外ではタイル要求を作らない", () => {
    const bounds = { west: 130.5, east: 130.8, south: 32.5, north: 32.8 };
    expect(intersectView({ x: 134, y: 35, width: 1, height: 1 }, bounds)).toBeNull();
    expect(intersectView({ x: 130.6, y: 32.6, width: 1, height: 1 }, bounds)).toEqual({ x: 130.6, y: 32.6, width: expect.any(Number), height: expect.any(Number) });
  });

  test("PolygonとMultiPolygonをSVGパスへ変換する", () => {
    const polygon = { type: "Polygon", coordinates: [[[130, 32], [131, 32], [131, 33], [130, 32]]] };
    expect(geometryToPathData(polygon)).toContain("M13000,-3200");
    expect(geometryToPathData({ type: "Point", coordinates: [130, 32] })).toBe("");
  });

  test("GeoJSON形式を検証し対象外形状を除外する", () => {
    expect(validateFeatureCollection({ type: "FeatureCollection", features: [
      { geometry: { type: "Polygon", coordinates: [] } },
      { geometry: { type: "Point", coordinates: [0, 0] } }
    ] })).toHaveLength(1);
    expect(() => validateFeatureCollection({ features: [] })).toThrow("GeoJSON");
  });
});
