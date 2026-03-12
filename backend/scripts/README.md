# 測試圖片準備指南

## 目錄結構
```
scripts/
├── sample_garments/     # 服裝圖片 (用於種子資料)
│   ├── 01.png          # White T-Shirt
│   ├── 02.png          # Black T-Shirt
│   ├── 03.png          # Blue Denim Shirt
│   ├── 04.png          # Red Polo Shirt
│   └── 05.png          # Grey Hoodie
│
└── test_persons/        # 測試人像照片
    ├── person1.jpg
    └── person2.jpg
```

## 圖片要求

### 服裝圖片 (Garment Images)
- **格式**: PNG (建議透明背景) 或 JPG
- **尺寸**: 建議 512x512 或 768x768
- **內容**:
  - 平鋪的服裝照片 (flat lay)
  - 或掛在衣架上的正面照
  - 背景乾淨、單色最佳
  - 服裝要佔畫面 70% 以上

**推薦免費圖片來源**:
- Unsplash: https://unsplash.com/s/photos/clothing
- Pexels: https://www.pexels.com/search/clothes/
- 或使用電商網站的商品圖 (蝦皮、momo、淘寶)

### 人像照片 (Person Images)
- **格式**: JPG 或 PNG
- **尺寸**: 建議 768x1024 (3:4 比例)
- **內容要求** ⭐ 重要:
  - ✅ 全身照 (從頭到腳都要拍到)
  - ✅ 正面站立,雙手自然下垂
  - ✅ 背景乾淨單色 (白色/淺色最佳)
  - ✅ 光線均勻,避免陰影
  - ✅ 穿著素色緊身上衣 (方便 AI 替換)
  - ❌ 避免穿著寬鬆衣物
  - ❌ 避免複雜背景
  - ❌ 避免誇張姿勢

**推薦測試人像來源**:
- Generated Photos: https://generated.photos/ (AI 生成人像)
- ThisPersonDoesNotExist: https://thispersondoesnotexist.com/
- 或使用 IDM-VTON 官方範例: https://github.com/yisol/IDM-VTON

## 快速測試

### 方法 1: 使用 IDM-VTON 官方範例
```bash
cd backend/scripts

# 下載範例圖片
curl -L -o test_persons/person1.jpg \
  "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/person/00008_00.jpg"

curl -L -o sample_garments/01.png \
  "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/cloth/00034_00.jpg"
```

### 方法 2: 使用自己的照片
1. 準備一張符合要求的全身照
2. 重新命名為 `person1.jpg`
3. 放到 `backend/scripts/test_persons/` 目錄

## 重新載入種子資料

當你準備好圖片後:

```bash
# 方法 1: 重啟 backend (會自動重新 seed)
docker-compose restart backend

# 方法 2: 手動執行 seed
docker exec clothes-backend-1 python -c "from app.seed import seed_garments; seed_garments()"
```

## 驗證圖片已上傳

```bash
# 查看 API 回傳的服裝列表
curl http://localhost:8000/api/garments | jq '.[0]'

# 或直接打開 MinIO 管理介面
open http://localhost:9001
# 登入: minioadmin / minioadmin
# 查看 tryon bucket > images 資料夾
```
