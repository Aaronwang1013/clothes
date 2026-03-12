# FORMA 虛擬試衣功能測試指南

## 🎯 測試目標
驗證完整的試穿流程:上傳人像照片 → 選擇服裝 → AI 生成試穿效果

---

## 📋 測試前準備

### 1. 確認服務運行中
```bash
docker ps

# 應該看到三個容器運行:
# - clothes-backend-1   (port 8000)
# - clothes-frontend-1  (port 3000)
# - clothes-minio-1     (port 9000, 9001)
```

### 2. 準備測試圖片

#### A. 人像照片要求 ⭐ 重要
- **格式**: JPG 或 PNG
- **尺寸**: 768x1024 (3:4 比例) 或類似比例
- **內容要求**:
  - ✅ **全身照** (從頭到腳)
  - ✅ 正面站立,雙手自然下垂
  - ✅ 背景乾淨單色 (白色/淺色最佳)
  - ✅ 穿著素色緊身上衣
  - ❌ 避免寬鬆衣物
  - ❌ 避免複雜背景
  - ❌ 避免誇張姿勢

#### B. 推薦測試圖片來源
1. **IDM-VTON 官方範例** (最推薦):
   - 前往: https://github.com/yisol/IDM-VTON
   - 下載 `example/person/` 目錄下的圖片
   - 或 `example/cloth/` 目錄下的服裝圖

2. **Generated Photos** (AI 生成人像):
   - 前往: https://generated.photos/
   - 選擇全身照 (full body)
   - 下載後使用

3. **使用自己的照片**:
   - 用手機拍攝全身照
   - 確保符合上述要求
   - 背景盡量乾淨

---

## 🧪 測試步驟

### Step 1: 開啟前端頁面
```bash
open http://localhost:3000
```

你應該會看到 FORMA 虛擬試衣間介面,包含:
- 左側: 身材比例面板
- 中間: 照片上傳區
- 右側: 服裝選擇面板

### Step 2: 檢查服裝列表
右側應該會顯示 10 件服裝(目前是純色佔位符)

如果顯示"載入服裝中..."沒有變化:
```bash
# 檢查 API
curl http://localhost:8000/api/garments

# 檢查 backend logs
docker logs clothes-backend-1 --tail 20
```

### Step 3: 上傳人像照片
1. 點擊中間的上傳區域
2. 選擇你準備好的全身照
3. 照片應該會顯示預覽

### Step 4: 選擇服裝
1. 在右側點擊任一件服裝
2. 服裝卡片應該會有邊框高亮
3. 底部按鈕從「請先上傳照片」變成「✦ 立即試穿」

### Step 5: 開始試穿
1. 點擊「✦ 立即試穿」按鈕
2. 應該會彈出 Modal 視窗
3. 顯示 loading 動畫與狀態:
   - 「排隊等待中...」(pending)
   - 「AI 生成試穿效果中...」(processing)
   - 「通常需要 30-45 秒」

### Step 6: 查看結果
- **成功**: 顯示原始照片 vs 試穿效果圖
- **失敗**: 顯示錯誤訊息

---

## 🔍 監控與除錯

### 監控 Backend Logs
```bash
# 即時監控
docker logs -f clothes-backend-1

# 你應該看到:
# 1. POST /api/tryon - 提交試穿任務
# 2. 開始呼叫 Replicate API
# 3. 處理狀態更新
# 4. GET /api/tryon/{task_id} - 前端輪詢
```

### 監控前端 Network
1. 開啟瀏覽器開發者工具 (F12)
2. 切換到 Network 標籤
3. 觀察 API 請求:
   - `POST /api/tryon` - 提交試穿
   - `GET /api/tryon/{task_id}` - 每 3 秒輪詢一次

### 檢查 MinIO 儲存
```bash
# 開啟 MinIO 管理介面
open http://localhost:9001

# 登入: minioadmin / minioadmin
# 進入 tryon bucket → images 資料夾
# 應該可以看到:
# - 上傳的人像照片
# - 生成的試穿結果圖
```

### 檢查資料庫
```bash
# 進入 backend 容器
docker exec -it clothes-backend-1 python << 'EOF'
from app.db import engine
from sqlmodel import Session, select
from app.models import TryonTask

with Session(engine) as session:
    tasks = session.exec(select(TryonTask)).all()
    for task in tasks:
        print(f"Task {task.id[:8]}: {task.status}")
        if task.error:
            print(f"  Error: {task.error}")
EOF
```

---

## ❗ 常見問題

### Q1: API 回傳 404 "Garment not found"
**原因**: 資料庫沒有服裝資料

**解決方案**:
```bash
# 重啟 backend (會自動 seed)
docker-compose restart backend

# 等待 10 秒後檢查
curl http://localhost:8000/api/garments | jq 'length'
# 應該回傳: 10
```

### Q2: 試穿一直卡在 "pending" 狀態
**可能原因**:
1. Replicate API token 無效
2. Backend 未正確呼叫 Replicate API
3. Network 問題

**檢查步驟**:
```bash
# 1. 檢查 token
grep REPLICATE_API_TOKEN .env

# 2. 檢查 backend logs
docker logs clothes-backend-1 | grep -i "error\|exception"

# 3. 手動測試 Replicate API
docker exec clothes-backend-1 python << 'EOF'
import replicate
import os

token = os.environ.get('REPLICATE_API_TOKEN')
client = replicate.Client(api_token=token)

# 簡單測試
try:
    output = replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input={"prompt": "a cat"}
    )
    print("✅ Replicate API 正常")
except Exception as e:
    print(f"❌ Replicate API 錯誤: {e}")
EOF
```

### Q3: 試穿結果很奇怪/失敗
**可能原因**:
1. 人像照片不符合要求 (不是全身照/背景複雜)
2. 服裝圖片品質差 (目前是純色佔位符)
3. IDM-VTON 模型本身的限制

**解決方案**:
- 使用 IDM-VTON 官方範例圖片測試
- 確保人像照片符合要求
- 準備真實的服裝圖片

### Q4: CORS 錯誤
**症狀**: 瀏覽器 console 顯示 CORS error

**檢查**:
```bash
# 檢查 backend CORS 設定
curl -I -X OPTIONS http://localhost:8000/api/garments

# 應該包含:
# Access-Control-Allow-Origin: *
```

### Q5: 圖片無法顯示
**可能原因**: MinIO presigned URL 過期或設定錯誤

**檢查**:
```bash
# 測試 MinIO 連線
curl http://localhost:9000/minio/health/live

# 檢查 MinIO bucket
docker exec clothes-minio-1 ls -la /data/tryon/
```

---

## 📊 成功標準

測試通過條件:
- ✅ 前端可以正常顯示
- ✅ 可以上傳照片並預覽
- ✅ 可以選擇服裝
- ✅ 點擊「立即試穿」後,Modal 彈出
- ✅ 狀態從 pending → processing → completed
- ✅ 30-60 秒後顯示試穿結果圖
- ✅ 結果圖可以正常顯示

---

## 🚀 測試完成後

### 如果測試成功:
1. 🎉 恭喜!核心功能已經可以運作
2. 接下來可以:
   - 準備真實的服裝圖片
   - 優化使用者體驗
   - 新增錯誤處理
   - 撰寫 README 文件

### 如果測試失敗:
1. 記錄錯誤訊息
2. 檢查 backend logs
3. 檢查瀏覽器 console
4. 參考「常見問題」章節
5. 或告訴我錯誤訊息,我幫你除錯

---

## 📝 測試紀錄範本

```
測試日期: 2026-02-27
測試人員: [你的名字]

## 環境狀態
- [ ] Backend 運行中
- [ ] Frontend 運行中
- [ ] MinIO 運行中

## 測試結果
- [ ] 服裝列表載入成功
- [ ] 照片上傳成功
- [ ] 服裝選擇成功
- [ ] 試穿提交成功
- [ ] 狀態輪詢正常
- [ ] 結果圖生成成功
- [ ] 結果圖顯示正常

## 發現的問題
1. [描述問題]
2. [描述問題]

## 測試圖片
- 人像: [圖片來源/檔名]
- 服裝: [服裝 ID 或名稱]
- 處理時間: [秒數]
- 結果: [成功/失敗]

## 截圖
[附上測試截圖]
```

---

## 💡 下一步

測試完成後,建議優先做:
1. ✅ 準備 3-5 張真實服裝圖片 (取代色塊)
2. ✅ 新增更好的錯誤提示
3. ✅ 新增 loading 進度條
4. ✅ 撰寫 README 文件

祝測試順利! 🎉
