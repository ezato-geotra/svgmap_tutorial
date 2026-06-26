// Description:
// geogratis.gc.caのgeonamesサービスに接続し表示するLaWA
// Programmed by Satoru Takagi


var canadianGeoNamesService = "https://geogratis.gc.ca/services/geoname/en/geonames.csv";

onload=function(){
	addEventListener("zoomPanMap",  getGeoNames);
	getGeoNames();
}


var crsAD=1;
var maxItems=100;

async function getGeoNames(){
	var geoViewBox = svgMap.getGeoViewBox(); // 地理的な表示領域を得る
	var req = getCanadianGeoNamesReq(geoViewBox); // 表示領域をもとにサービスへのクエリを組み立てる
	var csv = await getCsv(req); // クエリを使って非同期でCSVを取得
	if ( csv.length > maxItems){ // 最大数以上の場合メッセージを出す
		messageDiv.innerText="Exceeded maximum number. Please zoom in.";
	}else{
		messageDiv.innerText="";
	}
	drawPoints(csv); // 取得したデータを可視化する
}

function getCanadianGeoNamesReq(geoArea){
	var area_x0=geoArea.x;
	var area_y0=geoArea.y;
	var area_x1=geoArea.x+geoArea.width;
	var area_y1=geoArea.y+geoArea.height;
	var ans = `${canadianGeoNamesService}?bbox=${area_x0},${area_y0},${area_x1},${area_y1}&num=${maxItems}`;
	return ( ans );
}

async function getCsv(url){
	var response = await fetch(url); 
	var txt = await response.text();
	txt = txt.split("\n");
	var ans = [];
	for ( var line of txt ){
		// https://www.ipentec.com/document/csharp-read-csv-file-by-regex ダブルクォーテーションエスケープを加味したcsvパース
		line = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
		if (line.length > 1){
			ans.push(line);
		}
	}
	return ( ans );
}

function drawPoints(csv){
	removeUses();
	var schema = csv[0].join();
	var latCol=csv[0].indexOf("latitude");
	var lngCol=csv[0].indexOf("longitude");
	svgImage.documentElement.setAttribute("property",schema);
	for ( var i = 1 ; i < csv.length ; i++){
		var point = csv[i];
		var meta = point.join();
		var lat = Number(point[latCol]);
		var lng = Number(point[lngCol]);
		var use=svgImage.createElement("use");
		use.setAttribute("xlink:href","#p1");
		use.setAttribute("content",meta);
		use.setAttribute("x",0);
		use.setAttribute("y",0);
		use.setAttribute("transform",`ref(svg,${lng},${-lat})`);
		svgImage.documentElement.appendChild(use);
	}
	svgMap.refreshScreen();
}

function removeUses(){
	var uses = svgImage.getElementsByTagName("use");
	for ( var i = uses.length-1 ; i >=0 ; i--){
		uses[i].remove();
	}
}