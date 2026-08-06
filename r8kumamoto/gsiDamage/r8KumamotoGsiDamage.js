// License: MPL-2.0

import {
  GSI_LAYERS,
  GSI_SOURCE_PAGE,
  chooseZoom,
  expandTileUrl,
  geometryToPathData,
  getLayer,
  intersectView,
  isAllowedGsiUrl,
  tilesForView,
  validateFeatureCollection
} from "./gsiDamageData.js";

const ui = {
  ortho: document.getElementById("orthoSelect"),
  slopeYatsushiro: document.getElementById("slopeYatsushiroToggle"),
  slopeKumamoto3: document.getElementById("slopeKumamoto3Toggle"),
  opacity: document.getElementById("opacityRange"),
  opacityValue: document.getElementById("opacityValue"),
  reload: document.getElementById("reloadButton"),
  status: document.getElementById("statusMessage")
};

let initialized = false;
let svgMap;
let svgImage;
let svgImageProps;
let layerID;
let activeController;
let renderedTileSignature = "";

window.addEventListener("layerWebAppReady", initializeLayer);
window.addEventListener("beforeunload", () => activeController?.abort());

async function initializeLayer() {
  if (initialized) return;
  initialized = true;
  ({ svgMap, svgImage, svgImageProps, layerID } = window);
  bindUi();
  configureClickDetails();
  window.preRenderFunction = renderRasterTiles;
  renderRasterTiles();
  await loadSlopeData();
}

function bindUi() {
  ui.ortho.addEventListener("change", () => {
    renderedTileSignature = "";
    renderRasterTiles();
    svgMap.refreshScreen();
  });
  ui.slopeYatsushiro.addEventListener("change", updateVectorVisibility);
  ui.slopeKumamoto3.addEventListener("change", updateVectorVisibility);
  ui.opacity.addEventListener("input", () => {
    const opacity = Number(ui.opacity.value) / 100;
    svgImage.getElementById("orthoTiles").setAttribute("opacity", String(opacity));
    ui.opacityValue.value = `${ui.opacity.value}%`;
    svgMap.refreshScreen();
  });
  ui.reload.addEventListener("click", () => void loadSlopeData());
}

function configureClickDetails() {
  svgMap.setShowPoiProperty((target) => {
    const values = (target.getAttribute("content") ?? "").split(",");
    const rows = ["種別", "地区", "更新時点", "出典"].map((label, index) =>
      `<tr><th>${label}</th><td>${escapeHtml(values[index] ?? "-")}</td></tr>`
    ).join("");
    svgMap.showModal(`<table border="1" style="border-collapse:collapse;width:100%">${rows}</table>`, 430, 230);
  }, layerID);
  svgImageProps.isClickable = { value: true, hilightStrokeStyle: { stroke: "#facc15", "stroke-width": 5 } };
}

function renderRasterTiles() {
  if (!svgMap || !svgImage) return;
  const group = svgImage.getElementById("orthoTiles");
  const layer = getLayer(ui.ortho.value);
  if (!layer) {
    group.replaceChildren();
    renderedTileSignature = "none";
    return;
  }
  const zoom = chooseZoom(svgImageProps.scale, layer.minZoom, layer.maxZoom);
  const clippedView = intersectView(svgMap.getGeoViewBox(), layer.bounds);
  const tiles = clippedView ? tilesForView(clippedView, zoom) : [];
  const signature = `${layer.id}:${tiles.map((tile) => tile.key).join("|")}`;
  if (signature === renderedTileSignature) return;
  renderedTileSignature = signature;
  const fragment = svgImage.createDocumentFragment();
  for (const tile of tiles) {
    const rawUrl = expandTileUrl(layer.url, tile);
    if (!isAllowedGsiUrl(rawUrl)) continue;
    const image = svgImage.createElement("image");
    image.setAttribute("x", String(tile.west * 100));
    image.setAttribute("y", String(-tile.north * 100));
    image.setAttribute("width", String((tile.east - tile.west) * 100));
    image.setAttribute("height", String((tile.north - tile.south) * 100));
    image.setAttribute("preserveAspectRatio", "none");
    image.setAttribute("metadata", tile.key);
    image.setAttribute("xlink:href", svgMap.getCORSURL(rawUrl));
    fragment.appendChild(image);
  }
  group.replaceChildren(fragment);
}

async function loadSlopeData() {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;
  ui.reload.disabled = true;
  setStatus("斜面崩壊・堆積データを取得しています", "");
  try {
    const layers = GSI_LAYERS.filter((layer) => layer.kind === "vector");
    const results = await Promise.all(layers.map(async (layer) => {
      if (!isAllowedGsiUrl(layer.url)) throw new Error("許可されていないデータURLです");
      const response = await fetch(svgMap.getCORSURL(layer.url), { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`${layer.title}: HTTP ${response.status}`);
      const type = (response.headers.get("content-type") ?? "").toLowerCase();
      if (type.includes("text/html")) throw new Error(`${layer.title}: HTMLが返されました`);
      return { layer, features: validateFeatureCollection(await response.json()) };
    }));
    let featureCount = 0;
    for (const result of results) {
      featureCount += drawFeatures(result.layer, result.features);
    }
    updateVectorVisibility();
    setStatus(`斜面データ ${featureCount.toLocaleString("ja-JP")}件を表示しました`, "");
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.error(error);
    setStatus(`斜面データの取得に失敗しました: ${error.message}`, "error");
  } finally {
    if (activeController === controller) activeController = null;
    ui.reload.disabled = false;
  }
}

function drawFeatures(layer, features) {
  const groupId = layer.id === "slope-yatsushiro" ? "slopeYatsushiro" : "slopeKumamoto3";
  const group = svgImage.getElementById(groupId);
  const fragment = svgImage.createDocumentFragment();
  let count = 0;
  for (const feature of features) {
    const d = geometryToPathData(feature.geometry);
    if (!d) continue;
    const properties = feature.properties ?? {};
    const path = svgImage.createElement("path");
    path.setAttribute("d", d);
    path.setAttribute("fill", properties._fillColor ?? "#ff3232");
    path.setAttribute("fill-opacity", String(properties._fillOpacity ?? 0.45));
    path.setAttribute("stroke", properties._color ?? "#ff0000");
    path.setAttribute("stroke-opacity", String(properties._opacity ?? 1));
    path.setAttribute("stroke-width", String(Math.max(1, Number(properties._weight) || 1)));
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.setAttribute("content", `斜面崩壊・堆積,${layer.title.replace("斜面崩壊・堆積 ", "")},${layer.updated},国土地理院`);
    fragment.appendChild(path);
    count += 1;
  }
  group.replaceChildren(fragment);
  return count;
}

function updateVectorVisibility() {
  svgImage.getElementById("slopeYatsushiro").setAttribute("visibility", ui.slopeYatsushiro.checked ? "visible" : "hidden");
  svgImage.getElementById("slopeKumamoto3").setAttribute("visibility", ui.slopeKumamoto3.checked ? "visible" : "hidden");
  svgMap.refreshScreen();
}

function setStatus(message, type) {
  ui.status.textContent = message;
  ui.status.className = `status${type ? ` ${type}` : ""}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

export { GSI_SOURCE_PAGE };
