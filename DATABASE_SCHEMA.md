# FORMA Virtual Try-On - 資料庫架構設計

## 目錄
- [設計原則](#設計原則)
- [MVP 階段 (目前)](#mvp-階段-目前)
- [Phase 2-3: 完整資料架構](#phase-2-3-完整資料架構)
- [Phase 4: 台灣市場擴展](#phase-4-台灣市場擴展)
- [物件儲存架構](#物件儲存架構)
- [索引策略](#索引策略)
- [資料遷移計劃](#資料遷移計劃)

---

## 設計原則

### 核心原則
1. **關注點分離**: Metadata (SQL) vs Binary (Object Storage)
2. **可擴展性**: 從 SQLite MVP → PostgreSQL Production
3. **正規化**: 避免資料重複,保持一致性
4. **性能優化**: 適當的索引與快取策略
5. **審計追蹤**: 記錄關鍵操作的時間戳與使用者

### 技術選型演進
```
MVP:      SQLite + MinIO (本機開發)
Phase 2:  PostgreSQL + MinIO (單機部署)
Phase 3:  PostgreSQL + S3 (雲端部署)
Phase 4+: PostgreSQL (主庫) + Read Replicas (讀寫分離)
```

---

## MVP 階段 (目前)

### 當前資料模型

#### 1. `garment` - 服裝表
```sql
CREATE TABLE garment (
    id           TEXT PRIMARY KEY,        -- UUID hex (32 chars)
    name         TEXT NOT NULL,           -- 服裝名稱
    category     TEXT NOT NULL,           -- upper_body | lower_body | dress
    image_url    TEXT NOT NULL,           -- MinIO key: "images/{uuid}.png"

    -- 未來擴展欄位 (Phase 2+)
    -- brand_id      TEXT,
    -- price         DECIMAL(10,2),
    -- description   TEXT,
    -- tags          JSON,
    -- created_at    TIMESTAMP,
    -- updated_at    TIMESTAMP
);
```

**索引**: PRIMARY KEY on `id`

#### 2. `tryontask` - 試穿任務表
```sql
CREATE TABLE tryontask (
    id                  TEXT PRIMARY KEY,
    person_image_url    TEXT NOT NULL,       -- MinIO key
    garment_id          TEXT NOT NULL,       -- FK to garment.id
    status              TEXT NOT NULL,       -- pending|processing|completed|failed
    result_image_url    TEXT,                -- MinIO key (nullable)
    error               TEXT,                -- 錯誤訊息 (nullable)
    created_at          TIMESTAMP NOT NULL,  -- UTC timestamp

    FOREIGN KEY (garment_id) REFERENCES garment(id)

    -- 未來擴展欄位 (Phase 3+)
    -- user_id           TEXT,
    -- session_id        TEXT,
    -- processing_time   INTEGER,
    -- model_version     TEXT,
    -- completed_at      TIMESTAMP
);
```

**索引**:
- PRIMARY KEY on `id`
- INDEX on `garment_id` (查詢某服裝的所有試穿記錄)
- INDEX on `created_at DESC` (按時間排序)

### MVP 限制
- ❌ 無使用者系統 (匿名使用)
- ❌ 無歷史記錄查詢 (試穿完就結束)
- ❌ 無收藏/分享功能
- ❌ 無服裝詳細資訊 (品牌/價格/描述)

---

## Phase 2-3: 完整資料架構

### 核心實體關係圖 (ERD)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    User     │1     *│  TryonTask   │*     1│   Garment   │
│─────────────│───────│──────────────│───────│─────────────│
│ id (PK)     │       │ id (PK)      │       │ id (PK)     │
│ email       │       │ user_id (FK) │       │ brand_id    │
│ username    │       │ garment_id   │       │ name        │
│ password    │       │ status       │       │ category_id │
│ created_at  │       │ created_at   │       │ price       │
└─────────────┘       └──────────────┘       └─────────────┘
      │                      │                      │
      │1                     │*                     │*
      │                      │                      │
      │*                     │                      │
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│ UserProfile │       │UserFavorite  │       │   Brand     │
│─────────────│       │──────────────│       │─────────────│
│ user_id(PK) │       │ id (PK)      │       │ id (PK)     │
│ gender      │       │ user_id (FK) │       │ name        │
│ height      │       │ garment_id   │       │ logo_url    │
│ weight      │       │ created_at   │       │ website     │
└─────────────┘       └──────────────┘       └─────────────┘
```

### 完整資料表設計

#### 1. `user` - 使用者表 (Phase 3)
```sql
CREATE TABLE "user" (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email           TEXT UNIQUE NOT NULL,
    username        TEXT UNIQUE,
    password_hash   TEXT,                    -- bcrypt hash (若使用密碼登入)
    auth_provider   TEXT DEFAULT 'email',    -- email|line|google|facebook
    auth_provider_id TEXT,                   -- LINE UID, Google ID, etc.
    is_active       BOOLEAN DEFAULT true,
    is_verified     BOOLEAN DEFAULT false,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMP,

    CONSTRAINT unique_auth UNIQUE (auth_provider, auth_provider_id)
);

CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_auth ON "user"(auth_provider, auth_provider_id);
CREATE INDEX idx_user_created_at ON "user"(created_at DESC);
```

**說明**:
- 支援多種登入方式 (Email, LINE, Google, Facebook)
- `auth_provider_id`: 第三方平台的 User ID
- `is_verified`: Email 驗證狀態

---

#### 2. `user_profile` - 使用者檔案表 (Phase 3)
```sql
CREATE TABLE user_profile (
    user_id         TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    display_name    TEXT,
    avatar_url      TEXT,                    -- MinIO/S3 key
    gender          TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),
    birth_date      DATE,

    -- 身材資訊 (對應前端 BodyPanel)
    height          INTEGER,                 -- cm
    weight          INTEGER,                 -- kg
    shoulder_width  INTEGER,                 -- cm
    chest           INTEGER,                 -- cm
    waist           INTEGER,                 -- cm
    hip             INTEGER,                 -- cm

    -- 偏好設定
    preferred_style JSON,                    -- ["casual", "formal", "streetwear"]
    preferred_brands JSON,                   -- brand_ids array

    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profile_gender ON user_profile(gender);
```

---

#### 3. `brand` - 品牌表 (Phase 2)
```sql
CREATE TABLE brand (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name            TEXT UNIQUE NOT NULL,
    name_zh         TEXT,                    -- 中文名稱
    logo_url        TEXT,                    -- MinIO/S3 key
    website         TEXT,
    description     TEXT,

    -- 電商整合 (Phase 4)
    shopee_shop_id  TEXT,
    momo_seller_id  TEXT,
    pchome_store_id TEXT,

    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brand_name ON brand(name);
CREATE INDEX idx_brand_active ON brand(is_active) WHERE is_active = true;
```

---

#### 4. `category` - 服裝分類表 (Phase 2)
```sql
CREATE TABLE category (
    id              TEXT PRIMARY KEY,        -- upper_body, lower_body, dress, etc.
    name            TEXT NOT NULL,
    name_zh         TEXT NOT NULL,           -- 中文名稱
    parent_id       TEXT REFERENCES category(id),  -- 支援多層分類
    display_order   INTEGER DEFAULT 0,
    icon_url        TEXT
);

-- 範例資料
INSERT INTO category (id, name, name_zh, parent_id) VALUES
    ('upper_body', 'Upper Body', '上身', NULL),
    ('lower_body', 'Lower Body', '下身', NULL),
    ('dress', 'Dress', '洋裝', NULL),
    ('tshirt', 'T-Shirt', 'T恤', 'upper_body'),
    ('shirt', 'Shirt', '襯衫', 'upper_body'),
    ('hoodie', 'Hoodie', '帽T', 'upper_body'),
    ('jeans', 'Jeans', '牛仔褲', 'lower_body'),
    ('skirt', 'Skirt', '裙子', 'lower_body');
```

---

#### 5. `garment` - 服裝表 (擴展版)
```sql
CREATE TABLE garment (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    brand_id        TEXT REFERENCES brand(id) ON DELETE SET NULL,
    category_id     TEXT NOT NULL REFERENCES category(id),

    -- 基本資訊
    name            TEXT NOT NULL,
    description     TEXT,
    price           DECIMAL(10, 2),
    currency        TEXT DEFAULT 'TWD',

    -- 圖片 (MinIO/S3 keys)
    image_url       TEXT NOT NULL,           -- 主圖
    detail_images   JSON,                    -- ["images/detail1.png", "detail2.png"]

    -- 屬性
    color           TEXT,                    -- "白色", "黑色"
    sizes           JSON,                    -- ["S", "M", "L", "XL"]
    material        TEXT,                    -- "100% 棉"
    tags            JSON,                    -- ["休閒", "夏季", "透氣"]

    -- 庫存與狀態
    stock_quantity  INTEGER DEFAULT 0,
    is_available    BOOLEAN DEFAULT true,

    -- 電商連結 (Phase 4)
    shopee_url      TEXT,
    momo_url        TEXT,
    pchome_url      TEXT,

    -- SEO
    slug            TEXT UNIQUE,             -- URL-friendly: "white-tshirt-nike"

    -- 統計
    view_count      INTEGER DEFAULT 0,
    tryon_count     INTEGER DEFAULT 0,
    favorite_count  INTEGER DEFAULT 0,

    -- 時間戳
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_garment_brand ON garment(brand_id);
CREATE INDEX idx_garment_category ON garment(category_id);
CREATE INDEX idx_garment_available ON garment(is_available) WHERE is_available = true;
CREATE INDEX idx_garment_price ON garment(price);
CREATE INDEX idx_garment_created_at ON garment(created_at DESC);
CREATE INDEX idx_garment_tryon_count ON garment(tryon_count DESC);
CREATE INDEX idx_garment_slug ON garment(slug);

-- GIN index for JSON fields (PostgreSQL)
CREATE INDEX idx_garment_tags ON garment USING GIN (tags);
```

---

#### 6. `tryon_task` - 試穿任務表 (擴展版)
```sql
CREATE TABLE tryon_task (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id             TEXT REFERENCES "user"(id) ON DELETE SET NULL,  -- nullable (匿名使用)
    session_id          TEXT,                    -- 匿名 session tracking
    garment_id          TEXT NOT NULL REFERENCES garment(id) ON DELETE CASCADE,

    -- 輸入
    person_image_url    TEXT NOT NULL,           -- MinIO/S3 key
    body_params         JSON,                    -- {height: 170, weight: 65, ...}

    -- 處理狀態
    status              TEXT NOT NULL DEFAULT 'pending',
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

    -- 輸出
    result_image_url    TEXT,                    -- MinIO/S3 key
    error_message       TEXT,
    error_code          TEXT,

    -- 技術細節
    model_version       TEXT DEFAULT 'idm-vton-v1',
    processing_time_ms  INTEGER,                 -- 處理耗時 (毫秒)
    replicate_id        TEXT,                    -- Replicate prediction ID

    -- 使用者互動
    user_rating         INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback       TEXT,

    -- 時間戳
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at          TIMESTAMP,
    completed_at        TIMESTAMP,

    -- Soft delete
    deleted_at          TIMESTAMP
);

CREATE INDEX idx_tryon_user ON tryon_task(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_tryon_session ON tryon_task(session_id);
CREATE INDEX idx_tryon_garment ON tryon_task(garment_id);
CREATE INDEX idx_tryon_status ON tryon_task(status);
CREATE INDEX idx_tryon_created_at ON tryon_task(created_at DESC);
CREATE INDEX idx_tryon_completed_at ON tryon_task(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Composite index for user history query
CREATE INDEX idx_tryon_user_created ON tryon_task(user_id, created_at DESC);
```

---

#### 7. `user_favorite` - 使用者收藏表 (Phase 3)
```sql
CREATE TABLE user_favorite (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id         TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    garment_id      TEXT NOT NULL REFERENCES garment(id) ON DELETE CASCADE,
    note            TEXT,                        -- 使用者備註
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, garment_id)                 -- 防止重複收藏
);

CREATE INDEX idx_favorite_user ON user_favorite(user_id, created_at DESC);
CREATE INDEX idx_favorite_garment ON user_favorite(garment_id);
```

---

#### 8. `share_link` - 分享連結表 (Phase 3)
```sql
CREATE TABLE share_link (
    id              TEXT PRIMARY KEY,            -- short code: "abc123"
    tryon_task_id   TEXT NOT NULL REFERENCES tryon_task(id) ON DELETE CASCADE,
    user_id         TEXT REFERENCES "user"(id) ON DELETE SET NULL,

    -- 分享設定
    is_public       BOOLEAN DEFAULT true,
    expires_at      TIMESTAMP,
    password_hash   TEXT,                        -- 選用密碼保護

    -- 統計
    view_count      INTEGER DEFAULT 0,

    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_share_task ON share_link(tryon_task_id);
CREATE INDEX idx_share_user ON share_link(user_id);
CREATE INDEX idx_share_expires ON share_link(expires_at) WHERE expires_at IS NOT NULL;
```

---

#### 9. `outfit_recommendation` - 穿搭推薦表 (Phase 4)
```sql
CREATE TABLE outfit_recommendation (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name            TEXT NOT NULL,
    description     TEXT,
    image_url       TEXT,                        -- 穿搭示意圖

    -- 推薦邏輯
    target_gender   TEXT,
    target_season   TEXT[],                      -- ["spring", "summer"]
    target_occasion TEXT[],                      -- ["casual", "formal", "party"]

    -- 搭配的服裝
    garment_ids     JSON NOT NULL,               -- [id1, id2, id3]

    -- AI 生成資訊
    ai_generated    BOOLEAN DEFAULT false,
    ai_prompt       TEXT,

    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT true
);

CREATE INDEX idx_outfit_gender ON outfit_recommendation(target_gender);
CREATE INDEX idx_outfit_active ON outfit_recommendation(is_active) WHERE is_active = true;
```

---

#### 10. `size_recommendation` - 尺寸推薦表 (Phase 4)
```sql
CREATE TABLE size_recommendation (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id         TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    garment_id      TEXT NOT NULL REFERENCES garment(id) ON DELETE CASCADE,

    -- 推薦結果
    recommended_size TEXT NOT NULL,              -- "M", "L"
    confidence      DECIMAL(3, 2),               -- 0.85 (85% 信心)

    -- 推薦依據
    algorithm       TEXT,                        -- "ml_model_v1", "rule_based"
    input_params    JSON,                        -- {height: 170, chest: 90, ...}

    -- 使用者反饋
    user_accepted   BOOLEAN,
    actual_size     TEXT,                        -- 使用者實際購買的尺寸

    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_size_user ON size_recommendation(user_id);
CREATE INDEX idx_size_garment ON size_recommendation(garment_id);
```

---

#### 11. `analytics_event` - 行為分析表 (Phase 3+)
```sql
CREATE TABLE analytics_event (
    id              BIGSERIAL PRIMARY KEY,       -- 高頻寫入用 BIGSERIAL
    user_id         TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    session_id      TEXT NOT NULL,

    -- 事件資訊
    event_type      TEXT NOT NULL,               -- page_view, garment_click, tryon_start, etc.
    event_category  TEXT,                        -- navigation, engagement, conversion

    -- 關聯實體
    garment_id      TEXT,
    tryon_task_id   TEXT,

    -- 事件屬性
    properties      JSON,                        -- {referrer: "google", device: "mobile"}

    -- Context
    ip_address      INET,
    user_agent      TEXT,

    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Partition by month for performance
CREATE INDEX idx_analytics_user ON analytics_event(user_id, created_at DESC);
CREATE INDEX idx_analytics_type ON analytics_event(event_type, created_at DESC);
CREATE INDEX idx_analytics_session ON analytics_event(session_id);

-- Consider partitioning for large datasets
-- CREATE TABLE analytics_event_2024_02 PARTITION OF analytics_event
--     FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

---

## Phase 4: 台灣市場擴展

### 電商整合相關表

#### 12. `ecommerce_product` - 電商商品映射表
```sql
CREATE TABLE ecommerce_product (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    garment_id      TEXT NOT NULL REFERENCES garment(id) ON DELETE CASCADE,

    -- 平台資訊
    platform        TEXT NOT NULL,               -- shopee|momo|pchome
    product_id      TEXT NOT NULL,               -- 平台商品 ID
    product_url     TEXT NOT NULL,

    -- 同步資訊
    price           DECIMAL(10, 2),
    stock           INTEGER,
    is_available    BOOLEAN DEFAULT true,

    -- 最後同步時間
    last_synced_at  TIMESTAMP,
    sync_error      TEXT,

    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (platform, product_id)
);

CREATE INDEX idx_ecommerce_garment ON ecommerce_product(garment_id);
CREATE INDEX idx_ecommerce_platform ON ecommerce_product(platform, is_available);
```

#### 13. `line_user` - LINE 使用者綁定表
```sql
CREATE TABLE line_user (
    user_id         TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    line_user_id    TEXT UNIQUE NOT NULL,        -- LINE User ID
    display_name    TEXT,
    picture_url     TEXT,
    status_message  TEXT,

    -- LINE Notify token (用於推播)
    notify_token    TEXT,

    linked_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_line_user_id ON line_user(line_user_id);
```

---

## 物件儲存架構

### MinIO/S3 Bucket 結構
```
tryon/                          (bucket name)
├── images/
│   ├── garments/
│   │   ├── original/           原始服裝圖
│   │   │   └── {uuid}.png
│   │   ├── thumbnail/          縮圖 (200x200)
│   │   │   └── {uuid}.jpg
│   │   └── medium/             中圖 (800x800)
│   │       └── {uuid}.jpg
│   │
│   ├── persons/                使用者上傳的人像
│   │   └── {uuid}.png
│   │
│   ├── results/                試穿結果圖
│   │   └── {uuid}.png
│   │
│   ├── avatars/                使用者頭像
│   │   └── {user_id}.jpg
│   │
│   └── brands/                 品牌 logo
│       └── {brand_id}.png
│
├── temp/                       暫存檔 (定期清理)
│   └── uploads/
│       └── {uuid}.tmp
│
└── exports/                    使用者資料匯出
    └── {user_id}/
        └── {export_id}.zip
```

### 檔案命名規範
- **格式**: `{category}/{subcategory}/{uuid}.{ext}`
- **UUID**: 使用 UUID v4 (hex 格式, 無破折號)
- **副檔名**: .png (透明), .jpg (壓縮)

### 儲存策略
```python
# 圖片處理流程
原始上傳 → 驗證 → 壓縮/轉換 → 生成多尺寸 → 上傳 MinIO → 存 URL 到 DB
```

---

## 索引策略

### 查詢模式分析

#### 高頻查詢
1. **列出服裝** (分頁 + 篩選)
   ```sql
   SELECT * FROM garment
   WHERE category_id = ? AND is_available = true
   ORDER BY created_at DESC
   LIMIT 20 OFFSET 0;
   ```
   需要索引: `(category_id, is_available, created_at DESC)`

2. **使用者試穿歷史**
   ```sql
   SELECT * FROM tryon_task
   WHERE user_id = ?
   ORDER BY created_at DESC
   LIMIT 50;
   ```
   需要索引: `(user_id, created_at DESC)`

3. **熱門服裝**
   ```sql
   SELECT * FROM garment
   WHERE is_available = true
   ORDER BY tryon_count DESC
   LIMIT 10;
   ```
   需要索引: `(is_available, tryon_count DESC)`

#### 複合索引建議
```sql
-- 服裝篩選與排序
CREATE INDEX idx_garment_filter_sort
ON garment(category_id, is_available, created_at DESC);

-- 使用者歷史查詢
CREATE INDEX idx_tryon_user_history
ON tryon_task(user_id, created_at DESC)
WHERE deleted_at IS NULL;

-- 品牌服裝查詢
CREATE INDEX idx_garment_brand_active
ON garment(brand_id, is_available, created_at DESC);
```

### 全文搜尋 (PostgreSQL)
```sql
-- 為服裝名稱和描述建立全文搜尋索引
ALTER TABLE garment ADD COLUMN search_vector tsvector;

CREATE INDEX idx_garment_search
ON garment USING GIN(search_vector);

-- 更新 trigger
CREATE TRIGGER trg_garment_search_update
BEFORE INSERT OR UPDATE ON garment
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', name, description);

-- 使用範例
SELECT * FROM garment
WHERE search_vector @@ to_tsquery('shirt & cotton');
```

---

## 資料遷移計劃

### SQLite → PostgreSQL 遷移

#### 階段 1: 準備 (開發環境)
```bash
# 1. 匯出 SQLite 資料
sqlite3 tryon.db .dump > dump.sql

# 2. 轉換 SQL (處理語法差異)
# - TEXT PRIMARY KEY → UUID
# - datetime → TIMESTAMP
# - JSON 欄位處理

# 3. 建立 PostgreSQL schema
psql -U postgres -d tryon -f schema.sql

# 4. 匯入資料
psql -U postgres -d tryon -f data.sql
```

#### 階段 2: 雙寫期 (過渡)
```python
# 同時寫入 SQLite 和 PostgreSQL
async def create_garment(data):
    # Write to SQLite
    sqlite_session.add(garment_sqlite)

    # Write to PostgreSQL
    postgres_session.add(garment_postgres)

    # Commit both
    sqlite_session.commit()
    postgres_session.commit()
```

#### 階段 3: 驗證與切換
1. 比對兩邊資料一致性
2. 逐步將讀流量導向 PostgreSQL
3. 監控效能與錯誤率
4. 停用 SQLite 寫入
5. 移除 SQLite 相關程式碼

---

## 資料保留政策

### 清理策略
```sql
-- 1. 匿名使用者試穿記錄 (保留 30 天)
DELETE FROM tryon_task
WHERE user_id IS NULL
  AND created_at < NOW() - INTERVAL '30 days';

-- 2. 失敗任務 (保留 7 天)
DELETE FROM tryon_task
WHERE status = 'failed'
  AND created_at < NOW() - INTERVAL '7 days';

-- 3. 過期分享連結
DELETE FROM share_link
WHERE expires_at < NOW();

-- 4. 舊的分析事件 (保留 90 天,之後轉存到冷儲存)
DELETE FROM analytics_event
WHERE created_at < NOW() - INTERVAL '90 days';
```

### 備份策略
```bash
# 每日完整備份
pg_dump -Fc tryon > backup_$(date +%Y%m%d).dump

# 每小時增量備份 (WAL archiving)
# 配置 postgresql.conf:
# wal_level = replica
# archive_mode = on
# archive_command = 'cp %p /backup/wal/%f'
```

---

## 效能優化建議

### 1. 快取策略
```python
# Redis 快取熱門服裝
@cache(ttl=3600)  # 1 hour
def get_popular_garments():
    return db.query(Garment).order_by(
        Garment.tryon_count.desc()
    ).limit(20).all()
```

### 2. 讀寫分離
```
Primary (Master)  ← 所有寫入
    ↓ (replication)
Read Replica 1    ← 服裝列表查詢
Read Replica 2    ← 試穿歷史查詢
```

### 3. 分區表 (Partitioning)
```sql
-- 按月分區 analytics_event (資料量大時)
CREATE TABLE analytics_event (
    ...
) PARTITION BY RANGE (created_at);

CREATE TABLE analytics_2024_01 PARTITION OF analytics_event
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 4. 連線池
```python
# SQLAlchemy engine config
engine = create_engine(
    DATABASE_URL,
    pool_size=20,          # 基本連線數
    max_overflow=10,       # 最大額外連線
    pool_pre_ping=True,    # 檢查連線有效性
    pool_recycle=3600      # 1小時回收連線
)
```

---

## 資料一致性檢查

### 定期檢查腳本
```sql
-- 1. 檢查孤兒記錄
SELECT COUNT(*) FROM tryon_task t
LEFT JOIN garment g ON t.garment_id = g.id
WHERE g.id IS NULL;

-- 2. 檢查統計數字一致性
SELECT g.id, g.tryon_count, COUNT(t.id) as actual_count
FROM garment g
LEFT JOIN tryon_task t ON t.garment_id = g.id
WHERE g.tryon_count != COUNT(t.id);

-- 3. 檢查圖片檔案存在性 (需要配合 MinIO client)
SELECT image_url FROM garment
WHERE image_url NOT IN (
    -- MinIO list objects query
);
```

---

## 安全性考量

### 1. 敏感資料加密
```python
# 使用者密碼 (bcrypt)
from passlib.hash import bcrypt
password_hash = bcrypt.hash("user_password")

# 個人資料 (at-rest encryption)
# PostgreSQL: enable transparent data encryption (TDE)
```

### 2. SQL Injection 防護
```python
# ✅ 正確: 使用參數化查詢
session.query(User).filter(User.email == user_input).first()

# ❌ 錯誤: 字串拼接
session.execute(f"SELECT * FROM user WHERE email = '{user_input}'")
```

### 3. GDPR 合規 (個資保護)
```sql
-- 使用者資料完全刪除 (非 soft delete)
DELETE FROM user_profile WHERE user_id = ?;
DELETE FROM tryon_task WHERE user_id = ?;
DELETE FROM user_favorite WHERE user_id = ?;
DELETE FROM "user" WHERE id = ?;

-- 匿名化 (保留統計但移除個資)
UPDATE tryon_task SET user_id = NULL WHERE user_id = ?;
```

---

## 總結

### 資料表數量演進
- **MVP (Phase 1)**: 2 tables (garment, tryontask)
- **Phase 2**: +3 tables (brand, category, user)
- **Phase 3**: +5 tables (user_profile, user_favorite, share_link, analytics_event, outfit_recommendation)
- **Phase 4**: +3 tables (size_recommendation, ecommerce_product, line_user)

**Total: 13 核心表**

### 儲存空間預估 (1年後)
- Users: 10,000 users × 1KB = 10 MB
- Garments: 1,000 items × 2KB = 2 MB
- Tryon Tasks: 100,000 tasks × 500 bytes = 50 MB
- Analytics: 1M events × 200 bytes = 200 MB
- **Database Total**: ~300 MB

- Garment Images: 1,000 × 500KB = 500 MB
- User Uploads: 100,000 × 2MB = 200 GB
- Results: 100,000 × 3MB = 300 GB
- **Object Storage Total**: ~500 GB

### 下一步行動
1. ✅ 檢視此架構設計
2. 決定是否立即升級到完整 schema (或繼續 MVP)
3. 實作資料遷移腳本 (SQLite → PostgreSQL)
4. 建立種子資料 (brands, categories)
5. 實作 Repository Pattern 抽象層
