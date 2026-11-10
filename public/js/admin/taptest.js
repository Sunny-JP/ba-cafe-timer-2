import { api } from '../features/api.js';
import { showForegroundNotifications } from '../features/push.js';
import { $, initAdminPage } from './common.js';

const jst = (iso) => new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false });

async function run(schedule, out) {
  out.className = 'result';
  out.textContent = '実行中…';
  try {
    const v = $('#tap-time').value;
    const r = await api.adminTestTap({ schedule, tap_time: v ? new Date(v).toISOString() : undefined });
    const lines = schedule
      ? [`予約しました: ${jst(r.queued)} (JST) に通知が届きます`, `通知オンの端末: ${r.devices} 台(すべてに届きます)`]
      : [
          `タップ時刻: ${jst(r.tap_time)} (JST)`,
          `論理月: ${r.logical_month}`,
          `統計キー: ${r.stats_keys.join(', ')}`,
          r.notification.scheduled ? `通知: ${jst(r.notification.send_at)} に予約される` : `通知: 予約されない (${r.notification.reason})`,
          `サービスアカウント: ${r.service_account ? '設定済み' : '未設定 (通知は予約されません)'}`,
          `通知オンの端末: ${r.devices} 台`,
        ];
    out.textContent = lines.join('\n');
  } catch (e) {
    out.className = 'result err';
    out.textContent = e.message;
  }
}

$('#run').onclick = () => run(false, $('#sim-result'));
$('#queue').onclick = () => run(true, $('#queue-result'));

initAdminPage('/admin/taptest', showForegroundNotifications);
