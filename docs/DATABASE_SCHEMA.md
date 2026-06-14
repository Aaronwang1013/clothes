# 資料庫 Schema 設計

> 版本：1.0｜日期：2026-06-14｜作者：Aaron Wang

---

## 目前狀態（MVP）

資料庫使用 **SQLite**，以 SQLModel（SQLAlchemy + Pydantic）管理。生產環境使用 Docker named volume 持久化。MVP 後計畫遷移至 PostgreSQL。

---

## 資料表

### 1. `user` — 使用者

```
id                TEXT (UUID hex, PK)
email             TEXT UNIQUE NOT NULL
name              TEXT
avatar_url        TEXT
password_hash     TEXT          # Email 登入用；SSO 用戶為 NULL
oauth_provider    TEXT          # "google" | "line" | "facebook" | "apple" | NULL
oauth_provider_id TEXT          # provider 給的唯一 ID
is_admin          BOOLEAN       # 預設 False
created_at        DATETIME      # UTC
```

**設計說明：**
- Email 登入與 SSO 共用同一張表，以 `oauth_provider` 區分
- SSO 用戶 `password_hash` 為 NULL，無法使用 Email 登入
- 同一個 email 可以先用 Email 登入，後綁定 SSO（`sso_login` endpoint 會合併帳號）

---

### 2. `refreshtoken` — Refresh Token

```
id          TEXT (UUID hex, PK)
user_id     TEXT FK→user NOT NULL
token_hash  TEXT          # SHA-256(raw token)，raw token 只在發行時回傳一次
expires_at  DATETIME      # 30 天後過期
revoked     BOOLEAN       # 預設 False；使用或登出後設為 True
created_at  DATETIME      # UTC
```

**安全機制：**
- DB 只存 hash，不存原始 token（防 DB 洩漏直接被用）
- Token Rotation：每次 refresh 時舊 token 立即撤銷，發新 token
- 登出時 revoke 指定 token

---

### 3. `passwordresettoken` — 忘記密碼 Token

```
id          TEXT (UUID hex, PK)
user_id     TEXT FK→user NOT NULL
token_hash  TEXT          # SHA-256(raw token)
expires_at  DATETIME      # 發行後 1 小時過期
used        BOOLEAN       # 預設 False；重設成功後設為 True
created_at  DATETIME      # UTC
```

**設計說明：**
- 一次性使用（`used=True` 後無法再用）
- 有效期 1 小時
- Raw token 透過 Resend 寄至用戶 email

---

### 4. `garment` — 服裝

```
id          TEXT (UUID hex, PK)
name        TEXT NOT NULL
category    TEXT          # 目前只有 "upper_body"
image_url   TEXT          # S3/MinIO object key（非完整 URL）
```

**設計說明：**
- `image_url` 儲存 object key（如 `images/abc123.png`），不是完整 URL
- 實際 URL 在回傳前由 `get_presigned_url()` 動態產生
- 初始資料由 `seed.py` 在 server 啟動時自動填入

---

### 5. `tryontask` — 試穿任務

```
id                TEXT (UUID hex, PK)
person_image_url  TEXT NOT NULL      # S3/MinIO object key（人像）
garment_id        TEXT FK→garment NOT NULL
user_id           TEXT FK→user       # nullable（支援匿名使用）
status            TEXT NOT NULL      # pending | processing | completed | failed
result_image_url  TEXT               # S3/MinIO key（完成後填入）
error             TEXT               # 失敗原因（最多 500 字元）
created_at        DATETIME NOT NULL  # UTC
```

**狀態機：**
```
pending ──► processing ──► completed
                │
                └──────────► failed
```

| 狀態 | 說明 |
|------|------|
| `pending` | 任務已建立，等待 BackgroundTask 執行 |
| `processing` | BackgroundTask 已啟動，正在呼叫 Fashn.ai |
| `completed` | 結果圖已上傳 S3，`result_image_url` 已填入 |
| `failed` | 推論失敗，`error` 欄位記錄錯誤訊息 |

---

## 關聯圖

```
┌──────────────────────────────┐
│            user              │
│──────────────────────────────│
│ id (PK)                      │
│ email                        │
│ password_hash (nullable)     │
│ oauth_provider (nullable)    │
└────────────┬─────────────────┘
             │ 1:N
    ┌────────┴──────────────────────────────────┐
    │                                            │
    ▼                                            ▼
┌──────────────────────┐           ┌──────────────────────────┐
│    refreshtoken      │           │   passwordresettoken     │
│──────────────────────│           │──────────────────────────│
│ id (PK)              │           │ id (PK)                   │
│ user_id (FK)         │           │ user_id (FK)              │
│ token_hash           │           │ token_hash                │
│ expires_at           │           │ expires_at (1hr)          │
│ revoked              │           │ used                      │
└──────────────────────┘           └──────────────────────────┘

┌──────────────┐         ┌────────────────────────────┐
│   garment    │ ◄──N:1──│       tryontask            │──N:1──► user (nullable)
│──────────────│         │────────────────────────────│
│ id (PK)      │         │ id (PK)                    │
│ name         │         │ person_image_url            │
│ category     │         │ garment_id (FK)             │
│ image_url    │         │ user_id (FK, nullable)      │
└──────────────┘         │ status                      │
                         │ result_image_url (nullable) │
                         │ error (nullable)            │
                         └────────────────────────────┘
```

---

## 物件儲存（S3 / MinIO）

資料庫只存 **object key**，不存完整 URL。URL 由後端動態產生 presigned URL。

```
bucket: tryon
├── images/
│   ├── {uuid}.png    # 上傳的人像或服裝圖
│   └── {uuid}.png    # 試穿結果圖
```

**Key 格式**：`images/{uuid_hex}.{ext}`

---

## MVP 後的演進

| Phase | 主要變動 |
|-------|---------|
| Phase 2 | SQLite → PostgreSQL；新增 `brand`、`category` 表 |
| Phase 3 | 新增 `user_profile`（身材資料）、`user_favorite`、`share_link` |
| Phase 4 | 新增 `ecommerce_product`（蝦皮/momo 連結）、`size_recommendation`、`line_user` |

完整未來 Schema 設計詳見 `.claude/prompts/DATABASE_SCHEMA.md`。
