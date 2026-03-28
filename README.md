# ja-ucp-ogp

日本語版アンサイクロペディア公式SNSアカウント運用のための OGP 代替画像ジェネレーター。

アンサイクロペディアは OGP メタタグに非対応のため、Twitter/X にリンクを貼ってもリンクカードが表示されない。本ツールは記事情報を含む OGP 画像 (1200x630px) を生成し、ツイートに画像として添付することでこの問題を回避する。

## インストール

```bash
npm install -g @kongyo2/ja-ucp-ogp
```

または npx で直接実行:

```bash
npx @kongyo2/ja-ucp-ogp -t "記事名" -d "概要文"
```

## 使い方

### CLI モード

オプションを指定して直接生成:

```bash
ja-ucp-ogp -t "エクストリーム・アイロニング" -d "人里離れた場所でアイロン台を広げ、衣類にアイロンをかけるエクストリームスポーツ。"
```

出力例:

```
✅ 生成完了: C:\Users\you\output\エクストリーム・アイロニング.png
   URL表示: ansaikuropedia.org/wiki/エクストリーム・アイロニング
```

#### オプション一覧

| オプション                 | 説明                                             | 必須               |
| -------------------------- | ------------------------------------------------ | ------------------ |
| `-t, --title <title>`      | 記事タイトル                                     | CLI モードでは必須 |
| `-d, --description <desc>` | 概要文                                           | CLI モードでは必須 |
| `-i, --image <path>`       | 添付画像パス                                     | 省略可             |
| `-o, --output <path>`      | 出力先パス (デフォルト: `output/<タイトル>.png`) | 省略可             |
| `-f, --font <path>`        | カスタムフォントファイルパス                     | 省略可             |

### インタラクティブモード

オプションなしで起動すると対話型 UI が表示される:

```bash
ja-ucp-ogp
```

4 ステップで入力を案内:

1. 記事タイトル
2. 概要文
3. 画像パス (Enter でスキップ)
4. 出力先パス (Enter でデフォルト)

### 画像付きレイアウト

`-i` で画像を指定すると、左にテキスト・右に画像のレイアウトで生成される:

```bash
ja-ucp-ogp -t "日本" -d "極東の島国。" -i ./photo.jpg
```

## 生成される画像

- サイズ: 1200x630px (Twitter/X 推奨 OGP サイズ)
- フォーマット: PNG
- URL 表示: `ansaikuropedia.org/wiki/<記事名>`
- デザイン: ダーク基調 + ゴールドアクセントのグラスモーフィズム

### フォント

以下の順でシステムフォントを自動検出する (Windows):

1. メイリオ
2. 游ゴシック
3. MS ゴシック

見つからない場合は `sans-serif` にフォールバックする。`-f` オプションで任意のフォントファイルを指定可能。

## 開発

```bash
git clone https://github.com/kongyo2/ja-ucp-ogp.git
cd ja-ucp-ogp
npm install
```

### スクリプト

| コマンド                                | 説明                               |
| --------------------------------------- | ---------------------------------- |
| `npm run generate`                      | 開発用実行 (tsx)                   |
| `npm run generate -- -t "..." -d "..."` | CLI モードで開発用実行             |
| `npm run build`                         | TypeScript ビルド (`dist/` に出力) |
| `npm run typecheck`                     | 型チェックのみ (出力なし)          |
| `npm run lint`                          | oxlint でリント                    |
| `npm run lint:strict`                   | 警告もエラー扱いでリント           |
| `npm run format`                        | Prettier でフォーマット            |
| `npm run format:check`                  | フォーマットチェック               |


## ライセンス

MIT
