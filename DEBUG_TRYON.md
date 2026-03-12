# 試穿功能除錯指南

## 問題描述
點擊「立即試穿」後,彈出視窗但沒有繼續執行。
Backend logs 顯示: `422 Unprocessable Entity`

## 可能原因

### 1. FormData 格式問題
FastAPI 需要特定的 multipart/form-data 格式

### 2. 參數名稱不匹配
檢查前端傳送的參數名稱是否與 backend 期望的一致

### 3. 圖片檔案問題
File 物件可能沒有正確傳遞

## 請幫我檢查

### 開啟瀏覽器開發者工具

1. **按 F12** 或右鍵 → 檢查
2. **切換到 Console 標籤**
3. **再次點擊「立即試穿」**
4. **查看紅色錯誤訊息**

### 切換到 Network 標籤

1. **按 F12** → **Network 標籤**
2. **再次點擊「立即試穿」**
3. **找到 `/api/tryon` 請求** (狀態碼 422)
4. **點擊該請求**
5. **查看以下資訊**:

#### Request (請求)
- **Headers**: 確認 Content-Type
- **Payload/Body**: 查看傳送的資料

#### Response (回應)
- **Preview 或 Response**: 查看錯誤詳細訊息

## 常見 422 錯誤原因

### FastAPI 422 錯誤通常是:

1. **缺少必要參數**
   ```
   {"detail": [{"loc": ["body", "person_image"], "msg": "field required"}]}
   ```

2. **參數型別錯誤**
   ```
   {"detail": [{"loc": ["body", "garment_id"], "msg": "invalid type"}]}
   ```

3. **檔案上傳格式錯誤**
   ```
   {"detail": "File upload failed"}
   ```

## 請提供給我

把以下資訊複製給我:

### Console 標籤
```
(貼上紅色錯誤訊息)
```

### Network → /api/tryon → Response
```
(貼上回應內容)
```

## 臨時測試方案

如果想手動測試 API 是否正常:

```bash
# 1. 準備一張測試圖片
# 2. 取得第一件服裝的 ID
GARMENT_ID=$(curl -s http://localhost:8000/api/garments | jq -r '.[0].id')
echo "Garment ID: $GARMENT_ID"

# 3. 測試上傳
curl -X POST http://localhost:8000/api/tryon \
  -F "person_image=@/path/to/your/photo.jpg" \
  -F "garment_id=$GARMENT_ID"
```

如果這個指令成功,問題就在前端;如果失敗,問題在 backend。
