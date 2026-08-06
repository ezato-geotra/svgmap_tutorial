// License: MPL-2.0

export const MHLW_INDEX_URL = "https://www.mhlw.go.jp/stf/newpage_75017.html";
export const SNAPSHOT = Object.freeze({
  reportNumber: 37,
  asOf: "2026-08-05 08:00",
  medicalAsOf: "2026-08-05 07:00",
  welfareAsOf: "2026-08-04",
  sourcePdf: "https://www.mhlw.go.jp/content/001733600.pdf"
});

export const METRICS = Object.freeze({
  medicalCurrent: { label: "医療施設：現在の被災施設数", dataset: "medical", field: "current" },
  medicalWater: { label: "医療施設：現在の断水施設数", dataset: "medical", field: "waterCurrent" },
  welfareCurrent: { label: "高齢者施設：現在の被災施設数", dataset: "welfare", field: "current" },
  welfareBuilding: { label: "高齢者施設：現在の建物被害施設数", dataset: "welfare", field: "buildingCurrent" },
  welfareWater: { label: "高齢者施設：現在の断水施設数", dataset: "welfare", field: "waterCurrent" }
});

const CENTERS = Object.freeze({
  "熊本市": [32.8031, 130.7079], "八代市": [32.5081, 130.6024], "宇城市": [32.6482, 130.6841],
  "宇土市": [32.6874, 130.6580], "美里町": [32.6397, 130.7888], "菊池市": [32.9797, 130.8132],
  "合志市": [32.8850, 130.7897], "菊陽町": [32.86263, 130.82797], "氷川町": [32.58204, 130.67403],
  "水俣市": [32.2118, 130.4084], "芦北町": [32.2992, 130.4932], "人吉市": [32.2169, 130.7543],
  "あさぎり町": [32.2374, 130.8973], "上天草市": [32.5872, 130.4305], "御船町": [32.7144, 130.8018],
  "嘉島町": [32.7402, 130.7574], "益城町": [32.7913, 130.8167], "甲佐町": [32.6513, 130.8113],
  "山都町": [32.6852, 130.9912], "玉名市": [32.9279, 130.5596], "大津町": [32.87921, 130.86807],
  "天草市": [32.4585, 130.1931]
});

export const MEDICAL_ROWS = Object.freeze([
  medical("宇土市", 6, 6, 6, 0, 0), medical("宇城市", 14, 12, 11, 0, 3), medical("美里町", 2, 2, 2, 0, 0),
  medical("菊池市", 3, 0, 0, 0, 0), medical("合志市", 2, 1, 1, 0, 0), medical("菊陽町", 1, 0, 0, 0, 0),
  medical("八代市", 26, 22, 20, 1, 4), medical("氷川町", 1, 1, 1, 0, 0), medical("水俣市", 1, 1, 0, 0, 1),
  medical("芦北町", 1, 0, 0, 0, 0), medical("人吉市", 3, 0, 0, 0, 0), medical("あさぎり町", 1, 0, 0, 0, 0),
  medical("上天草市", 4, 0, 0, 0, 0), medical("熊本市", 15, 0, 0, 0, 0), medical("御船町", 3, 1, 1, 0, 0),
  medical("嘉島町", 1, 1, 1, 0, 0), medical("益城町", 3, 1, 1, 0, 0), medical("甲佐町", 2, 0, 0, 0, 0),
  medical("山都町", 3, 1, 1, 0, 0)
]);

export const WELFARE_ROWS = Object.freeze([
  welfare("熊本市", 279, 263, 0, 20, 23), welfare("八代市", 200, 154, 1, 139, 66),
  welfare("宇城市", 81, 59, 0, 64, 19), welfare("宇土市", 54, 44, 0, 32, 7),
  welfare("甲佐町", 29, 29, 0, 0, 0), welfare("益城町", 26, 22, 0, 3, 3),
  welfare("上天草市", 22, 12, 0, 16, 1), welfare("氷川町", 19, 14, 0, 15, 7),
  welfare("美里町", 18, 15, 0, 4, 4), welfare("御船町", 16, 14, 0, 5, 0),
  welfare("菊陽町", 14, 11, 0, 3, 0), welfare("玉名市", 13, 13, 0, 0, 0),
  welfare("合志市", 12, 12, 0, 0, 0), welfare("大津町", 11, 11, 0, 0, 0),
  welfare("天草市", 11, 11, 0, 0, 0), welfare("山都町", 10, 7, 0, 4, 0),
  welfare("水俣市", 8, 7, 0, 6, 1), welfare("芦北町", 6, 3, 0, 6, 2),
  welfare("嘉島町", 6, 6, 1, 1, 1), welfare("菊池市", 3, 3, 0, 0, 0),
  welfare("人吉市", 3, 3, 0, 0, 0)
]);

export function rowsForMetric(metricKey) {
  const metric = METRICS[metricKey];
  if (!metric) return [];
  const source = metric.dataset === "medical" ? MEDICAL_ROWS : WELFARE_ROWS;
  return source.map((row) => ({ ...row, value: Number(row[metric.field]) || 0 }));
}

export function findLatestMhlwReport(html, baseUrl = MHLW_INDEX_URL) {
  if (typeof html !== "string" || !html.trim()) return null;
  const document = new DOMParser().parseFromString(html, "text/html");
  const reports = [];
  for (const anchor of document.querySelectorAll("a[href]")) {
    const match = anchor.textContent?.match(/第\s*(\d+)\s*報/);
    if (!match) continue;
    let href;
    try {
      href = new URL(anchor.getAttribute("href"), baseUrl).href;
    } catch {
      continue;
    }
    if (!isAllowedMhlwPdfUrl(href)) continue;
    reports.push({ reportNumber: Number(match[1]), title: anchor.textContent.trim(), url: href });
  }
  return reports.sort((a, b) => b.reportNumber - a.reportNumber)[0] ?? null;
}

export function isAllowedMhlwPdfUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === "https://www.mhlw.go.jp" &&
      url.pathname.startsWith("/content/") && url.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

export function colorForValue(value, maximum) {
  if (!Number.isFinite(value) || value <= 0) return "#cbd5e1";
  const ratio = maximum > 0 ? value / maximum : 0;
  if (ratio >= 0.6) return "#991b1b";
  if (ratio >= 0.25) return "#dc2626";
  if (ratio >= 0.08) return "#f97316";
  return "#facc15";
}

export function sumField(rows, field) {
  return (rows ?? []).reduce((sum, row) => sum + (Number(row?.[field]) || 0), 0);
}

function medical(name, maximum, current, waterCurrent, gasCurrent, otherCurrent) {
  return point(name, { maximum, current, waterCurrent, gasCurrent, otherCurrent });
}

function welfare(name, current, buildingCurrent, powerCurrent, waterCurrent, gasCurrent) {
  return point(name, { current, buildingCurrent, powerCurrent, waterCurrent, gasCurrent });
}

function point(name, values) {
  const center = CENTERS[name];
  if (!center) throw new Error(`自治体代表点がありません: ${name}`);
  return { name, lat: center[0], lon: center[1], ...values };
}
