/** @jest-environment jsdom */

import {
  MEDICAL_ROWS,
  SNAPSHOT,
  colorForValue,
  findLatestMhlwReport,
  isAllowedMhlwPdfUrl,
  rowsForMetric,
  sumField
} from "../medicalWelfareData.js";

describe("medicalWelfareData", () => {
  test("第37報の医療施設合計と一致する", () => {
    expect(sumField(MEDICAL_ROWS, "maximum")).toBe(92);
    expect(sumField(MEDICAL_ROWS, "current")).toBe(49);
    expect(sumField(MEDICAL_ROWS, "waterCurrent")).toBe(45);
  });

  test("表示指標の値を正規化する", () => {
    const rows = rowsForMetric("medicalCurrent");
    expect(rows.find((row) => row.name === "八代市").value).toBe(22);
    expect(rowsForMetric("unknown")).toEqual([]);
  });

  test("厚労省ページから最大報番号のPDFを選ぶ", () => {
    const html = `<a href="/content/old.pdf">令和8年熊本地震（第36報）</a>
      <a href="${SNAPSHOT.sourcePdf}">令和8年熊本地震（第37報）</a>`;
    expect(findLatestMhlwReport(html)).toMatchObject({ reportNumber: 37, url: SNAPSHOT.sourcePdf });
    expect(findLatestMhlwReport("")).toBeNull();
  });

  test("PDF URLと色を検証する", () => {
    expect(isAllowedMhlwPdfUrl(SNAPSHOT.sourcePdf)).toBe(true);
    expect(isAllowedMhlwPdfUrl("https://example.com/content/a.pdf")).toBe(false);
    expect(colorForValue(0, 10)).toBe("#cbd5e1");
    expect(colorForValue(10, 10)).toBe("#991b1b");
  });
});
