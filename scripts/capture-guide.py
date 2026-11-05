"""使い方ガイド用のスクリーンショットを、デモ画面 (public/demo.html) から撮り直す。

    python scripts/capture-guide.py                # すべて撮る
    python scripts/capture-guide.py timer bond     # 名前を指定して撮る
    python scripts/capture-guide.py --lang en      # 言語を指定 (既定: ja en ko zh)

- Edge (ヘッドレス) と Pillow が必要。出力は public/img/guide/<言語>/<名前>.png
- 幅 390px の iframe にデモを入れて撮るので、スマホ幅のレイアウトになる。
- 見本のデータは public/js/demo.js。撮る画面を増やすときは SHOTS に足す。
"""

import argparse
import functools
import http.server
import os
import subprocess
import tempfile
import time
import threading
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
OUT = PUBLIC / "img" / "guide"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

W, H, SCALE = 390, 780, 2  # 端末の幅・高さ(CSS px)と倍率

# 名前: (デモの URL に付けるクエリ, 画像の高さ(CSS px))
SHOTS = {
    "timer": ("tab=timer", 480),
    "calendar": ("tab=calendar", 700),
    "bond": ("tab=bond", 780),
    "menu": ("tab=timer&menu=1", 780),
    "settings": ("tab=settings", 780),
}


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(PUBLIC))
    handler.log_message = lambda *a, **k: None
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def capture(port, name, query, height, lang, mode, work):
    # 窓の最小幅(約500px)より狭い端末幅を再現するため、iframe の中にデモを入れる
    page = work / f"{name}-{lang}-{mode}.html"
    src = f"http://127.0.0.1:{port}/demo.html?{query}&lang={lang}&mode={mode}"
    page.write_text(
        f'<!doctype html><body style="margin:0;background:#000"><iframe src="{src}" '
        f'style="border:0;width:{W}px;height:{H}px;display:block"></iframe>',
        encoding="utf-8",
    )
    raw = work / f"{name}-{lang}-{mode}.png"
    subprocess.run(
        [
            EDGE, "--headless", "--disable-gpu", "--hide-scrollbars",
            f"--window-size={W + 120},{H + 120}", f"--force-device-scale-factor={SCALE}",
            "--virtual-time-budget=9000", f"--screenshot={raw}", page.as_uri(),
        ],
        check=True, capture_output=True,
        # 親が Chromium 系のとき残る変数。付いたままだと Edge が何も出さずに終了する
        env={k: v for k, v in os.environ.items() if not k.startswith("CHROME_")},
    )
    # Edge は起動した側のプロセスが先に終わり、画像はそのあとで書かれる。できあがる(書き込みが止まる)まで待つ
    last = -1
    for _ in range(120):
        size = raw.stat().st_size if raw.exists() else -1
        if size > 0 and size == last:
            break
        last = size
        time.sleep(0.5)
    else:
        raise RuntimeError(f"スクリーンショットができませんでした: {raw}")
    img = Image.open(raw).convert("RGB").crop((0, 0, W * SCALE, min(height, H) * SCALE))
    dest = OUT / lang / (name if mode == "dark" else f"{name}-{mode}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(f"{dest}.png", optimize=True)
    print("wrote", f"{dest}.png")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("names", nargs="*", help="撮る画面 (省略時はすべて)")
    ap.add_argument("--lang", nargs="*", default=["ja", "en", "ko", "zh"])
    ap.add_argument("--mode", nargs="*", default=["dark"], choices=["dark", "light"])
    args = ap.parse_args()
    names = args.names or list(SHOTS)
    server = serve()
    port = server.server_address[1]
    with tempfile.TemporaryDirectory() as tmp:
        for lang in args.lang:
            for mode in args.mode:
                for name in names:
                    query, height = SHOTS[name]
                    capture(port, name, query, height, lang, mode, Path(tmp))
    server.shutdown()


if __name__ == "__main__":
    main()
