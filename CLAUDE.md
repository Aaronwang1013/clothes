# Virtual Try-On (VTR) 專案

## 專案概述
從零開始建構 Virtual Try-On 網頁應用，讓使用者上傳人像照片並選擇服裝，AI 生成試穿效果圖。
最終目標是針對台灣市場加入差異化功能。

## 目前階段：MVP（最小可行產品）

### MVP 架構
```
Browser (Next.js + shadcn/ui)  →  FastAPI (REST API)  →  Replicate API (IDM-VTON)
                                       |
                                  SQLite + MinIO
```

### MVP 特性
- 不需登入（匿名使用）
- 不需 Celery（用 FastAPI BackgroundTasks）
- 不需 PostgreSQL（SQLite 足夠）
- 不需 WebSocket（前端輪詢 task 狀態）

### 技術選型
| 層級 | 技術 |
|------|------|
| 後端 | Python 3.11+ / FastAPI |
| 前端 | Next.js 14 + shadcn/ui + Tailwind |
| 資料庫 | SQLite (MVP) → PostgreSQL (之後) |
| 物件儲存 | MinIO (dev) / S3 (prod) |
| AI 推論 | Replicate API (IDM-VTON) |
| 套件管理 | uv (Python) / npm (Node.js) |

### 專案結構
```
clothes/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI 入口
│   │   ├── config.py        # 環境變數
│   │   ├── db.py            # SQLite 連線
│   │   ├── models.py        # SQLModel 模型
│   │   ├── storage.py       # MinIO 操作
│   │   ├── inference.py     # Replicate API 整合
│   │   ├── seed.py          # 預設資料
│   │   └── api/
│   │       ├── tryon.py     # 試穿 API
│   │       ├── garments.py  # 服裝 API
│   │       └── upload.py    # 上傳 API
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx     # 主頁面
│   │   ├── components/
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── GarmentGrid.tsx
│   │   │   ├── TryonResult.tsx
│   │   │   └── StatusPolling.tsx
│   │   └── lib/
│   │       └── api.ts       # API client
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── Makefile
```

### 核心 API
```
POST /api/tryon           # 提交試穿（上傳人像 + garment_id）
GET  /api/tryon/{task_id} # 查詢狀態與結果
GET  /api/garments        # 列出服裝
POST /api/upload          # 上傳圖片到 MinIO
```

### 資料模型
- **Garment**: id, name, category, image_url
- **TryonTask**: id, person_image_url, garment_id, status, result_image_url, created_at

### 核心流程
1. 前端 POST /api/tryon（上傳人像 + garment_id）
2. 後端建立 TryonTask(status='pending')，啟動 BackgroundTask
3. 前端每 3 秒輪詢 GET /api/tryon/{task_id}
4. BackgroundTask: 呼叫 Replicate API → 下載結果 → 上傳 MinIO → 更新 status='completed'
5. 前端顯示結果

---

## 長期規劃（MVP 之後）

### Phase 2: 完整功能
- Celery + Redis 任務佇列
- PostgreSQL 資料庫
- WebSocket 即時更新
- JWT 認證系統
- 支援多服裝類別（上衣、下身、洋裝）

### Phase 3: 使用者系統
- 登入/註冊
- 試穿歷史
- 收藏/分享

### Phase 4: 台灣市場功能
- 蝦皮/momo/PChome 電商整合
- 尺寸推薦系統
- LINE Login + 分享
- 穿搭推薦 AI

### Phase 5: 生產環境
- CatVTON 自建推論（RunPod/Modal）
- CI/CD (GitHub Actions)
- 監控（Prometheus + Grafana + Sentry）

## 開發規範
- Python 程式碼使用 ruff 格式化
- 前端使用 TypeScript
- Git commit 使用 conventional commits 格式
