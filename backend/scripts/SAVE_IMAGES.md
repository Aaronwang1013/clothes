# 儲存服裝圖片指南

我已經看到你上傳的 3 張 The North Face 圖片:
1. 紅色連帽衫 (Red Hoodie)
2. 黑色防風外套 (Black Windwall Jacket)
3. 黑色 Polo 衫 (Black Polo Shirt)

## 請按照以下步驟儲存:

### 方法 1: 直接從對話中儲存

1. **在對話視窗中**,找到你剛上傳的 3 張圖片
2. **右鍵點擊每張圖片** → 「另存新檔」
3. **儲存到**: `/Users/aaronwang/Desktop/clothes/backend/scripts/sample_garments/`
4. **重新命名**:
   - 紅色連帽衫 → `01.png`
   - 黑色防風外套 → `02.png`
   - 黑色 Polo 衫 → `03.png`

### 方法 2: 如果圖片已在你的電腦上

如果這些圖片已經在你的下載資料夾或桌面:

```bash
# 1. 找到圖片位置 (例如: ~/Downloads/)
# 2. 複製到專案目錄
cp ~/Downloads/圖片1.png backend/scripts/sample_garments/01.png
cp ~/Downloads/圖片2.png backend/scripts/sample_garments/02.png
cp ~/Downloads/圖片3.png backend/scripts/sample_garments/03.png
```

## 完成後驗證

```bash
# 檢查檔案
ls -lh backend/scripts/sample_garments/

# 應該看到:
# 01.png (紅色連帽衫)
# 02.png (黑色防風外套)
# 03.png (黑色 Polo 衫)
```

## 下一步

儲存完成後,執行:

```bash
# 重啟 backend
docker-compose restart backend

# 等待 15 秒後檢查
curl http://localhost:8000/api/garments | jq 'length'
# 應該顯示: 3
```

然後告訴我,我會幫你驗證!
