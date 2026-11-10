import { api } from '../features/api.js';
import { showForegroundNotifications } from '../features/push.js';
import { $, initAdminPage } from './common.js';

$('#test-push').onclick = async () => {
  const out = $('#push-result');
  out.className = 'result';
  out.textContent = '送信中…';
  try {
    const r = await api.adminTestPush();
    out.textContent = `端末 ${r.devices} 台 / 成功 ${r.ok} / 無効 ${r.gone} (登録解除) / 失敗 ${r.error}`;
    if (r.failures.length) out.textContent += `
理由: ${[...new Set(r.failures)].join(', ')}`;
  } catch (e) {
    out.className = 'result err';
    out.textContent = e.message;
  }
};

initAdminPage('/admin/push', showForegroundNotifications);
