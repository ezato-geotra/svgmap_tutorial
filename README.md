# SVGMap チュートリアル

[SVGMap チュートリアル](https://www.svgmap.org/wiki/index.php?title=%E3%83%81%E3%83%A5%E3%83%BC%E3%83%88%E3%83%AA%E3%82%A2%E3%83%AB) を学習した際の実装内容をまとめたリポジトリです。

[GitHub Pages](https://ezato-geotra.github.io/svgmap_tutorial/) で実装したものを確認できます。

## Github Pagesで確認できないページについて
「svgmapAppLayers GitHub Pagesの利用」は`Docker`でプロキシの設定を行っている関係上、静的ページである`GitHub Pages`で実行できないため、`Docker`で実行する必要があります。

### Dockerの利用方法
`Docker`コマンド

#### 起動
```bash
docker compose up -d --build
```

#### 停止
```bash
docker compose down
```

#### Proxy が動いてるか確認する方法
`Docker` を起動した状態で下記URLにアクセス

[Example Domain](http://localhost:8080/corsaw/proxy.php?csurl=https://example.com/)

画面が正常に表示されればOK