// Description:
// GeoJsonを読み込み表示するLaWA
// Programmed by Satoru Takagi

var dataPaths = {
	"A34b-180316.geojson":"世界遺産構成資産範囲ポリゴン（代表点）",
	"A34a-180316.geojson":"世界遺産構成資産範囲ポリゴンデータ",
	"A34d-180316.geojson":"世界遺産構成資産範囲ライン（代表点）",
	"A34c-180316.geojson":"世界遺産構成資産範囲ラインデータ",
	"A34e-180316.geojson":"世界遺産構成資産",
	"A34f-180316.geojson":"世界遺産緩衝地帯ポリゴンデータ",
	"A34g-180316.geojson":"世界遺産緩衝地帯ポリゴン（代表点）",
	"C28-20_Airport.geojson":"空港データ空港",
	"C28-20_AirportReferencePoint.geojson":"空港データ標点",
	"C28-20_SurveyContent.geojson":"空港データ調査内容",
	"C28-20_TerminalBuilding.geojson":"空港データターミナルビル",
	"N02-20_RailroadSection.geojson":"鉄道データ鉄道",
	"N02-20_Station.geojson":"鉄道データ駅"
};

addEventListener("load", function(){
	buildDataSelect();
	changeData();
});

function changeData(){
	var path = dataSelect.options[dataSelect.selectedIndex].value;
	loadAndDrawGeoJson(path);
}

async function loadAndDrawGeoJson(dataPath){
	var gjs = await loadJSON(dataPath);
	var parentElm = svgImage.getElementById("mapContents");
	removeChildren(parentElm);
	svgMapGIStool.drawGeoJson(gjs, layerID, "orange", 2, "orange", "p0", "poi", "", parentElm);
	svgMap.refreshScreen();
}

function buildDataSelect(){
	var first=true;
	for ( var dataPath in dataPaths){
		dataSelect.insertAdjacentHTML('beforeend', '<option value="' + dataPath +'" >'+dataPaths[dataPath]+'</option>');
	}
}

async function loadJSON(url){
	var dt = getDateStr(new Date(),10);
	var response = await fetch(url+"?time="+dt); // 常に最新のデータを得るには何かダミーのクエリパートを付けるBad Tips..
	// https://stackoverflow.com/questions/37204296/cache-invalidation-using-the-query-string-bad-practice
	// https://stackoverflow.com/questions/9692665/cache-busting-via-params
	var json = await response.json();
	return ( json );
}

function getDateStr(dateData , tStep){
	var mind = tStep * Math.floor( dateData.getUTCMinutes() / tStep ) ;
	var ans = dateData.getUTCFullYear()+ pad(dateData.getUTCMonth() + 1) + pad(dateData.getUTCDate()) + pad(dateData.getUTCHours()) + pad(mind);
	return ( ans );
}
function pad( inp ){
	return ( ("0"+inp).slice(-2));
}

function removeChildren(element){
	while (element.firstChild) element.removeChild(element.firstChild);
}

