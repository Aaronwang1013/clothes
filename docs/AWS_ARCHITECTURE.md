# FORMA — AWS 低成本 MVP 部署架構

> 目標：最低可行成本，支援台灣使用者，月費約 **$15–35 USD**

---

## 架構全圖

```
╔═══════════════════════════════════════════════════════════════╗
║                        使用者（台灣）                          ║
╚══════════════════════╤════════════════════════════════════════╝
                       │ HTTPS
                       ▼
              ┌─────────────────┐
              │   Route 53      │  DNS + SSL 憑證 (ACM)
              │   $0.5/月       │
              └────────┬────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌──────────────────┐     ┌──────────────────────┐
│  AWS Amplify     │     │  AWS App Runner       │
│  (Next.js 前端)  │     │  (FastAPI 後端)        │
│  $0–5/月         │     │  $10–20/月            │
│                  │     │  ・自動 scale to 0    │
│  ・GitHub 自動   │     │  ・Docker from ECR    │
│    CI/CD 部署    │     │  ・vCPU 0.25, 0.5 GB  │
└──────────────────┘     └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
   ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐
   │   Amazon S3      │  │  Amazon EFS     │  │  AWS SES         │
   │   (圖片儲存)     │  │  (SQLite DB)    │  │  (發送信件)      │
   │   $0.5–2/月      │  │  $1–3/月        │  │  $0/月           │
   │                  │  │                 │  │                  │
   │  ・人像照片      │  │  ・掛載至       │  │  ・忘記密碼信    │
   │  ・試穿結果圖    │  │    App Runner   │  │  ・62k封/月免費  │
   │  ・服裝圖片      │  │  ・未來升級     │  └──────────────────┘
   └────────┬─────────┘  │    RDS Postgres │
            │             └─────────────────┘
            ▼
  ┌──────────────────┐
  │  CloudFront CDN  │  $1–5/月
  │  (圖片加速)      │
  │  ・S3 origin     │
  │  ・台灣節點快取  │
  └──────────────────┘

外部服務：
  ┌──────────────────┐
  │  Replicate API   │  按使用量計費
  │  (IDM-VTON 推論) │  ~$0.03/次試穿
  └──────────────────┘

輔助服務（免費）：
  ┌──────────────────┐  ┌──────────────────┐
  │  AWS ECR         │  │ Parameter Store  │
  │  (Docker 映像)   │  │ (環境變數/秘鑰)  │
  │  500MB 免費      │  │ Standard 免費    │
  └──────────────────┘  └──────────────────┘
```

---

## 各服務說明

### 前端：AWS Amplify
- **為何選 Amplify**：Next.js 原生支援，GitHub push 自動部署，免維運
- **方案**：Amplify Hosting（Free tier：每月 5GB 儲存 + 15GB 頻寬）
- **設定**：環境變數 `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`

### 後端：AWS App Runner
- **為何選 App Runner**：無流量時 scale to 0（冷啟動約 5–10 秒），最適合 MVP 低流量
- **規格**：0.25 vCPU / 0.5 GB RAM（最便宜方案）
- **部署流程**：
  ```
  GitHub Actions → docker build → push ECR → App Runner 自動拉取部署
  ```
- **未來升級**：流量大時改 ECS Fargate + ALB

### 圖片儲存：Amazon S3 + CloudFront
- 取代 MinIO，API 相容（boto3 直接用）
- CloudFront distribution 加速台灣用戶的圖片讀取
- **S3 Bucket Policy**：App Runner 透過 IAM Role 存取，不需要 public access

### 資料庫：SQLite on EFS（MVP 階段）
- EFS 掛載至 App Runner，SQLite 檔案持久化
- **升級路徑**：流量成長時，直接換 `DATABASE_URL` 指向 RDS PostgreSQL（Free Tier：db.t3.micro）

### Email：Amazon SES
- 取代 Resend，用於密碼重設信件
- 需驗證寄信網域（或單一 Email）
- 每月前 62,000 封免費（從 EC2/App Runner 發送）

---

## 月費估算

| 服務             | 規格                          | 估算/月     |
|------------------|-------------------------------|-------------|
| Route 53         | 1 hosted zone                 | $0.50       |
| ACM (SSL)        | 公開憑證                       | 免費        |
| AWS Amplify      | 前端 hosting                  | $0–5        |
| AWS App Runner   | 0.25 vCPU / 0.5 GB            | $10–20      |
| Amazon ECR       | Docker image (< 500 MB)       | 免費        |
| Amazon S3        | 圖片儲存 ~10 GB               | $0.23       |
| CloudFront       | 圖片 CDN ~10 GB 流量          | $0.85       |
| Amazon EFS       | SQLite 持久化 (< 1 GB)        | $0.30       |
| Amazon SES       | 密碼重設信                    | 免費        |
| Parameter Store  | 環境變數                      | 免費        |
| **合計**         |                               | **~$12–27** |
| Replicate API    | 按試穿次數計費 ~$0.03/次      | 另計        |

---

## 程式碼調整（從 MinIO 換 S3）

只需改設定，不需重寫業務邏輯（boto3 API 相容）：

### `backend/app/config.py`
```python
# 新增
aws_region: str = "ap-northeast-1"  # 東京（台灣最近）
aws_access_key_id: str = ""         # 或使用 IAM Role（推薦）
aws_secret_access_key: str = ""

# 移除 minio_endpoint, minio_use_ssl
```

### `backend/app/storage.py`
```python
# 移除 endpoint_url 參數，改用原生 S3
def _get_client():
    return boto3.client("s3", region_name=settings.aws_region)
```

### `.env`（生產環境）
```
# 改為 S3
AWS_REGION=ap-northeast-1
# 若用 IAM Role 則不需要 Access Key

# 其他
DATABASE_URL=sqlite:////mnt/efs/tryon.db
MINIO_PUBLIC_ENDPOINT=  # 改為 CloudFront domain
```

---

## CI/CD 流程（GitHub Actions）

```yaml
# .github/workflows/deploy-backend.yml
on:
  push:
    branches: [main]
    paths: [backend/**]

jobs:
  deploy:
    steps:
      - name: Build & push to ECR
        # docker build → aws ecr get-login-password → docker push
      - name: Deploy to App Runner
        # aws apprunner start-deployment
```

---

## 升級路徑（Phase 2）

| 當前（MVP）      | 升級後（Phase 2）              | 觸發條件            |
|------------------|-------------------------------|---------------------|
| App Runner       | ECS Fargate + ALB             | 冷啟動不可接受      |
| SQLite on EFS    | RDS PostgreSQL db.t3.micro    | 並發寫入衝突        |
| 單一 App Runner  | Auto Scaling Group            | 高峰流量            |
| —                | ElastiCache Redis             | 加入 Celery 任務佇列|
| —                | WAF                           | 正式上線安全需求    |
