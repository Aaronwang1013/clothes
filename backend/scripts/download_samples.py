#!/usr/bin/env python3
"""
下載 IDM-VTON 範例服裝圖片

使用方式:
    python download_samples.py
"""

import os
import sys
import urllib.request
from pathlib import Path

# 範例圖片 URLs (使用可靠的來源)
SAMPLE_URLS = [
    # 從 GitHub raw 或其他可靠來源
    "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/cloth/00034_00.jpg",
    "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/cloth/00055_00.jpg",
    "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/cloth/00126_00.jpg",
    "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/cloth/00238_00.jpg",
    "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/cloth/00470_00.jpg",
    "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/cloth/00617_00.jpg",
    "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/cloth/00784_00.jpg",
    "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/cloth/00934_00.jpg",
    "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/cloth/01043_00.jpg",
    "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/cloth/01234_00.jpg",
]

def download_image(url: str, output_path: Path) -> bool:
    """下載單張圖片"""
    try:
        print(f"下載: {url}")
        urllib.request.urlretrieve(url, output_path)

        # 檢查檔案大小
        size = output_path.stat().st_size
        if size < 1000:  # 小於 1KB 可能是錯誤頁面
            print(f"  ❌ 失敗 (檔案太小: {size} bytes)")
            output_path.unlink()
            return False

        print(f"  ✅ 成功 ({size:,} bytes)")
        return True
    except Exception as e:
        print(f"  ❌ 錯誤: {e}")
        return False

def main():
    # 確保目錄存在
    script_dir = Path(__file__).parent
    output_dir = script_dir / "sample_garments"
    output_dir.mkdir(exist_ok=True)

    print(f"輸出目錄: {output_dir}")
    print(f"準備下載 {len(SAMPLE_URLS)} 張服裝圖片...\n")

    success_count = 0

    for i, url in enumerate(SAMPLE_URLS, 1):
        output_file = output_dir / f"{i:02d}.jpg"

        # 跳過已存在的檔案
        if output_file.exists():
            size = output_file.stat().st_size
            if size > 1000:
                print(f"[{i:02d}] 已存在,跳過")
                success_count += 1
                continue
            else:
                output_file.unlink()  # 刪除太小的檔案

        if download_image(url, output_file):
            success_count += 1

        print()

    print(f"\n完成! 成功下載 {success_count}/{len(SAMPLE_URLS)} 張圖片")

    if success_count == 0:
        print("\n⚠️  沒有成功下載任何圖片")
        print("請手動下載圖片到: backend/scripts/sample_garments/")
        print("圖片來源: https://github.com/yisol/IDM-VTON/tree/main/example/cloth")
        sys.exit(1)

    return success_count

if __name__ == "__main__":
    main()
