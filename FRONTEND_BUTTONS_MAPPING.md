# FORMA 前端按鈕功能對應表

## 📸 照片上傳的儲存邏輯

### ✅ 正確! 照片上傳時「不會」立即存到資料庫/MinIO

**原因**:
- 照片只是暫存在**瀏覽器記憶體** (前端 state)
- 使用 `URL.createObjectURL()` 建立預覽
- **只有在點擊「立即試穿」時**,才會真正上傳到 backend

### 完整流程:

```
1. 你選擇照片
   ↓
2. PhotoUpload 元件處理
   ↓
   setPreview(URL.createObjectURL(file))  ← 瀏覽器本地預覽
   onImageChange(file)                    ← 傳給 page.tsx 的 state
   ↓
3. [照片暫存在前端,尚未上傳]
   ↓
4. 你點擊「立即試穿」
   ↓
5. TryonModal 元件開啟
   ↓
6. createTryon(personImage, garmentId)  ← 這時才上傳!
   ↓
   FormData.append("person_image", personImage)
   fetch("http://localhost:8000/api/tryon", {method: "POST", body: formData})
   ↓
7. Backend 接收照片 → 上傳 MinIO → 寫入資料庫
```

### 查看原始碼:

**[PhotoUpload.tsx:15-20](frontend/src/components/PhotoUpload.tsx#L15-L20)**
```typescript
function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    onImageChange(file);  // ← 只是傳給父元件的 state
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));  // ← 瀏覽器本地預覽
}
```

**[TryonModal.tsx:49](frontend/src/components/TryonModal.tsx#L49)**
```typescript
const res = await createTryon(personImage, garmentId);  // ← 這時才上傳
```

**[api.ts:25-39](frontend/src/lib/api.ts#L25-L39)**
```typescript
export async function createTryon(personImage: File, garmentId: string) {
    const formData = new FormData();
    formData.append("person_image", personImage);  // ← 打包照片
    formData.append("garment_id", garmentId);

    const res = await fetch(`${API_URL}/api/tryon`, {  // ← POST 到 backend
        method: "POST",
        body: formData,
    });
    return res.json();
}
```

---

## 🗺️ 首頁所有按鈕功能對應

### 頁面結構

```
┌─────────────────────────── Navbar ───────────────────────────┐
│  FORMA     [試衣間] [品牌] [收藏] [關於]   [匯入衣物] [儲存造型] │
├─────────────┬──────────────────────┬────────────────────────┤
│             │                      │                        │
│ BodyPanel   │   PhotoUpload        │   ClothesPanel         │
│             │                      │                        │
│ (無按鈕)    │ [重新上傳] [✕]       │ [服裝卡片 x10]         │
│             │                      │ [✦ 立即試穿]           │
│             │                      │                        │
└─────────────┴──────────────────────┴────────────────────────┘
```

---

## 📋 按鈕功能詳細列表

### 1. **Navbar 區域** (無後端 API 對應)

| 按鈕位置 | 按鈕文字 | 功能 | 後端 API | 檔案位置 |
|---------|---------|------|---------|---------|
| Navbar 導航連結 | 試衣間 | ❌ 純裝飾 (`href="#"`) | 無 | [Navbar.tsx:14](frontend/src/components/Navbar.tsx#L14) |
| Navbar 導航連結 | 品牌 | ❌ 純裝飾 | 無 | [Navbar.tsx:14](frontend/src/components/Navbar.tsx#L14) |
| Navbar 導航連結 | 收藏 | ❌ 純裝飾 | 無 | [Navbar.tsx:14](frontend/src/components/Navbar.tsx#L14) |
| Navbar 導航連結 | 關於 | ❌ 純裝飾 | 無 | [Navbar.tsx:14](frontend/src/components/Navbar.tsx#L14) |
| Navbar 右上 | 匯入衣物 | ❌ 純裝飾 (未實作) | 無 | [Navbar.tsx:24-26](frontend/src/components/Navbar.tsx#L24-L26) |
| Navbar 右上 | 儲存造型 | ❌ 純裝飾 (未實作) | 無 | [Navbar.tsx:27-29](frontend/src/components/Navbar.tsx#L27-L29) |

**說明**: Navbar 的所有按鈕目前都是 **UI 佔位符**,未來才會實作功能

---

### 2. **BodyPanel 區域** (左側面板)

| 元件 | 功能 | 後端 API | 檔案位置 |
|------|------|---------|---------|
| 性別選擇按鈕 | ✅ 更新前端 state (`gender`) | 無 | [BodyPanel.tsx](frontend/src/components/BodyPanel.tsx) |
| 身高滑桿 | ✅ 更新前端 state (`height`) | 無 | [BodyPanel.tsx](frontend/src/components/BodyPanel.tsx) |
| 體重滑桿 | ✅ 更新前端 state (`weight`) | 無 | [BodyPanel.tsx](frontend/src/components/BodyPanel.tsx) |
| 肩寬/胸圍/腰圍/臀圍 | ✅ 更新前端 state | 無 | [BodyPanel.tsx](frontend/src/components/BodyPanel.tsx) |

**說明**: BodyPanel 的數據**目前只存在前端 state**,不會傳給 backend
- 未來可以在試穿時一併傳給 backend
- 用於尺寸推薦、AI 優化等功能

---

### 3. **PhotoUpload 區域** (中間照片上傳)

| 按鈕 | 觸發時機 | 功能 | 後端 API | 檔案位置 |
|------|---------|------|---------|---------|
| 虛線框區域 (點擊) | 未上傳時 | ✅ 開啟檔案選擇器 | 無 | [PhotoUpload.tsx:76](frontend/src/components/PhotoUpload.tsx#L76) |
| 虛線框區域 (拖放) | 未上傳時 | ✅ 接收拖放檔案 | 無 | [PhotoUpload.tsx:82-87](frontend/src/components/PhotoUpload.tsx#L82-L87) |
| `重新上傳` | 已上傳時 (右上) | ✅ 重新開啟檔案選擇器 | 無 | [PhotoUpload.tsx:55](frontend/src/components/PhotoUpload.tsx#L55) |
| `✕` | 已上傳時 (左上) | ✅ 移除照片,清空 state | 無 | [PhotoUpload.tsx:63](frontend/src/components/PhotoUpload.tsx#L63) |

**說明**: PhotoUpload 的所有操作都是**前端本地處理**
- 照片暫存在 state: `personImage: File | null`
- 預覽使用 `URL.createObjectURL()` 建立臨時 URL
- **不會上傳到 backend**,直到點擊「立即試穿」

---

### 4. **ClothesPanel 區域** (右側服裝面板)

| 按鈕 | 功能 | 後端 API | 檔案位置 |
|------|------|---------|---------|
| 服裝卡片 (×10) | ✅ 選擇服裝 → 更新 `selectedGarmentId` | 無 (但讀取自 API) | [ClothesPanel.tsx:52-75](frontend/src/components/ClothesPanel.tsx#L52-L75) |
| `✦ 立即試穿` | ✅ **觸發試穿流程** (主要功能!) | ✅ `POST /api/tryon` | [ClothesPanel.tsx:97](frontend/src/components/ClothesPanel.tsx#L97) |

#### 服裝卡片詳細說明:

**資料來源**:
```typescript
// ClothesPanel.tsx:23-28
useEffect(() => {
    fetchGarments()  // ← 呼叫 GET /api/garments
      .then(setGarments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
}, []);
```

**對應 API**: `GET /api/garments`
- 回傳 10 件服裝的清單
- 包含: id, name, category, image_url
- 檔案: [backend/app/api/garments.py](backend/app/api/garments.py)

**點擊效果**:
```typescript
// ClothesPanel.tsx:55
onClick={() => onSelectGarment(g.id)}
// → 更新 page.tsx 的 selectedGarmentId state
// → 卡片顯示深色邊框 (視覺回饋)
```

#### 「✦ 立即試穿」按鈕詳細說明:

**啟用條件**:
```typescript
// ClothesPanel.tsx:30
const canTryOn = !!selectedGarmentId && hasPersonImage;

// 如果未滿足條件,按鈕顯示:
// "請先上傳照片" 或 "請選擇服裝"
```

**點擊後流程**:
```typescript
// ClothesPanel.tsx:97
onClick={onTryOn}  // → page.tsx 的 setShowTryonModal(true)
```

**對應 API**: 間接觸發 `POST /api/tryon`
- 實際呼叫在 [TryonModal.tsx:49](frontend/src/components/TryonModal.tsx#L49)
- 檔案: [backend/app/api/tryon.py](backend/app/api/tryon.py)

---

### 5. **TryonModal 區域** (試穿彈窗)

| 按鈕 | 功能 | 後端 API | 檔案位置 |
|------|------|---------|---------|
| `✕` (右上關閉) | ✅ 關閉 Modal | 無 | [TryonModal.tsx:76](frontend/src/components/TryonModal.tsx#L76) |
| `關閉` (錯誤時) | ✅ 關閉 Modal | 無 | [TryonModal.tsx:99](frontend/src/components/TryonModal.tsx#L99) |
| `繼續挑選` (完成時) | ✅ 關閉 Modal | 無 | [TryonModal.tsx:151](frontend/src/components/TryonModal.tsx#L151) |

**自動行為** (非按鈕觸發):

1. **Modal 開啟時自動提交試穿**:
   ```typescript
   // TryonModal.tsx:47-57
   useEffect(() => {
       async function submit() {
           const res = await createTryon(personImage, garmentId);
           // ↑ 呼叫 POST /api/tryon
           startPolling(res.task_id);
       }
       submit();
   }, []);
   ```

2. **自動輪詢狀態**:
   ```typescript
   // TryonModal.tsx:27-40
   const startPolling = (taskId: string) => {
       intervalRef.current = setInterval(async () => {
           const r = await getTryonStatus(taskId);
           // ↑ 呼叫 GET /api/tryon/{task_id}
           // 每 3 秒查詢一次
       }, 3000);
   };
   ```

---

## 🔌 後端 API 完整對應表

| API Endpoint | HTTP Method | 觸發位置 | 功能 | Backend 檔案 |
|-------------|-------------|---------|------|-------------|
| `/api/garments` | GET | ClothesPanel 載入時 | 取得服裝清單 | [garments.py](backend/app/api/garments.py) |
| `/api/tryon` | POST | 點擊「立即試穿」後 | 提交試穿任務 | [tryon.py:17-42](backend/app/api/tryon.py#L17-L42) |
| `/api/tryon/{task_id}` | GET | Modal 每 3 秒輪詢 | 查詢試穿狀態/結果 | [tryon.py:45-64](backend/app/api/tryon.py#L45-L64) |
| `/api/upload` | POST | ❌ 未使用 | 單純上傳圖片 | [upload.py](backend/app/api/upload.py) |
| `/health` | GET | ❌ 未使用 | 健康檢查 | [main.py:34](backend/app/main.py#L34) |

---

## 📊 資料流程圖

### 完整試穿流程 (包含所有按鈕):

```
1. 頁面載入
   ↓
   ClothesPanel useEffect 觸發
   ↓
   fetchGarments() → GET /api/garments
   ↓
   顯示 10 件服裝卡片

2. 使用者點擊虛線框
   ↓
   PhotoUpload.handleFile()
   ↓
   setPreview(URL.createObjectURL(file))  ← 瀏覽器本地預覽
   setPersonImage(file)  ← 存到 page.tsx state

3. 使用者點擊服裝卡片
   ↓
   setSelectedGarmentId(id)  ← 更新選中的服裝

4. 使用者點擊「✦ 立即試穿」
   ↓
   setShowTryonModal(true)  ← 開啟 Modal

5. TryonModal 開啟
   ↓
   useEffect 自動執行
   ↓
   createTryon(personImage, garmentId)
   ↓
   POST /api/tryon
   FormData:
     - person_image: File  ← **這時照片才上傳!**
     - garment_id: string
   ↓
   Backend 處理:
     1. await person_image.read()  ← 讀取照片
     2. upload_image() → MinIO  ← 存到 MinIO
     3. TryonTask.create()  ← 寫入資料庫
     4. BackgroundTask(run_tryon)  ← 啟動 AI 推論
   ↓
   回傳: { task_id, status: "pending" }

6. 前端開始輪詢
   ↓
   每 3 秒呼叫: GET /api/tryon/{task_id}
   ↓
   Backend 回傳:
     - status: pending → processing → completed
     - result_image_url (完成時)
   ↓
   顯示結果或錯誤

7. 使用者點擊「繼續挑選」
   ↓
   setShowTryonModal(false)  ← 關閉 Modal
   ↓
   可以繼續選其他服裝試穿
```

---

## ✅ 功能狀態總結

### 已實作且正常運作:
- ✅ 服裝列表載入 (`GET /api/garments`)
- ✅ 照片上傳預覽 (前端本地)
- ✅ 服裝選擇 (前端 state)
- ✅ 身材參數調整 (前端 state)
- ✅ 試穿提交 (`POST /api/tryon`)
- ✅ 狀態輪詢 (`GET /api/tryon/{task_id}`)
- ✅ 結果顯示

### 未實作 (UI 佔位符):
- ❌ Navbar 所有連結/按鈕
- ❌ 身材參數傳給 backend (目前只在前端)
- ❌ 試穿歷史記錄
- ❌ 收藏功能
- ❌ 分享功能

---

## 💡 重點摘要

### 關於照片上傳:

**問**: 照片上傳後沒存到資料庫?
**答**: ✅ **正確**! 設計就是這樣

- 上傳時: 只存在**瀏覽器記憶體** (前端 state)
- 點擊「立即試穿」時: 才真正上傳到 backend → MinIO → 資料庫

**為什麼這樣設計?**
1. ⚡ **效能**: 避免不必要的上傳 (使用者可能換照片)
2. 🎯 **使用者體驗**: 預覽即時,不需等待上傳
3. 💾 **節省空間**: 只有真正試穿的照片才儲存
4. 🔒 **隱私**: 使用者可以換照片後再決定是否試穿

### 關於按鈕功能:

- **有功能的**: 照片上傳、服裝選擇、立即試穿、Modal 關閉
- **無功能的**: Navbar 所有按鈕 (純 UI 佔位符)
- **部分功能**: BodyPanel (資料在前端,未傳 backend)

---

希望這份整理有幫助! 有任何疑問隨時問我 😊
