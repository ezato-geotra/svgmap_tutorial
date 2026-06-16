// Description:
// メッシュ情報を読み込み表示するLaWA その１
// Programmed by Satoru Takagi

var csvPath = "mesh.csv";

var csvLines, csvProps;

addEventListener("load",async function(){
	csvLines = await getText(csvPath);
	csvLines = csvLines.split("\n");
	csvProps=getCsvProps(csvLines[0]);
	vminI.value=csvProps.minVal;
	vmaxI.value=csvProps.maxVal;
	getRange();
	drawMesh(csvLines, csvProps);
});

function drawMesh(csvLines, csvProps, minVal, maxVal){
	if (!minVal){
		minVal = csvProps.minVal;
	}
	if (!maxVal){
		maxVal = csvProps.maxVal;
	}
	for ( var i = 1 ; i < csvProps.partY + 1 ; i++ ){
		var strTxt = csvLines[i].split(",");
		for ( var j = 0 ; j < csvProps.partX ; j++ ){
			if ( strTxt[j].replace(/\s+/g, "") !=""){
				var val = Number(strTxt[j]);
				setMesh( j , i-1 , val, csvProps, minVal, maxVal );
			}
		}
	}
	svgMap.refreshScreen();
}

function setMesh( xp , yp , value, csvProps, minVal, maxVal ){
//		console.log("call getMesh:");
	var color = getColor(value, minVal, maxVal);
	var cl = svgImage.getElementById(xp+":"+yp);
	if ( cl ){
		cl.setAttribute("fill" , color);
	} else {
		var xd = csvProps.minX + xp * csvProps.twd; // rectの西
		var yd = csvProps.maxY - yp * csvProps.thd; // rectの北
		
		cl = document.createElement("rect"); // Should be used NS ( for Firefox!!)
		cl.setAttribute("x" ,  100 * xd );
		cl.setAttribute("y" , -100 * yd );
		cl.setAttribute("width" , 100 * csvProps.twd );
		cl.setAttribute("height" , 100 * csvProps.thd );
		cl.setAttribute("content" , value);
		cl.setAttribute("fill" , color);
		cl.setAttribute("id", xp+":"+yp);
		svgImage.getElementsByTagName("svg")[0].appendChild(cl);
	}
}

function getCsvProps(headerLine){
	var hp = getHeaderParams( headerLine );
	console.log("sc_param:",hp);
	svgImage.documentElement.setAttribute("property", hp.valName);
	
	csvProps={
		minX: Number(hp.minX),
		maxX: Number(hp.maxX),
		minY: Number(hp.minY),
		maxY: Number(hp.maxY),
		minVal: Number(hp.minVal),
		maxVal: Number(hp.maxVal),
		partX: Number(hp.partX),
		partY: Number(hp.partY),
	}
	
	csvProps.twd = ( csvProps.maxX - csvProps.minX ) / csvProps.partX;
	csvProps.thd = ( csvProps.maxY - csvProps.minY ) / csvProps.partY;
	
	return ( csvProps );
	updateTile();
}

function getHeaderParams( hash ){
	hash = hash.split(",");
	for ( var i = 0 ; i < hash.length ; i++ ){
		hash[i] = hash[i].split(":");
		if ( hash[i][1] ){
			hash[hash[i][0]] = hash[i][1];
		} else {
			hash[hash[i][0]] = true;
		}
	}
	return ( hash );
}

async function getText(path){
	var response = await fetch(path);
	var txt = await response.text();
	return ( txt );
}

function getColor( val, minVal, maxVal ){
	
	// value clip
	if ( val > maxVal ){
		val = maxVal;
	}
	if ( val < minVal ){
		val = minVal;
	}
	
	// Hue値の算出(最大値:H=0(赤) , 最小値:H=270(青紫) 逆周り)
	var h = 270 - 270 * (val - minVal) / (maxVal - minVal);
	
	var ans = HSVtoRGB (h, 255, 255);
	
	return ("#"+ pad16(ans.r) + pad16(ans.g) + pad16(ans.b));
}

function pad16( val ){
	var bv =  "00" + val.toString(16);
	bv = bv.substr(bv.length - 2, 2);
	return ( bv );
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


function getRange(){
	if ( isNaN(vminI.value) || isNaN(vmaxI.value) ){return}
	var minVal = Number(vminI.value);
	var maxVal = Number(vmaxI.value);
	if ( minVal > maxVal){[minVal, maxVal] = [maxVal, minVal]}
	
	document.getElementById("scalemin").innerHTML = minVal.toPrecision(5);
	document.getElementById("scalemax").innerHTML = maxVal.toPrecision(5);
	document.getElementById("scalemid").innerHTML = ((maxVal + minVal)/2.0).toPrecision(5);
	return{minVal,maxVal}
}

function setRange(){
	var range=getRange();
	drawMesh(csvLines, csvProps, range.minVal, range.maxVal);
}
