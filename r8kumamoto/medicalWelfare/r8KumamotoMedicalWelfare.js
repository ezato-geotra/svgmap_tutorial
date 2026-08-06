// License: MPL-2.0

import {
  MEDICAL_ROWS,
  METRICS,
  MHLW_INDEX_URL,
  SNAPSHOT,
  WELFARE_ROWS,
  colorForValue,
  findLatestMhlwReport,
  rowsForMetric,
  sumField
} from "./medicalWelfareData.js";

const ui = {
  metric: document.getElementById("metricSelect"),
  checkLatest: document.getElementById("checkLatestButton"),
  status: document.getElementById("statusMessage"),
  total: document.getElementById("totalValue"),
  count: document.getElementById("municipalityCount")
};

let initialized = false;
let svgMap;
let svgImage;
let svgImageProps;
let layerID;
let activeController;

window.addEventListener("layerWebAppReady", initializeLayer);
window.addEventListener("beforeunload", () => activeController?.abort());

async function initializeLayer() {
  if (initialized) return;
  initialized = true;
  ({ svgMap, svgImage, svgImageProps, layerID } = window);
  for (const [key, metric] of Object.entries(METRICS)) ui.metric.add(new Option(metric.label, key));
  ui.metric.value = "medicalCurrent";
  ui.metric.addEventListener("change", drawMetric);
  ui.checkLatest.addEventListener("click", () => void checkLatestReport());
  configureDetails();
  drawMetric();
  await checkLatestReport();
}

function configureDetails() {
  svgMap.setShowPoiProperty((target) => {
    const name = target?.getAttribute("data-municipality") || (target?.getAttribute("content") ?? "").split(",")[0];
    if (!name) return;
    const medical = MEDICAL_ROWS.find((row) => row.name === name);
    const welfare = WELFARE_ROWS.find((row) => row.name === name);
    const rows = [
      ["市町村", name],
      ["医療施設 被災（現在）", medical?.current ?? "表に掲載なし"],
      ["医療施設 断水（現在）", medical?.waterCurrent ?? "表に掲載なし"],
      ["医療ガス（現在）", medical?.gasCurrent ?? "表に掲載なし"],
      ["高齢者施設 被災（現在）", welfare?.current ?? "地図化対象外"],
      ["高齢者施設 建物被害（現在）", welfare?.buildingCurrent ?? "地図化対象外"],
      ["高齢者施設 断水（現在）", welfare?.waterCurrent ?? "地図化対象外"]
    ].map(([label, value]) => `<tr><th>${label}</th><td>${escapeHtml(value)}</td></tr>`).join("");
    svgMap.showModal(`<table border="1" style="border-collapse:collapse;width:100%">${rows}</table><p><a href="${SNAPSHOT.sourcePdf}" target="_blank" rel="noopener noreferrer">厚生労働省 第37報</a></p>`, 500, 370);
  }, layerID);
  svgImageProps.isClickable = { value: true, hilightStrokeStyle: { stroke: "#fde047", "stroke-width": 5 } };
}

function drawMetric() {
  const metricKey = ui.metric.value;
  const metric = METRICS[metricKey];
  const rows = rowsForMetric(metricKey);
  const maximum = Math.max(0, ...rows.map((row) => row.value));
  const fragment = svgImage.createDocumentFragment();
  for (const row of rows) {
    const circle = svgImage.createElement("circle");
    circle.setAttribute("cx", "0");
    circle.setAttribute("cy", "0");
    circle.setAttribute("r", String(5 + Math.min(18, Math.sqrt(row.value) * 1.2)));
    circle.setAttribute("transform", `ref(svg,${row.lon * 100},${-row.lat * 100})`);
    circle.setAttribute("fill", colorForValue(row.value, maximum));
    circle.setAttribute("fill-opacity", "0.82");
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "1.5");
    circle.setAttribute("data-municipality", row.name);
    const medical = MEDICAL_ROWS.find((item) => item.name === row.name);
    const welfare = WELFARE_ROWS.find((item) => item.name === row.name);
    circle.setAttribute("content", `${row.name},${metric.label},${row.value},${medical?.current ?? "-"},${medical?.waterCurrent ?? "-"},${welfare?.current ?? "-"},${welfare?.waterCurrent ?? "-"},${SNAPSHOT.asOf},厚生労働省第37報`);
    fragment.appendChild(circle);
  }
  svgImage.getElementById("municipalityPoints").replaceChildren(fragment);
  ui.total.textContent = sumField(rows, "value").toLocaleString("ja-JP");
  ui.count.textContent = rows.length.toLocaleString("ja-JP");
  svgMap.refreshScreen();
}

async function checkLatestReport() {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;
  ui.checkLatest.disabled = true;
  setStatus("厚生労働省の最新版を確認しています", "");
  try {
    const response = await fetch(svgMap.getCORSURL(MHLW_INDEX_URL), { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const latest = findLatestMhlwReport(await response.text());
    if (!latest) throw new Error("報告PDFが見つかりません");
    if (latest.reportNumber > SNAPSHOT.reportNumber || latest.url !== SNAPSHOT.sourcePdf) {
      setStatus(`第${latest.reportNumber}報が公開されています。地図は第${SNAPSHOT.reportNumber}報のため更新が必要です`, "warning");
    } else {
      setStatus(`内蔵データは公開中の最新版（第${latest.reportNumber}報）と一致しています`, "");
    }
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.error(error);
    setStatus(`最新版を確認できませんでした。第${SNAPSHOT.reportNumber}報を表示しています: ${error.message}`, "warning");
  } finally {
    if (activeController === controller) activeController = null;
    ui.checkLatest.disabled = false;
  }
}

function setStatus(message, type) {
  ui.status.textContent = message;
  ui.status.className = `status${type ? ` ${type}` : ""}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
