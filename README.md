# RepeatIngredients — Pokémon Sleep 重疊食材查詢

在 **Pokémon Sleep** 中，勾選想做的咖哩、沙拉、甜點，一次看出哪些食材會被重複使用、哪些食材用不到，幫你規劃要準備的食材。

🔗 **線上使用**：（發布後在此填入網址，例如 `https://biaopks.github.io/pkd-repeatIngredients`）

## 功能

- **兩個分頁**：「各料理分析」分別看咖哩、沙拉、甜點；「全食譜分析」把三種料理已勾選的食譜合在一起，看整體的重疊與用不到的食材，並以顏色標出每道食譜所屬的料理。
- **選擇料理種類**：頁面最上方可開關咖哩、沙拉、甜點，關閉的種類不顯示也不計算。
- **勾選食譜**：每種料理一份清單，顯示基礎能量、食譜加成與食材總數；支援「全選」「清除」，按住 `Shift` 再點擊可一次選取（或取消）一個範圍。
- **用不到的食材**：所選食譜完全沒使用的食材。
- **重疊的食材**：被兩道以上所選食譜使用的食材，標示次數與各食譜用量。
- **各食譜的食材**：每道食譜各自用到的食材，只用到一次的以深色顯示，與其他食譜重疊的以淡色顯示，方便判斷哪些食材要一起準備。
- 勾選結果會記在瀏覽器裡，下次開啟會保留。

## 使用方式

直接開啟上方網址即可，電腦與手機都能使用，不需要安裝或登入。

想在自己的電腦上開啟：下載整個資料夾後，雙擊 `index.html` 即可。

## 專案結構

```
├── index.html        頁面
├── style.css         樣式
├── app.js            勾選與重疊統計邏輯
├── data/recipes.js   食譜資料（由 build_data.py 產生）
├── img/              食材圖片
└── build_data.py     將 Excel 轉成 data/recipes.js 並複製圖片
```

## 更新資料

食譜資料整理在 Excel（`Ingredient_Meal_Summary.xlsx`，不包含在此 repository），更新方式：

1. 修改 Excel 並存檔。
2. 在專案資料夾執行 `python build_data.py`（需要 Python 與 `openpyxl`）。
3. 將更新後的 `data/recipes.js`（有新增食材時也包含 `img/`）上傳到 GitHub，網站會自動更新。

## 資料來源與聲明

- 資料來源：[寶可夢攻略站 pks.raenonx.cc](https://pks.raenonx.cc)
- 本專案為非官方的玩家工具，與 Nintendo、Creatures Inc.、GAME FREAK inc.、The Pokémon Company 及 Pokémon Sleep 開發團隊無關。
- Pokémon 與 Pokémon Sleep 的名稱、角色與相關素材，其權利屬於各自的權利人。
- 資料可能因遊戲更新而與實際內容有落差，僅供參考。
