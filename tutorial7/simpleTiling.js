// Description:
// タイリングメカニズムを実装したLaWA
// Programmed by Satoru Takagi

addEventListener("load",init);
addEventListener("zoomPanMap",zpmFunc);

var latCol=1;
var lngCol=0;
var tilesTh=8; // 画面の中に入るタイルの枚数の閾値（縮小すると読み込むタイルが多くなりすぎ重くなるのを防ぐ）

function init(){
    zpmFunc();
}

function getTileList(geoViewBox){
    var tileNames={};
    for ( var ty = Math.floor(geoViewBox.y) ; ty<= Math.floor(geoViewBox.y+geoViewBox.height) ; ty++){
        for ( var tx = Math.floor(geoViewBox.x) ; tx <= Math.floor(geoViewBox.x+geoViewBox.width) ; tx++){
            var tile="tile_" + tx + "_" + ty;
            tileNames[tile]=true;
        }
    }
    return (tileNames);
}

var tiles={}; // データ(CSVを配列化したもの)をタイルごとに格納する変数

async function zpmFunc(){
    var geoViewBox = svgMap.getGeoViewBox();
    var tileList=getTileList(geoViewBox);

    if (Object.keys(tileList).length < tilesTh ){
        for ( var tileKey in tiles ){ // 必要ないデータを消す
            if ( !tileList[tileKey]){
                delete tiles[tileKey];
            }
        }
        for ( var tileKey in tileList ){ // 不足しているデータを読み込む
            if ( !tiles[tileKey] ){
                tiles[tileKey]=await loadCSV(`tiles/${tileKey}.csv`); // テンプレートリテラル
            }
        }
        message.innerText="-";
        drawTiles(tileList);
    } else {
        message.innerText="Too many tiles, please zoom in.";
        removeAllTiles();
    }
}

function removeAllTiles(){
    tiles={};
    var groups = svgImage.getElementById("mapTiles").children;
    for ( var i = groups.length -1 ; i >= 0 ; i-- ){
        groups[i].remove();
    }
    svgMap.refreshScreen();
}

function drawTiles(tileList){
    // tileList:表示すべきタイルのキー(ID)の連想配列
    var tileGroup = svgImage.getElementById("mapTiles");
    var groups = tileGroup.children;
    for ( var i = groups.length -1 ; i >= 0 ; i-- ){
        var groupKey = groups[i].getAttribute("id");
        if ( !tileList[groupKey]){
            groups[i].remove(); // 表示する必要のないグループは消す
        } else {
            delete tileList[groupKey]; // すでに描画済みのタイルなのでtileListから消す
        }
    }
    // tileListは、新たに描画すべきタイルのリストとなった
    for ( var tileKey in tileList){
        var grp = svgImage.createElement("g");
        grp.setAttribute("id",tileKey);
        tileGroup.appendChild(grp);
        if ( tiles[tileKey] ){
            var geoJson = csv2geojson(tiles[tileKey], lngCol, latCol);
            svgMapGIStool.drawGeoJson(geoJson, layerID, "", 0, "", "p0", "poi", "", grp);
        }

    }
    svgMap.refreshScreen();
}

var schema;

async function loadCSV(url){
    var response = await fetch(url);
    if ( response.ok ){
        var txt = await response.text();
        txt=txt.split(/[\r\n]+/);
        console.log(txt);
        var csv=[];
        var schemaLine = true;
        for ( line of txt){
            line = line.trim();
            if ( schemaLine ){
                schema = line;
                svgImage.documentElement.setAttribute("property",schema);
            } else {
                if ( line !=""){
                    line=line.split(",");
                    csv.push(line);
                }
            }
            schemaLine = false;
        }
        return ( csv );
    } else {
        return null;
    }
}

function csv2geojson(csvArray, lngCol, latCol){
    var geoJson = {type: "FeatureCollection",  features: []}
    for ( var csvRecord of csvArray ){
        var lng = Number(csvRecord[lngCol]);
        var lat = Number(csvRecord[latCol]);
        var feature = { type: "Feature",
            geometry: {
                type: "Point",
                "coordinates": [lng, lat]
            },
            "properties": {
                "csvMetadata": csvRecord.toString() // この処理は非常に雑です。
            }
        }
        geoJson.features.push(feature);
    }
    return(geoJson);
}