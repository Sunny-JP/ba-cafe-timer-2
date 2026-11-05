# Cafe Timer リニューアル 設計書・開発計画

作成日: 2026-10-17 / 対象: cafetimer.rabbit1.cc

## 1. 目的と方針

Next.js (Next on Pages) 上で動く現行の Cafe Timer を、保守しやすくシンプルな構成へ作り直す。

- Next on Pages が非推奨になったため、Cloudflare Workers へ移行する
- フレームワークとビルド工程を廃止し、HTML / CSS / JS を役割ごとにファイル分割する
- DB・認証・通知を Google Firebase 基盤に統一する(Supabase / OneSignal を廃止)
- タップ履歴などのユーザーデータは、各ユーザーの Google Drive に保管する
- DB への読み書きは、すべて定義した API 経由にする。クライアントにクエリを発行させない
- 日本国外のユーザーも想定し、時刻表示をローカルタイムゾーンに対応させる
- 不要にファイルを増やさない

## 2. 現状 (As-Is)

| 領域 | 現状 |
| --- | --- |
| フレームワーク | Next.js 15 (App Router) + React 19 + Tailwind CSS 4 |
| ホスティング | Cloudflare Pages (@cloudflare/next-on-pages、非推奨) |
| DB・認証 | Supabase (PostgreSQL)、Discord OAuth |
| 通知 | OneSignal (REST の send\_after で3時間後に予約) |
| PWA | @ducanh2912/next-pwa |
| API | /api/tap、/api/relationship (Edge Runtime) |
| 課題 | profiles の取得と get\_taps\_by\_logical\_month / delete\_user\_account の RPC をクライアントが直接実行している。ソースは設定ファイルを除いても約50ファイル。タップ履歴は運営の DB に集約されている |

## 3. 新構成 (To-Be)

### 3.1 全体像

```
ブラウザ (静的 HTML/CSS/JS, PWA)
   │  Authorization: Bearer <Firebase IDトークン>
   │  X-Drive-Token: <Google アクセストークン>   ※データ系APIのみ
   ▼
Cloudflare Worker (静的配信 + /api/* + cron)
   ├─ Google Drive API  → 各ユーザーの appDataFolder (タップ・プロフィール・絆)
   ├─ Firestore (REST)  → 端末トークンと未送信の通知予約のみ
   └─ FCM HTTP v1       → プッシュ通知送信
```

### 3.2 技術選定

| 項目 | 採用 | 理由 |
| --- | --- | --- |
| ホスティング・API | Cloudflare Workers (Static Assets) | Next/OpenNext 不要。cron も同居でき、無料枠で足りる |
| 認証 | Firebase Authentication (Google プロバイダ) | Drive スコープを同時に取得できる |
| ユーザーデータ | Google Drive appDataFolder (drive.appdata スコープ) | ユーザーの Drive 内の隠しフォルダ。審査不要の非機密スコープ |
| 通知 | Firebase Cloud Messaging (Web Push) | Firebase 統一。予約は Worker の cron で実現 |
| 通知予約・端末情報 | Firestore | セキュリティルールは全拒否。Worker のみがアクセスする |
| フロント | 素の HTML / CSS / JS (ES Modules) | ビルド不要。Firebase SDK と Chart.js は CDN から読み込み、バージョンを固定する |
| 日時処理 | 標準の Intl と固定オフセット (JST +9h) | date-fns / date-fns-tz は不要 |

Cloud Functions は使わないため Blaze プランは不要。すべて無料枠に収まる見込み。

## 4. ディレクトリ構成

```
cafetimer/
├─ public/                      # Workers Static Assets としてそのまま配信
│  ├─ index.html                # マークアップ
│  ├─ js/docs.js                # 規約・FAQ・ガイド等 (pages.tsx の代替)
│  ├─ manifest.webmanifest
│  ├─ firebase-messaging-sw.js  # FCM 用 (ルート固定が必須)
│  ├─ css/app.css               # スタイル
│  ├─ js/
│  │  ├─ app.js                 # 起動・タブ切替・状態管理
│  │  ├─ views.js               # タイマー / カレンダー / 絆の描画
│  │  ├─ api.js                 # /api/* 呼び出しのみ
│  │  ├─ auth.js                # Google ログイン・トークン取得
│  │  ├─ push.js                # FCM 登録
│  │  └─ time.js                # JST 計算・表示・UUID v7 (Worker と共用)
│  ├─ data/gifts.js             # 定数と、/api/gamedata で取得したデータの保持 (データ本体は src/data/gamedata.js)
│  └─ img/                      # アイコン・ogp・gifts.png
├─ src/
│  ├─ worker.js                 # ルーティング・cron
│  ├─ drive.js                  # Drive appDataFolder の読み書き
│  └─ firebase.js               # IDトークン検証・Firestore・FCM送信
├─ wrangler.toml
├─ .dev.vars                    # ローカル用の秘密情報 (git 管理外)
└─ README.md
```

約16ファイル。package-lock.json と node\_modules は不要で、デプロイは `npx wrangler` で行う。

## 5. データ設計 (Google Drive)

### 5.1 ファイルと現行スキーマの対応

| 現行テーブル | Drive 上のファイル | 内容 |
| --- | --- | --- |
| profiles | profile.json | ticket1\_time, ticket2\_time, updated\_at |
| relationship | relationship.json | id, char\_key, bond\_level, recorded\_at, created\_at, updated\_at の配列 |
| taps | taps-YYYY-MM.json | id, tap\_time の配列。4:00 JST 区切りの論理月ごとに分割 |

- カラム名は現行どおり。ファイル単位でユーザーが決まるため user\_id(profiles は id)のみ省略する
- 各ファイルに `schema: 1` を持たせる
- ID は UUID v7 を文字列で保持する。既存 ID は維持し、新規分は Worker で生成する
- recorded\_at は `YYYY-MM-DD` の文字列。tap\_time と各 \*\_at は UTC の ISO 文字列

### 5.2 DB 制約の代替

| 現行の制約 | 新構成での実現 |
| --- | --- |
| bond\_level は 1〜100 | API で検証し、範囲外は 400 |
| (char\_key, bond\_level) の一意制約 | API で検証し、現行の文言「RANK n は既に登録されています。」を返す。import では重複を読み飛ばす |
| updated\_at トリガ | relationship の更新時に Worker が書き換える |
| ON DELETE CASCADE | DELETE /api/account で Drive のファイルと Firestore の端末情報を削除 |

### 5.3 Firestore (最小限)

- `devices/{uid}`: FCM トークンの配列
- `pending/{id}`: `{uid, sendAt}`。通知送信後に削除する
- セキュリティルールは全拒否。クライアントは Firestore SDK を読み込まない

## 6. API 設計

すべて Firebase ID トークンを検証する。データ系は `X-Drive-Token` も受け取り、保存せずにその場で Drive を操作する。Worker は同一オリジンで配信するため CORS は不要(現行の固定オリジン設定は廃止)。

| メソッド | パス | 内容 |
| --- | --- | --- |
| GET | /api/bootstrap?month=YYYY-MM | プロフィール・当月タップ・絆履歴を1回で取得 |
| GET | /api/taps?month=YYYY-MM | 月別タップ取得(カレンダー切替) |
| POST | /api/taps | 重複判定と3時間ルールを検証して追記し、通知を予約。重複は 429 |
| PUT | /api/profile | チケット時刻の更新 |
| GET | /api/relationship | 絆履歴の取得(recorded\_at 降順) |
| POST | /api/relationship | 登録(範囲・一意の検証) |
| DELETE | /api/relationship | id 指定で削除 |
| PUT / DELETE | /api/devices | FCM トークンの登録・解除 |
| DELETE | /api/account | 全データ削除 |
| POST | /api/import | 旧データの取り込み(検証つき) |

補足:

- 月またぎの重複判定では、当月ファイルが空の場合に前月ファイルも読む
- 論理月は page.tsx の処理に合わせ、毎月1日の 4:00 JST 前は前月扱いとする
- Drive の同時書き込みは後勝ち。保存前に再読込して衝突を減らす

## 7. 認証とトークン

- ログインは Firebase Auth の Google プロバイダ。`drive.appdata` スコープを追加で要求する
- Drive のアクセストークンは1時間で失効する。Google Identity Services の無音更新を試み、失敗時は再認証ボタンを表示する
- Worker はトークンを保存しない。ログやエラー出力にも含めない
- 無音更新が iOS PWA で不安定な場合の代替は、暗号化したリフレッシュトークンを Worker が保管する方式。ただし運営側が保管することになるため、プライバシーポリシーの更新が必要
- OAuth 同意画面は「本番」にする(「テスト」のままだと100人制限・7日で失効)
- Discord ログインは廃止する

## 8. 通知設計

1. タップ時に Worker が `shouldScheduleNotification` で判定し、Firestore の pending に `{uid, sendAt}` を書く(sendAt は3時間後、秒以下は切り捨て)
2. Cron(毎分)が期限到来分を取得し、FCM HTTP v1 で送信して削除する
3. 文面は messages.ts から移植し、ランダムに選ぶ

サーバーに残るのは端末トークンと未送信の予約のみで、タップ履歴は残らない。iOS はホーム画面に追加した PWA でのみ届く(現行と同じ)。旧 OneSignal の Service Worker は、新しい firebase-messaging-sw.js の登録で置き換える。

## 9. 時刻・タイムゾーン設計

| 種類 | 方式 |
| --- | --- |
| ゲームのルール計算 | UTC のエポック値に固定の +9時間を足す(4:00/16:00 の境界、論理月・論理日、3時間ルール) |
| 表示 | Intl.DateTimeFormat に端末のタイムゾーンを渡す。夏時間も自動処理 |
| 時間の長さ | タイムゾーン非依存(カウントダウン、チケットの20時間) |

- 保存する時刻はすべて UTC の ISO 文字列
- スロット表示はローカル時刻を主表示とし、JST を補助表示する(現行の挙動を踏襲)
- カレンダーはゲーム日(4:00 JST 区切り)基準のままとし、見出しに注記を入れる
- タイムゾーンの手動上書きを設定に追加する(保存先は profile.json を検討)
- UI の多言語化は未定。文言を data/ に切り出しておくと後で対応しやすい

## 10. セキュリティ

- クライアントは Firestore に一切アクセスしない(ルール全拒否)。Drive もクライアントから直接は触らない
- 秘密情報(サービスアカウント JSON など)は `wrangler secret` に置く。リポジトリには含めない
- 外部スクリプトは CDN から読み込み、バージョンを固定する
- 現行の秘密情報(Supabase の DB パスワード、Discord の Client Secret、OneSignal の REST API Key)は、構成図PDFとチャットに実値が含まれていたため、ローテーションまたは失効させる
- 利用規約・プライバシーポリシー(js/docs.js)を新構成に合わせて書き直す

## 11. 移行計画

運営側からユーザーの Drive へ一括投入することはできないため、ユーザー自身の操作を必須とする。

1. 旧アプリに「データ書き出し」を追加する(既存の認証済み API で taps / profile / relationship の全件を JSON 出力)
2. 新アプリで Google ログイン後、書き出した JSON を取り込む(POST /api/import)
3. UPDATE\_LOGS とダイアログで告知し、猶予期間を設ける
4. 猶予期間後に旧環境(Supabase / OneSignal / Pages)を停止する

import は、既存 ID を保持し、bond\_level の範囲と (char\_key, bond\_level) の重複を検証する。

## 12. 開発計画

| フェーズ | 内容 | 成果物 |
| --- | --- | --- |
| 0 準備 | 秘密情報のローテーション。利用する Firebase プロジェクトの決定。Drive API の有効化と OAuth 同意画面の本番化。旧 DB 関数(get\_taps\_by\_logical\_month / delete\_user\_account)の定義確認。Workers とドメインの準備 | 環境が整った状態 |
| 1 基盤 | time.js(JST 計算・Intl 表示・UUID v7・論理月)。worker.js の骨格、IDトークン検証、drive.js。bootstrap / taps / profile / relationship の API | 動く API とユニットテスト |
| 2 フロント | index.html / app.css / app.js を作成し、タイマー・カレンダー・絆・設定・規約表示を移植。Tailwind のクラスを平易な CSS に置き換え。manifest と PWA | 通知以外が動く新アプリ |
| 3 通知 | push.js、firebase-messaging-sw.js、devices API、Firestore の pending、cron 送信 | 通知が届く状態 |
| 4 移行 | 旧アプリの書き出し機能、import API と UI、告知文、プライバシーポリシーの更新 | 移行手順の確立 |
| 5 検証・切替 | 実機テストと負荷確認。本番切替。旧環境の停止と秘密情報の失効 | 本番稼働 |

## 13. テスト観点

- タイムゾーン: Asia/Tokyo、America/Los\_Angeles(夏時間あり)、Pacific/Auckland、UTC で、スロット表示とカウントダウンを確認
- 境界: 4:00 / 16:00 JST ちょうど、月初 4:00 JST 前後、年またぎ
- タップ: 3時間ルール、重複 429、月またぎの最終タップ判定
- 絆: 範囲外、重複登録、削除
- トークン: 失効後の再取得、再認証ボタンの導線
- 通知: 予約から3時間後の送信、境界を跨ぐ場合は予約しない、端末解除
- 端末: iOS PWA、Android Chrome、PC ブラウザ
- 移行: 旧データの書き出しから取り込みまでの件数・ID の一致

## 14. リスクと対応

| リスク | 対応 |
| --- | --- |
| Drive トークンの無音更新が不安定 | 再認証ボタンを用意し、実機で早期に検証する。最終手段はリフレッシュトークン方式 |
| Drive API の遅延(1回数百ミリ秒) | 楽観的 UI を維持し、bootstrap で呼び出し回数を減らす |
| 複数端末の同時書き込み | 保存前に再読込。月別分割で衝突範囲を限定 |
| ログイン方式の変更(Discord から Google) | 事前告知と猶予期間。移行手順を FAQ に掲載 |
| iOS PWA のポップアップ認証 | 早期に実機で検証し、必要なら方式を調整 |
| ユーザー操作が必要な移行 | 手順を簡素化し、猶予期間を長めに取る |

## 15. 未決事項

- 利用する Firebase プロジェクト(構成図に2つ分の設定がある)
- get\_taps\_by\_logical\_month / delete\_user\_account の正確な定義
- UI の多言語化の有無
- タイムゾーン上書きの保存先(profile.json かローカルのみか)
- 旧環境の停止時期
- CALENDAR\_LIMITS.MIN の `new Date(2025, 12, 1)` が意図どおり(2026-01-01)か
