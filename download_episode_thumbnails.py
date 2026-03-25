"""
Download episode thumbnails from videos.json to thumbnails/episodes/ folder.
Run this first, then run: python manage.py seed_videos --episodes-only

Usage:
    python download_episode_thumbnails.py
"""

import json
import os
import re
import urllib.request

VIDEOS_JSON = os.path.join(os.path.dirname(__file__), "videos.json")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "thumbnails", "episodes")


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "_", text)
    return text[:60]


def download(url, dest_path, label):
    if os.path.exists(dest_path):
        print(f"  ⏭  Already exists: {label}")
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp, open(dest_path, "wb") as f:
            f.write(resp.read())
        print(f"  ✅ Downloaded: {label}")
        return True
    except Exception as e:
        print(f"  ❌ Failed ({label}): {e}")
        return False


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(VIDEOS_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    total, success, failed = 0, 0, 0

    # Collect (section_idx, item_idx, ep_idx) -> local_path so we don't mutate while iterating
    updates = []

    for section in ("trailer_only", "coming_soon"):
        for item_idx, item in enumerate(data.get(section, [])):
            if item.get("content_type") != "SERIES":
                continue
            series_slug = slugify(item["title"])

            for ep_idx, ep in enumerate(item.get("episodes", [])):
                thumb_url = ep.get("thumbnail_url")
                if not thumb_url:
                    continue

                ext = os.path.splitext(thumb_url.split("?")[0])[-1]
                if not ext or len(ext) > 5:
                    ext = ".jpg"

                s = ep["season_number"]
                e = ep["episode_number"]
                filename = f"{series_slug}_s{s:02d}e{e:02d}{ext}"
                dest = os.path.join(OUTPUT_DIR, filename)
                label = f"{item['title']} S{s}E{e} - {ep['title']}"

                total += 1
                if download(thumb_url, dest, label):
                    success += 1
                    updates.append((section, item_idx, ep_idx, os.path.relpath(dest)))
                else:
                    failed += 1

    # Apply thumbnail_local paths only after all downloads complete
    for section, item_idx, ep_idx, local_path in updates:
        data[section][item_idx]["episodes"][ep_idx]["thumbnail_local"] = local_path

    with open(VIDEOS_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"\nDone. {success}/{total} downloaded, {failed} failed.")
    print(f"Thumbnails saved to: {OUTPUT_DIR}")
    if success > 0:
        print("\nNext step:")
        print("  cd backend && python manage.py seed_videos --episodes-only")


if __name__ == "__main__":
    main()
