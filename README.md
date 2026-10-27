# Cafe Timer (原型)

設計書: `Cafe Timer リニューアル 設計書・開発計画.md`

## セットアップ

1. Firebase プロジェクトで Authentication(Google)・Firestore(ルール全拒否)・Cloud Messaging を有効化。Drive API を有効化し、OAuth 同意画面に `drive.appdata` を追加
2. 次の `TODO` / プレースホルダを実値に置き換える
   - `public/js/auth.js`: `firebaseConfig`、`GOOGLE_CLIENT_ID`
   - `public/js/push.js`: `VAPID_KEY`
   - `public/firebase-messaging-sw.js`: Firebase 設定(auth.js と同じ値)
   - `wrangler.toml`: `FIREBASE_PROJECT_ID`
   - `public/data/gifts.js`: bondData.ts の移植
3. サービスアカウント JSON を登録: `npx wrangler secret put FIREBASE_SERVICE_ACCOUNT`(ローカルは `.dev.vars`)

## 実行

```
npx wrangler dev      # ローカル
npx wrangler deploy   # デプロイ
node --test test/     # time.js のテスト
```
