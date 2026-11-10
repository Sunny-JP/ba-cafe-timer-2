// 使い方ガイド・FAQ・規約などの文書(メニューのページ本文)。
// - SKELETON: 文書の構造。`{{キー}}` の位置に TEXT の訳が入る(構造は言語で共通)。
// - TEXT: キーごとに全言語の訳をまとめる。値は HTML(<b> <a> <br> が使える)。
//   訳がない言語は日本語で代用し、<セクション>.title がない言語では、日本語版を注記付きで表示する。
// - 変更履歴の印 <ul class="log" data-update-log></ul> には js/updates.js の内容が差し込まれる。
// - キーの付け方: <セクション>.<種類><連番>  (title=h2 / h=h3 / p / li / q=質問 / a=回答)
// app.js が文書を開いたときに初めて読み込む。

export const SKELETON = {
  about: `


  <h2>{{about.title}}</h2>
  <p>{{about.p1}}</p>
  <h3>{{about.h1}}</h3>
  <ul>
    <li>{{about.li1}}</li>
    <li>{{about.li2}}</li>
    <li>{{about.li3}}</li>
    <li>{{about.li4}}</li>
    <li>{{about.li5}}</li>
  </ul>
  <h3>{{about.h2}}</h3>
  <p>{{about.p2}}</p>
  <h3>{{about.h3}}</h3>
  <p>{{about.p3}}</p>
  <ul>
    <li>{{about.li6}}</li>
    <li>{{about.li7}}</li>
    <li>{{about.li8}}</li>
    <li>{{about.li9}}</li>
  </ul>


`,
  guide: `


  <h2>{{guide.title}}</h2>
  <p>{{guide.demo}}</p>

  <h3>{{guide.h1}}</h3>
  <ul>
    <li>{{guide.li1}}</li>
    <li>{{guide.li2}}</li>
  </ul>

  <h3>{{guide.h2}}</h3>
  <ul>
    <li>{{guide.li3}}</li>
  </ul>

  <h3>{{guide.h3}}</h3>
  <ul>
    <li>{{guide.li4}}</li>
    <li>{{guide.li5}}</li>
    <li>{{guide.li6}}</li>
  </ul>

  <h3>{{guide.h4}}</h3>
  <p>{{guide.p1}}</p>

  <h3>{{guide.h5}}</h3>
  <ul>
    <li>{{guide.li7}}</li>
    <li>{{guide.li8}}</li>
    <li>{{guide.li9}}</li>
  </ul>

  <h3>{{guide.h6}}</h3>
  <p>{{guide.p2}}</p>
  <p>{{guide.p3}}</p>
  <div class="note warn">
    <p>{{guide.p4}}</p>
    <p>{{guide.p5}}</p>
    <p>{{guide.p6}}</p>
  </div>


`,
  faq: `


  <h2>{{faq.title}}</h2>

  <h3 class="group">{{faq.h1}}</h3>
  <dl>
    <dt>{{faq.q1}}</dt>
    <dd>{{faq.a1}}</dd>

    <dt>{{faq.q2}}</dt>
    <dd>{{faq.a2}}</dd>

    <dt>{{faq.q3}}</dt>
    <dd>{{faq.a3}}</dd>

    <dt>{{faq.q4}}</dt>
    <dd>{{faq.a4}}</dd>

    <dt>{{faq.q5}}</dt>
    <dd>{{faq.a5}}</dd>

    <dt>{{faq.q6}}</dt>
    <dd>{{faq.a6}}</dd>
  </dl>

  <h3 class="group">{{faq.h2}}</h3>
  <dl>
    <dt>{{faq.q7}}</dt>
    <dd>{{faq.a7}}</dd>

    <dt>{{faq.q8}}</dt>
    <dd>{{faq.a8}}</dd>

    <dt>{{faq.q9}}</dt>
    <dd>{{faq.a9}}</dd>

    <dt>{{faq.q10}}</dt>
    <dd>{{faq.a10}}</dd>

    <dt>{{faq.q11}}</dt>
    <dd>{{faq.a11}}</dd>

    <dt>{{faq.q12}}</dt>
    <dd>{{faq.a12}}</dd>

    <dt>{{faq.q13}}</dt>
    <dd>{{faq.a13}}</dd>

    <dt>{{faq.q14}}</dt>
    <dd>{{faq.a14}}</dd>

    <dt>{{faq.q15}}</dt>
    <dd>{{faq.a15}}</dd>

    <dt>{{faq.q16}}</dt>
    <dd>{{faq.a16}}</dd>

    <dt>{{faq.q17}}</dt>
    <dd>{{faq.a17}}</dd>
  </dl>


`,
  terms: `


  <h2>{{terms.title}}</h2>
  <p>{{terms.p1}}</p>

  <h3>{{terms.h1}}</h3>
  <ul>
    <li>{{terms.li1}}</li>
    <li>{{terms.li2}}</li>
    <li>{{terms.li3}}</li>
  </ul>

  <h3>{{terms.h2}}</h3>
  <ul>
    <li>{{terms.li4}}</li>
    <li>{{terms.li5}}</li>
    <li>{{terms.li6}}</li>
    <li>{{terms.li7}}</li>
    <li>{{terms.li8}}</li>
    <li>{{terms.li9}}</li>
  </ul>

  <h3>{{terms.h3}}</h3>
  <ul>
    <li>{{terms.li10}}</li>
  </ul>

  <h3>{{terms.h4}}</h3>
  <ul>
    <li>{{terms.li11}}</li>
    <li>{{terms.li12}}</li>
  </ul>

  <p class="right">{{terms.p2}}</p>


`,
  privacy: `


  <h2>{{privacy.title}}</h2>
  <p>{{privacy.p1}}</p>

  <h3>{{privacy.h1}}</h3>
  <ul>
    <li>{{privacy.li1}}</li>
    <li>{{privacy.li2}}</li>
    <li>{{privacy.li3}}</li>
  </ul>

  <h3>{{privacy.h2}}</h3>
  <ul>
    <li>{{privacy.li4}}</li>
  </ul>

  <h3>{{privacy.h3}}</h3>
  <ul>
    <li>{{privacy.li6}}</li>
    <li>{{privacy.li7}}</li>
    <li>{{privacy.li8}}</li>
    <li>{{privacy.li9}}</li>
  </ul>

  <h3>{{privacy.h4}}</h3>
  <p>{{privacy.p2}}</p>
  <ul>
    <li>{{privacy.li10}}</li>
    <li>{{privacy.li11}}</li>
  </ul>
  

  <h3>{{privacy.h5}}</h3>
  <p>{{privacy.p3}}</p>

  <h3>{{privacy.h6}}</h3>
  <p>{{privacy.p4}}</p>


`,
  operator: `


  <h2>{{operator.title}}</h2>

  <h3>{{operator.h1}}</h3>
  <p>{{operator.p1}}</p>

  <h3>{{operator.h2}}</h3>
  <p>{{operator.p2}}</p>

  <h3>{{operator.h3}}</h3>
  <ul class="log" data-update-log></ul>

  <h3>{{operator.h4}}</h3>
  <p>{{operator.p3}}</p>


`,
};

export const TEXT = {
  "about.title": {
    ja: `About`,
    en: `About`,
    ko: `About`,
    zh: `About`,
  },
  "about.p1": {
    ja: `「Cafe Timer 2」は、ゲーム『ブルーアーカイブ』のカフェ機能を支援する非公式ファンメイドツールです。<br> 生徒さんのカフェ訪問タイミングを通知でお知らせし、先生方の業務をサポートします。`,
    en: `"Cafe Timer 2" is an unofficial fan-made tool that supports the Cafe feature of the game Blue Archive.<br> It notifies you when students can be visited at the cafe and helps Sensei keep track of their routine.`,
    ko: `「Cafe Timer 2」는 게임 『블루 아카이브』의 카페 기능을 지원하는 비공식 팬메이드 도구입니다.<br> 학생의 카페 방문 타이밍을 알림으로 알려 드려 선생님의 일과를 돕습니다.`,
    zh: `「Cafe Timer 2」是辅助游戏《蔚蓝档案》咖啡厅功能的非官方粉丝制作工具。<br> 它会通过通知告知学生到访咖啡厅的时机，协助老师完成日常事务。`,
  },
  "about.h1": {
    ja: `主な機能`,
    en: `Features`,
    ko: `주요 기능`,
    zh: `主要功能`,
  },
  "about.li1": {
    ja: `生徒さんの再タップ可能タイミングのカウントダウン`,
    en: `Countdown until students can be tapped again`,
    ko: `학생을 다시 터치할 수 있을 때까지의 카운트다운`,
    zh: `学生可再次触摸时间的倒计时`,
  },
  "about.li2": {
    ja: `生徒さんの訪問タイミング(4:00/16:00 JST)のカウントダウン`,
    en: `Countdown to student visit times (4:00 / 16:00 JST)`,
    ko: `학생 방문 타이밍(4:00/16:00 JST)까지의 카운트다운`,
    zh: `学生到访时间（4:00/16:00 JST）的倒计时`,
  },
  "about.li3": {
    ja: `招待券のクールタイム管理`,
    en: `Cooldown management for invitation tickets`,
    ko: `초대권 쿨타임 관리`,
    zh: `邀请券冷却时间管理`,
  },
  "about.li4": {
    ja: `タップ履歴のカレンダー表示`,
    en: `Calendar view of tap history`,
    ko: `터치 기록 캘린더 표시`,
    zh: `触摸记录的日历显示`,
  },
  "about.li5": {
    ja: `絆上げの記録とグラフ表示`,
    en: `Bond rank records and graph`,
    ko: `인연 랭크 기록과 그래프 표시`,
    zh: `羁绊等级记录与图表显示`,
  },
  "about.h2": {
    ja: `対応プラットフォーム`,
    en: `Supported platforms`,
    ko: `지원 환경`,
    zh: `支持的平台`,
  },
  "about.p2": {
    ja: `PCおよびスマートフォンの最新ブラウザで動作します。<br> PWAに対応しているため、ホーム画面に追加してアプリのように使うことができます。`,
    en: `Works on the latest browsers on PC and smartphones.<br> As a PWA, it can be added to your home screen and used like an app.`,
    ko: `PC와 스마트폰의 최신 브라우저에서 동작합니다.<br> PWA를 지원하므로 홈 화면에 추가해 앱처럼 사용할 수 있습니다.`,
    zh: `可在电脑和智能手机的最新浏览器中使用。<br> 支持 PWA，可添加到主屏幕，像应用一样使用。`,
  },
  "about.h3": {
    ja: `絆グラフの予測について`,
    en: `About the bond graph forecast`,
    ko: `인연 그래프 예측에 대해`,
    zh: `关于羁绊图表的预测`,
  },
  "about.p3": {
    ja: `絆グラフの点線は、記録をもとにした簡易的な予測です。縦軸の幅は累計EXPで、目盛りには各絆ランクに必要な累計EXPの位置にランクを表示しています。`,
    en: `The dotted line on the bond graph is a simple forecast based on your records. The vertical axis is scaled by cumulative EXP, and each tick shows the rank at the position of the cumulative EXP required for that bond rank.`,
    ko: `인연 그래프의 점선은 기록을 바탕으로 한 간단한 예측입니다. 세로축의 폭은 누적 EXP이며, 눈금에는 각 인연 랭크에 필요한 누적 EXP 위치에 랭크를 표시합니다.`,
    zh: `羁绊图表中的虚线是基于记录的简易预测。纵轴的刻度间距按累计 EXP 计算，刻度处在各羁绊等级所需累计 EXP 的位置上，并标注该等级。`,
  },
  "about.li6": {
    ja: `<b>モデル:</b> 線形予測(直線での延長)です。最初の記録から最後の記録までの累計EXPの増加を日数で割り、1日あたりの平均獲得EXPを求めます。`,
    en: `<b>Model:</b> A linear forecast (a straight-line extension). The increase in cumulative EXP from your first record to your last is divided by the number of days to get your average EXP per day.`,
    ko: `<b>모델:</b> 선형 예측(직선 연장)입니다. 첫 기록부터 마지막 기록까지의 누적 EXP 증가량을 일수로 나누어 하루 평균 획득 EXP를 구합니다.`,
    zh: `<b>模型：</b>线性预测（直线延长）。将第一条记录到最后一条记录的累计 EXP 增量除以天数，得到每天的平均获得 EXP。`,
  },
  "about.li7": {
    ja: `<b>予測日:</b> 最後の記録から、そのペースが今後も続くと仮定して、RANK 5ごと(RANK 100まで)に必要な累計EXPへ届く日を計算します。点線にカーソルを合わせる(スマートフォンではタップする)と、日付・ランク・EXPが表示されます。`,
    en: `<b>Forecast dates:</b> Assuming that pace continues from your last record, it calculates the date you will reach the cumulative EXP required for every 5 ranks (up to RANK 100). Hover over the dotted line (tap on a smartphone) to see the date, rank and EXP.`,
    ko: `<b>예측 날짜:</b> 마지막 기록부터 그 속도가 계속된다고 가정하고, RANK 5마다(RANK 100까지) 필요한 누적 EXP에 도달하는 날짜를 계산합니다. 점선에 커서를 올리면(스마트폰에서는 탭하면) 날짜·랭크·EXP가 표시됩니다.`,
    zh: `<b>预测日期：</b>假设从最后一条记录起该速度持续不变，计算每 5 个等级（直到 RANK 100）所需累计 EXP 的到达日期。将光标移到虚线上（智能手机上点按），即可显示日期、等级和 EXP。`,
  },
  "about.li8": {
    ja: `<b>表示される条件:</b> 日付の異なる記録が2件以上あり、ペースが0より大きく、RANK 100に到達していない場合に表示します。`,
    en: `<b>When it is shown:</b> You need at least two records on different dates, a pace greater than zero, and you must not have reached RANK 100 yet.`,
    ko: `<b>표시 조건:</b> 날짜가 다른 기록이 2건 이상이고, 속도가 0보다 크며, 아직 RANK 100에 도달하지 않은 경우에 표시됩니다.`,
    zh: `<b>显示条件：</b>需要至少 2 条日期不同的记录，速度大于 0，且尚未达到 RANK 100。`,
  },
  "about.li9": {
    ja: `<b>注意:</b> イベントや生徒さんの贈り物の有無などによるペースの変化は考慮しません。あくまで目安としてご利用ください。`,
    en: `<b>Note:</b> Changes in pace caused by events, gifts for students and so on are not taken into account. Please use it only as a guide.`,
    ko: `<b>주의:</b> 이벤트나 학생에게 주는 선물 여부 등으로 인한 속도 변화는 고려하지 않습니다. 어디까지나 참고용으로 이용해 주세요.`,
    zh: `<b>注意：</b>活动或赠送学生礼物等造成的速度变化不在考虑范围内，请仅作参考。`,
  },
  "guide.demo": {
    ja: `ログインせずに画面の見た目を確認できる<a href="/demo.html" target="_blank" rel="noopener">デモページ</a>があります。見本のデータが表示されるだけで、操作しても記録は保存されません。`,
    en: `You can look around the screens without signing in on the <a href="/demo.html" target="_blank" rel="noopener">demo page</a>. It only shows sample data, and nothing you do there is saved.`,
    ko: `로그인하지 않고 화면을 확인할 수 있는 <a href="/demo.html" target="_blank" rel="noopener">데모 페이지</a>가 있습니다. 샘플 데이터만 표시되며, 조작해도 기록은 저장되지 않습니다.`,
    zh: `无需登录即可查看界面的<a href="/demo.html" target="_blank" rel="noopener">演示页面</a>。页面只显示示例数据，操作不会保存任何记录。`,
  },
  "guide.title": {
    ja: `使い方ガイド`,
    en: `User Guide`,
    ko: `사용 가이드`,
    zh: `使用指南`,
  },
  "guide.h1": {
    ja: `カフェタイマーの使い方`,
    en: `How to Use Cafe Timer`,
    ko: `카페 타이머 사용법`,
    zh: `咖啡厅计时器的使用方法`,
  },
  "guide.li1": {
    ja: `<b>Next Tap:</b> 生徒さんと触れ合うことができるまでの時間をカウントダウンします。「Tap」ボタンを押すと履歴が記録され、カウントダウンが始まります。`,
    en: `<b>Next Tap:</b> Counts down the time until you can interact with students again. Press "Tap" to record it and start the countdown.`,
    ko: `<b>Next Tap:</b> 학생과 다시 교감할 수 있을 때까지의 시간을 카운트다운합니다. 「Tap」 버튼을 누르면 기록이 남고 카운트다운이 시작됩니다.`,
    zh: `<b>Next Tap：</b>倒计时显示距离可以再次与学生互动的时间。按下「Tap」按钮会记录并开始倒计时。`,
  },
  "guide.li2": {
    ja: `<b>Next Call:</b> 生徒さんを招待するチケット(招待券)のクールタイムを管理します。使用した時刻にボタンを押すと、次の使用可能時刻までのカウントダウンが始まります。`,
    en: `<b>Next Call:</b> Manages the cooldown of invitation tickets. Press the button at the time you use a ticket to start the countdown to the next available time.`,
    ko: `<b>Next Call:</b> 학생을 초대하는 티켓(초대권)의 쿨타임을 관리합니다. 사용한 시각에 버튼을 누르면 다음 사용 가능 시각까지 카운트다운이 시작됩니다.`,
    zh: `<b>Next Call：</b>管理邀请学生的票券（邀请券）的冷却时间。在使用时按下按钮，即开始倒计时到下次可使用的时间。`,
  },
  "guide.h2": {
    ja: `Tap履歴の使い方`,
    en: `Tap history`,
    ko: `터치 기록 사용법`,
    zh: `触摸记录的使用方法`,
  },
  "guide.li3": {
    ja: `<b>SAVE IMAGE:</b> Tap履歴を月ごとに画像で保存できます。SNSへの投稿などにご利用いただけます。`,
    en: `<b>SAVE IMAGE:</b> Saves the tap history of a month as an image, handy for sharing on social media.`,
    ko: `<b>SAVE IMAGE:</b> 터치 기록을 월별 이미지로 저장할 수 있습니다. SNS 게시 등에 활용하세요.`,
    zh: `<b>SAVE IMAGE：</b>可将触摸记录按月保存为图片，方便发布到社交媒体等。`,
  },
  "guide.h3": {
    ja: `表示の設定`,
    en: `Display settings`,
    ko: `화면 설정`,
    zh: `显示设置`,
  },
  "guide.li4": {
    ja: `ヘッダーの太陽/月のボタンで、ライトモードとダークモードを切り替えられます。`,
    en: `Use the sun/moon button in the header to switch between light and dark mode.`,
    ko: `헤더의 해/달 버튼으로 라이트 모드와 다크 모드를 전환할 수 있습니다.`,
    zh: `点击页眉的太阳/月亮按钮可在浅色与深色模式间切换。`,
  },
  "guide.li5": {
    ja: `設定ページでは、自動(端末の設定に合わせる)・ライト・ダークの選択、アクセントカラーの変更、言語の選択ができます。`,
    en: `In Settings you can choose Auto (follows your device), Light or Dark, change the accent color, and pick a language.`,
    ko: `설정에서 자동(기기 설정에 맞춤)·라이트·다크 선택, 강조 색상 변경, 언어 선택을 할 수 있습니다.`,
    zh: `在设置中可选择自动（跟随设备）、浅色、深色，更改强调色，并选择语言。`,
  },
  "guide.li6": {
    ja: `時刻は端末のタイムゾーンで表示されます。設定ページの「タイムゾーン」で変更することもできます。`,
    en: `Times are shown in your device's time zone. You can change it in Settings.`,
    ko: `시각은 기기의 시간대로 표시되며, 설정에서 변경할 수도 있습니다.`,
    zh: `时间按设备的时区显示，也可以在设置中更改。`,
  },
  "guide.h4": {
    ja: `履歴と同期`,
    en: `History and sync`,
    ko: `기록과 동기화`,
    zh: `历史记录与同步`,
  },
  "guide.p1": {
    ja: `Googleアカウントでログインすると、タップ履歴などの記録があなたのGoogle Driveに保存されます。 同じアカウントでログインすれば、PCやスマホなど異なる端末でも同じデータを共有・同期できます。`,
    en: `When you sign in with a Google account, your tap history and other records are saved to your own Google Drive. Sign in with the same account on another device to share and sync the same data.`,
    ko: `Google 계정으로 로그인하면 터치 기록 등이 본인의 Google Drive에 저장됩니다. 같은 계정으로 로그인하면 PC나 스마트폰 등 다른 기기에서도 같은 데이터를 공유·동기화할 수 있습니다.`,
    zh: `使用 Google 账号登录后，触摸记录等将保存到你自己的 Google Drive。 用同一账号在电脑、手机等其他设备登录，即可共享并同步相同的数据。`,
  },
  "guide.h5": {
    ja: `データのエクスポート・インポート`,
    en: `About notifications`,
    ko: `알림 설정에 대해`,
    zh: `关于通知设置`,
  },
  "guide.li7": {
    ja: `<b>エクスポート:</b> メニューの「データのエクスポート」を押すと、タップ履歴・絆ランクの記録・チケットの時刻をJSONファイルとして端末に保存できます。バックアップや、別のGoogleアカウントへの移行にご利用ください。`,
    en: `Exporting and importing data`,
    ko: `데이터 내보내기·가져오기`,
    zh: `导出与导入数据`,
  },
  "guide.li8": {
    ja: `<b>インポート:</b> メニューの「データのインポート」から、エクスポートしたファイル(または旧版で書き出したファイル)を選ぶと、データが取り込まれます。`,
    en: `<b>Export:</b> Press "Export data" in the menu to save your tap history, bond rank records and ticket times to your device as a JSON file. Use it as a backup or to move to another Google account.`,
    ko: `<b>내보내기:</b> 메뉴의 "데이터 내보내기"를 누르면 터치 기록·인연 랭크 기록·티켓 시각이 JSON 파일로 기기에 저장됩니다. 백업이나 다른 Google 계정으로의 이전에 이용하세요.`,
    zh: `<b>导出：</b>点击菜单中的“导出数据”，可将触摸记录、羁绊等级记录和票券时间保存为 JSON 文件。可用于备份，或迁移到其他 Google 账号。`,
  },
  "guide.li9": {
    ja: `インポートは追加のみで、既存のデータが削除されることはありません。同じIDのタップや、同じ絆ランクの記録は重複として読み飛ばされます。チケットの時刻だけは、ファイルの値で上書きされます。`,
    en: `<b>Import:</b> Choose "Import data" in the menu and select an exported file (or a file exported from the old version) to load the data.`,
    ko: `<b>가져오기:</b> 메뉴의 "데이터 가져오기"에서 내보낸 파일(또는 이전 버전에서 내보낸 파일)을 선택하면 데이터를 불러옵니다.`,
    zh: `<b>导入：</b>在菜单的“导入数据”中选择已导出的文件（或旧版本导出的文件），即可读取数据。`,
  },
  "guide.h6": {
    ja: `通知設定について`,
    en: `Importing only adds data; nothing existing is deleted. Taps with the same ID and bond rank records with the same rank are skipped as duplicates. Only the ticket times are overwritten by the values in the file.`,
    ko: `가져오기는 데이터를 추가만 하며 기존 데이터는 삭제되지 않습니다. ID가 같은 터치와 랭크가 같은 인연 기록은 중복으로 건너뜁니다. 티켓 시각만 파일의 값으로 덮어씁니다.`,
    zh: `导入只会追加数据，不会删除现有数据。ID 相同的触摸记录和等级相同的羁绊记录会被视为重复而跳过。只有票券时间会被文件中的值覆盖。`,
  },
  "guide.p2": {
    ja: `設定ページの「通知設定」から、生徒さんと触れ合える時刻をプッシュ通知でお知らせします。 通知は、Tapを記録した3時間後に届きます。次の4:00/16:00 JSTを跨ぐ場合は、そのタイミングで触れ合えるため予約しません。 4:00/16:00 JSTそのものも、時刻が固定されているため通知を行いません。`,
    en: `From "Notifications" in Settings, you can get push notifications when students can be tapped again. A notification arrives 3 hours after you record a tap. If the next 4:00/16:00 JST comes first, none is scheduled because you can interact at that time anyway. No notification is sent for 4:00/16:00 JST itself, since those times are fixed.`,
    ko: `설정의 「알림 설정」에서 학생과 교감할 수 있는 시각을 푸시 알림으로 알려 드립니다. 알림은 Tap을 기록한 3시간 뒤에 도착합니다. 다음 4:00/16:00 JST가 먼저 오는 경우에는 그 시점에 교감할 수 있으므로 예약하지 않습니다. 4:00/16:00 JST 자체도 시각이 고정되어 있으므로 알림을 보내지 않습니다.`,
    zh: `通过设置中的「通知设置」，可以用推送通知告知可与学生互动的时间。 通知会在记录 Tap 的 3 小时后送达。若下一个 4:00/16:00 JST 先到来，则届时即可互动，因此不会预约。 4:00/16:00 JST 本身时间固定，也不会发送通知。`,
  },
  "guide.p3": {
    ja: `通知を登録できる端末は、1ユーザーあたり最大10台です。上限を超えると、古い端末の登録から順に解除されます。不要な端末は、その端末の設定ページから通知設定をオフにしてください。`,
    en: `Up to 10 devices can be registered per user. When the limit is exceeded, the oldest registrations are removed first. Turn notifications off from the Settings of devices you no longer use.`,
    ko: `알림을 등록할 수 있는 기기는 사용자당 최대 10대입니다. 한도를 넘으면 오래된 기기부터 등록이 해제됩니다. 불필요한 기기에서는 설정에서 알림을 꺼 주세요.`,
    zh: `每位用户最多可注册 10 台设备。超出上限时，将从最旧的设备开始解除注册。不需要的设备请在其设置中关闭通知。`,
  },
  "guide.p4": {
    ja: `<b>通知設定がうまくいかない場合</b>`,
    en: `<b>If notifications do not work</b>`,
    ko: `<b>알림 설정이 잘 되지 않을 때</b>`,
    zh: `<b>通知设置不顺利时</b>`,
  },
  "guide.p5": {
    ja: `AdGuard や uBlock Origin などの広告ブロック(コンテンツブロッカー)機能を使用している場合、通知システムが「トラッキング」と誤認され、許可ダイアログが表示されないことがあります。`,
    en: `If you use an ad blocker (content blocker) such as AdGuard or uBlock Origin, the notification system may be mistaken for tracking and the permission dialog may not appear.`,
    ko: `AdGuard나 uBlock Origin 같은 광고 차단(콘텐츠 차단) 기능을 사용 중이면 알림 시스템이 「트래킹」으로 오인되어 허용 대화상자가 표시되지 않을 수 있습니다.`,
    zh: `如果使用了 AdGuard 或 uBlock Origin 等广告拦截（内容拦截）功能，通知系统可能被误认为「追踪」，导致不显示授权对话框。`,
  },
  "guide.p6": {
    ja: `通知設定を行う際は、このサイト(ドメイン)を許可リストに追加するか、一時的に機能をOFFにしてからページを再読み込み・通知設定を行ってください。`,
    en: `When setting up notifications, add this site (domain) to the allow list or temporarily turn the blocker off, then reload the page and set up notifications again.`,
    ko: `알림을 설정할 때는 이 사이트(도메인)를 허용 목록에 추가하거나 기능을 일시적으로 끈 뒤, 페이지를 새로고침하고 알림 설정을 해 주세요.`,
    zh: `设置通知时，请将本站（域名）加入允许列表，或暂时关闭该功能，然后重新加载页面并进行通知设置。`,
  },
  "faq.title": {
    ja: `FAQ`,
    en: `FAQ`,
    ko: `FAQ`,
    zh: `FAQ`,
  },
  "faq.h1": {
    ja: `機能`,
    en: `Features`,
    ko: `기능`,
    zh: `功能`,
  },
  "faq.q1": {
    ja: `Q: 記録を間違えてタップしてしまいました。削除できますか?`,
    en: `Q: I tapped by mistake. Can I delete the record?`,
    ko: `Q: 실수로 터치를 기록했습니다. 삭제할 수 있나요?`,
    zh: `Q：误按了 Tap 记录，可以删除吗？`,
  },
  "faq.a1": {
    ja: `A: カフェタッチのTap履歴は個別に編集・削除することはできません。絆ランク記録は直近6件のデータまで削除可能です。`,
    en: `A: Individual tap records cannot be edited or deleted. Bond rank records can be deleted for the latest 6 entries.`,
    ko: `A: 카페 터치 기록은 개별적으로 수정·삭제할 수 없습니다. 인연 랭크 기록은 최근 6건까지 삭제할 수 있습니다.`,
    zh: `A：咖啡厅触摸记录无法单独编辑或删除。羁绊等级记录可删除最近的 6 条。`,
  },
  "faq.q2": {
    ja: `Q: 追加招待券には対応しますか?`,
    en: `Q: Are additional invitation tickets supported?`,
    ko: `Q: 추가 초대권에 대응하나요?`,
    zh: `Q：支持追加的邀请券吗？`,
  },
  "faq.a2": {
    ja: `A: 今のところは対応していません。`,
    en: `A: Not at the moment.`,
    ko: `A: 현재는 대응하지 않습니다.`,
    zh: `A：目前不支持。`,
  },
  "faq.q3": {
    ja: `Q: ゲーム内でタップしたら自動で反映されますか?`,
    en: `Q: Is a tap in the game reflected automatically?`,
    ko: `Q: 게임에서 터치하면 자동으로 반영되나요?`,
    zh: `Q：在游戏中触摸后会自动反映吗？`,
  },
  "faq.a3": {
    ja: `A: 本サイトはゲーム内のデータに一切アクセスしていません。ゲーム内カフェでのタップ後は、こちらでも手動でTapボタンを押してください。`,
    en: `A: This site does not access any in-game data. After tapping in the in-game cafe, please press the Tap button here manually as well.`,
    ko: `A: 이 사이트는 게임 내 데이터에 일절 접근하지 않습니다. 게임 내 카페에서 터치한 뒤 여기서도 직접 Tap 버튼을 눌러 주세요.`,
    zh: `A：本站完全不访问游戏内数据。在游戏内咖啡厅触摸后，请在这里也手动按下 Tap 按钮。`,
  },
  "faq.q4": {
    ja: `Q: Tap履歴のエクスポートはできますか?`,
    en: `Q: Can I export the tap history?`,
    ko: `Q: 터치 기록을 내보낼 수 있나요?`,
    zh: `Q：可以导出触摸记录吗？`,
  },
  "faq.a4": {
    ja: `A: はい、メニューの「データのエクスポート」からJSONファイルとして書き出せます(使い方ガイドも参照)。SNSなどへの共有は、月ごとの画像保存機能(SAVE IMAGE)をご使用ください。`,
    en: `A: Yes. Use "Export data" in the menu to save a JSON file. To share on social media, use the monthly image export (SAVE IMAGE).`,
    ko: `A: 네, 메뉴의 "데이터 내보내기"에서 JSON 파일로 저장할 수 있습니다(사용 가이드도 참조). SNS 공유에는 월별 이미지 저장 기능(SAVE IMAGE)을 이용하세요.`,
    zh: `A: 可以。在菜单的“导出数据”中可保存为 JSON 文件（另请参阅使用指南）。如需分享到社交媒体，请使用按月保存图片的功能（SAVE IMAGE）。`,
  },
  "faq.q5": {
    ja: `Q: 以前のバージョン(Discordログイン版)のデータを引き継げますか?`,
    en: `Q: Can I carry over data from the previous (Discord login) version?`,
    ko: `Q: 이전 버전(Discord 로그인판)의 데이터를 이어받을 수 있나요?`,
    zh: `Q：可以继承旧版本（Discord 登录版）的数据吗？`,
  },
  "faq.a5": {
    ja: `A: 旧版で書き出したデータ(JSON)を、設定ページの「データのインポート」から取り込めます。同じ形式で「データのエクスポート」から書き出すこともできます。Googleアカウントでログインしたうえでお試しください。`,
    en: `A: Yes. Import the data (JSON) exported from the old version via "Import data" in Settings (you can also export in the same format with "Export data"). Please sign in with your Google account first.`,
    ko: `A: 네. 이전 버전에서 내보낸 데이터(JSON)를 설정의 "데이터 가져오기"에서 불러올 수 있습니다. 같은 형식으로 "데이터 내보내기"도 가능합니다. 먼저 Google 계정으로 로그인해 주세요.`,
    zh: `A: 可以。可在设置的“导入数据”中导入旧版本导出的数据（JSON）。也可以用“导出数据”按相同格式导出。请先登录 Google 账号。`,
  },
  "faq.q6": {
    ja: `Q: The history calendar doesn't match the dates I actually tapped.`,
    en: `Q: The history calendar doesn't match the dates I actually tapped.`,
    ko: `Q: 기록 캘린더의 날짜가 실제로 터치한 날짜와 다릅니다.`,
    zh: `Q：历史日历上的日期与实际触摸的日期不一致。`,
  },
  "faq.a6": {
    ja: `A: The history calendar treats the period from 4:00 AM to 3:59 AM the following day (Japan Standard Time) as one day. Times shown elsewhere in the app use your local time zone (you can change it from the menu), but the calendar's day boundaries follow the game's reset time, so the dates may differ from your local dates if you live in a time zone other than UTC+9.`,
    en: `A: The history calendar treats the period from 4:00 AM to 3:59 AM the following day (Japan Standard Time) as one day. Times shown elsewhere in the app use your local time zone (you can change it in Settings), but the calendar's day boundaries follow the game's reset time, so the dates may differ from your local dates if you live in a time zone other than UTC+9.`,
    ko: `A: 기록 캘린더는 오전 4시부터 다음 날 오전 3시 59분까지(일본 표준시)를 하루로 취급합니다. 앱의 다른 곳에 표시되는 시각은 현지 시간대(설정에서 변경 가능)를 따르지만, 캘린더의 날짜 경계는 게임의 초기화 시각을 따르므로 UTC+9 이외의 시간대에서는 현지 날짜와 다를 수 있습니다.`,
    zh: `A：历史日历将每天 4:00 到次日 3:59（日本标准时间）视为一天。应用其他位置显示的时间使用本地时区（可在设置中更改），但日历的日期分界遵循游戏的刷新时间，因此在 UTC+9 以外的时区，日期可能与本地日期不同。`,
  },
  "faq.h2": {
    ja: `システム`,
    en: `System`,
    ko: `시스템`,
    zh: `系统`,
  },
  "faq.q7": {
    ja: `Q: オフラインでも利用できますか?`,
    en: `Q: Can I use it offline?`,
    ko: `Q: 오프라인에서도 사용할 수 있나요?`,
    zh: `Q：可以离线使用吗？`,
  },
  "faq.a7": {
    ja: `A: 利用できません。インターネットへの接続が必要です。`,
    en: `A: No. An internet connection is required.`,
    ko: `A: 사용할 수 없습니다. 인터넷 연결이 필요합니다.`,
    zh: `A：不可以，需要连接互联网。`,
  },
  "faq.q8": {
    ja: `Q: ゲーム内部のデータを使用していますか?`,
    en: `Q: Does it use data inside the game?`,
    ko: `Q: 게임 내부 데이터를 사용하나요?`,
    zh: `Q：会使用游戏内部的数据吗？`,
  },
  "faq.a8": {
    ja: `A: 本サイトはゲーム「ブルーアーカイブ」内に実装されている機能などは使用していません。また、ゲームデータ自体にもアクセスしていませんので、本サイトがゲーム内のアカウントに影響を与えることはありません。`,
    en: `A: This site does not use any features implemented in Blue Archive and does not access game data, so it cannot affect your in-game account.`,
    ko: `A: 이 사이트는 『블루 아카이브』에 구현된 기능을 사용하지 않으며 게임 데이터에도 접근하지 않으므로, 게임 내 계정에 영향을 주지 않습니다.`,
    zh: `A：本站不使用《蔚蓝档案》中实现的功能，也不访问游戏数据，因此不会影响你的游戏账号。`,
  },
  "faq.q9": {
    ja: `Q: アプリを閉じてもタイマー・チケットは維持されますか?`,
    en: `Q: Are timers and tickets kept after I close the app?`,
    ko: `Q: 앱을 닫아도 타이머·티켓이 유지되나요?`,
    zh: `Q：关闭应用后计时器和票券还会保留吗？`,
  },
  "faq.a9": {
    ja: `A: はい、維持されます。時間はあなたのGoogle Driveに保存されているため、ブラウザを閉じたり、別の端末からアクセスしたりしても、最新の状態が反映されます。`,
    en: `A: Yes. Times are stored in your Google Drive, so the latest state is reflected even after closing the browser or accessing from another device.`,
    ko: `A: 네, 유지됩니다. 시간은 본인의 Google Drive에 저장되므로 브라우저를 닫거나 다른 기기에서 접속해도 최신 상태가 반영됩니다.`,
    zh: `A：会。时间保存在你的 Google Drive 中，即使关闭浏览器或从其他设备访问，也会反映最新状态。`,
  },
  "faq.q10": {
    ja: `Q: データはどこに保存されますか?`,
    en: `Q: Where is my data stored?`,
    ko: `Q: 데이터는 어디에 저장되나요?`,
    zh: `Q：数据保存在哪里？`,
  },
  "faq.a10": {
    ja: `A: あなた自身のGoogle Drive内にある、このアプリ専用の非表示フォルダに保存されます。運営者のサーバーにタップ履歴などは保存されません。このアプリがアクセスするのは専用フォルダのみで、Driveにある他のファイルを読み取ることはありません。`,
    en: `A: In a hidden folder dedicated to this app in your own Google Drive. Tap history and similar data are not stored on the operator's servers. The app only accesses its dedicated folder and never reads other files in your Drive.`,
    ko: `A: 본인의 Google Drive 안에 있는 이 앱 전용 숨김 폴더에 저장됩니다. 운영자의 서버에는 터치 기록 등이 저장되지 않습니다. 이 앱은 전용 폴더에만 접근하며 Drive의 다른 파일은 읽지 않습니다.`,
    zh: `A：保存在你自己的 Google Drive 中本应用专用的隐藏文件夹里。触摸记录等不会保存在运营者的服务器上。本应用只访问专用文件夹，不会读取 Drive 中的其他文件。`,
  },
  "faq.q11": {
    ja: `Q: データのバックアップは必要ですか?`,
    en: `Q: Do I need to back up my data?`,
    ko: `Q: 데이터 백업이 필요한가요?`,
    zh: `Q：需要备份数据吗？`,
  },
  "faq.a11": {
    ja: `A: ログインに使用しているGoogleアカウントのDriveに保存されるため、ログアウトしてもデータが消えることはありません。ただし、データの永久保存については保証しておりませんので、各自で別途記録しておくことをおすすめします。`,
    en: `A: Data is stored in the Drive of the Google account you sign in with, so it is not lost when you sign out. However, permanent storage is not guaranteed, so we recommend keeping your own records.`,
    ko: `A: 로그인에 사용한 Google 계정의 Drive에 저장되므로 로그아웃해도 데이터가 사라지지 않습니다. 다만 영구 보존은 보증하지 않으므로 별도로 기록해 두시길 권장합니다.`,
    zh: `A：数据保存在登录所用 Google 账号的 Drive 中，退出登录也不会丢失。但我们不保证数据永久保存，建议自行另外记录。`,
  },
  "faq.q12": {
    ja: `Q: 複数の端末で同時に使えますか?`,
    en: `Q: Can I use it on several devices at the same time?`,
    ko: `Q: 여러 기기에서 동시에 사용할 수 있나요?`,
    zh: `Q：可以在多台设备上同时使用吗？`,
  },
  "faq.a12": {
    ja: `A: 複数端末でお使いいただけますが、複数端末での同時操作はデータの不整合を引き起こす可能性があります。データの整合性を保つために、他方の端末では再読み込みを行ってから操作を開始してください。`,
    en: `A: You can use multiple devices, but operating them at the same time may cause data inconsistencies. Reload the other device before you start operating it.`,
    ko: `A: 여러 기기에서 사용할 수 있지만 동시에 조작하면 데이터 불일치가 생길 수 있습니다. 다른 기기에서는 새로고침한 뒤 조작을 시작해 주세요.`,
    zh: `A：可以在多台设备上使用，但同时操作可能导致数据不一致。请在另一台设备上先重新加载再开始操作。`,
  },
  "faq.q13": {
    ja: `Q: 1つの端末で複数アカウントを管理できますか?`,
    en: `Q: Can I manage multiple accounts on one device?`,
    ko: `Q: 한 기기에서 여러 계정을 관리할 수 있나요?`,
    zh: `Q：可以在一台设备上管理多个账号吗？`,
  },
  "faq.a13": {
    ja: `A: 可能ですが、本サイトはアカウントを切り替えて使うシステムを実装していませんので、都度ログアウト・ログインが必要となります。また、通知機能は端末ごとに管理されており、1つの端末につき1つのアカウントのみ通知を受信できますのでご了承ください。`,
    en: `A: Yes, but the site has no account switching, so you need to sign out and sign in each time. Notifications are managed per device, and only one account per device can receive them.`,
    ko: `A: 가능하지만 계정 전환 기능이 없으므로 그때마다 로그아웃·로그인이 필요합니다. 또한 알림은 기기별로 관리되어 한 기기당 하나의 계정만 알림을 받을 수 있습니다.`,
    zh: `A：可以，但本站没有账号切换功能，每次都需要退出登录再登录。另外通知按设备管理，每台设备只能有一个账号接收通知。`,
  },
  "faq.q14": {
    ja: `Q: このサービスは無料で使えますか?`,
    en: `Q: Is this service free?`,
    ko: `Q: 무료로 사용할 수 있나요?`,
    zh: `Q：这个服务免费吗？`,
  },
  "faq.a14": {
    ja: `A: はい、すべての機能を無料でご利用いただけます。ただし、個人開発のサービスであるため、予告なく仕様変更やサービス停止を行う可能性がある点はあらかじめご了承ください。`,
    en: `A: Yes, all features are free. Since this is a personal project, specifications may change or the service may stop without notice.`,
    ko: `A: 네, 모든 기능을 무료로 이용할 수 있습니다. 다만 개인 개발 서비스이므로 예고 없이 사양이 변경되거나 서비스가 중단될 수 있습니다.`,
    zh: `A：是的，所有功能均可免费使用。不过由于是个人开发的服务，可能会不经预告地变更规格或停止服务，敬请谅解。`,
  },
  "faq.q15": {
    ja: `Q: 通知が届きません。`,
    en: `Q: Notifications do not arrive.`,
    ko: `Q: 알림이 오지 않습니다.`,
    zh: `Q：收不到通知。`,
  },
  "faq.a15": {
    ja: `A: ブラウザの設定で通知が「許可」になっているかご確認ください。また、本サイトの通知設定をやり直してみてください(使い方ガイドのページも参照)。ご利用の端末に起因する通知の不着は、申し訳ありませんが対応いたしかねます。利用規約にもある通り、通知は必ず届くことを保証しておりません。`,
    en: `A: Check that notifications are "allowed" in your browser settings, and try setting up notifications again (see also the User Guide). We are unable to handle missed notifications caused by your device. As stated in the Terms of Service, notification delivery is not guaranteed.`,
    ko: `A: 브라우저 설정에서 알림이 「허용」으로 되어 있는지 확인하고, 알림 설정을 다시 해 보세요(사용 가이드도 참고). 기기에 기인한 알림 미수신은 대응하기 어렵습니다. 이용약관에 있는 대로 알림이 반드시 도착함을 보증하지 않습니다.`,
    zh: `A：请确认浏览器设置中通知为「允许」，并重新进行本站的通知设置（也请参考使用指南）。因设备原因导致的通知未送达，我们无法处理。如使用条款所述，不保证通知一定送达。`,
  },
  "faq.q16": {
    ja: `Q: 「Drive の認証が切れました」と表示されます。`,
    en: `Q: "Drive authorization has expired" is displayed.`,
    ko: `Q: 「Drive 인증이 만료되었습니다」라고 표시됩니다.`,
    zh: `Q：显示「Drive 授权已过期」。`,
  },
  "faq.a16": {
    ja: `A: 通常は自動でGoogle Drive認証が更新されますが、更新できないときは画面上部の「再認証」ボタンを押してください。`,
    en: `A: Google Drive authorization is usually updated automatically, but if it cannot be updated, please press the "Reauthorize" button at the top of the screen.`,
    ko: `A: 보안을 위해 Google Drive 접근은 약 1시간 후 만료됩니다. 일반적으로 자동으로 갱신되지만, 갱신되지 않을 경우 화면 상단의 「재인증」 버튼을 눌러 주세요.`,
    zh: `A：为安全起见，Google Drive 的访问权限大约一小时后会过期。通常会自动更新；如果无法更新，请按屏幕顶部的“重新认证”按钮。`,
  },
  "faq.q17": {
    ja: `Q: Google以外のログイン方法はありますか?`,
    en: `Q: Are there other sign-in methods besides Google?`,
    ko: `Q: Google 외의 로그인 방법이 있나요?`,
    zh: `Q：除 Google 外还有其他登录方式吗？`,
  },
  "faq.a17": {
    ja: `A: 現在はGoogle認証のみに対応しています。本サイトはアカウントを切り替えて使用する設計になっていないため、他の認証システムを導入する予定もありません。`,
    en: `A: Only Google sign-in is supported at present. The site is not designed for switching accounts, so there are no plans to add other authentication systems.`,
    ko: `A: 현재는 Google 인증만 지원합니다. 이 사이트는 계정을 전환해 쓰는 설계가 아니므로 다른 인증 시스템을 도입할 예정도 없습니다.`,
    zh: `A：目前仅支持 Google 认证。本站并非为切换账号使用而设计，因此也没有引入其他认证系统的计划。`,
  },
  "terms.title": {
    ja: `利用規約`,
  },
  "terms.p1": {
    ja: `この利用規約は、本ウェブサイト上で提供するサービス(以下、「本サービス」といいます)の利用条件を定めるものです。`,
  },
  "terms.h1": {
    ja: `1. 免責事項`,
  },
  "terms.li1": {
    ja: `本サービスは現状のまま提供するもので、正確性・安全性・継続的に利用できることを保証するものではありません。`,
  },
  "terms.li2": {
    ja: `本サービスの利用により生じた損害(ゲーム内での損失、データ消失など)について、運営者は一切の責任を負いません。`,
  },
  "terms.li3": {
    ja: `通知機能はブラウザや設定、端末、ネットワーク環境等に依存するため、確実に届くことを保証するものではありません。`,
  },
  "terms.h2": {
    ja: `2. 禁止事項`,
  },
  "terms.li4": {
    ja: `本サービスのサーバーに過度な負荷をかける行為`,
  },
  "terms.li5": {
    ja: `不正アクセス行為`,
  },
  "terms.li6": {
    ja: `本サービスを営利目的に使用する行為`,
  },
  "terms.li7": {
    ja: `日本国における法令に反する行為`,
  },
  "terms.li8": {
    ja: `その他、運営者が不適切と判断する行為`,
  },
  "terms.li9": {
    ja: `禁止事項に違反した場合は、通知登録の削除、IPアドレス遮断などの措置を行うことがあります。`,
  },
  "terms.h3": {
    ja: `3. サービスの変更・停止`,
  },
  "terms.li10": {
    ja: `運営者は、ユーザーに通知することなく、本サービスの内容を変更または提供を中止することができるものとします。`,
  },
  "terms.h4": {
    ja: `4. 著作権`,
  },
  "terms.li11": {
    ja: `本サービスは個人によって制作された非公式ツールであり、株式会社Yostar、NEXON Games、およびその他の関連団体とは一切関係ありません。`,
  },
  "terms.li12": {
    ja: `本サービス中の『ブルーアーカイブ』に関係するデータ等の著作権は、株式会社Yostar、NEXON Games、およびその他の権利者に帰属します。`,
  },
  "terms.p2": {
    ja: `2026年2月8日 発効`,
  },
  "privacy.title": {
    ja: `プライバシーポリシー`,
  },
  "privacy.p1": {
    ja: `当サイトは、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。`,
  },
  "privacy.h1": {
    ja: `1. 収集する情報`,
  },
  "privacy.li1": {
    ja: `認証情報: Googleログイン時に提供されるユーザーID、メールアドレス、表示名、プロフィール画像URL。これらはユーザーの識別と表示のためにのみ使用されます。`,
  },
  "privacy.li2": {
    ja: `利用データ: タイマーのタップ履歴、チケット時刻、絆ランクの記録、表示設定(タイムゾーン)。これらは運営者のサーバーではなく、ユーザー自身のGoogle Driveのアプリ専用フォルダに保存されます。`,
  },
  "privacy.li3": {
    ja: `通知トークン・通知予約: プッシュ通知を送信するために必要な端末トークンと、未送信の通知予約。運営者のサーバーに保存されます。`,
  },
  "privacy.h2": {
    ja: `2. Google Driveへのアクセス`,
  },
  "privacy.li4": {
    ja: `本サービスは、Google Driveのアプリ専用領域(appDataFolder)のみにアクセスする権限(drive.appdata)を要求します。Driveにあるその他のファイルを閲覧・変更することはありません。`,
  },
  "privacy.h3": {
    ja: `3. 利用目的`,
  },
  "privacy.li6": {
    ja: `本サービスの提供・運営のため`,
  },
  "privacy.li7": {
    ja: `通知機能の提供のため`,
  },
  "privacy.li8": {
    ja: `アクセス解析による利便性向上のため`,
  },
  "privacy.li9": {
    ja: `不正アクセスの防止のため`,
  },
  "privacy.h4": {
    ja: `4. アクセス解析ツール`,
  },
  "privacy.p2": {
    ja: `当サイトでは、サービスの改善を目的として以下のツールを利用し、個人を特定できない匿名のトラフィックデータを収集しています。`,
  },
  "privacy.li10": {
    ja: `Google Analytics: Cookieを使用してサイトの利用状況を収集するために使用されます。`,
  },
  "privacy.li11": {
    ja: `Cloudflare Browser Insights: サイトのパフォーマンスや接続状況を分析するために使用されます。`,
  },
  "privacy.h5": {
    ja: `5. 第三者への提供`,
  },
  "privacy.p3": {
    ja: `当サイトは、法令に基づく場合を除き、予めユーザーの同意を得ることなく第三者に個人情報を提供することはありません。 ただし、本サービスの基盤としてGoogle(Firebase、Google Drive)およびCloudflareを使用しており、認証情報や通知トークンはGoogleのサーバー上で、ユーザーデータはユーザー自身のGoogle Drive上で管理されます。`,
  },
  "privacy.h6": {
    ja: `6. データの削除`,
  },
  "privacy.p4": {
    ja: `ユーザーは設定ページの「データ削除」から、いつでも自身のGoogle Drive上のデータと、サーバー上の通知トークン・通知予約を削除することができます。なお、アクセス解析によって収集された匿名情報については、本操作の対象外となります。`,
  },
  "operator.title": {
    ja: `運営者情報など`,
    en: `Operator Info`,
    ko: `운영자 정보 등`,
    zh: `运营者信息等`,
  },
  "operator.h1": {
    ja: `運営・開発`,
    en: `Operator / Developer`,
    ko: `운영·개발`,
    zh: `运营·开发`,
  },
  "operator.p1": {
    ja: `さにー<br> X: <a href="https://x.com/156miyako" target="_blank" rel="noopener noreferrer">@156miyako</a><br> HP: <a href="https://rabbit1.cc" target="_blank" rel="noopener noreferrer">https://rabbit1.cc</a>`,
    en: `Sunny<br> X: <a href="https://x.com/156miyako" target="_blank" rel="noopener noreferrer">@156miyako</a><br> HP: <a href="https://rabbit1.cc" target="_blank" rel="noopener noreferrer">https://rabbit1.cc</a>`,
    ko: `Sunny(さにー)<br> X: <a href="https://x.com/156miyako" target="_blank" rel="noopener noreferrer">@156miyako</a><br> HP: <a href="https://rabbit1.cc" target="_blank" rel="noopener noreferrer">https://rabbit1.cc</a>`,
    zh: `Sunny（さにー）<br> X: <a href="https://x.com/156miyako" target="_blank" rel="noopener noreferrer">@156miyako</a><br> HP: <a href="https://rabbit1.cc" target="_blank" rel="noopener noreferrer">https://rabbit1.cc</a>`,
  },
  "operator.h2": {
    ja: `謝辞`,
    en: `Acknowledgments`,
    ko: `감사의 말`,
    zh: `致谢`,
  },
  "operator.p2": {
    ja: `ブルーアーカイブ(ブルアカ)攻略 Wiki 様(絆ランクテーブル・生徒さんごとの贈り物対応付けに使用)<br> HP: <a href="https://bluearchive.wikiru.jp/" target="_blank" rel="noopener noreferrer">https://bluearchive.wikiru.jp/</a><br>Schale DB(生徒さんの名前の翻訳などに使用)<br> HP: <a href="https://schaledb.com" target="_blank" rel="noopener noreferrer">https://schaledb.com</a>`,
    en: `Blue Archive Strategy Wiki (used for the bond rank table and student gift mappings)<br> HP: <a href="https://bluearchive.wikiru.jp/" target="_blank" rel="noopener noreferrer">https://bluearchive.wikiru.jp/</a><br>Schale DB (used for student name translations and more)<br> HP: <a href="https://schaledb.com" target="_blank" rel="noopener noreferrer">https://schaledb.com</a>`,
    ko: `블루 아카이브 공략 Wiki 님(인연 랭크 표·학생별 선물 대응에 사용)<br> HP: <a href="https://bluearchive.wikiru.jp/" target="_blank" rel="noopener noreferrer">https://bluearchive.wikiru.jp/</a><br>Schale DB(학생 이름 번역 등에 사용)<br> HP: <a href="https://schaledb.com" target="_blank" rel="noopener noreferrer">https://schaledb.com</a>`,
    zh: `蔚蓝档案攻略 Wiki（用于羁绊等级表及各学生礼物对应）<br> HP: <a href="https://bluearchive.wikiru.jp/" target="_blank" rel="noopener noreferrer">https://bluearchive.wikiru.jp/</a><br>Schale DB（用于学生姓名翻译等）<br> HP: <a href="https://schaledb.com" target="_blank" rel="noopener noreferrer">https://schaledb.com</a>`,
  },
  "operator.h3": {
    ja: `変更履歴`,
    en: `Change log`,
    ko: `변경 이력`,
    zh: `更新历史`,
  },
  "operator.h4": {
    ja: `連絡先・フィードバック`,
    en: `Contact and feedback`,
    ko: `문의·피드백`,
    zh: `联系方式与反馈`,
  },
  "operator.p3": {
    ja: `不具合・ミスのご報告やご要望は、<a href="https://github.com/Sunny-JP/ba-cafe-timer-2" target="_blank" rel="noopener noreferrer">GitHub</a>または X (Twitter) までお願いいたします。 個人開発のため全てのご意見への対応は難しい場合がありますが、Pull Requestなど積極的に受け付けています。特にWeb開発経験をお持ちの方は、ご協力いただけると幸いです。`,
    en: `Please report bugs, mistakes and requests via <a href="https://github.com/Sunny-JP/ba-cafe-timer-2" target="_blank" rel="noopener noreferrer">GitHub</a> or X (Twitter). As this is a personal project we may not be able to respond to every comment, but pull requests are very welcome, especially from people with web development experience.`,
    ko: `오류·실수 제보나 요청은 <a href="https://github.com/Sunny-JP/ba-cafe-timer-2" target="_blank" rel="noopener noreferrer">GitHub</a> 또는 X(Twitter)로 부탁드립니다. 개인 개발이라 모든 의견에 대응하기 어려울 수 있지만, Pull Request는 적극 환영합니다. 특히 웹 개발 경험이 있는 분의 도움을 기다립니다.`,
    zh: `故障、错误的报告及需求请通过 <a href="https://github.com/Sunny-JP/ba-cafe-timer-2" target="_blank" rel="noopener noreferrer">GitHub</a> 或 X (Twitter) 联系。 由于是个人开发，可能无法回应所有意见，但非常欢迎 Pull Request，尤其期待有 Web 开发经验的朋友协助。`,
  },
};

// セクション id の本文。translated=false のときは日本語で代用している
export function docHtml(id, lang) {
  const skeleton = SKELETON[id];
  if (!skeleton) return { html: "", translated: true };
  const translated = lang in (TEXT[`${id}.title`] ?? {});
  const l = translated ? lang : "ja";
  const html = skeleton.replace(/\{\{([\w.]+)\}\}/g, (_, k) => TEXT[k]?.[l] ?? TEXT[k]?.ja ?? "");
  return { html, translated };
}
