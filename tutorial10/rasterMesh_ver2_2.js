// Description:
// メッシュ情報を読み込み表示するLaWA　その３
// Programmed by Satoru Takagi

// 
// History:
// 2022/02/14 : 1st rev.

// 読み込んだASCIIデータを保持するグローバル変数
var geoidGrid=[];
var dataProps;

onload = async function(){
	// メッシュデータを読み込みグローバル変数に保存
	await buildData();
	// 読み込んだデータからdataURIとしてビットイメージを生成
	var duri = buildImage(geoidGrid,document.getElementById("geoidCanvas")); 
	// 生成した画像の地理的な範囲
	// 画像になると、グリッドの点は画像のピクセルの中心となることに注意！
	var imageGeoArea={
		lng0: dataProps.glomn - dataProps.dglo/2,
		lat0: dataProps.glamn - dataProps.dgla/2,
		lngSpan: dataProps.nlo * dataProps.dglo,
		latSpan: dataProps.nla * dataProps.dgla
	}
	if ( typeof(svgMap)=="object" ){
		buildSvgImage(duri,imageGeoArea); // SVGコンテンツを生成
		svgMap.refreshScreen();
	}
}

async function buildData(){
	var gtxt = await loadText("gsigeo2011_ver2_2.asc");
	
	gtxt = gtxt.split("\n");
	
	dataProps = getHeader(gtxt[0]);
	var gx=0, gy=0;
	var geoidGridLine=[];
	for ( var i = 1 ; i < gtxt.length ; i++){
		var na = getNumberArray(gtxt[i]);
		gx += na.length;
		geoidGridLine = geoidGridLine.concat(na);
		if ( gx >= dataProps.nlo ){
			geoidGrid.push(geoidGridLine);
			geoidGridLine=[];
			gx=0;
		}
	}
}

function buildImage(geoidGrid, canvas){
	//
	canvas.width=dataProps.nlo;
	canvas.height=dataProps.nla;

	var context = canvas.getContext('2d');
	var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	var pixels = imageData.data;
	for ( var py = 0 ; py < dataProps.nla ; py++ ){
		var dy = dataProps.nla - 1 - py
		for ( var px = 0 ; px < dataProps.nlo ; px++ ){
			var base = (dy * dataProps.nlo + px) * 4;
			if ( geoidGrid[py][px]!=999){
				
				var hue = (1-(geoidGrid[py][px]-dataProps.minVal)/(dataProps.maxVal-dataProps.minVal))*270;
				var rgb = HSVtoRGB(hue,255,255);
				
				pixels[base + 0] = rgb.r;  // Red
				pixels[base + 1] = rgb.g;  // Green
				pixels[base + 2] = rgb.b;  // Blue
				pixels[base + 3] = 255;  // Alpha
			}
		}
	}
	context.putImageData(imageData, 0, 0);
	
	var duri = canvas.toDataURL('image/png');
	return ( duri );
}

function getHeader(line){
	var datas = parseLine(line);
	return {
		glamn:Number(datas[0]),
		glomn:Number(datas[1]),
		dgla:Number(datas[2]),
		dglo:Number(datas[3]),
		nla:Number(datas[4]),
		nlo:Number(datas[5]),
		ikind:Number(datas[6]),
		vern:datas[7],
		minVal:9e99,
		maxVal:-9e99
	}
}

function getNumberArray(line){
	var ans = [];
	var lineArray = parseLine( line );
	for ( var col of lineArray){
		var val = Number(col);
		if ( val != 999){
			if ( val > dataProps.maxVal){
				dataProps.maxVal=val;
			}
			if ( val < dataProps.minVal){
				dataProps.minVal=val;
			}
		}
		ans.push(val);
	}
	return ( ans );
}

function parseLine(line){
	var ans = line.trim().split(/\s+/)
	return (ans);
}


async function loadText(url){ // テキストデータをfetchで読み込む
	messageDiv.innerText="ジオイド高データを読み込み中です";
	var response = await fetch(url);
	var txt = await response.text();
	messageDiv.innerText="";
	return ( txt );
}

function HSVtoRGB (h, s, v) { // from http://d.hatena.ne.jp/ja9/20100903/1283504341
	var r, g, b; // 0..255
	while (h < 0) {
		h += 360;
	}
	h = h % 360;
	
	// 特別な場合 saturation = 0
	if (s == 0) {
		// → RGB は V に等しい
		v = Math.round(v);
		return {'r': v, 'g': v, 'b': v};
	}
	s = s / 255;
	
	var i = Math.floor(h / 60) % 6,
	f = (h / 60) - i,
	p = v * (1 - s),
	q = v * (1 - f * s),
	t = v * (1 - (1 - f) * s);

	switch (i) {
	case 0 :
		r = v;  g = t;  b = p;  break;
	case 1 :
		r = q;  g = v;  b = p;  break;
	case 2 :
		r = p;  g = v;  b = t;  break;
	case 3 :
		r = p;  g = q;  b = v;  break;
	case 4 :
		r = t;  g = p;  b = v;  break;
	case 5 :
		r = v;  g = p;  b = q;  break;
	}
	return {'r': Math.round(r), 'g': Math.round(g), 'b': Math.round(b)};
}


// 以下はSVGMapレイヤーとして動かしたときに有効になる関数
var CRSad = 100; // svgmapコンテンツのCRSきめうち・・
function  buildSvgImage(imageDataUri,imageParam){
	// dataURLを受け取って、SVGMapコンテンツに画像を張り付ける
	var rct = svgImage.createElement("image");
	rct.setAttribute("x", imageParam.lng0 * CRSad);
	rct.setAttribute("y", -(imageParam.lat0 + imageParam.latSpan) * CRSad);
	rct.setAttribute("width", imageParam.lngSpan * CRSad);
	rct.setAttribute("height", imageParam.latSpan * CRSad);
	rct.setAttribute("xlink:href",imageDataUri);
	rct.setAttribute("style","image-rendering:pixelated"); // メッシュデータなので拡大次画像のピクセルをくっきりさせる
	var root = svgImage.documentElement;
	root.appendChild(rct);
}