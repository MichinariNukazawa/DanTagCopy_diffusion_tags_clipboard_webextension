DanTagCopy - diffusion tags collecter from danbooru to clipboard WebExtensions
----

In danbooru page collect tags for diffusion prompt.  
danboooruページ上のタグをクリップボードにコピーするブラウザ拡張です。  
  
danbooruのページで見ている画像に付けられたタグを、整形してクリップボードに集めます。  
diffusionのプロンプトに使うタグを集める作業を単純化して呪文探しを助けます。  
FireFox,Chromeに対応しています。  
  

<img src="docs/20221014_example.png" width="500">  

タグはStableDifussion, NovelAIDiffusion向けに変換も行います。  

<img src="docs/20221024_popup.png" width="200">  

# 使い方
- 生成したい画像を思い浮かべながら[danbooru][danbooru]で画像を探す。
- 見つけた画像のページで右クリックしてDanTagCopyを実行。
- クリップボードにタグがコピーされる。
- StableDiffusion, NodelAIにプロンプトを貼り付けて画像を生成！

# Install
## Chrome
[Chrome Web Store][chrome]  
または、  
- zipファイルを[Download][Download]する。  
- zipファイルを解凍。  
- Chromeの拡張機能から「パッケージ化されていない拡張機能を読み込む」で解凍したディレクトリを指定する。  
## FireFox
[Firefox Add-ons][firefox]  
または、  
- zipファイルを[Download][Download]する。  
- FireFoxの拡張機能から「一時的なアドオンを読み込む」でダウンロードしたzipファイルを指定する。  


# License
Public Domain  


# TODO
- タグの自動カスタム
  - 自動タグソート(どのような順番に？)
  - 自動追加・除外タグリスト
低優先度・要検討
- 表記設定切り替え時にクリップボードへ反映  
- ブラウザシークレットモード対応  


# Develop
## Setup
Ubuntu環境で以下のコマンドを実行。
```
sudo apt install npm
npm install
```

## Build
以下のコマンドを実行。
```
npm run release
```


# Contact
mail: [michinari.nukazawa@gmail.com][mailto]  
twitter: [@MNukazawa][twitter]  

Develop by Michinari.Nukazawa, in project "[daisy bell][pixiv_booth_project_daisy_bell]".  

[chrome]: https://chrome.google.com/webstore/detail/dantagcopy/bnpbaljjkmiiglbgmbhkionpfkbnomlc
[firefox]: https://addons.mozilla.org/ja/firefox/addon/dantagcopy/
[danbooru]: https://danbooru.donmai.us/
[download]: https://github.com/MichinariNukazawa/DanTagCopy_diffusion_tags_clipboard_webextension/releases/
[pixiv_booth_project_daisy_bell]: https://daisy-bell.booth.pm/
[mailto]: mailto:michinari.nukazawa@gmail.com
[twitter]: https://twitter.com/MNukazawa
