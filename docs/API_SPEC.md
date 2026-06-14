# API 規格文件

> 版本：1.0｜日期：2026-06-14｜作者：Aaron Wang  
> Base URL（本地）：`http://localhost:8000`  
> Base URL（生產）：`https://api.yourdomain.com`

---

## 目錄

1. [認證方式](#認證方式)
2. [通用錯誤格式](#通用錯誤格式)
3. [認證 API](#認證-api)
4. [試穿 API](#試穿-api)
5. [服裝 API](#服裝-api)
6. [上傳 API](#上傳-api)
7. [系統 API](#系統-api)

---

## 認證方式

需要登入的 endpoint 須在 Header 帶入 JWT：

```
Authorization: Bearer <access_token>
```

- **Access Token** 有效期：1 天
- **Refresh Token** 有效期：30 天（用後自動 rotate）
- Token 以 JWT（HMAC-SHA256）簽名；DB 不存 access token，只存 refresh token hash

---

## 通用錯誤格式

```json
{
  "detail": "錯誤訊息"
}
```

| HTTP 狀態碼 | 說明 |
|-------------|------|
| 400 | 請求格式錯誤或邏輯錯誤 |
| 401 | 未認證或 token 無效/過期 |
| 403 | 無權限 |
| 404 | 資源不存在 |
| 409 | 衝突（如 email 已被使用） |
| 422 | 輸入驗證失敗 |
| 500 | 伺服器內部錯誤 |

---

## 認證 API

### POST /api/auth/register

Email 註冊新帳號，同時回傳 token（不需再呼叫 login）。

**Request**
```json
{
  "email": "user@example.com",
  "password": "min8chars",
  "name": "Aaron"          // optional
}
```

**Response 200**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc123...",
  "user": {
    "id": "a1b2c3...",
    "email": "user@example.com",
    "name": "Aaron",
    "avatar_url": null,
    "is_admin": false,
    "oauth_provider": null
  }
}
```

**錯誤**
- `409` Email 已被使用
- `422` 密碼少於 8 個字元

---

### POST /api/auth/login

Email 登入。

**Request**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response 200**：同 register

**錯誤**
- `401` Email 或密碼錯誤

---

### POST /api/auth/sso

社群登入（Google、LINE、Facebook、Apple）。若 email 已存在則合併帳號，否則建立新帳號。

**Request**
```json
{
  "provider": "google",         // "google" | "line" | "facebook" | "apple"
  "provider_id": "1234567890",  // provider 給的 User ID
  "email": "user@example.com",
  "name": "Aaron",              // optional
  "avatar_url": "https://..."   // optional
}
```

**Response 200**：同 register

---

### POST /api/auth/logout

登出，撤銷指定的 refresh token。

**Request**
```json
{
  "refresh_token": "abc123..."
}
```

**Response 200**
```json
{
  "message": "已登出"
}
```

---

### POST /api/auth/refresh

刷新 access token。舊 refresh token 立即失效（Token Rotation）。

**Request**
```json
{
  "refresh_token": "abc123..."
}
```

**Response 200**：同 register（包含新的 access_token 和 refresh_token）

**錯誤**
- `401` Refresh token 無效或已過期

---

### POST /api/auth/forgot-password

觸發忘記密碼流程，發送重設信至用戶 email。

> 無論 email 是否存在，皆回傳相同訊息（防止 email 枚舉攻擊）。

**Request**
```json
{
  "email": "user@example.com"
}
```

**Response 200**
```json
{
  "message": "若此 Email 存在，重設連結已寄出"
}
```

---

### POST /api/auth/reset-password

使用重設連結中的 token 設定新密碼。

**Request**
```json
{
  "token": "raw_token_from_email_link",
  "new_password": "newpassword"
}
```

**Response 200**
```json
{
  "message": "密碼已重設，請重新登入"
}
```

**錯誤**
- `400` Token 無效、已使用或已過期
- `422` 密碼少於 8 個字元

---

### GET /api/auth/me

🔒 需登入

取得當前登入用戶資訊。

**Response 200**
```json
{
  "id": "a1b2c3...",
  "email": "user@example.com",
  "name": "Aaron",
  "avatar_url": null,
  "is_admin": false,
  "oauth_provider": null
}
```

**錯誤**
- `401` 未登入

---

### PATCH /api/auth/profile

🔒 需登入

更新個人資料（name、avatar_url）。

**Request**（所有欄位皆 optional）
```json
{
  "name": "New Name",
  "avatar_url": "https://..."
}
```

**Response 200**：同 `/auth/me`

---

### POST /api/auth/change-password

🔒 需登入（Email 帳號專用，SSO 用戶無法使用）

修改密碼。

**Request**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword"
}
```

**Response 200**
```json
{
  "message": "密碼已更新"
}
```

**錯誤**
- `400` 此帳號為 SSO 登入，無法使用此功能
- `401` 目前密碼錯誤
- `422` 新密碼少於 8 個字元

---

## 試穿 API

### POST /api/tryon

提交試穿請求。登入用戶的試穿紀錄會與帳號關聯；未登入則匿名記錄。

**Content-Type**: `multipart/form-data`

**Request Fields**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `person_image` | File | ✅ | 人像照片（jpg/png） |
| `garment_id` | string | ✅ | 服裝 ID |

**Response 200**
```json
{
  "task_id": "d4e5f6...",
  "status": "pending"
}
```

**錯誤**
- `404` garment_id 不存在

---

### GET /api/tryon/{task_id}

輪詢試穿任務狀態。前端每 3 秒呼叫一次，直到 status 為 `completed` 或 `failed`。

**Response 200（pending / processing）**
```json
{
  "task_id": "d4e5f6...",
  "status": "processing",
  "created_at": "2026-06-14T10:00:00"
}
```

**Response 200（completed）**
```json
{
  "task_id": "d4e5f6...",
  "status": "completed",
  "result_image_url": "https://s3.ap-southeast-1.amazonaws.com/...?X-Amz-...",
  "person_image_url": "https://s3.ap-southeast-1.amazonaws.com/...?X-Amz-...",
  "created_at": "2026-06-14T10:00:00"
}
```

> `result_image_url` 和 `person_image_url` 皆為有時限的 presigned URL，不可長期儲存。

**Response 200（failed）**
```json
{
  "task_id": "d4e5f6...",
  "status": "failed",
  "error": "Fashn.ai timeout after 120s",
  "created_at": "2026-06-14T10:00:00"
}
```

**錯誤**
- `404` task_id 不存在

---

### GET /api/tryon/history

🔒 需登入

取得當前用戶的試穿歷史（按時間倒序）。

**Response 200**
```json
[
  {
    "task_id": "d4e5f6...",
    "status": "completed",
    "result_image_url": "https://...",
    "person_image_url": "https://...",
    "created_at": "2026-06-14T10:00:00"
  },
  ...
]
```

---

## 服裝 API

### GET /api/garments

取得所有服裝清單。

**Response 200**
```json
[
  {
    "id": "a1b2c3...",
    "name": "白色 T-Shirt",
    "category": "upper_body",
    "image_url": "https://s3...?X-Amz-..."
  },
  ...
]
```

---

### GET /api/garments/{garment_id}

取得單一服裝資訊。

**Response 200**
```json
{
  "id": "a1b2c3...",
  "name": "白色 T-Shirt",
  "category": "upper_body",
  "image_url": "https://s3...?X-Amz-..."
}
```

**錯誤**
- `404` 服裝不存在

---

## 上傳 API

### POST /api/upload

上傳圖片至 S3/MinIO，回傳 object key 和 presigned URL。

**Content-Type**: `multipart/form-data`

**Request Fields**

| 欄位 | 類型 | 說明 |
|------|------|------|
| `file` | File | 圖片檔案（jpg/png） |

**Response 200**
```json
{
  "key": "images/abc123def456.png",
  "url": "https://s3...?X-Amz-..."
}
```

> `key` 可傳給其他 API；`url` 為有時限的 presigned URL，用於即時預覽。

---

## 系統 API

### GET /health

健康檢查，確認服務正常運行。

**Response 200**
```json
{
  "status": "ok"
}
```
