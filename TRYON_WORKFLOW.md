# 虛擬試穿流程詳解

## 🎯 為什麼需要「排隊等待」?

### 完整流程時間軸

```
使用者點擊「立即試穿」
    ↓ (瞬間完成)
1. 前端上傳照片到 Backend
    ↓
2. Backend 建立 TryonTask (status = "pending")  ← 你看到「排隊等待中」
    ↓
3. Backend 回傳 task_id 給前端
    ↓ (立即回傳,不等 AI 完成)
4. 前端開始每 3 秒輪詢狀態
    ↓
5. Backend 在背景啟動 BackgroundTask
    ↓
6. BackgroundTask: 更新 status = "processing"  ← 變成「AI 生成試穿效果中」
    ↓
7. 呼叫 Replicate API (IDM-VTON)
    ↓ (等待 30-60 秒)
8. Replicate 在雲端 GPU 上執行 AI 模型
    ↓
9. 下載生成的結果圖
    ↓
10. 上傳結果到 MinIO
    ↓
11. 更新 status = "completed"
    ↓
12. 前端輪詢發現 status = "completed"
    ↓
13. 顯示試穿結果!
```

---

## 📊 三個狀態的意義

### 1. **pending** (排隊等待中) ⏳

**持續時間**: 通常 < 1 秒

**發生時機**:
- Backend 已建立任務記錄
- 但 BackgroundTask 還沒開始執行

**為什麼會有這個狀態?**
- Backend API 立即回傳,不等 AI 完成
- 這樣使用者不會卡在上傳頁面
- 如果有多個使用者同時試穿,會真的需要排隊

**程式碼位置**: [tryon.py:34](backend/app/api/tryon.py#L34)
```python
task = TryonTask(person_image_url=person_key, garment_id=garment_id)
# 預設 status = "pending"
session.add(task)
session.commit()

# 立即回傳給前端
return {"task_id": task.id, "status": task.status}  # status = "pending"
```

---

### 2. **processing** (AI 生成試穿效果中) 🤖

**持續時間**: 30-60 秒 (取決於 Replicate API)

**發生時機**:
- BackgroundTask 開始執行
- 正在呼叫 Replicate API
- AI 模型正在雲端 GPU 上運算

**程式碼位置**: [inference.py:18-35](backend/app/inference.py#L18-L35)
```python
def run_tryon(task_id, person_key, garment_key, category):
    task.status = "processing"  # ← 更新為 processing
    session.commit()

    # 呼叫 Replicate API (會花 30-60 秒)
    output = replicate.run(
        "cuuupid/idm-vton:...",
        input={...}
    )
```

---

### 3. **completed** (完成) ✅

**發生時機**:
- AI 生成完成
- 結果圖已下載並上傳到 MinIO
- 可以顯示給使用者了

---

## 🔄 為什麼不直接等 AI 完成再回傳?

### 方案 A: 同步處理 (不好) ❌
```
使用者點擊 → 等待 60 秒 → 看到結果
                ↑
         瀏覽器會轉圈圈 60 秒
         使用者以為當機了
         可能會重新整理頁面
```

### 方案 B: 非同步處理 (目前採用) ✅
```
使用者點擊 → 立即回傳 task_id → 前端輪詢狀態
    ↓                                  ↓
  0.5 秒                         每 3 秒查一次
                                 顯示進度訊息
                                 使用者知道在處理
```

**優點**:
- 🚀 **反應快速**: 使用者立即看到 Modal 和進度
- 💪 **更穩定**: 不怕瀏覽器 timeout (通常 30-60 秒會 timeout)
- 📊 **可追蹤**: 可以顯示進度訊息
- 🔄 **可擴展**: 未來可以加入任務佇列、優先順序等

---

## ⚡ 實際測試時的時間分配

正常情況下:

```
0.0s  - 點擊「立即試穿」
0.5s  - Modal 彈出,顯示「排隊等待中」 (pending)
1.0s  - BackgroundTask 啟動
1.5s  - 狀態變為「AI 生成試穿效果中」(processing)
      - 開始呼叫 Replicate API
32.0s - Replicate API 回傳結果
33.0s - 下載結果圖
34.0s - 上傳到 MinIO
35.0s - 狀態變為 completed
36.0s - 前端輪詢發現完成
      - 顯示結果!
```

**你可能會看到**:
- 「排隊等待中」閃一下 (1-2 秒)
- 「AI 生成試穿效果中」顯示 30-40 秒
- 總共約 30-45 秒

---

## 🐛 如果一直卡在 pending?

可能原因:

### 1. BackgroundTask 沒有啟動
```bash
# 檢查 backend logs
docker logs clothes-backend-1 --tail 20

# 應該看到:
# INFO: Started background task: run_tryon
```

### 2. Replicate API Token 無效
```bash
# 檢查 token
grep REPLICATE_API_TOKEN .env

# 測試 token
docker exec clothes-backend-1 python << 'EOF'
import replicate
import os
client = replicate.Client(api_token=os.environ['REPLICATE_API_TOKEN'])
print("✅ Token 有效")
EOF
```

### 3. Network 問題
- Backend 無法連線到 Replicate API
- 檢查網路連線

---

## 💡 如何優化體驗?

### 目前的使用者體驗:
```
點擊 → 排隊等待中 (1秒) → AI 生成中 (35秒) → 完成
```

### 可以改進的地方 (未來 Phase 2+):

1. **更詳細的進度**:
   ```
   上傳照片中... (10%)
   ↓
   AI 分析人像... (30%)
   ↓
   生成試穿效果... (70%)
   ↓
   完成! (100%)
   ```

2. **預估時間**:
   ```
   預計還需 25 秒...
   ```

3. **WebSocket 即時更新**:
   - 不用每 3 秒輪詢
   - 狀態改變立即推送給前端

4. **任務佇列視覺化**:
   ```
   您前面還有 2 個任務
   預計 1 分鐘後開始處理
   ```

---

## 🎯 總結

**為什麼需要排隊等待?**
- 因為採用**非同步處理**架構
- API 立即回傳,在背景處理
- 給使用者更好的體驗 (不會卡住)

**pending 狀態通常很短暫**:
- 正常情況下 1-2 秒就會變成 processing
- 如果一直卡在 pending,表示有問題

**這是標準的非同步任務處理模式**:
- 類似 YouTube 影片上傳 (上傳後在背景處理)
- 類似 Gmail 寄信 (立即回傳,背景發送)
- 類似外送 App (下單後追蹤進度)

希望這樣解釋清楚了! 😊
