# Cafe Timer 2

ブルーアーカイブの「カフェ」のタップ間隔・チケットを管理するタイマー、絆ランクの記録、通知を提供する Web アプリです(PWA)。
Cloudflare Workers(API と静的ファイル配信)+ Firebase(認証・通知)+ Google Drive(ユーザーのデータ保存)で動きます。

- **ファイルごとの仕様・API・保存データ**: `doc/manual.md` と `doc/manual.pdf`(手元の保守用で Git には含めません。コードを変えたら一緒に更新し、`node scripts/spec-pdf.mjs` で PDF も作り直してください)
- 取り込みファイルの形式: [doc/import-file.md](doc/import-file.md)
- 初期の設計と開発計画: [doc/renewal plan.md](doc/renewal%20plan.md)

## 機能

| 画面 | 内容 |
|---|---|
| タイマー | 最後のタップからの経過・次回タップ可能時刻(3 時間間隔)、チケット(20 時間クールダウン)の残り時間。タップの記録 |
| カレンダー | 月ごとのタップ履歴。日付を選ぶとその日のタップを表示(横長の画面ではタイマーと並べて表示) |
| 絆 | 生徒ごとの絆ランクを日付付きで記録。履歴、累計 EXP の推移グラフと予測、好きな贈り物(画像と効果の強さ)の一覧 |
| 設定 | テーマ・アクセントカラー、言語(日本語 / English / 한국어 / 中文)、通知のオン・オフ、データの取り込み・書き出し、アカウントの削除 |

- 一日と月の区切りは **JST 4:00**(ゲーム内の日付変更に合わせています)。
- 通知は、タップの **3 時間後** に届きます。ただし 4:00 / 16:00(カフェの収益が更新される時刻)をまたぐ場合は予約しません。
- タップ・チケットは押した時点で端末に保存して完了とし、サーバーへは裏で届くまで送ります(オフラインでも記録できます)。

## 全体構造

```
ブラウザ (PWA)                         Cloudflare Workers                    外部サービス
┌────────────────────────┐   /api/*   ┌──────────────────────┐
│ public/ の静的ファイル  │ ─────────▶ │ src/worker.js        │ ──▶ Google Drive (appDataFolder)
│  index.html, dist/      │            │  ・ID トークン検証    │      ユーザーごとの記録を保存
│                         │ ◀───────── │  ・回数制限・ルーティング │
│ Firebase Auth で        │            │ src/drive.js         │ ──▶ Firestore (REST)
│ Google ログイン         │            │ src/firebase.js      │      通知先と送信予約
│ FCM でプッシュ受信      │ ◀─ Push ── │  ・Firestore / FCM    │ ──▶ FCM HTTP v1 (Web Push)
└────────────────────────┘            │ cron: 毎分           │
                                      └──────────────────────┘
```

- **静的ファイル**は Workers の Static Assets(`public/`)が配信し、`/api/*` だけ Worker が処理します。
- **ユーザーの記録は、各自の Google Drive の appDataFolder** に保存します。Drive 連携はブラウザで認可コードだけを受け取り、サーバーがリフレッシュトークンを暗号化して保管します(トークンはブラウザに残しません)。
- **Firestore** には、通知先・通知予約・暗号化したリフレッシュトークン・匿名の集計だけを置きます。クライアントから Firestore には直接アクセスしません(セキュリティルールは全拒否)。
- API 呼び出しには `Authorization: Bearer <Firebase ID トークン>` を付けます。Worker が署名・有効期限・発行元を検証して `uid` を得ます。

## ディレクトリ構成

```
public/                     静的ファイル (そのまま配信される)
  index.html / demo.html    アプリ本体 / 使い方ガイド用のデモ
  admin/index.html          管理画面 (タブで切り替え)
  js/                       画面の JS (ビルドで dist/ に束ねる。各ファイルの役割は doc/manual.md)
  css/  lang/  img/         スタイル・文言 (4 言語)・画像
  _headers                  セキュリティヘッダー (CSP)
src/
  worker.js                 API のルーティング・回数制限・cron
  drive.js                  Drive のトークン管理と appDataFolder の読み書き
  firebase.js               ID トークン検証・Firestore・FCM・Firebase Auth
  gamedata.js               ゲームデータ本体 (絆 EXP 表・贈物・キャラ・名前)
scripts/build.mjs           ビルド
test/                       テスト
doc/                        仕様書・設計書
```

## セットアップ

1. Firebase プロジェクトで Authentication(Google)・Firestore(ルール全拒否)・Cloud Messaging を有効化します。Google Cloud で Drive API を有効化し、OAuth 同意画面に `drive.appdata` を追加します。
2. 公開設定を [public/js/config.js](public/js/config.js) に書きます(`firebaseConfig`、`GOOGLE_CLIENT_ID`、`VAPID_KEY`)。`wrangler.toml` の `FIREBASE_PROJECT_ID` も合わせます。
3. Worker 専用のサービスアカウントを作り、「Cloud Datastore ユーザー」「Firebase Cloud Messaging API 管理者」「Firebase Authentication 閲覧者」のロールを付けて、鍵(JSON)を登録します。
   - 本番: `Get-Content <鍵.json> -Raw | npx wrangler secret put FIREBASE_SERVICE_ACCOUNT`(登録後、鍵のファイルは削除します)
   - ローカル: `.dev.vars` に `FIREBASE_SERVICE_ACCOUNT='<JSON を 1 行にしたもの>'`
4. Drive の認証を維持するための秘密情報を登録します(本番は `npx wrangler secret put <名前>`、ローカルは `.dev.vars`)。
   - `GOOGLE_CLIENT_SECRET`: Google Cloud の OAuth ウェブクライアントのシークレット
   - `TOKEN_ENC_KEY`: 暗号鍵。`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` で作ります
   - OAuth 同意画面は「本番」に公開してください(「テスト」のままだとリフレッシュトークンが 7 日で失効します)
5. 管理画面を使う場合は、管理者の uid を `ADMIN_UIDS`(カンマ区切り)に登録します。

## 実行

```
npm install
npx wrangler dev                    # ローカル (http://localhost:8787)
npx wrangler dev --test-scheduled   # cron を手動で起動できるローカル実行
npx wrangler deploy                 # デプロイ
npm test                            # テスト
```

`wrangler dev` / `wrangler deploy` は、先に `npm run build`([scripts/build.mjs](scripts/build.mjs))を自動で実行し、`public/js` と `public/css/app.css` を `public/dist/` と `public/firebase-messaging-sw.js` に束ねます(どちらも Git に含めません)。

`--test-scheduled` で起動した場合、別のターミナルから次のコマンドで cron を 1 回実行できます。

```
curl.exe "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

## 免責事項
本ツールは個人による非公式のファンメイドサイトであり、株式会社NEXON、株式会社Yostar、およびその他の全ての関連会社とは一切関係ありません。
