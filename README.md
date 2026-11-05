# Cafe Timer 2

ブルーアーカイブの「カフェ」のタップ間隔・チケットを管理するタイマー、絆ランクの記録、通知を提供する Web アプリです(PWA)。
Cloudflare Workers(API と静的ファイル配信)+ Firebase(認証・通知)+ Google Drive(ユーザーのデータ保存)で動きます。

詳しい設計・開発計画は [doc/Cafe Timer リニューアル 設計書・開発計画.md](doc/Cafe%20Timer%20リニューアル%20設計書・開発計画.md)、取り込みファイルの形式は [doc/インポートファイル仕様.md](doc/インポートファイル仕様.md) を参照してください。

## 機能

| 画面 | 内容 |
|---|---|
| タイマー | 最後のタップからの経過・次回タップ可能時刻(3 時間間隔)、チケット(20 時間クールダウン)の残り時間。タップの記録 |
| カレンダー | 月ごとのタップ履歴。日付を選ぶとその日のタップを表示(横長の画面ではタイマーと並べて表示) |
| 絆 | 生徒ごとの絆ランクを日付付きで記録。履歴、累計 EXP の推移グラフと予測、好きな贈り物(画像と効果の強さ)の一覧 |
| 設定 | テーマ・アクセントカラー、言語(日本語 / English / 한국어 / 中文)、通知のオン・オフ、データの取り込み、アカウントの削除 |

- 一日と月の区切りは **JST 4:00**(ゲーム内の日付変更に合わせています)。
- 通知は、タップの **3 時間後** に届きます。ただし 4:00 / 16:00(カフェの収益が更新される時刻)をまたぐ場合は予約しません。
- 同じタップを 1 分以内に重ねて記録することはできません。

## 全体構造

```
ブラウザ (PWA)                         Cloudflare Workers                    外部サービス
┌────────────────────────┐   /api/*   ┌──────────────────────┐
│ public/ の静的ファイル  │ ─────────▶ │ src/worker.js        │ ──▶ Google Drive (appDataFolder)
│  index.html, js/, css/  │            │  ・ID トークン検証    │      ユーザーごとの記録を保存
│                         │ ◀───────── │  ・ルーティング       │
│ Firebase Auth で        │            │ src/drive.js         │ ──▶ Firestore (REST)
│ Google ログイン         │            │ src/firebase.js      │      通知先と送信予約
│ FCM でプッシュ受信      │ ◀─ Push ── │  ・Firestore / FCM    │ ──▶ FCM HTTP v1 (Web Push)
└────────────────────────┘            │ cron: 毎分           │
                                      └──────────────────────┘
```

- **静的ファイル**は Workers の Static Assets(`public/`)が配信し、`/api/*` だけ Worker が処理します([wrangler.toml](wrangler.toml) の `run_worker_first`)。
- **ユーザーの記録は、各自の Google Drive の appDataFolder** に保存します。サーバーはデータを保持せず、リクエストごとに渡される Drive のアクセストークンで読み書きするだけです。
- **Firestore** は通知のための最小限の情報(端末トークン・送信予約)にだけ使います。クライアントから Firestore には直接アクセスしません(セキュリティルールは全拒否)。

### 認証

1. ブラウザで Firebase Auth の Google ログインを行い、同時に Drive の `drive.appdata` スコープのアクセストークンを取得します([public/js/auth.js](public/js/auth.js))。
2. API 呼び出しには、2 つのトークンを付けます([public/js/api.js](public/js/api.js))。
   - `Authorization: Bearer <Firebase ID トークン>` … Worker が公開鍵(JWK)で署名・有効期限・発行元を検証し、`uid` を得ます。
   - `X-Drive-Token: <Drive アクセストークン>` … Drive を使う API だけで必要です。
3. Drive のトークンは期限が短いため、Google Identity Services で無音更新します。失敗した場合は再ログインの案内を出します。

### データ

**Google Drive(ユーザーごと)**

| ファイル | 内容 |
|---|---|
| `profile.json` | チケット時刻、タイムゾーン |
| `taps-YYYY-MM.json` | その月(JST 4:00 区切り)のタップ記録 |
| `relationship.json` | 絆ランクの記録(生徒キー・ランク・日付) |

**Firestore**

| コレクション | 内容 |
|---|---|
| `devices/{uid}` | 通知先の端末トークン(最大 10 件) |
| `pending/{id}` | 送信予約(`uid` と送信時刻) |

### 通知の仕組み

1. タップを記録すると([`POST /api/taps`](src/worker.js))、条件を満たす場合に `pending` へ送信予約(3 時間後)を作ります。
2. Worker の cron(毎分)が、送信時刻を過ぎた予約を探し、そのユーザーの端末へ FCM HTTP v1 で送信します([src/firebase.js](src/firebase.js) の `sendDueNotifications`)。
3. 無効になった端末トークンは、送信時に削除します。
4. 通知をオンにすると、ブラウザで取得した FCM トークンを `PUT /api/devices` で登録します([public/js/push.js](public/js/push.js))。
5. 画面を開いている間は、Service Worker ではなくページ側で通知を表示します(`showForegroundNotifications`)。

### API

| メソッド・パス | 内容 | Drive |
|---|---|---|
| `GET /api/bootstrap` | 起動時に必要なデータ(プロフィール・当月のタップ・絆)をまとめて取得 | 要 |
| `GET` / `POST /api/taps` | タップの取得 / 記録 | 要 |
| `PUT /api/profile` | チケット時刻・タイムゾーンの保存 | 要 |
| `GET` / `POST` / `DELETE /api/relationship` | 絆ランクの取得 / 追加 / 削除 | 要 |
| `GET /api/export` | データの書き出し(インポート可能な形式) | 要 |
| `POST /api/import` | データのインポート | 要 |
| `DELETE /api/account` | Drive 上のデータと通知情報の削除 | 要 |
| `PUT` / `DELETE /api/devices` | 通知先端末の登録 / 解除 | 不要 |
| `GET /api/gamedata` | 絆 EXP 表・キャラ・贈り物・各言語の名前(ログイン後に一度取得) | 不要 |

エラーは `{ error, code }` の JSON で返します。`code` が `id_token` / `drive_token` の場合、クライアントは再認証や再試行を行います。

### ゲームデータ

絆 EXP 表・贈り物・キャラ・各言語の表示名は、`public/` の外の [src/data/gamedata.js](src/data/gamedata.js) にあります。ログイン後に `/api/gamedata` で一度だけ取得してから画面を描画します([public/js/gamedata.js](public/js/gamedata.js))。

## ディレクトリ構成

```
public/                     静的ファイル (そのまま配信される)
  index.html                アプリ本体
  content*.html             言語ごとの説明ページ
  css/app.css               スタイル
  js/
    app.js                  状態管理・イベント処理・描画の起点
    views.js                各画面の HTML 生成
    api.js                  /api/* の呼び出し
    auth.js                 Firebase Auth・Drive トークン
    push.js                 FCM の端末登録・フォアグラウンド通知
    gamedata.js             ゲームデータの取得と読み込み
    i18n.js                 文言と言語切替
    time.js                 JST・論理日/月・UUID v7 (ブラウザと Worker で共用)
  data/gifts.js             定数と、取得したデータの保持
  img/                      アイコン・贈り物のスプライト画像
  firebase-messaging-sw.js  FCM 用 Service Worker
src/
  worker.js                 ルーティング・cron
  drive.js                  Drive appDataFolder の読み書き
  firebase.js               ID トークン検証・Firestore・FCM
  data/gamedata.js          ゲームデータ本体
test/time.test.mjs          time.js のテスト
doc/                        設計書・仕様書
```

## セットアップ

1. Firebase プロジェクトで Authentication(Google)・Firestore(ルール全拒否)・Cloud Messaging を有効化します。Google Cloud で Drive API を有効化し、OAuth 同意画面に `drive.appdata` を追加します。
2. 次のプレースホルダを実際の値に置き換えます。
   - `public/js/auth.js`: `firebaseConfig`、`GOOGLE_CLIENT_ID`
   - `public/js/push.js`: `VAPID_KEY`(Cloud Messaging の Web プッシュ証明書の公開鍵)
   - `public/firebase-messaging-sw.js`: Firebase 設定(`auth.js` と同じ値)
   - `wrangler.toml`: `FIREBASE_PROJECT_ID`
3. サービスアカウントの JSON を登録します。
   - 本番: `npx wrangler secret put FIREBASE_SERVICE_ACCOUNT`
   - ローカル: `.dev.vars` に `FIREBASE_SERVICE_ACCOUNT='<JSON を 1 行にしたもの>'`(値はシングルクォートで囲みます)
4. Drive の認証を維持するための秘密情報を登録します(リフレッシュトークンをサーバーで暗号化して保管します)。
   - `GOOGLE_CLIENT_SECRET`: Google Cloud の OAuth ウェブクライアントのシークレット
   - `TOKEN_ENC_KEY`: 暗号鍵。`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` で作ります
   - 本番: `npx wrangler secret put GOOGLE_CLIENT_SECRET` / `npx wrangler secret put TOKEN_ENC_KEY`
   - ローカル: `.dev.vars` に同じ名前で追記します
   - OAuth 同意画面は「本番」に公開してください(「テスト」のままだとリフレッシュトークンが 7 日で失効します)

## 実行

```
npx wrangler dev                    # ローカル (http://localhost:8787)
npx wrangler dev --test-scheduled   # cron を手動で起動できるローカル実行
npx wrangler deploy                 # デプロイ
node --test test/time.test.mjs      # time.js のテスト
```

`--test-scheduled` で起動した場合、別のターミナルから次のコマンドで cron を 1 回実行できます。

```
curl.exe "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

## 開発メモ

- `public/js/time.js` は DOM に依存しないため、Worker からも import しています。JST・4:00 区切りの計算は、ここだけに置いてください。
- 画面の文言は `public/js/i18n.js` の辞書にあります。新しい文言は、4 言語分を追加してください。
- 秘密情報(サービスアカウントなど)は Git に入れません。`.dev.vars` と `service-account.json` は `.gitignore` に入っています。
- 運用者向けの内部資料は、Git 管理外のファイルにまとめています(担当者に確認してください)。
