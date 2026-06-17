// Description:
// メッシュ情報を読み込み表示するLaWA　その２
// Programmed by Satoru Takagi


var meshCsvHd = "meshTiles/";
var topCsv = meshCsvHd+"top.csv";

var tileThScale = 8;

onload=function(){
	document.addEventListener("zoomPanMap", updateLayer,false);
	updateLayer();
}

function updateLayer(){
	// 縮尺と領域に応じてデータDL・地図を描画する。
	
	var tileURLs;
	var geoViewBox = svgMap.getGeoViewBox();
	
	// 表示すべきタイルを縮尺と領域に基づいてリストアップする
	console.log(svgImageProps.scale);
	if ( svgImageProps.scale > tileThScale ){
		// 大縮尺の分割タイルデータを表示する
		tileURLs= getTileURLs(geoViewBox);
	} else {
		// 小縮尺のtopCsvデータを表示する
		tileURLs=[topCsv];
	}
	
	var maintainImages={}; // 保持すべきタイルを保持する配列
	var prevImages=svgImage.getElementsByTagName("g"); // 1ステップ前までに描画完了しているタイルたち
	for ( var i = prevImages.length-1 ; i >=0  ; i-- ){ // 1ステップ前のコンテンツで維持すべきものと消すべきものを選別する
		var dataSrc = prevImages[i].getAttribute("data-src");
		if ( tileURLs.indexOf(dataSrc)>=0 ){ // 読むべきコンテンツで1ステップ前にあるものは維持
			maintainImages[dataSrc]=true;
		} else { // それ以外は消去
			prevImages[i].remove();
		}
	}
	
	// 読み込むべきタイルで1ステップ前に読み込まれていないタイルを読み込ませる
	for ( var i = 0 ; i < tileURLs.length ; i++ ){
		var durl = tileURLs[i];
		if ( maintainImages[durl] ){
			// skip loading
		} else {
			showTileMap( durl );
		}
	}
}

function getTileURLs(geoViewBox){ 
	// 表示領域の中にあるメッシュ調べ、そのファイルをリストアップ
	var tileURLs= getMeshArray(geoViewBox, 1);
	for ( var i = 0 ; i < tileURLs.length ; i++ ){
		tileURLs[i]=meshCsvHd + tileURLs[i] + ".csv";
	}
	return (tileURLs);
}

async function showTileMap(url){
	// タイルデータを読み込んでパースし、画像生成ルーチンに渡す
	var txtData = await loadText(url);
	
	var rowData = txtData.split(/[\r\n]+/);
	// 1行目はタイルのメッシュ番号
	var meshData ={}; // メッシュ番号をKeyとした連想配列としてメッシュデータを構築　Valは自治体コードの配列(複数の自治体に属するものがあるため配列)
	for ( var i = 1 ; i < rowData.length ; i++ ){
		var colData = rowData[i].split(",");
		// 1カラム目は自治体コード、2カラム目からがメッシュ番号の断片（タイルのメッシュ番号を加えてメッシュ番号になる）
		for ( var j = 1 ; j<colData.length ; j++){
			var meshNumb = rowData[0]+colData[j]; // タイルのメッシュ番号に断片を加えメッシュ番号を生成
			if ( meshData[meshNumb]){ // 複数の自治体に属するメッシュ
				meshData[meshNumb].push(colData[0]);
			} else {
				meshData[meshNumb]=[colData[0]];
			}
		}
	}
	buildMeshTileSvg(meshData, url);
}

function buildMeshTileSvg(meshs, sourceID){
	var tileGroup =  svgImage.createElement("g");
	tileGroup.setAttribute("data-src",sourceID);
	
	for ( var meshNumb in  meshs ){
		var gxy = mesh2LatLng(meshNumb); // .latitude,.longitude,.latSpan,.lngSpan
		
		var rect = svgImage.createElement("rect");
		rect.setAttribute("x",gxy.longitude * 100);
		rect.setAttribute("y",(gxy.latitude + gxy.latSpan) * -100);
		rect.setAttribute("width",gxy.lngSpan * 100);
		rect.setAttribute("height",gxy.latSpan * 100);
		rect.setAttribute("content",meshs[meshNumb].join(" "));
//		var fillHue = getHue(meshs[meshNumb][0]);
		var RGBs=[];
		for ( lgCode of meshs[meshNumb]){
			RGBs.push(HSVtoRGB(getHue(lgCode),255,255));
		}
		var fillColor = getColorString(blendColor(RGBs));
//		var fillColor = getColorString(HSVtoRGB(fillHue,255,255));
		rect.setAttribute("fill",fillColor);
		//rect.setAttribute("fill","red");
		
		tileGroup.appendChild(rect);
	}
	svgImage.documentElement.appendChild(tileGroup);
	svgMap.refreshScreen();
}

function blendColor(colors){ // 加色混合
	var ans={r:0,g:0,b:0};
	for ( color of colors ){
		ans.r += color.r;
		ans.g += color.g;
		ans.b += color.b;
	}
	ans.r = Math.floor(ans.r / colors.length);
	ans.g = Math.floor(ans.g / colors.length);
	ans.b = Math.floor(ans.b / colors.length);
	return ( ans );
}

async function loadText(url){ // テキストデータをfetchで読み込む
	var response = await fetch(url);
	var txt = await response.text();
	return ( txt );
}


// ===================================================================================
// 以下は地域基準メッシュライブラリ

var m1LatSpan = 1/1.5, m1LngSpan = 1;
var m2LatSpan = m1LatSpan/8, m2LngSpan = m1LngSpan/8;
var m3LatSpan = m2LatSpan/10, m3LngSpan = m2LngSpan/10;
var m4LatSpan = m3LatSpan/2, m4LngSpan = m3LngSpan/2;

function mesh2LatLng( meshStr ){
	// mesh4は定義が怪しい
	var latitude,longitude; // south,east corne
	var latSpan,lngSpan;
	var m1Lat,m1Lng,m2Lat,m2Lng,m3Lat,m3Lng,m4;
	if ( meshStr.length > 3){
		m1Lat = Number(meshStr.substring(0,2));
		m1Lng = Number(meshStr.substring(2,4));
		latitude  = m1Lat / 1.5;
		longitude = 100 + m1Lng;
		latSpan = m1LatSpan;
		lngSpan = m1LngSpan;
		if ( !latitude || !longitude ){
			return {
				latitude : null,
				longitude : null
			}
		}
		if ( meshStr.length > 5 ){
			m2Lat = Number(meshStr.substring(4,5));
			m2Lng = Number(meshStr.substring(5,6));
			latitude  += m2Lat * m2LatSpan;
			longitude += m2Lng * m2LngSpan;
			latSpan = m2LatSpan;
			lngSpan = m2LngSpan;
			if ( meshStr.length > 7 ){
				m3Lat = Number(meshStr.substring(6,7));
				m3Lng = Number(meshStr.substring(7,8));
				latitude  += m3Lat * m3LatSpan;
				longitude += m3Lng * m3LngSpan;
				latSpan = m3LatSpan;
				lngSpan = m3LngSpan;
				if ( meshStr.length == 9 ){
					m4 = meshStr.substring(8);
					switch(m4){
					case "1":
						// do nothing
						break;
					case "2":
						longitude += m4LngSpan;
						break;
					case "3":
						latitude += m4LatSpan;
						break;
					case "4":
						latitude += m4LatSpan;
						longitude += m4LngSpan;
						break;
					}
					latSpan = m4LatSpan;
					lngSpan = m4LngSpan;
				}
			}
		}
	}
	return {
		latitude: latitude,
		longitude: longitude,
		latSpan : latSpan,
		lngSpan : lngSpan
	}
}

function latLng2Mesh(lat,lng,meshLevel){
	lat = lat*1.5;
	lng = lng - 100;
	var m1Lat = Math.floor(lat);
	var m1Lng = Math.floor(lng);
	
	if ( meshLevel==1){
		return ( m1Lat.toString() + m1Lng.toString() );
	}
	
	lat = lat - m1Lat;
	lng = lng - m1Lng;
	
	lat = lat * 8;
	lng = lng * 8;
	
	var m2Lat = Math.floor(lat);
	var m2Lng = Math.floor(lng);
	
	if ( meshLevel==2){
		return ( m1Lat.toString() + m1Lng.toString() + m2Lat.toString() + m2Lng.toString() );
	}
	
	lat = lat - m2Lat;
	lng = lng - m2Lng;
	
	lat = lat * 10;
	lng = lng * 10;

	var m3Lat = Math.floor(lat);
	var m3Lng = Math.floor(lng);
	
	if ( meshLevel==3){
		return ( m1Lat.toString() + m1Lng.toString() + m2Lat.toString() + m2Lng.toString() + m3Lat.toString() + m3Lng.toString() );
	}
	
	lat = lat - m3Lat;
	lng = lng - m3Lng;
	
	lat = lat * 2;
	lng = lng * 2;

	var m4Lat = Math.floor(lat);
	var m4Lng = Math.floor(lng);
	var m4Num = 1;
	if ( m4Lat==1 ){
		m4Num += 2;
	}
	if ( m4Lng==1 ){
		m4Num += 1;
	}
	
	if ( meshLevel==4){
		return ( m1Lat.toString() + m1Lng.toString() + m2Lat.toString() + m2Lng.toString() + m3Lat.toString() + m3Lng.toString() + m4Num.toString() );
	}
	
	return (null);
}



function getMeshArray(geoBbox, meshLevel){
	var latStep, lngStep;
	if ( meshLevel == 1 ){
		latStep = m1LatSpan;
		lngStep = m1LngSpan;
	} else if ( meshLevel == 2 ){
		latStep = m2LatSpan;
		lngStep = m2LngSpan;
	} else if ( meshLevel == 3 ){
		latStep = m3LatSpan;
		lngStep = m3LngSpan;
	} else if ( meshLevel == 4 ){
		latStep = m4LatSpan;
		lngStep = m4LngSpan;
	} else {
		return ( null );
	}
		
	var ans = [];
	for ( var mx = geoBbox.x ; mx < geoBbox.x + geoBbox.width + lngStep ; mx += lngStep){
		if ( mx > geoBbox.x + geoBbox.width ){
			mx = geoBbox.x + geoBbox.width;
		}
	// geoBbox(.x,.y,.wjdth,.height)を包含する最小のメッシュコードのリストを返す
		for ( var my = geoBbox.y ; my < geoBbox.y + geoBbox.height + latStep ; my += latStep){
			if ( my > geoBbox.y + geoBbox.height ){
				my = geoBbox.y + geoBbox.height;
			}
//			console.log(mx,my);
			ans[latLng2Mesh(my,mx,meshLevel)]=true;
		}
	}
	
	var ans2=[];
	for ( mesh in ans ){
		ans2.push(mesh);
	}
	
	return ( ans2 );
}

// ===================================================================================


function getHue(str){ // 文字列からハッシュ関数(jenkinsOneAtATimeHash)を使って適当なHUE値(0..359)を得る
	return(jenkinsOneAtATimeHash(str)%360);
}

//https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
//Credits (modified code): Bob Jenkins (http://www.burtleburtle.net/bob/hash/doobs.html)
//See also: https://en.wikipedia.org/wiki/Jenkins_hash_function
//Takes a string of any size and returns an avalanching hash string of 8 hex characters.
function jenkinsOneAtATimeHash(keyString){
	let hash = 0;
	for (charIndex = 0; charIndex < keyString.length; ++charIndex){
		hash += keyString.charCodeAt(charIndex);
		hash += hash << 10;
		hash ^= hash >> 6;
	}
	hash += hash << 3;
	hash ^= hash >> 11;
	//4,294,967,295 is FFFFFFFF, the maximum 32 bit unsigned integer value, used here as a mask.
	return (((hash + (hash << 15)) & 4294967295) >>> 0);
};

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

function getColorString(rgb){
	return ("#"+ pad16(rgb.r) + pad16(rgb.g) + pad16(rgb.b));
}

function pad16( val ){
	var bv =  "00" + val.toString(16);
	bv = bv.substr(bv.length - 2, 2);
	return ( bv );
}