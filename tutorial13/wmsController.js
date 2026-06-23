// Description:
// gebcoのWMSに接続し表示するLaWA
// Programmed by Satoru Takagi

onload=async function(){
	await refreshScreenWithLoading();
}

let loadingTaskId = 0;

function nextFrame(){
	return new Promise(function(resolve){
		requestAnimationFrame(resolve);
	});
}

async function refreshScreenWithLoading(){
	const loadingSvg = parent.document.getElementById("loading-svg");

	loadingSvg.classList.remove("is-loaded");
	await nextFrame();

	svgMap.refreshScreen();
}

const GEBCOurl = "https://wms.gebco.net/2025/mapserv";
const GEBCOlayer = "gebco_2025";

var crsAD=1;

function preRenderFunction(){
	const prevImageElement = svgImage.getElementById("wmsImage");
	if (prevImageElement) {
		prevImageElement.remove();
	}

	const geoViewBox = svgMap.getGeoViewBox();
	const screenSize = getScreenSize();
	console.log("screenSize:",screenSize);
	const req = getWMSreq(GEBCOurl, GEBCOlayer, geoViewBox, screenSize);

	const newImage = getSvgImage(req, geoViewBox);
	waitForWMSImage(req);
	svgImage.documentElement.appendChild(newImage);
}

function getSvgImage( imageUrl, geoViewBox){
	const imageElement = svgImage.createElement("image");
	imageElement.setAttribute("opacity", 0.5);
	imageElement.setAttribute("preserveAspectRatio", "none");
	imageElement.setAttribute("id", "wmsImage");
	imageElement.setAttribute("xlink:href", imageUrl);
	imageElement.setAttribute("x", geoViewBox.x * crsAD);
	imageElement.setAttribute("y", -(geoViewBox.y+geoViewBox.height) * crsAD); // 軸反転のため北端を設定
	imageElement.setAttribute("width", geoViewBox.width * crsAD);
	imageElement.setAttribute("height", geoViewBox.height * crsAD);
	return(imageElement);
}

async function waitForWMSImage(imageUrl){
	const currentTaskId = ++loadingTaskId;
	const loadingSvg = parent.document.getElementById("loading-svg");

	loadingSvg.classList.remove("is-loaded");
	await preloadImage(imageUrl);
	await nextFrame();
	await nextFrame();

	if (currentTaskId === loadingTaskId) {
		loadingSvg.classList.add("is-loaded");
	}
}

function preloadImage(imageUrl){
	return new Promise(function(resolve){
		const image = new Image();

		image.onload = resolve;
		image.onerror = resolve;
		image.src = imageUrl;
	});
}

function getWMSreq(baseUrl, layerName, geoArea, screenSize){
	const wmsArea_x0 = geoArea.x;
	const wmsArea_y0 = geoArea.y;
	const wmsArea_x1 = geoArea.x + geoArea.width;
	const wmsArea_y1 = geoArea.y + geoArea.height;

	let ans = `${baseUrl}?
	request=getmap&
	service=wms&
	version=1.3.0&
	layers=${layerName}&
	crs=EPSG:4326&
	bbox=${wmsArea_y0},${wmsArea_x0},${wmsArea_y1},${wmsArea_x1}&
	width=${screenSize.width}&
	height=${screenSize.height}&
	format=image%2Fpng`;

	ans = ans.replace(/\s/g,""); // 空白文字(改行含)を除去
	return ( ans );
}

function getScreenSize(){
	const gvb = svgMap.getGeoViewBox();
	const scale = svgImageProps.scale;
	return {
		width : Math.round(gvb.width * scale),
		height: Math.round(gvb.height * scale),
	}
}