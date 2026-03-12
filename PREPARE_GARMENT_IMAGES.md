# 準備真實服裝圖片指南

## 🎯 目標
替換目前的色塊佔位符,準備 5-10 張真實服裝圖片用於測試

---

## ✅ 已完成
- ✅ 清除資料庫中的舊色塊資料
- ✅ 清除 MinIO 中的舊圖片
- ✅ 建立 `backend/scripts/sample_garments/` 目錄

---

## 📸 方法 1: 手動下載 IDM-VTON 官方範例 (推薦)

### 步驟:

1. **前往 IDM-VTON GitHub**
   ```
   https://github.com/yisol/IDM-VTON/tree/main/example/cloth
   ```

2. **選擇並下載 5-10 張服裝圖片**
   - 點擊圖片 → 右鍵「另存新檔」
   - 建議選擇: 00034_00.jpg, 00055_00.jpg, 00126_00.jpg, 00238_00.jpg, 00470_00.jpg

3. **重新命名並放到指定目錄**
   ```
   /Users/aaronwang/Desktop/clothes/backend/scripts/sample_garments/

   命名格式:
   01.png (或 .jpg)
   02.png
   03.png
   04.png
   05.png
   ...
   10.png (選用)
   ```

4. **驗證檔案**
   ```bash
   ls -lh backend/scripts/sample_garments/
   # 應該看到 5-10 個圖片檔案,每個 > 10KB
   ```

---

## 📸 方法 2: 使用電商網站的服裝圖

你也可以從台灣電商網站下載服裝圖片:

### 蝦皮購物
1. 前往 https://shopee.tw
2. 搜尋「T恤」或「襯衫」
3. 開啟商品頁面
4. 右鍵圖片 → 另存新檔

### UNIQLO Taiwan
1. 前往 https://www.uniqlo.com/tw/
2. 選擇商品
3. 下載商品圖片

### 注意事項:
- ✅ 選擇**平鋪**或**掛在衣架上**的照片
- ✅ 背景乾淨單色
- ✅ 服裝要清晰可見
- ❌ 避免模特兒穿著照 (效果較差)

---

## 📸 方法 3: 使用 Unsplash 免費圖庫

```bash
# 前往 Unsplash
open https://unsplash.com/s/photos/clothing-flat-lay

# 搜尋關鍵字:
- "clothing flat lay"
- "t-shirt product"
- "shirt white background"

# 下載 5-10 張圖片
# 放到 backend/scripts/sample_garments/
```

---

## 🚀 完成後:重新載入資料

### 方法 A: 重啟 Backend (推薦)

```bash
docker-compose restart backend

# 等待 15 秒後檢查
curl http://localhost:8000/api/garments | jq 'length'
# 應該顯示你放入的圖片數量 (5-10)
```

### 方法 B: 手動執行 Seed

```bash
docker exec clothes-backend-1 python -c "from app.seed import seed_garments; seed_garments()"
```

---

## ✅ 驗證圖片已載入

### 1. 檢查 API
```bash
curl http://localhost:8000/api/garments | jq '.[] | {name, image_url}'
```

### 2. 檢查 MinIO
```bash
# 開啟 MinIO 管理介面
open http://localhost:9001

# 登入: minioadmin / minioadmin
# 進入 tryon bucket → images 資料夾
# 應該看到你的服裝圖片
```

### 3. 檢查前端
```bash
# 開啟前端
open http://localhost:3000

# 右側應該顯示真實的服裝圖片 (不是色塊)
```

---

## 🎨 圖片要求

### 最佳格式:
- **尺寸**: 512x512 或 768x768
- **格式**: PNG (透明背景) 或 JPG
- **檔案大小**: 50KB - 2MB
- **內容**: 平鋪服裝或掛在衣架上

### 範例好圖:
```
✅ 白色背景上的黑色T恤 (平鋪)
✅ 掛在衣架上的襯衫正面照
✅ 純色背景的洋裝產品照
```

### 範例壞圖:
```
❌ 模特兒穿著照 (會跟試穿功能衝突)
❌ 複雜背景 (AI 難以辨識)
❌ 多件衣服在同一張圖 (AI 會混淆)
❌ 側面或背面照 (需要正面)
```

---

## 🆘 如果遇到問題

### Q: 重啟 backend 後圖片還是色塊?
```bash
# 1. 檢查檔案是否存在
ls -lh backend/scripts/sample_garments/

# 2. 檢查 seed.py 邏輯
# seed.py 會優先使用 backend/scripts/sample_garments/ 的圖片
# 如果不存在才會生成色塊

# 3. 查看 backend logs
docker logs clothes-backend-1 --tail 30
```

### Q: 圖片太大無法上傳?
```bash
# 使用 ImageMagick 或線上工具壓縮
# Mac 安裝:
brew install imagemagick

# 壓縮圖片到 512x512
convert input.jpg -resize 512x512 output.jpg
```

### Q: 需要多少張圖片?
- **最少**: 3 張 (快速測試)
- **建議**: 5 張 (基本測試)
- **完整**: 10 張 (完整體驗)

---

## 💡 快速測試建議

如果你只是想快速測試功能:
1. 下載 **3-5 張** IDM-VTON 官方範例圖
2. 重新命名為 01.png, 02.png, ...
3. 放到 `backend/scripts/sample_garments/`
4. 重啟 backend
5. 測試試穿功能

完成測試後,可以再慢慢增加更多服裝圖片。

---

## 📞 需要協助?

如果你:
- ✅ 已經下載了圖片並放到正確位置
- ✅ 重啟了 backend
- ❌ 但前端還是顯示色塊或沒有服裝

請執行以下指令並告訴我結果:

```bash
# 1. 檢查檔案
ls -lh backend/scripts/sample_garments/

# 2. 檢查 backend logs
docker logs clothes-backend-1 --tail 50 | grep -i "seed\|garment\|image"

# 3. 檢查 API
curl http://localhost:8000/api/garments | jq '.[0]'
```

我會幫你除錯! 😊
