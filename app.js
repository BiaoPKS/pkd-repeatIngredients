// ===== 設定 =====
// 未來「依重疊次數給權重」只需修改這個函式：count = 該食材被幾道所選食譜使用
function overlapWeight(count) {
  return count; // 目前權重 = 次數，之後可改成例如 count * count
}

// ===== 狀態 =====
const DATA = window.RECIPE_DATA;
const CATS = Object.keys(DATA.categories);
const STORE_KEY = "pks-double-ingredient-v2";
let selected = {};   // { 咖哩: Set(食譜名), ... }
let lastClicked = {}; // 每類最近點選的食譜（供 Shift 範圍選取）
let enabled = new Set(CATS);   // 目前顯示並計算的料理種類
let view = "cat";              // "cat" = 各料理分析；"all" = 全食譜分析
CATS.forEach(c => { selected[c] = new Set(); DATA.categories[c].forEach(r => r.cat = c); });

try {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  CATS.forEach(c => ((saved.sel || {})[c] || []).forEach(n => selected[c].add(n)));
  if (Array.isArray(saved.on)) enabled = new Set(saved.on.filter(c => CATS.includes(c)));
  if (saved.view === "all" || saved.view === "cat") view = saved.view;
} catch (e) { /* 無法使用 localStorage 時忽略 */ }

function save() {
  try {
    const sel = {}; CATS.forEach(c => sel[c] = [...selected[c]]);
    localStorage.setItem(STORE_KEY, JSON.stringify({ sel, on: [...enabled], view }));
  } catch (e) {}
}

// ===== 計算 =====
function analyzeList(picked) {
  const map = {};
  picked.forEach(r => {
    Object.entries(r.ingredients).forEach(([ing, qty]) => {
      (map[ing] = map[ing] || []).push({ name: r.name, qty, cat: r.cat });
    });
  });
  const rows = Object.entries(map).map(([ing, users]) => ({
    ing, users, count: users.length, weight: overlapWeight(users.length),
  }));
  rows.sort((a, b) => b.weight - a.weight || b.count - a.count || a.ing.localeCompare(b.ing, "zh-Hant"));
  const unused = DATA.ingredients.filter(i => !map[i]);   // 所選食譜完全沒用到的食材
  return { picked, shared: rows.filter(r => r.count >= 2), single: rows.filter(r => r.count === 1), unused };
}

// 單一料理：只算該料理已選的食譜
function analyze(cat) {
  return analyzeList(DATA.categories[cat].filter(r => selected[cat].has(r.name)));
}

// 全食譜：把「納入」的各料理已選食譜合在一起算
function pickedAll() {
  return CATS.filter(c => enabled.has(c)).flatMap(c => DATA.categories[c].filter(r => selected[c].has(r.name)));
}

// ===== 畫面 =====
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => k.startsWith("on") ? e.addEventListener(k.slice(2), v) : e.setAttribute(k, v));
  kids.flat().forEach(k => e.append(k));
  return e;
};

function render() {
  const app = document.getElementById("app");
  const scrollPos = {};
  app.querySelectorAll(".list").forEach(l => scrollPos[l.closest(".col").dataset.cat] = l.scrollTop);
  const visible = CATS.filter(c => enabled.has(c));
  app.style.setProperty("--n", Math.max(visible.length, 1));
  renderTabs();
  renderCatBar();
  if (!visible.length) {
    app.replaceChildren(el("p", { class: "empty pad" }, "請在上方選擇至少一種料理。"));
  } else if (view === "all") {
    app.style.setProperty("--n", 1);
    app.replaceChildren(renderAllPanel(visible));
  } else {
    app.replaceChildren(...visible.map(renderCol));
  }
  app.querySelectorAll(".list").forEach(l => l.scrollTop = scrollPos[l.closest(".col").dataset.cat] || 0);
  document.getElementById("updated").textContent = "資料更新：" + DATA.updated;
}

function renderTabs() {
  const tabs = [["cat", "各料理分析"], ["all", "全食譜分析"]];
  document.getElementById("tabs").replaceChildren(...tabs.map(([k, label]) =>
    el("button", { class: "tab" + (view === k ? " on" : ""), role: "tab",
      "aria-selected": String(view === k),
      onclick: () => { view = k; save(); render(); } }, label)));
}

function renderCatBar() {
  const bar = document.getElementById("cats");
  bar.replaceChildren(el("span", { class: "cats-label" }, view === "all" ? "納入料理：" : "顯示料理："),
    ...CATS.map(c => {
      const cb = el("input", { type: "checkbox" });
      cb.checked = enabled.has(c);
      cb.addEventListener("change", () => {
        cb.checked ? enabled.add(c) : enabled.delete(c);
        save(); render();
      });
      return el("label", { class: "cat-toggle", "data-cat": c }, cb, c);
    }));
}

function renderCol(cat) {
  const recipes = DATA.categories[cat];
  const shown = recipes;

  const list = el("ul", { class: "list" }, shown.map(r => {
    const cb = el("input", { type: "checkbox" });
    cb.checked = selected[cat].has(r.name);
    cb.addEventListener("click", e => {
      const on = cb.checked;
      const idx = shown.indexOf(r);
      const last = shown.findIndex(x => x.name === lastClicked[cat]);
      // Shift + 點擊：把上次點的食譜到這次之間全部設成同樣狀態
      const range = (e.shiftKey && last >= 0)
        ? shown.slice(Math.min(idx, last), Math.max(idx, last) + 1) : [r];
      range.forEach(x => on ? selected[cat].add(x.name) : selected[cat].delete(x.name));
      lastClicked[cat] = r.name;
      save(); render();
    });
    return el("li", {}, el("label", {}, cb,
      el("span", { class: "nm" }, r.name),
      el("span", { class: "meta" },
        el("span", { class: "n-energy" }, r.energy.toLocaleString()),
        el("span", { class: "n-bonus" }, r.bonus + "%"),
        el("span", { class: "n-total" }, r.total))));
  }));

  const tools = el("div", { class: "tools" },
    el("button", { onclick: () => { shown.forEach(r => selected[cat].add(r.name)); save(); render(); } }, "全選"),
    el("button", { onclick: () => { selected[cat].clear(); save(); render(); } }, "清除"));

  return el("section", { class: "col", "data-cat": cat },
    el("div", { class: "col-head" }, el("h2", {}, `${cat}（${recipes.length}）`), tools),
    list, renderResult(cat));
}

// 食材圖示（找不到圖片時自動隱藏）
function icon(ing, size) {
  const src = (DATA.images || {})[ing];
  if (!src) return "";
  const img = el("img", { class: "ico", src, alt: "", width: size, height: size, loading: "lazy" });
  img.addEventListener("error", () => img.remove());
  return img;
}

// 各食譜的食材：只用到一次的（獨有）正常顯示，與其他食譜重疊的以淡色顯示
function singleSection(single, shared, picked, showCat) {
  const count = {};
  [...single, ...shared].forEach(r => count[r.ing] = r.count);
  const chip = (ing, qty, faded) => el("span",
    { class: "chip ing-chip" + (faded ? " faded" : ""), title: `${ing} ${qty}${faded ? `（與其他食譜重疊 ×${count[ing]}）` : "（只用到一次）"}` },
    icon(ing, 32), ing, " ", el("small", {}, qty));
  return el("div", { class: "sec" },
    el("h3", {}, `各食譜的食材・只用到一次（${single.length}）`),
    picked.map(r => {
      const entries = Object.entries(r.ingredients).sort((a, b) => (count[a[0]] > 1) - (count[b[0]] > 1));
      return el("div", { class: "grp", "data-cat": r.cat },
        el("div", { class: "grp-name" }, showCat ? el("span", { class: "cat-tag", "data-cat": r.cat }, r.cat) : "", r.name),
        el("div", { class: "chips" }, entries.map(([ing, qty]) => chip(ing, qty, count[ing] > 1))));
    }));
}

function chipSection(title, items, emptyText) {
  return el("div", { class: "sec" },
    el("h3", {}, `${title}（${items.length}）`),
    items.length
      ? el("div", { class: "chips" }, items.map(o =>
          el("span", { class: "chip ing-chip", title: o.note ? `${o.ing}：${o.note}` : o.ing },
            icon(o.ing, 32), o.ing, o.note ? el("small", {}, " " + o.note) : "")))
      : el("p", { class: "empty" }, emptyText));
}

// 結果區：各料理與全食譜共用。showCat = true 時，食譜旁會標出所屬料理
function renderResultBox(res, showCat, emptyHint) {
  const { picked, shared, single, unused } = res;
  const box = el("div", { class: "result" });
  if (!picked.length) {
    box.append(el("p", { class: "empty" }, emptyHint));
    return box;
  }
  const total = shared.length + single.length;
  const summary = el("p", { class: "summary" });
  const split = showCat
    ? "（" + CATS.filter(c => enabled.has(c)).map(c => `${c} ${picked.filter(r => r.cat === c).length}`).join("・") + "）"
    : "";
  summary.innerHTML = `已選 <b>${picked.length}</b> 道${split}・共用到 <b>${total}</b> 種食材`;
  box.append(summary);
  box.append(chipSection("用不到的食材", unused.map(i => ({ ing: i })), "所有食材都用到了"));

  box.append(el("div", { class: "sec" }, el("h3", {}, `重疊的食材（${shared.length} 種）`)));
  if (!shared.length) {
    box.append(el("p", { class: "empty" }, picked.length < 2 ? "至少選 2 道才會有重疊。" : "所選食譜之間沒有重疊的食材。"));
  }
  const max = shared.length ? shared[0].weight : 1;
  shared.forEach(r => {
    const bar = el("div", { class: "bar" }, el("i", { style: `width:${(r.weight / max) * 100}%` }));
    box.append(el("div", { class: "ing" },
      el("div", { class: "ing-head" },
        icon(r.ing, 44),
        el("span", { class: "ing-name" }, r.ing),
        el("span", { class: "badge" }, `×${r.count}`), bar),
      el("div", { class: "chips" }, r.users.map(u =>
        el("span", { class: "chip", ...(showCat ? { "data-cat": u.cat } : {}) }, u.name + " ", el("small", {}, u.qty))))));
  });

  box.append(singleSection(single, shared, picked, showCat));
  return box;
}

function renderResult(cat) {
  return renderResultBox(analyze(cat), false, "請在上方勾選食譜。");
}

// 全食譜分析：合併各料理已選的食譜
function renderAllPanel(visible) {
  const counts = visible.map(c => el("span", { class: "cat-tag", "data-cat": c }, `${c} ${selected[c].size}`));
  return el("section", { class: "col all" },
    el("div", { class: "col-head" }, el("h2", {}, "全食譜分析"), el("div", { class: "all-counts" }, counts)),
    el("p", { class: "all-hint" }, "合併各料理已勾選的食譜一起分析；要增減食譜，請切換到「各料理分析」勾選。"),
    renderResultBox(analyzeList(pickedAll()), true, "尚未勾選任何食譜，請先到「各料理分析」勾選。"));
}

render();
