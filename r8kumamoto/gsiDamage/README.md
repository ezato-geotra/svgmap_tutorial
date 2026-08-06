# 令和8年熊本地震 正射画像・斜面崩壊 LaWA

国土地理院の被災後正射画像（XYZ PNG）と、斜面崩壊・堆積分布（GeoJSON）を表示するT-LaWAです。

- データ: `https://maps.gsi.go.jp/xyz/20260729kumamoto_.../`
- 掲載ページ: `https://www.gsi.go.jp/BOUSAI/20260728_kumamoto_earthquake.html`
- 確認日: 2026-08-05
- ライセンス: 国土地理院コンテンツ利用規約。画面上に出典を表示します。
- CORS: `maps.gsi.go.jp` の `/xyz/` を `svgMap.getCORSURL()` 経由で取得します。

正射画像は表示範囲・ズームに応じてタイルを差し替えます。斜面分布は空中写真判読であり、現地調査結果ではありません。

```sh
npm test -- --config appLayers/r8kumamoto/gsiDamage/jest.config.js --runInBand
```
