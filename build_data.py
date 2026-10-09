"""把 ../Ingredient_Meal_Summary.xlsx 轉成網頁使用的 data/recipes.js
更新食譜後，執行:  python build_data.py
"""
import json, datetime, pathlib, shutil, sys
import openpyxl

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE.parent / "Ingredient_Meal_Summary.xlsx"
OUT = HERE / "data" / "recipes.js"
CATEGORIES = ["咖哩", "沙拉", "甜點"]   # 分頁名稱 = 料理類別

# 食材圖片：食材全名 -> (來源檔名 [在 ../FigureIngredients], 網頁用英文檔名)
# 新增食材時，在這裡加一行即可
IMG_SRC = HERE.parent / "FigureIngredients"
IMG_DIR = HERE / "img"
IMAGES = {
    "粗枝大蔥": ("蔥", "leek"),        "品鮮蘑菇": ("蘑菇", "mushroom"),
    "特選蛋": ("蛋", "egg"),           "窩心洋芋": ("洋芋", "potato"),
    "特選蘋果": ("蘋果", "apple"),     "火辣香草": ("香草", "herb"),
    "豆製肉": ("肉", "meat"),          "哞哞鮮奶": ("鮮奶", "milk"),
    "甜甜蜜": ("蜜", "honey"),         "純粹油": ("油", "oil"),
    "暖暖薑": ("薑", "ginger"),        "好眠番茄": ("番茄", "tomato"),
    "放鬆可可": ("可可", "cocoa"),     "美味尾巴": ("尾巴", "tail"),
    "萌綠大豆": ("大豆", "soybean"),   "萌綠玉米": ("玉米", "corn"),
    "醒腦咖啡豆": ("咖啡", "coffee"),  "沉甸甸南瓜": ("南瓜", "pumpkin"),
    "嫩亮酪梨": ("酪梨", "avocado"),
}

def pct(v):
    """食譜加成：Excel 若存成小數(0.78)或百分比格式，統一轉成 78；已是 78 則維持"""
    if v is None:
        return None
    v = float(v)
    v = v * 100 if v <= 1.5 else v
    v = round(v, 1)
    return int(v) if v == int(v) else v

wb = openpyxl.load_workbook(SRC, data_only=True)
data = {"updated": datetime.date.today().isoformat(), "ingredients": [], "categories": {}}

for cat in CATEGORIES:
    ws = wb[cat]
    rows = list(ws.iter_rows(values_only=True))
    header = rows[0]
    ing_names = [h for h in header[4:] if h]
    if not data["ingredients"]:
        data["ingredients"] = ing_names
    recipes = []
    for r in rows[1:]:
        if not r[0]:
            continue
        ings = {n: v for n, v in zip(header[4:], r[4:]) if n and v}
        recipes.append({
            "name": r[0], "bonus": pct(r[1]), "energy": r[2], "total": r[3],
            "ingredients": ings,
        })
    data["categories"][cat] = recipes
    print(f"{cat}: {len(recipes)} 道食譜")

# 複製圖片到專案內（上線時只需要 RepeatIngredients 資料夾）
IMG_DIR.mkdir(exist_ok=True)
data["images"] = {}
for ing in data["ingredients"]:
    if ing not in IMAGES:
        print("⚠ 沒有設定圖片對應：", ing); continue
    src_name, web_name = IMAGES[ing]
    src = IMG_SRC / f"{src_name}.webp"
    if not src.exists():
        print("⚠ 找不到圖片：", src); continue
    shutil.copyfile(src, IMG_DIR / f"{web_name}.webp")
    data["images"][ing] = f"img/{web_name}.webp"
print(f"圖片：{len(data['images'])}/{len(data['ingredients'])}")

OUT.write_text("window.RECIPE_DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
print("已輸出", OUT)
