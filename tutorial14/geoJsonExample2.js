// Description:
// GeoJsonを読み込み表示するLaWAその２
// Programmed by Satoru Takagi

const usgsEarthquakeService="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/";
const timeSpanKeys=["hour","day","week","month"]; // 配信データの期間設定の選択肢
const timeSpanOptions = {
	hour: "過去1時間",
	day: "過去1日間",
	week: "過去1週間",
	month: "過去30日間",
};
const timeSpanDefault=2; // 過去1週間のデータの表示をデフォルトに
const levelKeys=["significant","4.5","2.5","1.0","all"]; // マグニチュード別の配信データの選択肢
const levelOptions = {
	significant: "重大な地震",
	"4.5": "M4.5以上",
	"2.5": "M2.5以上",
	"1.0": "M1.0以上",
	all: "すべて",
};
const levelDefault=2; // M2.5以上の地震の表示をデフォルトに
const intervalMinutes=10; // 10分おきに更新する
let metaSchema = {}; // SVGMap.jsの標準で用意されているジオメトリ選択時のメタデータ表示UIの正規化されたスキーマを格納する

addEventListener("load", function(){
	buildDataSelect();
	changeData();
	setInterval(function(){
		changeData();
		messageDiv.innerText=new Date().toLocaleString() + " update";
	} ,intervalMinutes * 60 * 1000);
});

function changeData(){
	// const param1 = dataSelect1.selectedIndex;
	// const param2 = dataSelect2.selectedIndex;
	// const path = getUSGSURL(param1, param2);
	const path = getUSGSURL(dataSelect1.value, dataSelect2.value);
	if (!path){return}
	void loadAndDrawGeoJson(path);
}

async function loadAndDrawGeoJson(dataPath){
	var gjs = await loadJSON(dataPath);
	buildSchema(gjs.features);
	setMagColors(gjs.features);
	console.log("geoJson:",gjs);
	var parentElm = svgImage.getElementById("mapContents");
	removeChildren(parentElm);
	svgMapGIStool.drawGeoJson(gjs, layerID, "orange", 2, "orange", "p0", "poi", "", parentElm, metaSchema);
	svgMap.refreshScreen();
}

function buildDataSelect(){
	let selectedOpt = "";
	for ( let i = 0 ; i < timeSpanKeys.length; i++){
		const timeSpanKey = timeSpanKeys[i];
		selectedOpt="";
		if ( timeSpanDefault === i){
			selectedOpt="selected";
		}
		dataSelect1.insertAdjacentHTML('beforeend', `<option value="${timeSpanKey}" ${selectedOpt}>${timeSpanOptions[timeSpanKey]}</option>`);
	}
	for ( let i = 0 ; i < levelKeys.length ; i++){
		const levelKey = levelKeys[i];
		selectedOpt="";
		if ( levelDefault === i){
			selectedOpt="selected";
		}
		dataSelect2.insertAdjacentHTML('beforeend',  `<option value="${levelKey}" ${selectedOpt}>${levelOptions[levelKey]}</option>`);
	}
}

async function loadJSON(url){
	var response = await fetch(url);
	// var response = await fetch(url+"?time="+new Date().getTime()); // 常に最新のデータを得るには何かダミーのクエリパートを付けるBad Tips..
	// https://stackoverflow.com/questions/37204296/cache-invalidation-using-the-query-string-bad-practice
	// https://stackoverflow.com/questions/9692665/cache-busting-via-params
	var json = await response.json();
	return ( json );
}

function removeChildren(element){
	while (element.firstChild) element.removeChild(element.firstChild);
}

function getUSGSURL(timeSpan, level){
	// if (!timeSpanKeys[timeSpan]){return}
	// if (!levelKeys[level]){return}
	if (!timeSpan || !level){return}
	const ans = `${usgsEarthquakeService}${level}_${timeSpan}.geojson`;
	console.log("getUSGSURL:",ans);
	return (ans);
}

function buildSchema(features){ // geojsonのfeatureのproprerty名から正規化されたスキーマを生成
	metaSchema={};
	for (const feature of features){ // 一応全データをトレース
		for (const propName in feature.properties){
			if (!metaSchema[propName]){
				metaSchema[propName]=true;
			}
		}
	}
	metaSchema=Object.keys(metaSchema);
	svgImage.documentElement.setAttribute("property",metaSchema.join());
}

function setMagColors(features){ // [[解説書#drawGeoJson]]のスタイリング仕様を使い、マグニチュードに応じた色を付ける
	features.sort(function(a,b){ //マグニチュード昇順でソート
		return(a.properties.mag - b.properties.mag);
	});
	
	for (const feature of features){
		let cmag = feature.properties.mag;
		// マグニチュード3...7でクリッピング
		cmag = Math.max(3,cmag);
		cmag = Math.min(7,cmag);
		// 色相(hue)に変換し、そこからRGBカラーを生成
		const hue = (7 - cmag) / (4) * 240;
		const rgb = svgMapGIStool.hsv2rgb(hue, 100, 100);
		console.log(rgb);
		if (rgb){
			feature.properties["marker-color"]=`#${getHexColor(rgb.r)}${getHexColor(rgb.g)}${getHexColor(rgb.b)}`;
		}
	}
	console.log(features);
}

function getHexColor(val) {
	return val.toString(16).padStart(2, '0');
}