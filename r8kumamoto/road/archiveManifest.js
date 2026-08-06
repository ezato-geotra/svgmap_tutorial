// License: MPL-2.0
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

export const SOURCE_PAGE_URL =
  "https://www.mlit.go.jp/road/saigai/r8kumamoto/index.html";

export const ARCHIVES = Object.freeze([
  {
    id: "latest",
    label: "最新（2026-08-03 16:00掲載）",
    shortLabel: "最新",
    asOf: "2026-08-03 16:00",
    roadAsOf: "2026-08-03 14:00",
    probePeriod: "2026-08-03 13:00〜16:00",
    url: "https://www.mlit.go.jp/road/saigai/r8kumamoto/map.zip",
    isCurrent: true,
    expectedMissing: []
  },
  {
    id: "202607290800",
    label: "2026-07-29 08:00",
    shortLabel: "7/29 08:00",
    asOf: "2026-07-29 08:00",
    roadAsOf: "収録なし",
    probePeriod: "ZIP内に個別時刻属性なし",
    url: "https://www.mlit.go.jp/road/saigai/r8kumamoto/260729data.zip",
    expectedMissing: ["road", "travel"]
  },
  {
    id: "202607291200",
    label: "2026-07-29 12:00",
    shortLabel: "7/29 12:00",
    asOf: "2026-07-29 12:00",
    roadAsOf: "2026-07-29 12:00掲載分",
    probePeriod: "ZIP内に個別時刻属性なし",
    url: "https://www.mlit.go.jp/road/saigai/r8kumamoto/2607291200data.zip",
    expectedMissing: ["travel"]
  },
  ...[
    ["202607300800", "2026-07-30 08:00", "2607300800data.zip"],
    ["202607301200", "2026-07-30 12:00", "2607301200data.zip"],
    ["202607301600", "2026-07-30 16:00", "2607301600data.zip"],
    ["202607310800", "2026-07-31 08:00", "2607310800data.zip"],
    ["202607311600", "2026-07-31 16:00", "2607311600data.zip"],
    ["202608011800", "2026-08-01 18:00", "2608011800data.zip"],
    ["202608021800", "2026-08-02 18:00", "2608021800data.zip"],
    ["202608031200", "2026-08-03 12:00", "2608031200data.zip"],
    ["202608031600", "2026-08-03 16:00", "2608031600data.zip"]
  ].map(([id, label, filename]) => ({
    id,
    label,
    shortLabel: label.slice(5),
    asOf: label,
    roadAsOf: `${label}掲載分`,
    probePeriod: "ZIP内に個別時刻属性なし",
    url: `https://www.mlit.go.jp/road/saigai/r8kumamoto/${filename}`,
    expectedMissing: []
  }))
]);

const ARCHIVE_BY_ID = new Map(ARCHIVES.map((archive) => [archive.id, archive]));

export function getArchiveById(id) {
  return ARCHIVE_BY_ID.get(id) || ARCHIVES[0];
}

export function isAllowedArchiveUrl(url) {
  return ARCHIVES.some((archive) => archive.url === url);
}

