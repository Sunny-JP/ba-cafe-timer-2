// 独自ドロップダウン (キャラ・年月・タイムゾーン・言語の選択) の開閉と絞り込み。

export const closeDropdowns = () => {
  for (const l of document.querySelectorAll(".dd-list")) {
    l.classList.remove("open");
    l.previousElementSibling.setAttribute("aria-expanded", "false");
  }
};

// 検索窓の絞り込み。ひらがなはカタカナにそろえ、大文字小文字は区別しない
const norm = (s) => s.toLowerCase().replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
export function filterDropdown(input) {
  const q = norm(input.value.trim());
  for (const li of input.closest(".dd-list").querySelectorAll("li[data-q]")) {
    li.hidden = !!q && !norm(li.dataset.q).includes(q);
  }
}

// ボタンを押したときの開閉。開いたら検索窓にフォーカスし、選択中の項目が見えるようにする
export function toggleDropdown(button) {
  const list = button.nextElementSibling;
  const open = !list.classList.contains("open");
  closeDropdowns();
  list.classList.toggle("open", open);
  button.setAttribute("aria-expanded", String(open));
  const q = list.querySelector(".dd-q");
  if (q) {
    q.value = "";
    filterDropdown(q);
    if (open) q.focus({ preventScroll: true });
  }
  list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
}
