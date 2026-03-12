# Replicate API 版本修復

## 問題描述

試穿功能在提交後出現以下錯誤:

```
ReplicateError Details:
title: Invalid version or not permitted
status: 422
detail: The specified version does not exist (or perhaps you don't have permission to use it?)
```

## 根本原因

程式碼中使用的 IDM-VTON 模型版本 hash **不正確**:

```python
# ❌ 錯誤的版本 (不存在)
"cuuupid/idm-vton:c871bb9b046c1b1f6e63e7a4cebe1554a14d32bf39447819ac1dfa920bbedf30"
```

這個版本 hash 從未存在於 Replicate 上。

## 解決方案

更新為**最新版本** (11 個月前發布):

```python
# ✅ 正確的最新版本
"cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985"
```

## 修改的檔案

### [backend/app/inference.py:29](backend/app/inference.py#L29)

```python
# 修改前:
output = replicate.run(
    "cuuupid/idm-vton:c871bb9b046c1b1f6e63e7a4cebe1554a14d32bf39447819ac1dfa920bbedf30",
    input={...}
)

# 修改後:
output = replicate.run(
    "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
    input={...}
)
```

## 驗證修復

```bash
# 1. 重啟 backend
docker compose restart backend

# 2. 檢查 backend 狀態
curl http://localhost:8000/api/garments | jq 'length'
# 應該回傳: 10

# 3. 前往前端測試
open http://localhost:3000
```

## 可用的 IDM-VTON 版本

根據 https://replicate.com/cuuupid/idm-vton/versions:

| 版本 Hash (前 8 碼) | 發布時間 | 狀態 |
|---------------------|---------|------|
| 0513734a | 11 個月前 | ✅ **最新** (目前使用) |
| c871bb9b | 較舊 | ✅ 可用 (但與程式碼中的不同) |
| 906425db | 較舊 | ✅ 可用 |
| f691846e | 較舊 | ✅ 可用 |

**注意**: 程式碼中原本的 hash `c871bb9b046c1b1f...df30` 與 Replicate 上的 `c871bb9b046607b6...3ff4` 不同,因此無法使用。

## 下一步測試

現在可以進行完整的試穿測試:

1. 開啟 http://localhost:3000
2. 點擊左上角上傳人像照片
3. 選擇右側任一服裝
4. 點擊「立即試穿」
5. 等待 30-60 秒
6. 查看生成的試穿效果圖

## 如果將來遇到類似問題

### 如何查詢最新版本?

```bash
# 方法 1: 網頁查詢
open https://replicate.com/cuuupid/idm-vton/versions

# 方法 2: Python API 查詢
docker exec clothes-backend-1 python << 'EOF'
import replicate
import os
client = replicate.Client(api_token=os.environ['REPLICATE_API_TOKEN'])
model = client.models.get("cuuupid/idm-vton")
print(f"Latest version: {model.latest_version.id}")
EOF
```

### 如何切換到其他版本?

只需修改 [backend/app/inference.py:29](backend/app/inference.py#L29) 的版本 hash:

```python
output = replicate.run(
    "cuuupid/idm-vton:<新的版本hash>",
    input={...}
)
```

然後重啟 backend:

```bash
docker compose restart backend
```

## 參考資料

- Replicate 模型頁面: https://replicate.com/cuuupid/idm-vton
- 版本列表: https://replicate.com/cuuupid/idm-vton/versions
- 原始論文: IDM-VTON (ECCV 2024)
- GitHub: https://github.com/yisol/IDM-VTON
