# 令和8年熊本地震 医療・福祉施設被害 LaWA

厚生労働省「令和8年熊本地震について（第37報）」の市町村別表を正規化したS-LaWAです。

- 掲載ページ: `https://www.mhlw.go.jp/stf/newpage_75017.html`
- 出典PDF: `https://www.mhlw.go.jp/content/001733600.pdf`
- 形式: PDFを手作業で正規化したJavaScriptスナップショット
- 時点: 第37報（2026-08-05 08:00現在）
- CORS: 最新版確認のため `www.mhlw.go.jp` の `/stf/` を `svgMap.getCORSURL()` 経由で取得します。PDF自体はブラウザーで解析しません。

医療施設は第37報の市町村表全19自治体、高齢者施設は数値を検証できた21自治体を表示します。地点は自治体代表点です。掲載ページに新しい報告がある場合は画面に更新警告を出します。

```sh
npm test -- --config appLayers/r8kumamoto/medicalWelfare/jest.config.js --runInBand
```
