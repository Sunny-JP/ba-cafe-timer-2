// 表示言語(日本語 / English / 한국어 / 中文)。キーは UI 文字列、値は言語ごとの訳。
export const LANGS = [['ja', '日本語'], ['en', 'English'], ['ko', '한국어'], ['zh', '中文']];

const DICT = {
  ja: {
    loading: '読み込み中…',
    description: 'ブルーアーカイブ カフェのタップ間隔とチケットを管理するタイマー',
    loginText: 'Google アカウントでログインすると、記録はあなたの Google Drive に保存されます。',
    loginBtn: 'Google でログイン',
    reauthMsg: 'Drive の認証が切れました。',
    reauthBtn: '再認証',
    menu: 'メニュー',
    navTimer: 'タイマー',
    navCalendar: 'カレンダー',
    navBond: '絆',
    cancel: 'キャンセル',
    officialSite: '公式サイト',
    close: '閉じる',
    updateTitle: 'アップデートのお知らせ',
    updateHide: '今回のアップデートノートを今後表示しない',
    ok: 'OK',
    toLight: 'ライトモードにする',
    toDark: 'ダークモードにする',
    noPushSchedule: '境界を跨ぐため通知は予約されません',
    tapQueued: '再認証後に記録します(タップは端末に保存済み)',
    confirmDelBond: 'この記録を削除しますか?',
    confirmLogout: 'ログアウトしますか?',
    confirmDelAccount: 'Drive 上の全データと通知設定を削除します。元に戻せません。',
    del: '削除',
    logout: 'ログアウト',
    deleted: '削除しました',
    badJson: 'JSON を読み込めません',
    importReading: 'ファイルを読み込み中…',
    importSending: 'タップ {taps} 件 / 絆 {bonds} 件 を取り込み中…',
    importRefresh: 'データを更新中…',
    deleting: 'データを消去中…',
    forecast: '予測',
    imported: '取り込み完了: タップ {taps} / 絆 {bonds} 件 (スキップ {skipped})',
    pushDenied: '通知が許可されませんでした。',
    noRecord: '記録なし',
    noData: 'データ未登録',
    noHistory: 'まだ記録がありません',
    prev: '前へ',
    next: '次へ',
    docAbout: 'About',
    docGuide: '使い方ガイド',
    docFaq: 'FAQ',
    docTerms: '利用規約',
    docPrivacy: 'プライバシーポリシー',
    docOperator: '運営者情報など',
    docFallback: 'この文書は日本語版のみ提供しています。',
    modeAuto: '自動',
    modeLight: 'ライト',
    modeDark: 'ダーク',
    settings: '設定',
    display: '表示',
    accent: 'アクセントカラー',
    reset: 'リセット',
    timezone: 'タイムゾーン',
    deviceZone: '端末の設定',
    language: '言語 / Language',
    notifData: '通知・データ',
    pushTurnOn: '通知をオンにする',
    pushTurnOff: '通知をオフにする',
    pushStateOn: '現在: オン',
    pushStateOff: '現在: オフ',
    pushUnsupported: 'この端末は通知に非対応です (iOS はホーム画面に追加が必要)',
    importOld: 'データのインポート',
    exportData: 'データのエクスポート',
    exporting: 'データを書き出し中…',
    deleting: '記録を削除中…',
    thisMonth: '今月',
    exported: 'エクスポート完了: タップ {taps} / 絆 {bonds} 件',
    deleteData: 'データ削除',
  },
  en: {
    loading: 'Loading…',
    description: 'A timer for managing Blue Archive cafe tap intervals and invitation tickets',
    loginText: 'Sign in with your Google account. Your records are saved to your own Google Drive.',
    loginBtn: 'Sign in with Google',
    reauthMsg: 'Drive authorization has expired.',
    reauthBtn: 'Re-authenticate',
    menu: 'Menu',
    navTimer: 'Timer',
    navCalendar: 'Calendar',
    navBond: 'Bond',
    cancel: 'Cancel',
    officialSite: 'Official site',
    close: 'Close',
    updateTitle: "What's new",
    updateHide: "Don't show this update note again",
    ok: 'OK',
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
    noPushSchedule: 'No notification is scheduled because the next reset comes first',
    tapQueued: 'Saved on this device; it will be recorded after you re-authenticate',
    confirmDelBond: 'Delete this record?',
    confirmLogout: 'Sign out?',
    confirmDelAccount: 'This deletes all your data on Drive and your notification settings. This cannot be undone.',
    del: 'Delete',
    logout: 'Sign out',
    deleted: 'Deleted',
    badJson: 'Could not read the JSON file',
    importReading: 'Reading file…',
    importSending: 'Importing {taps} taps / {bonds} bond records…',
    importRefresh: 'Refreshing data…',
    deleting: 'Deleting data…',
    forecast: 'forecast',
    imported: 'Import complete: {taps} taps / {bonds} bond records ({skipped} skipped)',
    pushDenied: 'Notification permission was not granted.',
    noRecord: 'No records',
    noData: 'No data',
    noHistory: 'No records yet',
    prev: 'Previous',
    next: 'Next',
    docAbout: 'About',
    docGuide: 'User Guide',
    docFaq: 'FAQ',
    docTerms: 'Terms of Service',
    docPrivacy: 'Privacy Policy',
    docOperator: 'Operator Info',
    docFallback: 'This document is available in Japanese only.',
    modeAuto: 'Auto',
    modeLight: 'Light',
    modeDark: 'Dark',
    settings: 'Settings',
    display: 'Display',
    accent: 'Accent color',
    reset: 'Reset',
    timezone: 'Time zone',
    deviceZone: 'Device setting',
    language: 'Language',
    notifData: 'Notifications & data',
    pushTurnOn: 'Turn notifications on',
    pushTurnOff: 'Turn notifications off',
    pushStateOn: 'Currently on',
    pushStateOff: 'Currently off',
    pushUnsupported: 'This device does not support notifications (on iOS, add the app to the Home Screen first)',
    importOld: 'Import data',
    exportData: 'Export data',
    exporting: 'Exporting data…',
    deleting: 'Deleting the record…',
    thisMonth: 'This month',
    exported: 'Export complete: {taps} taps / {bonds} bond records',
    deleteData: 'Delete data',
  },
  ko: {
    loading: '불러오는 중…',
    description: '블루 아카이브 카페의 터치 간격과 초대권을 관리하는 타이머',
    loginText: 'Google 계정으로 로그인하면 기록이 본인의 Google Drive에 저장됩니다.',
    loginBtn: 'Google로 로그인',
    reauthMsg: 'Drive 인증이 만료되었습니다.',
    reauthBtn: '재인증',
    menu: '메뉴',
    navTimer: '타이머',
    navCalendar: '캘린더',
    navBond: '인연',
    cancel: '취소',
    officialSite: '공식 사이트',
    close: '닫기',
    updateTitle: '업데이트 안내',
    updateHide: '이번 업데이트 노트를 다시 표시하지 않기',
    ok: 'OK',
    toLight: '라이트 모드로 전환',
    toDark: '다크 모드로 전환',
    noPushSchedule: '다음 초기화 시각이 먼저 와서 알림이 예약되지 않습니다',
    tapQueued: '기기에 저장했습니다. 재인증 후 기록됩니다',
    confirmDelBond: '이 기록을 삭제할까요?',
    confirmLogout: '로그아웃할까요?',
    confirmDelAccount: 'Drive의 모든 데이터와 알림 설정을 삭제합니다. 되돌릴 수 없습니다.',
    del: '삭제',
    logout: '로그아웃',
    deleted: '삭제했습니다',
    badJson: 'JSON을 읽을 수 없습니다',
    importReading: '파일을 읽는 중…',
    importSending: '터치 {taps}건 / 인연 {bonds}건 가져오는 중…',
    importRefresh: '데이터를 갱신하는 중…',
    deleting: '데이터를 삭제하는 중…',
    forecast: '예측',
    imported: '가져오기 완료: 터치 {taps}건 / 인연 {bonds}건 (건너뜀 {skipped})',
    pushDenied: '알림이 허용되지 않았습니다.',
    noRecord: '기록 없음',
    noData: '데이터 없음',
    noHistory: '아직 기록이 없습니다',
    prev: '이전',
    next: '다음',
    docAbout: 'About',
    docGuide: '사용 가이드',
    docFaq: 'FAQ',
    docTerms: '이용약관',
    docPrivacy: '개인정보 처리방침',
    docOperator: '운영자 정보 등',
    docFallback: '이 문서는 일본어판만 제공됩니다.',
    modeAuto: '자동',
    modeLight: '라이트',
    modeDark: '다크',
    settings: '설정',
    display: '화면',
    accent: '강조 색상',
    reset: '초기화',
    timezone: '시간대',
    deviceZone: '기기 설정',
    language: '언어 / Language',
    notifData: '알림 · 데이터',
    pushTurnOn: '알림 켜기',
    pushTurnOff: '알림 끄기',
    pushStateOn: '현재: 켜짐',
    pushStateOff: '현재: 꺼짐',
    pushUnsupported: '이 기기는 알림을 지원하지 않습니다 (iOS는 홈 화면에 추가해야 합니다)',
    importOld: '데이터 가져오기',
    exportData: '데이터 내보내기',
    exporting: '데이터를 내보내는 중…',
    deleting: '기록을 삭제하는 중…',
    thisMonth: '이번 달',
    exported: '내보내기 완료: 터치 {taps}건 / 인연 {bonds}건',
    deleteData: '데이터 삭제',
  },
  zh: {
    loading: '加载中…',
    description: '用于管理蔚蓝档案咖啡厅触摸间隔与邀请券的计时器',
    loginText: '使用 Google 账号登录后，记录将保存在你自己的 Google Drive 中。',
    loginBtn: '使用 Google 登录',
    reauthMsg: 'Drive 授权已过期。',
    reauthBtn: '重新授权',
    menu: '菜单',
    navTimer: '计时器',
    navCalendar: '日历',
    navBond: '羁绊',
    cancel: '取消',
    officialSite: '官方网站',
    close: '关闭',
    updateTitle: '更新公告',
    updateHide: '不再显示本次更新说明',
    ok: 'OK',
    toLight: '切换为浅色模式',
    toDark: '切换为深色模式',
    noPushSchedule: '下一次刷新先到来，因此不会预约通知',
    tapQueued: '已保存在本设备，重新授权后将记录',
    confirmDelBond: '要删除这条记录吗？',
    confirmLogout: '要退出登录吗？',
    confirmDelAccount: '将删除 Drive 上的全部数据和通知设置，且无法恢复。',
    del: '删除',
    logout: '退出登录',
    deleted: '已删除',
    badJson: '无法读取 JSON',
    importReading: '正在读取文件…',
    importSending: '正在导入触摸 {taps} 条 / 羁绊 {bonds} 条…',
    importRefresh: '正在更新数据…',
    deleting: '正在删除数据…',
    forecast: '预测',
    imported: '导入完成：触摸 {taps} 条 / 羁绊 {bonds} 条（跳过 {skipped} 条）',
    pushDenied: '未允许通知。',
    noRecord: '无记录',
    noData: '暂无数据',
    noHistory: '还没有记录',
    prev: '上一个',
    next: '下一个',
    docAbout: 'About',
    docGuide: '使用指南',
    docFaq: 'FAQ',
    docTerms: '使用条款',
    docPrivacy: '隐私政策',
    docOperator: '运营者信息等',
    docFallback: '本文档仅提供日语版。',
    modeAuto: '自动',
    modeLight: '浅色',
    modeDark: '深色',
    settings: '设置',
    display: '显示',
    accent: '强调色',
    reset: '重置',
    timezone: '时区',
    deviceZone: '设备设置',
    language: '语言 / Language',
    notifData: '通知与数据',
    pushTurnOn: '开启通知',
    pushTurnOff: '关闭通知',
    pushStateOn: '当前：开',
    pushStateOff: '当前：关',
    pushUnsupported: '此设备不支持通知（iOS 需先添加到主屏幕）',
    importOld: '导入数据',
    exportData: '导出数据',
    exporting: '正在导出数据…',
    deleting: '正在删除记录…',
    thisMonth: '本月',
    exported: '导出完成：触摸 {taps} 条 / 羁绊 {bonds} 条',
    deleteData: '删除数据',
  },
};

// 贈物のカテゴリ(花言葉)名・贈物名・生徒名の訳。データ本体はサーバー(src/data/gamedata.js)にあり、
// ログイン後に loadNames() で読み込む。キーは日本語名。
const CATEGORY = { ja: {}, en: {}, ko: {}, zh: {} };

const GIFT_NAME = {};

const STUDENT_NAME = {};

const KEY = 'ct.lang';
const codes = LANGS.map((l) => l[0]);

function detect() {
  try {
    const saved = localStorage.getItem(KEY);
    if (codes.includes(saved)) return saved;
  } catch {
    /* 読めなくても動作する */
  }
  const nav = (navigator.language || 'ja').slice(0, 2).toLowerCase();
  return codes.includes(nav) ? nav : 'en';
}

let lang = detect();
export const getLang = () => lang;

export function setLang(code, persist = true) {
  if (!codes.includes(code)) return;
  lang = code;
  try {
    if (persist) localStorage.setItem(KEY, code);
  } catch {
    /* 保存できなくても動作する */
  }
  applyStatic();
}

export function t(key, vars = {}) {
  const s = DICT[lang][key] ?? DICT.ja[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export function loadNames(names) {
  for (const l of Object.keys(CATEGORY)) CATEGORY[l] = names.category[l] ?? {};
  for (const k of Object.keys(GIFT_NAME)) delete GIFT_NAME[k];
  for (const k of Object.keys(STUDENT_NAME)) delete STUDENT_NAME[k];
  Object.assign(GIFT_NAME, names.gift);
  Object.assign(STUDENT_NAME, names.student);
}

export const studentName = (name) => STUDENT_NAME[name]?.[lang] ?? name;
// 日本語名 -> {en, zh, ko} (管理画面の一覧用)
export const studentNames = (name) => STUDENT_NAME[name] ?? {};

// 管理画面で追加されたキャラの表示名 (name=日本語名、names={en, zh?, ko?})。未入力の言語は英語名で代用
export function registerStudentNames(characters) {
  for (const c of characters ?? []) {
    const en = c.names?.en ?? c.name;
    STUDENT_NAME[c.name] = { en, zh: c.names?.zh || en, ko: c.names?.ko || en };
  }
}
export const giftName = (name) => GIFT_NAME[name]?.[lang] ?? name;
export const categoryName = (name) => CATEGORY[lang][name] ?? name;

// index.html の固定文言。data-i18n=本文 / data-i18n-aria=aria-label
export function applyStatic() {
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('description'));
}
