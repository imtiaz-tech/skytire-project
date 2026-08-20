#!/usr/bin/env python3
"""
Wire Wheels scraper for:
  - https://luxorwirewheels.com/  (Shopify JSON API + requests)
  - https://www.bbwheelsonline.com/ (BigCommerce: sitemap discovery + product pages)
  - https://www.ninjatire.com/product-category/wire-wheels/ (WooCommerce Store API)
  - https://playerwheel.com/custom-wire-wheels/ (WooCommerce Store API + listing page)

Reuses the original bbwheels.ipynb approach:
  Phase 1: collect product URLs
  Phase 2: visit each product page / API and extract details
"""

from __future__ import annotations

import csv
import json
import re
import time
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse, quote, urlencode

import pandas as pd
import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
IMAGES_DIR = BASE_DIR / "images"
OUTPUT_LUXOR = BASE_DIR / "luxor_wire_wheels.csv"
OUTPUT_BB = BASE_DIR / "bbwheels_wire_wheels.csv"
OUTPUT_NINJA = BASE_DIR / "ninjatire_wire_wheels.csv"
OUTPUT_PLAYER = BASE_DIR / "playerwheel_wire_wheels.csv"

LUXOR_BASE = "https://luxorwirewheels.com"
BB_BASE = "https://www.bbwheelsonline.com"
NINJA_BASE = "https://www.ninjatire.com"
NINJA_CATEGORY_ID = 105  # product-category/wire-wheels
NINJA_CATEGORY_SLUG = "wire-wheels"
PLAYER_BASE = "https://playerwheel.com"
PLAYER_LISTING_URL = f"{PLAYER_BASE}/custom-wire-wheels/"
# Relays used when the origin host is unreachable (ISP / geo / firewall blocks).
PLAYER_TEXT_RELAY = "https://r.jina.ai/"
PLAYER_IMAGE_RELAY = "https://images.weserv.nl/?url="

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)

# (connect timeout, read timeout) — short connect so dead hosts fail fast
REQUEST_TIMEOUT = (12, 40)
REQUEST_DELAY = 0.25  # polite delay between requests
MAX_WORKERS = 4
MAX_IMAGE_WORKERS = 4

CSV_BASE_FIELDS = [
    "Product Name",
    "SKU",
    "Part Number",
    "Brand",
    "Model",
    "Wheel Type",
    "Size",
    "Diameter",
    "Width",
    "Offset",
    "Backspacing",
    "Bolt Pattern / PCD",
    "Finish",
    "Color",
    "Lip Size",
    "Hub Bore",
    "Load Rating",
    "Weight",
    "Construction",
    "Material",
    "Description",
    "Features",
    "Specifications",
    "Price",
    "Sale Price",
    "MSRP",
    "Stock / Availability",
    "Product URL",
    "Category",
    "Source",
]

# Luxor product_types that are NEVER wire wheels
LUXOR_EXCLUDE_TYPES = {
    "ACCESSORIES",
    "t-shirt",
    "Hat",
    "Tire Repair Tool",
    "DETAILER",
    "STEERING WHEEL",
    "Canopy",
    "KNOCK OFF CAP",
    "ROK CHIP",
    "EAGLE CHIP",
    "Knock Off Bolt",
    "KNOCK OFF BOLT",
    "2 BAR KNOCK-OFF",
    "3 BAR KNOCK-OFF",
    "EDGE KNOCK-OFF",
    "SUPA SWEPT KNOCK-OFF",
    "10 ANGLE BULLET KNOCK-OFF",
    "OCTAGON KNOCK-OFF",
    "KNOCK OFF",
    "KNOCK-OFF",
    "mws_apo_generated",
    "Replica Wheel",
    "LUXE FORGED OFF-ROAD WHEELS",
}

# Hard exclusions — non-wire wheel products
LUXOR_EXCLUDE_RE = re.compile(
    r"\b("
    r"replica\s*wheel|replica\s*rim|alloy\s*wheel|oem\s*wheel|steel\s*wheel|"
    r"truck\s*wheel|forged\s*off[- ]?road|t-?shirt|hoodie|hat|keychain|"
    r"steering\s*wheel|detailer|tire\s*repair|canopy|leveling\s*kit|"
    r"knock[- ]?off\s*(cap|bolt|chip|tool)|rok\s*chip"
    r")\b",
    re.I,
)

# Positive wire-wheel markers (title / type / tags / description)
WIRE_WHEEL_RE = re.compile(
    r"("
    r"wire\s*wheels?|"
    r"quad\s*cross[\s-]*lace|"
    r"triple\s*cross[\s-]*lace|"
    r"cross[\s-]*lace|"
    r"straight[\s-]*lace|"
    r"radial[\s-]*lace|"
    r"\b(?:36|60|72|80|96|100|144|150|180|204)\s*[- ]?spoke\b|"
    r"cali\s*spoke|"
    r"diamond\s*spoke|"
    r"\b\d{2,3}\s*fwd\s*straight\s*lace\b"
    r")",
    re.I,
)

# product_type values that themselves identify lace/spoke wire wheels
WIRE_PRODUCT_TYPE_RE = re.compile(
    r"("
    r"STRAIGHT\s*LACE|"
    r"CROSS\s*LACE|"
    r"QUAD\s*CROSS|"
    r"TRIPLE\s*CROSS|"
    r"\b\d{2,3}\s*(STRAIGHT|CROSS|SPOKE|BOLT\s*ON)|"
    r"CALI\s*SPOKE|"
    r"SHOWTIME"
    r")",
    re.I,
)

# Back-compat alias used by BB helpers
WIRE_TITLE_RE = WIRE_WHEEL_RE

SIZE_RE = re.compile(r"(\d{2}(?:\.\d+)?)\s*[xX×]\s*(\d{1,2}(?:\.\d+)?)")
OFFSET_RE = re.compile(r"([+-]?\d+(?:\.\d+)?)\s*mm\b", re.I)
BOLT_RE = re.compile(r"\b(\d\s*[xX]\s*\d{2,3}(?:\.\d+)?)\b")


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def make_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
        }
    )
    retry = Retry(
        total=4,
        connect=2,
        read=4,
        backoff_factor=0.8,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET", "HEAD"]),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=20, pool_maxsize=20)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def fetch(
    session: requests.Session,
    url: str,
    *,
    expect_json: bool = False,
    timeout: Any = REQUEST_TIMEOUT,
) -> Any:
    """GET with retries (via adapter) + soft failure handling."""
    time.sleep(REQUEST_DELAY)
    resp = session.get(url, timeout=timeout)
    if resp.status_code >= 400:
        raise requests.HTTPError(f"HTTP {resp.status_code} for {url}", response=resp)
    if expect_json:
        return resp.json()
    return resp


def safe_text(el) -> str:
    if not el:
        return ""
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).strip()


def slugify(value: str, fallback: str = "unknown") -> str:
    value = (value or "").strip()
    value = re.sub(r"[^\w\-]+", "_", value, flags=re.UNICODE)
    value = re.sub(r"_+", "_", value).strip("_")
    return value[:80] or fallback


def parse_size(text: str) -> Tuple[str, str, str]:
    """Return (size, diameter, width) from free text."""
    if not text:
        return "", "", ""
    m = SIZE_RE.search(text)
    if not m:
        return "", "", ""
    diameter, width = m.group(1), m.group(2)
    return f"{diameter}x{width}", diameter, width


def blank_row() -> Dict[str, str]:
    return {k: "" for k in CSV_BASE_FIELDS}


def expand_image_columns(rows: List[Dict[str, Any]], max_images: int) -> List[str]:
    cols = list(CSV_BASE_FIELDS)
    for i in range(1, max_images + 1):
        cols.append(f"Image{i}")
    for row in rows:
        paths = row.pop("_image_paths", []) or []
        for i in range(1, max_images + 1):
            row[f"Image{i}"] = paths[i - 1] if i <= len(paths) else ""
    return cols


def save_csv(rows: List[Dict[str, Any]], path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    max_images = max((len(r.get("_image_paths") or []) for r in rows), default=0)
    # Always keep at least Image1..Image3 columns for a stable schema
    max_images = max(max_images, 3)
    cols = expand_image_columns(rows, max_images)
    df = pd.DataFrame(rows)
    for c in cols:
        if c not in df.columns:
            df[c] = ""
    df = df[cols]
    df.to_csv(path, index=False, encoding="utf-8")
    print(f"✅ Saved {len(df)} rows → {path}")
    return path


# ---------------------------------------------------------------------------
# Images
# ---------------------------------------------------------------------------

def prefer_hires_url(url: str) -> str:
    if not url:
        return url
    # Shopify: request large width
    if "cdn.shopify.com" in url:
        if "?" in url:
            return re.sub(r"([?&])width=\d+", r"\1width=2000", url)
        return url + ("&" if "?" in url else "?") + "width=2000"
    # BigCommerce stencil sizes → original / large
    url = re.sub(r"/stencil/\d+x\d+/", "/stencil/1280x1280/", url)
    url = url.replace("/stencil/{:size}/", "/stencil/1280x1280/")
    # WordPress / WooCommerce sized thumbs → original upload
    url = re.sub(r"-\d+x\d+(?=\.(?:jpg|jpeg|png|webp|gif)(?:\?|$))", "", url, flags=re.I)
    return url


def download_images(
    session: requests.Session,
    image_urls: List[str],
    brand: str,
    sku: str,
) -> List[str]:
    """Download images to images/<brand>/<sku>/imageN.ext and return relative paths."""
    brand_slug = slugify(brand, "unknown_brand")
    sku_slug = slugify(sku or "no_sku", "no_sku")
    dest_dir = IMAGES_DIR / brand_slug / sku_slug
    dest_dir.mkdir(parents=True, exist_ok=True)

    rel_paths: List[str] = []
    seen: Set[str] = set()
    idx = 0

    for raw in image_urls:
        url = prefer_hires_url(raw.strip())
        if not url or url in seen:
            continue
        seen.add(url)
        idx += 1
        ext = Path(urlparse(url).path).suffix.lower() or ".jpg"
        if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            ext = ".jpg"
        filename = f"image{idx}{ext}"
        dest = dest_dir / filename
        rel = str(Path("images") / brand_slug / sku_slug / filename)

        if dest.exists() and dest.stat().st_size > 0:
            rel_paths.append(rel)
            continue

        try:
            time.sleep(0.05)
            content = None
            try:
                resp = session.get(url, timeout=REQUEST_TIMEOUT, stream=True)
                if resp.status_code < 400:
                    content = resp.content
            except Exception:
                content = None

            # Origin often blocked; retry via image CDN relay for playerwheel.com
            if not content and "playerwheel.com" in url:
                host_path = url.split("://", 1)[-1]
                relay = PLAYER_IMAGE_RELAY + quote(host_path, safe="")
                resp = session.get(relay, timeout=REQUEST_TIMEOUT)
                if resp.status_code < 400 and resp.content:
                    content = resp.content

            if not content:
                print(f"  ⚠ image failed: {url[:90]}")
                idx -= 1
                continue
            with open(dest, "wb") as f:
                f.write(content)
            if dest.stat().st_size == 0:
                dest.unlink(missing_ok=True)
                idx -= 1
                continue
            rel_paths.append(rel)
        except Exception as e:
            print(f"  ⚠ image failed ({e}): {url[:90]}")
            idx -= 1
            dest.unlink(missing_ok=True)

    return rel_paths


# ---------------------------------------------------------------------------
# Luxor (Shopify)
# ---------------------------------------------------------------------------

def luxor_is_wire_wheel(product: Dict[str, Any]) -> bool:
    """Return True only for genuine wire wheels (lace / spoke wire), never replicas/alloys."""
    title = product.get("title") or ""
    ptype = (product.get("product_type") or "").strip()
    tags = product.get("tags") or ""
    if isinstance(tags, list):
        tags = ", ".join(tags)
    body = BeautifulSoup(product.get("body_html") or "", "html.parser").get_text(" ", strip=True)
    blob = " ".join([title, ptype, tags, body])

    # 1) Hard exclude non-wire categories / wording
    if ptype in LUXOR_EXCLUDE_TYPES:
        return False
    if LUXOR_EXCLUDE_RE.search(blob):
        return False
    if re.search(r"\breplica\b", title, re.I) or re.search(r"\breplica\b", ptype, re.I):
        return False

    # 2) Require positive wire-wheel evidence
    if WIRE_WHEEL_RE.search(title) or WIRE_WHEEL_RE.search(tags) or WIRE_WHEEL_RE.search(body):
        return True
    if WIRE_PRODUCT_TYPE_RE.search(ptype):
        return True
    # Collection / tag explicitly says Wire Wheels
    if re.search(r"\bwire\s*wheels?\b", tags, re.I):
        return True

    return False


def luxor_collect_products(session: requests.Session) -> List[Dict[str, Any]]:
    """Paginate /products.json and keep wire-wheel products only."""
    products: List[Dict[str, Any]] = []
    seen_ids: Set[int] = set()
    page = 1
    while True:
        url = f"{LUXOR_BASE}/products.json?limit=250&page={page}"
        print(f"[Luxor] Listing page {page}: {url}")
        try:
            data = fetch(session, url, expect_json=True)
        except Exception as e:
            print(f"[Luxor] listing failed page {page}: {e}")
            break
        batch = data.get("products") or []
        if not batch:
            break
        for p in batch:
            pid = p.get("id")
            if pid in seen_ids:
                continue
            seen_ids.add(pid)
            if luxor_is_wire_wheel(p):
                products.append(p)
        print(f"  → batch={len(batch)} wire_kept_total={len(products)}")
        page += 1
        if page > 50:
            break
    return products


def luxor_parse_product(product: Dict[str, Any], session: requests.Session) -> Dict[str, Any]:
    # Always refresh full product JSON for complete gallery + description
    handle = product.get("handle") or ""
    if handle:
        try:
            full = fetch(session, f"{LUXOR_BASE}/products/{handle}.json", expect_json=True)
            product = full.get("product") or product
        except Exception as e:
            print(f"  ⚠ full product fetch failed for {handle}: {e}")

    row = blank_row()
    title = product.get("title") or ""
    tags = product.get("tags") or ""
    if isinstance(tags, list):
        tags_list = tags
        tags = ", ".join(tags)
    else:
        tags_list = [t.strip() for t in tags.split(",") if t.strip()]

    variants = product.get("variants") or [{}]
    v0 = variants[0] if variants else {}
    sku = (v0.get("sku") or "").strip() or f"luxor-{product.get('id')}"
    price = str(v0.get("price") or "")
    compare = str(v0.get("compare_at_price") or "") or ""
    weight = v0.get("weight")
    weight_unit = v0.get("weight_unit") or ""
    weight_str = f"{weight} {weight_unit}".strip() if weight not in (None, "") else ""

    body = BeautifulSoup(product.get("body_html") or "", "html.parser").get_text("\n", strip=True)
    size, diameter, width = parse_size(title)
    if not size:
        size, diameter, width = parse_size(tags)
    if not size:
        size, diameter, width = parse_size(body)

    # Finish / color from tags
    finish = ""
    color = ""
    for t in tags_list:
        tl = t.lower()
        if tl in {"chrome", "gold", "triple gold", "powder coat", "black", "all chrome", "all gold"}:
            finish = finish or t
            color = color or t
        if "chrome" in tl or "gold" in tl or "powder" in tl:
            finish = finish or t

    offset = ""
    m_off = OFFSET_RE.search(title) or OFFSET_RE.search(body)
    if m_off:
        offset = m_off.group(1) + "mm"
    if re.search(r"\breverse\b", title + " " + tags, re.I):
        offset = offset or "Reverse"

    bolt = ""
    m_bolt = BOLT_RE.search(title) or BOLT_RE.search(body)
    if m_bolt:
        bolt = m_bolt.group(1).replace(" ", "")

    # Inventory
    inv = v0.get("inventory_quantity")
    inv_mgmt = v0.get("inventory_management")
    if inv_mgmt is None:
        stock = "In stock / not tracked"
    elif inv is None:
        stock = "Unknown"
    else:
        stock = f"In stock ({inv})" if inv > 0 else "Out of stock"

    product_url = f"{LUXOR_BASE}/products/{handle}"

    row.update(
        {
            "Product Name": title,
            "SKU": sku,
            "Part Number": sku,
            "Brand": product.get("vendor") or "Luxor Wire Wheels",
            "Model": product.get("product_type") or "",
            "Wheel Type": product.get("product_type") or "Wire Wheel",
            "Size": size,
            "Diameter": diameter,
            "Width": width,
            "Offset": offset,
            "Backspacing": "",
            "Bolt Pattern / PCD": bolt,
            "Finish": finish,
            "Color": color,
            "Lip Size": "",
            "Hub Bore": "",
            "Load Rating": "",
            "Weight": weight_str,
            "Construction": "Wire Wheel",
            "Material": "",
            "Description": body,
            "Features": tags,
            "Specifications": tags,
            "Price": f"${price}" if price and not price.startswith("$") else price,
            "Sale Price": f"${price}" if price and compare else (f"${price}" if price else ""),
            "MSRP": f"${compare}" if compare and not str(compare).startswith("$") else compare,
            "Stock / Availability": stock,
            "Product URL": product_url,
            "Category": product.get("product_type") or "Wire Wheels",
            "Source": "luxorwirewheels.com",
        }
    )

    # Prefer sale/regular semantics: if compare_at exists, price is sale
    if compare:
        row["Sale Price"] = row["Price"]
        row["Price"] = row["MSRP"] or row["Price"]
        row["MSRP"] = row["MSRP"]

    image_urls = [img.get("src") for img in (product.get("images") or []) if img.get("src")]
    row["_image_paths"] = download_images(session, image_urls, row["Brand"], sku)
    return row


def scrape_luxor(session: Optional[requests.Session] = None, limit: Optional[int] = None) -> Path:
    session = session or make_session()
    products = luxor_collect_products(session)
    if limit:
        products = products[:limit]
    print(f"[Luxor] Scraping {len(products)} wire wheel products…")

    rows: List[Dict[str, Any]] = []
    seen_sku: Set[str] = set()

    for i, product in enumerate(products, 1):
        try:
            row = luxor_parse_product(product, session)
            sku_key = (row.get("SKU") or "").upper()
            if sku_key and sku_key in seen_sku:
                print(f"  [{i}/{len(products)}] skip duplicate SKU {sku_key}")
                continue
            if sku_key:
                seen_sku.add(sku_key)
            rows.append(row)
            print(
                f"  [{i}/{len(products)}] {row['SKU'][:20]:20} | {row['Product Name'][:45]:45} | "
                f"imgs={len(row.get('_image_paths') or [])}"
            )
        except Exception as e:
            print(f"  [{i}/{len(products)}] FAILED: {e}")
            continue

    return save_csv(rows, OUTPUT_LUXOR)


# ---------------------------------------------------------------------------
# BB Wheels Online (BigCommerce)
# ---------------------------------------------------------------------------

def bb_is_wire_candidate_url(url: str) -> bool:
    low = url.lower()
    # Exclude electrical / unrelated
    if any(
        x in low
        for x in (
            "spark",
            "ignition",
            "coil",
            "proconnect",
            "wiring",
            "wire-set",
            "wireset",
            "plug-wire",
            "plug_wire",
        )
    ):
        return False
    return bool(
        re.search(
            r"(wire[-_]?wheel|wire[-_]?rim|cross[-_]?lace|straight[-_]?lace|"
            r"truespoke|true[-_]?spoke|dayton[-_]?wire|100[-_]?spoke|72[-_]?spoke|"
            r"96[-_]?spoke|80[-_]?spoke|cali[-_]?spoke|diamond[-_]?spoke|radial[-_]?lace|"
            r"knock[-_]?off[-_]?wire|lowrider[-_]?wire)",
            low,
        )
    )


def bb_product_looks_like_wire_wheel(name: str, details: Dict[str, str], description: str) -> bool:
    blob = " ".join([name, description, " ".join(details.values())])
    if WIRE_TITLE_RE.search(blob):
        return True
    accessory = (details.get("Accessory Type") or "").lower()
    if "wire" in accessory:
        return True
    # Classic lace naming without the word wire
    if re.search(r"(cross\s*lace|straight\s*lace|\d{2,3}\s*spoke)", blob, re.I):
        if accessory in {"", "wheels", "wheel", "rims", "rim"} or "wheel" in accessory:
            return True
    return False


def bb_collect_urls_from_sitemap(session: requests.Session) -> List[str]:
    print("[BB] Fetching XML sitemap index…")
    idx = fetch(session, f"{BB_BASE}/xmlsitemap.php")
    locs = [unescape(u) for u in re.findall(r"<loc>(.*?)</loc>", idx.text)]
    product_maps = [u for u in locs if "type=products" in u]
    print(f"[BB] {len(product_maps)} product sitemap pages")

    urls: List[str] = []
    seen: Set[str] = set()
    for i, sm in enumerate(product_maps, 1):
        try:
            resp = fetch(session, sm, timeout=90)
            page_urls = [unescape(u) for u in re.findall(r"<loc>(.*?)</loc>", resp.text)]
            kept = 0
            for u in page_urls:
                if u in seen:
                    continue
                if bb_is_wire_candidate_url(u):
                    seen.add(u)
                    urls.append(u)
                    kept += 1
            print(f"  sitemap {i}/{len(product_maps)}: scanned={len(page_urls)} wire_candidates+={kept} total={len(urls)}")
        except Exception as e:
            print(f"  sitemap {i} failed: {e}")
            continue
    return urls


def bb_collect_urls_via_selenium(max_pages: int = 50) -> List[str]:
    """Optional JS listing crawl (original notebook style) for /wheels/ search."""
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
    except ImportError:
        print("[BB] Selenium not installed — skipping browser listing crawl.")
        return []

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1400,1000")
    options.add_argument(f"--user-agent={USER_AGENT}")

    driver = webdriver.Chrome(options=options)
    urls: List[str] = []
    seen: Set[str] = set()
    try:
        for q in ("wire wheels", "cross lace", "straight lace", "100 spoke"):
            for page in range(1, max_pages + 1):
                url = f"{BB_BASE}/search.php?search_query={quote(q)}&page={page}"
                print(f"[BB][Selenium] {url}")
                driver.get(url)
                try:
                    WebDriverWait(driver, 25).until(
                        EC.presence_of_all_elements_located(
                            (By.CSS_SELECTOR, "li.product, li.ss__result.product, article.card")
                        )
                    )
                except Exception:
                    print("  timeout / empty page — stop this query")
                    break
                items = driver.find_elements(By.CSS_SELECTOR, "h3.card-title a, .card-title a")
                if not items:
                    break
                before = len(urls)
                for a in items:
                    href = a.get_attribute("href") or ""
                    if not href:
                        continue
                    full = href if href.startswith("http") else urljoin(BB_BASE, href)
                    full = full.split("?")[0]
                    if full in seen:
                        continue
                    seen.add(full)
                    urls.append(full)
                print(f"  found {len(items)} links, new={len(urls)-before}, total={len(urls)}")
                if len(items) < 5:
                    break
    finally:
        driver.quit()
    return urls


def bb_extract_details(soup: BeautifulSoup) -> Dict[str, str]:
    details: Dict[str, str] = {}
    dl = soup.find("dl", class_="productView-info")
    if not dl:
        return details
    for dt, dd in zip(dl.find_all("dt"), dl.find_all("dd")):
        key = safe_text(dt).rstrip(":")
        details[key] = safe_text(dd)
    return details


def bb_extract_images(soup: BeautifulSoup, html: str) -> List[str]:
    urls: List[str] = []
    seen: Set[str] = set()

    def add(u: str):
        if not u or u in seen:
            return
        if "{:size}" in u or "loading.svg" in u:
            return
        # Keep BigCommerce product gallery images only
        if "/products/" not in u:
            return
        seen.add(u)
        urls.append(u)

    for img in soup.select("img"):
        for attr in ("src", "data-src", "data-srcset", "srcset"):
            val = img.get(attr) or ""
            if not val:
                continue
            # srcset: take first url
            part = val.split(",")[0].strip().split(" ")[0]
            if "products/" in part and "stencil" in part:
                add(part)

    for m in re.findall(
        r"https://cdn11\.bigcommerce\.com/[^\"'\s]+/products/\d+/[^\"'\s]+\.(?:jpg|jpeg|png|webp)",
        html,
        flags=re.I,
    ):
        add(m)

    # Prefer largest stencil size unique by filename
    best: Dict[str, str] = {}
    for u in urls:
        name = Path(urlparse(u).path).name
        # score by size folder
        score = 0
        m = re.search(r"/stencil/(\d+)x(\d+)/", u)
        if m:
            score = int(m.group(1)) * int(m.group(2))
        if name not in best or score > best[name][0]:
            best[name] = (score, prefer_hires_url(u))
    return [best[k][1] for k in best]


def bb_parse_product(session: requests.Session, url: str) -> Optional[Dict[str, Any]]:
    try:
        resp = fetch(session, url)
    except Exception as e:
        print(f"  fetch failed {url}: {e}")
        return None

    soup = BeautifulSoup(resp.content, "html.parser")
    name = safe_text(soup.find("h1", class_="productView-title"))
    if not name:
        return None

    # SKU / MPN from info values (original notebook approach)
    sku_els = soup.find_all("span", class_="productView-info-value")
    sku = safe_text(sku_els[0]) if len(sku_els) > 0 else ""
    mpn = safe_text(sku_els[1]) if len(sku_els) > 1 else ""

    brand_el = soup.find("h2", class_="productView-brand")
    brand = safe_text(brand_el) if brand_el else ""

    price_el = soup.find("span", class_="price price--withoutTax")
    sale_price = safe_text(price_el)
    reg_el = soup.find("span", class_="price price--non-sale")
    regular_price = safe_text(reg_el)

    desc_el = soup.find("div", class_="productView-description")
    description = safe_text(desc_el)

    details = bb_extract_details(soup)
    if not bb_product_looks_like_wire_wheel(name, details, description):
        return None

    size, diameter, width = parse_size(name)
    if not size:
        size, diameter, width = parse_size(details.get("Wheel Size", "") + "x" + details.get("Wheel Width", ""))
    if details.get("Wheel Size") and details.get("Wheel Width"):
        diameter = details.get("Wheel Size") or diameter
        width = details.get("Wheel Width") or width
        size = f"{diameter}x{width}"

    if not brand:
        brand = details.get("Product Brand") or details.get("Brand") or "BB Wheels"
    if not sku:
        sku = details.get("SKU") or details.get("MPN") or mpn or hashlib.md5(url.encode()).hexdigest()[:10]

    row = blank_row()
    row.update(
        {
            "Product Name": name,
            "SKU": sku,
            "Part Number": mpn or sku,
            "Brand": brand,
            "Model": details.get("Product Model", ""),
            "Wheel Type": details.get("Accessory Type", "") or "Wire Wheel",
            "Size": size,
            "Diameter": diameter,
            "Width": width,
            "Offset": details.get("Wheel Offset", "") or details.get("Offset", ""),
            "Backspacing": details.get("Backspacing", ""),
            "Bolt Pattern / PCD": details.get("Wheel Bolt Pattern", "") or details.get("Bolt Pattern", ""),
            "Finish": details.get("Finish", ""),
            "Color": details.get("Color", ""),
            "Lip Size": details.get("Lip Size", "") or details.get("Lip", ""),
            "Hub Bore": details.get("Center Bore", "") or details.get("Hub Bore", ""),
            "Load Rating": details.get("Load", "") or details.get("Load Rating", ""),
            "Weight": details.get("Weight", ""),
            "Construction": details.get("Construction", ""),
            "Material": details.get("Material", ""),
            "Description": description,
            "Features": details.get("Deal Type", ""),
            "Specifications": "; ".join(f"{k}: {v}" for k, v in details.items()),
            "Price": regular_price or sale_price,
            "Sale Price": sale_price,
            "MSRP": regular_price,
            "Stock / Availability": details.get("Availability", "")
            or ("In stock" if sale_price else ""),
            "Product URL": url,
            "Category": details.get("Accessory Type", "Wire Wheels"),
            "Source": "bbwheelsonline.com",
        }
    )

    images = bb_extract_images(soup, resp.text)
    row["_image_paths"] = download_images(session, images, brand, sku)
    return row


def scrape_bbwheels(
    session: Optional[requests.Session] = None,
    use_selenium: bool = False,
    limit: Optional[int] = None,
) -> Path:
    session = session or make_session()
    urls = bb_collect_urls_from_sitemap(session)
    if use_selenium:
        selenium_urls = bb_collect_urls_via_selenium()
        for u in selenium_urls:
            if u not in urls:
                urls.append(u)

    # Deduplicate
    urls = list(dict.fromkeys(urls))
    if limit:
        urls = urls[:limit]
    print(f"[BB] Candidate product URLs: {len(urls)}")
    print(
        "[BB] Note: bbwheelsonline.com currently appears to list few/no classic "
        "wire-wheel SKUs (lace/spoke wire). The filter will keep only verified matches."
    )

    rows: List[Dict[str, Any]] = []
    seen_sku: Set[str] = set()

    for i, url in enumerate(urls, 1):
        try:
            row = bb_parse_product(session, url)
            if not row:
                print(f"  [{i}/{len(urls)}] skip (not wire wheel): {url[:90]}")
                continue
            sku_key = (row.get("SKU") or "").upper()
            if sku_key in seen_sku:
                print(f"  [{i}/{len(urls)}] duplicate SKU {sku_key}")
                continue
            seen_sku.add(sku_key)
            rows.append(row)
            print(
                f"  [{i}/{len(urls)}] KEEP {row['SKU'][:18]:18} | {row['Product Name'][:40]:40} | "
                f"imgs={len(row.get('_image_paths') or [])}"
            )
        except Exception as e:
            print(f"  [{i}/{len(urls)}] FAILED {url[:80]}: {e}")
            continue

    return save_csv(rows, OUTPUT_BB)



# ---------------------------------------------------------------------------
# Ninja Tire (WooCommerce) — /product-category/wire-wheels/
# ---------------------------------------------------------------------------

def ninja_format_price(prices: Dict[str, Any]) -> Tuple[str, str, str]:
    """Return (price, sale_price, msrp) display strings from WC store API prices."""
    if not prices:
        return "", "", ""
    minor = int(prices.get("currency_minor_unit") or 2)
    symbol = prices.get("currency_symbol") or "$"

    def money(raw) -> str:
        if raw in (None, "", 0, "0"):
            return ""
        try:
            cents = int(str(raw))
        except (TypeError, ValueError):
            return str(raw)
        # placeholder "call for price" style values
        if cents >= 900000 * (10 ** max(minor - 2, 0)) and cents >= 999999:
            return "Call for price"
        value = cents / (10 ** minor)
        return f"{symbol}{value:,.2f}"

    price = money(prices.get("price"))
    regular = money(prices.get("regular_price"))
    sale = money(prices.get("sale_price"))
    # If sale == regular, treat as list price only
    if sale and regular and sale == regular:
        return regular, sale, regular
    if sale and regular and sale != regular:
        return regular, sale, regular
    return price or regular, sale or price, regular or price


def ninja_collect_products(
    session: requests.Session,
    limit: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Paginate WooCommerce Store API for Wire Wheels category."""
    products: List[Dict[str, Any]] = []
    seen: Set[int] = set()
    page = 1
    per_page = 50
    while True:
        url = f"{NINJA_BASE}/wp-json/wc/store/v1/products"
        params = {
            "category": NINJA_CATEGORY_ID,
            "per_page": per_page,
            "page": page,
            "orderby": "title",
            "order": "asc",
        }
        print(f"[Ninja] Listing page {page}: category={NINJA_CATEGORY_ID}")
        try:
            time.sleep(REQUEST_DELAY)
            resp = session.get(url, params=params, timeout=REQUEST_TIMEOUT)
            if resp.status_code >= 400:
                raise requests.HTTPError(f"HTTP {resp.status_code}", response=resp)
            batch = resp.json() or []
        except Exception as e:
            print(f"[Ninja] listing failed page {page}: {e}")
            break
        if not batch:
            break
        for p in batch:
            pid = p.get("id")
            if pid in seen:
                continue
            seen.add(pid)
            products.append(p)
            if limit and len(products) >= limit:
                print(f"  → reached limit={limit}, stopping early")
                return products
        total = resp.headers.get("X-WP-Total")
        pages = resp.headers.get("X-WP-TotalPages")
        print(f"  → batch={len(batch)} kept_total={len(products)} (site total={total}, pages={pages})")
        if pages and page >= int(pages):
            break
        if len(batch) < per_page:
            break
        page += 1
        if page > 200:
            break
    return products


def ninja_is_wire_wheel(product: Dict[str, Any]) -> bool:
    """Category is already wire-wheels; still drop obvious non-wheel junk."""
    title = product.get("name") or ""
    cats = " ".join(
        (c.get("name") or "") + " " + (c.get("slug") or "")
        for c in (product.get("categories") or [])
    )
    blob = f"{title} {cats} {product.get('description') or ''}"
    plain = BeautifulSoup(blob, "html.parser").get_text(" ", strip=True)

    if re.search(r"\b(t-?shirt|hoodie|hat|sticker|keychain)\b", plain, re.I):
        return False
    if re.search(r"\b(replica\s*wheel|alloy\s*wheel|oem\s*wheel|steel\s*wheel)\b", plain, re.I):
        return False
    # In wire-wheels category OR clear wire markers
    if NINJA_CATEGORY_SLUG in cats.lower() or re.search(r"\bwire\s*wheels?\b", cats, re.I):
        return True
    return bool(WIRE_WHEEL_RE.search(plain))


def ninja_parse_product(product: Dict[str, Any], session: requests.Session) -> Dict[str, Any]:
    title = BeautifulSoup(product.get("name") or "", "html.parser").get_text(" ", strip=True)
    sku = (product.get("sku") or "").strip() or f"ninja-{product.get('id')}"
    description = BeautifulSoup(product.get("description") or "", "html.parser").get_text("\n", strip=True)
    short = BeautifulSoup(product.get("short_description") or "", "html.parser").get_text(" ", strip=True)
    if short and short not in description:
        description = f"{short}\n{description}".strip()

    size, diameter, width = parse_size(title)
    if not size:
        size, diameter, width = parse_size(description)

    finish = ""
    color = ""
    for token in ("Chrome", "Gold", "Rose Gold", "Black", "California Gold", "24K", "Powder"):
        if re.search(re.escape(token), title, re.I):
            finish = finish or token
            color = color or token

    spoke = ""
    m_spoke = re.search(r"\b(\d{2,3})\s*[- ]?spoke\b", title, re.I)
    if m_spoke:
        spoke = f"{m_spoke.group(1)} Spoke"

    offset = ""
    if re.search(r"\breverse\b", title + " " + description, re.I):
        offset = "Reverse"
    elif re.search(r"\bstandard\b", title, re.I):
        offset = "Standard"
    elif re.search(r"\bstaggered\b", title, re.I):
        offset = "Staggered"

    cats = product.get("categories") or []
    category = ", ".join(
        BeautifulSoup(c.get("name") or "", "html.parser").get_text(" ", strip=True)
        for c in cats
        if c.get("name")
    )
    attrs = product.get("attributes") or []
    features = "; ".join(
        f"{a.get('name')}: " + ", ".join(t.get("name") or "" for t in (a.get("terms") or []))
        for a in attrs
        if a.get("name")
    )

    price, sale_price, msrp = ninja_format_price(product.get("prices") or {})
    stock = "In stock" if product.get("is_in_stock") else "Out of stock"

    row = blank_row()
    row.update(
        {
            "Product Name": title,
            "SKU": sku,
            "Part Number": sku,
            "Brand": "Ninja Tire",
            "Model": spoke or "",
            "Wheel Type": spoke or "Wire Wheel",
            "Size": size,
            "Diameter": diameter,
            "Width": width,
            "Offset": offset,
            "Backspacing": "",
            "Bolt Pattern / PCD": "",
            "Finish": finish,
            "Color": color,
            "Lip Size": "",
            "Hub Bore": "",
            "Load Rating": "",
            "Weight": "",
            "Construction": "Wire Wheel",
            "Material": "",
            "Description": description,
            "Features": features,
            "Specifications": features,
            "Price": price,
            "Sale Price": sale_price,
            "MSRP": msrp,
            "Stock / Availability": stock,
            "Product URL": product.get("permalink") or "",
            "Category": category or "Wire Wheels",
            "Source": "ninjatire.com",
        }
    )

    image_urls = []
    for img in product.get("images") or []:
        src = img.get("src") or img.get("thumbnail") or ""
        if src:
            image_urls.append(src)
    row["_image_paths"] = download_images(session, image_urls, row["Brand"], sku)
    return row


def scrape_ninja(
    session: Optional[requests.Session] = None,
    limit: Optional[int] = None,
) -> Path:
    session = session or make_session()
    products = ninja_collect_products(session, limit=limit)
    products = [p for p in products if ninja_is_wire_wheel(p)]
    if limit:
        products = products[:limit]
    print(f"[Ninja] Scraping {len(products)} wire wheel products…")

    rows: List[Dict[str, Any]] = []
    seen_sku: Set[str] = set()

    for i, product in enumerate(products, 1):
        try:
            row = ninja_parse_product(product, session)
            sku_key = (row.get("SKU") or "").upper()
            if sku_key and sku_key in seen_sku:
                print(f"  [{i}/{len(products)}] skip duplicate SKU {sku_key}")
                continue
            if sku_key:
                seen_sku.add(sku_key)
            rows.append(row)
            print(
                f"  [{i}/{len(products)}] {row['SKU'][:22]:22} | {row['Product Name'][:42]:42} | "
                f"imgs={len(row.get('_image_paths') or [])}"
            )
        except Exception as e:
            print(f"  [{i}/{len(products)}] FAILED: {e}")
            continue

    return save_csv(rows, OUTPUT_NINJA)




# ---------------------------------------------------------------------------
# Player Wheel (WooCommerce) — /custom-wire-wheels/
# ---------------------------------------------------------------------------

def player_host_reachable(session: requests.Session) -> bool:
    try:
        session.get(PLAYER_BASE + "/", timeout=(6, 12))
        return True
    except Exception:
        return False


def player_fetch_via_relay(session: requests.Session, url: str, *, expect_json: bool = False) -> Any:
    """
    Fetch playerwheel.com through r.jina.ai when the origin is blocked.
    Uses urllib (requests often gets HTTP 403 from the relay).
    Jina returns markdown; we unwrap embedded JSON or keep the text for HTML parsing.
    """
    import urllib.request

    relay_url = PLAYER_TEXT_RELAY + url
    time.sleep(REQUEST_DELAY)
    req = urllib.request.Request(
        relay_url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/plain",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            text = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        raise requests.RequestException(f"relay fetch failed for {url}: {e}") from e

    if expect_json:
        m = re.search(r"(\[\s*\{.*\}\s*\]|\{\s*\".*\}\s*)", text, re.S)
        if not m:
            raise ValueError(f"No JSON found in relay response for {url}")
        return json.loads(m.group(1))
    m_html = re.search(r"(<!DOCTYPE html>.*)</html>", text, re.I | re.S)
    if m_html:
        html = m_html.group(0)
        return html if html.endswith("</html>") else html + "</html>"
    return text


def player_get(
    session: requests.Session,
    url: str,
    *,
    expect_json: bool = False,
    use_relay: bool = False,
    params: Optional[Dict[str, Any]] = None,
) -> Any:
    """GET playerwheel URL directly, or via text relay when use_relay=True."""
    if params:
        url = url + ("&" if "?" in url else "?") + urlencode(params)

    if use_relay:
        return player_fetch_via_relay(session, url, expect_json=expect_json)

    if expect_json:
        time.sleep(REQUEST_DELAY)
        resp = session.get(url, timeout=REQUEST_TIMEOUT)
        if resp.status_code >= 400:
            raise requests.HTTPError(f"HTTP {resp.status_code} for {url}", response=resp)
        return resp.json()
    return fetch(session, url)


def player_attr_map(product: Dict[str, Any]) -> Dict[str, List[str]]:
    out: Dict[str, List[str]] = {}
    for a in product.get("attributes") or []:
        name = (a.get("name") or "").strip()
        if not name:
            continue
        terms = [
            BeautifulSoup(t.get("name") or "", "html.parser").get_text(" ", strip=True)
            for t in (a.get("terms") or [])
            if t.get("name")
        ]
        out[name] = [t for t in terms if t]
    return out


def player_format_price(prices: Dict[str, Any], attr_prices: List[str]) -> Tuple[str, str, str]:
    """Build display prices from WC price_range and/or Price attribute terms."""
    symbol = (prices or {}).get("currency_symbol") or "$"
    minor = int((prices or {}).get("currency_minor_unit") or 2)

    def money(raw) -> str:
        if raw in (None, "", "0", 0):
            return ""
        try:
            cents = int(str(raw))
        except (TypeError, ValueError):
            return str(raw)
        if cents <= 0:
            return ""
        return f"{symbol}{cents / (10 ** minor):,.2f}"

    pr = (prices or {}).get("price_range") or {}
    min_p = money(pr.get("min_amount"))
    max_p = money(pr.get("max_amount"))
    if min_p and max_p and min_p != max_p:
        display = f"{min_p} – {max_p}"
    else:
        display = max_p or min_p or money((prices or {}).get("price"))

    # Prefer human Price attribute terms when present (e.g. $629.00)
    clean_attr = [p for p in attr_prices if p and p.lower() != "call"]
    if clean_attr:
        # keep order, unique
        seen = []
        for p in clean_attr:
            if p not in seen:
                seen.append(p)
        if len(seen) == 1:
            display = seen[0]
        else:
            display = " – ".join(seen[:2]) if len(seen) > 1 else seen[0]

    if not display and any(p.lower() == "call" for p in attr_prices):
        display = "Call for price"

    return display, display, display



def player_collect_listing_urls(session: requests.Session, *, use_relay: bool = False) -> List[str]:
    """Collect product URLs from main listing + all size tag pages (13–26 inch)."""
    pages = [PLAYER_LISTING_URL] + [
        f"{PLAYER_BASE}/product-tag/{inch}-inch-wire-wheels/"
        for inch in (13, 14, 15, 16, 17, 18, 20, 22, 24, 26)
    ]
    urls: List[str] = []
    seen: Set[str] = set()
    for page_url in pages:
        print(f"[Player] Listing page: {page_url}", flush=True)
        try:
            raw = player_get(session, page_url, use_relay=use_relay)
            content = raw.content if hasattr(raw, "content") else str(raw).encode("utf-8", errors="replace")
            if isinstance(raw, str):
                content = raw.encode("utf-8", errors="replace")
        except Exception as e:
            print(f"  ⚠ listing failed: {e}", flush=True)
            continue
        soup = BeautifulSoup(content, "html.parser")
        page_new = 0
        for a in soup.select('a[href*="/product/"]'):
            href = a.get("href") or ""
            if "/product-tag/" in href or "/product-category/" in href:
                continue
            full = urljoin(PLAYER_BASE, href.split("?")[0])
            if "/product/" not in full:
                continue
            if not full.endswith("/"):
                full += "/"
            if full in seen:
                continue
            seen.add(full)
            urls.append(full)
            page_new += 1
        # Also catch bare product links in markdown/relay text
        for m in re.finditer(r"https?://playerwheel\.com/product/[a-z0-9\-]+/?", str(content if isinstance(content, str) else content.decode("utf-8", "ignore")), re.I):
            full = m.group(0)
            if not full.endswith("/"):
                full += "/"
            if full not in seen:
                seen.add(full)
                urls.append(full)
                page_new += 1
        print(f"  → new URLs={page_new} total={len(urls)}", flush=True)
    print(f"[Player] Found {len(urls)} unique product URLs across size pages", flush=True)
    return urls


def player_collect_api_products(session: requests.Session, *, use_relay: bool = False) -> Dict[str, Dict[str, Any]]:
    """Index all WC store products by permalink/slug."""
    by_slug: Dict[str, Dict[str, Any]] = {}
    page = 1
    while True:
        url = f"{PLAYER_BASE}/wp-json/wc/store/v1/products"
        print(f"[Player] API products page {page}", flush=True)
        try:
            batch = player_get(
                session,
                url,
                expect_json=True,
                use_relay=use_relay,
                params={"per_page": 50, "page": page},
            )
            if not isinstance(batch, list):
                batch = []
        except Exception as e:
            print(f"[Player] API page {page} failed: {e}", flush=True)
            break
        if not batch:
            break
        for p in batch:
            slug = (p.get("slug") or "").strip()
            permalink = (p.get("permalink") or "").strip()
            if slug:
                by_slug[slug] = p
            if permalink:
                by_slug[permalink.rstrip("/") + "/"] = p
                by_slug[permalink.rstrip("/")] = p
        print(f"  → batch={len(batch)} indexed={len(by_slug)}", flush=True)
        if len(batch) < 50:
            break
        page += 1
        if page > 50:
            break
    return by_slug


def player_is_wire_wheel(product: Dict[str, Any]) -> bool:
    title = product.get("name") or ""
    slug = product.get("slug") or ""
    blob = f"{title} {slug}"
    # Knock-off CAP accessories are not wheels
    if re.search(r"\b(two-wing|three-wing|bullet)\s*cap\b|\bcap\b", blob, re.I) and not re.search(
        r"floating\s*cap", blob, re.I
    ):
        # floating-cap wheels are still wheels; plain "cap" accessories are not
        if re.search(r"\b(wing|bullet)\s*cap\b", blob, re.I):
            return False
    if re.search(r"\b(t-?shirt|hoodie|hat|sticker|keychain)\b", blob, re.I):
        return False
    if re.search(r"\b(replica\s*wheel|alloy\s*wheel|oem\s*wheel|steel\s*wheel)\b", blob, re.I):
        return False
    return bool(WIRE_WHEEL_RE.search(blob) or re.search(r"wire|spoke|lace|crosslace", blob, re.I))


def player_parse_product_size(
    product: Dict[str, Any],
    session: requests.Session,
    size_value: str,
    size_index: int,
    image_paths: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Build one CSV row for a single wheel size option of a variable product."""
    title = BeautifulSoup(product.get("name") or "", "html.parser").get_text(" ", strip=True)
    base_sku = (product.get("sku") or "").strip() or f"player-{product.get('id')}"
    size_slug = slugify(size_value, "size")
    sku = f"{base_sku}-{size_slug}"

    description = BeautifulSoup(product.get("description") or "", "html.parser").get_text("\n", strip=True)
    short = BeautifulSoup(product.get("short_description") or "", "html.parser").get_text(" ", strip=True)
    if short and short not in description:
        description = f"{short}\n{description}".strip()

    attrs = player_attr_map(product)
    size_terms = attrs.get("Wheel Size") or attrs.get("Size") or []
    price_terms = attrs.get("Price") or []

    # Map price term to this size by index when lengths match
    size_price = ""
    if size_terms and price_terms and len(price_terms) == len(size_terms) and 0 <= size_index < len(price_terms):
        size_price = price_terms[size_index]
    elif len(price_terms) == 1:
        size_price = price_terms[0]

    if size_price and size_price.lower() == "call":
        price = sale_price = msrp = "Call for price"
    elif size_price:
        price = sale_price = msrp = size_price
    else:
        price, sale_price, msrp = player_format_price(product.get("prices") or {}, price_terms)

    size_str, diameter, width = parse_size(size_value)
    if not size_str:
        size_str = size_value
        # diameter from leading number e.g. 13x7
        m = re.match(r"(\d+(?:\.\d+)?)", size_value.replace("×", "x"))
        diameter = m.group(1) if m else ""

    finish = (attrs.get("Finish") or [""])[0]
    color = finish or (attrs.get("Product Name") or [""])[0]
    offset = (attrs.get("Off-Set") or attrs.get("Offset") or [""])[0]
    if not offset:
        if re.search(r"\breverse\b", title, re.I):
            offset = "Reverse"
        elif re.search(r"\bfwd\b", title, re.I):
            offset = "FWD"
        elif re.search(r"\bstd\b|\bstandard\b|\brwd\b", title, re.I):
            offset = "Standard"

    bolt_parts = []
    for key in ("Bolt Pattern 1", "Bolt Pattern 2", "Bolt Pattern 3", "Bolt Pattern"):
        bolt_parts.extend(attrs.get(key) or [])
    bolt = ", ".join(dict.fromkeys([b for b in bolt_parts if b and b.upper() != "X"]))
    hub = ", ".join(attrs.get("Center Bore") or [])

    spoke = ""
    m_spoke = re.search(r"\b(\d{2,3})\s*[- ]?spokes?\b", title, re.I)
    if m_spoke:
        spoke = f"{m_spoke.group(1)} Spoke"

    lace = ""
    if re.search(r"cross\s*lace|crosslace", title, re.I):
        lace = "Cross Lace"
    elif re.search(r"straight", title, re.I):
        lace = "Straight Lace"

    stock = "In stock" if product.get("is_in_stock", True) else "Out of stock"
    inch_label = f"{diameter} Inch Wire Wheels" if diameter else "Custom Wire Wheels"
    cats = ", ".join(
        BeautifulSoup(c.get("name") or "", "html.parser").get_text(" ", strip=True)
        for c in (product.get("categories") or [])
        if c.get("name")
    )
    if inch_label not in cats:
        cats = f"{inch_label}, {cats}".strip(", ")

    specs = "; ".join(f"{k}: {', '.join(v)}" for k, v in attrs.items() if v)
    display_name = f"{title} – {size_str}"

    row = blank_row()
    row.update(
        {
            "Product Name": display_name,
            "SKU": sku,
            "Part Number": base_sku,
            "Brand": "Player Wheel",
            "Model": " / ".join(x for x in (spoke, lace) if x),
            "Wheel Type": lace or spoke or "Wire Wheel",
            "Size": size_str,
            "Diameter": diameter,
            "Width": width,
            "Offset": offset,
            "Backspacing": "",
            "Bolt Pattern / PCD": bolt,
            "Finish": finish,
            "Color": color,
            "Lip Size": "",
            "Hub Bore": hub,
            "Load Rating": "",
            "Weight": "",
            "Construction": "Wire Wheel",
            "Material": "",
            "Description": description,
            "Features": specs,
            "Specifications": specs,
            "Price": price,
            "Sale Price": sale_price,
            "MSRP": msrp,
            "Stock / Availability": stock,
            "Product URL": product.get("permalink") or "",
            "Category": cats or inch_label,
            "Source": "playerwheel.com",
        }
    )

    if image_paths is not None:
        row["_image_paths"] = list(image_paths)
    else:
        image_urls = [img.get("src") for img in (product.get("images") or []) if img.get("src")]
        row["_image_paths"] = download_images(session, image_urls, row["Brand"], base_sku)
    return row


def player_expand_product_rows(
    product: Dict[str, Any],
    session: requests.Session,
) -> List[Dict[str, Any]]:
    """Expand a variable parent into one row per wheel size."""
    attrs = player_attr_map(product)
    size_terms = attrs.get("Wheel Size") or attrs.get("Size") or []
    if not size_terms:
        size_terms = [""]

    # Download images once per parent SKU folder
    base_sku = (product.get("sku") or "").strip() or f"player-{product.get('id')}"
    image_urls = [img.get("src") for img in (product.get("images") or []) if img.get("src")]
    image_paths = download_images(session, image_urls, "Player Wheel", base_sku)

    rows: List[Dict[str, Any]] = []
    for idx, size_value in enumerate(size_terms):
        rows.append(
            player_parse_product_size(
                product,
                session,
                size_value=size_value or "N/A",
                size_index=idx,
                image_paths=image_paths,
            )
        )
    return rows


def scrape_player(
    session: Optional[requests.Session] = None,
    limit: Optional[int] = None,
) -> Path:
    """
    Scrape Player Wheel custom wire wheels.

    Collects products from /custom-wire-wheels/ and every size tag page
    (13–26 inch), then expands each variable product into one CSV row per size.

    Note: size tag pages (e.g. "13 INCH WIRE WHEELS") are filters over the same
    parent catalog — they do not add unique models beyond the main listing.
    Expanding by Wheel Size / Size attributes produces one row per diameter.
    """
    session = session or make_session()
    print("[Player] Checking site reachability…", flush=True)
    use_relay = not player_host_reachable(session)
    if use_relay:
        print(
            "[Player] Origin blocked — using text/image relays "
            f"({PLAYER_TEXT_RELAY.rstrip('/')} + images.weserv.nl)",
            flush=True,
        )
        # Listing HTML via relay is slow/noisy; Store API has the full catalog.
        listing_urls = []
        print("[Player] Skipping HTML listings in relay mode (API-only)", flush=True)
    else:
        print("[Player] Origin reachable — scraping directly", flush=True)
        listing_urls = player_collect_listing_urls(session, use_relay=False)

    api_index = player_collect_api_products(session, use_relay=use_relay)

    # Offline / relay-failure fallback: use previously saved Store API dump
    cache_path = BASE_DIR / "cache" / "playerwheel_all_products.json"
    if not api_index and cache_path.exists():
        print(f"[Player] API empty — loading cache {cache_path}", flush=True)
        try:
            cached = json.loads(cache_path.read_text(encoding="utf-8"))
            for p in cached:
                slug = (p.get("slug") or "").strip()
                permalink = (p.get("permalink") or "").strip()
                if slug:
                    api_index[slug] = p
                if permalink:
                    api_index[permalink.rstrip("/") + "/"] = p
                    api_index[permalink.rstrip("/")] = p
            print(f"  → cached products indexed={len(api_index)}", flush=True)
        except Exception as e:
            print(f"  ⚠ cache load failed: {e}", flush=True)

    products: List[Dict[str, Any]] = []
    seen_ids: Set[int] = set()

    for url in listing_urls:
        slug = url.rstrip("/").split("/")[-1]
        product = api_index.get(url) or api_index.get(url.rstrip("/")) or api_index.get(slug)
        if not product:
            print(f"  ⚠ not in API, skip: {url}", flush=True)
            continue
        if not player_is_wire_wheel(product):
            continue
        pid = product.get("id")
        if pid in seen_ids:
            continue
        seen_ids.add(pid)
        products.append(product)

    # Also include any API wire parents missed by HTML listings
    for product in list(api_index.values()):
        pid = product.get("id")
        if not pid or pid in seen_ids:
            continue
        if product.get("parent"):
            continue
        if not player_is_wire_wheel(product):
            continue
        seen_ids.add(pid)
        products.append(product)
        print(f"  + API-only product: {product.get('name')}", flush=True)

    print(f"[Player] Parent wire products: {len(products)} (will expand by size)", flush=True)
    if not products:
        raise SystemExit(
            "[Player] No wire products found. "
            "Site may be blocked and cache/cache/playerwheel_all_products.json is missing."
        )

    # Refresh local API cache for offline / blocked-origin rebuilds
    try:
        cache_path = BASE_DIR / "cache" / "playerwheel_all_products.json"
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        # unique by id
        uniq = {p.get("id"): p for p in products if p.get("id") is not None}
        # Prefer full api_index values when available
        full = []
        seen_c: Set[int] = set()
        for p in list(api_index.values()):
            pid = p.get("id")
            if not pid or pid in seen_c:
                continue
            if not player_is_wire_wheel(p) and pid not in uniq:
                continue
            seen_c.add(pid)
            full.append(p)
        if not full:
            full = list(uniq.values())
        cache_path.write_text(json.dumps(full, ensure_ascii=False), encoding="utf-8")
        print(f"[Player] Wrote API cache → {cache_path}", flush=True)
    except Exception as e:
        print(f"  ⚠ could not write cache: {e}", flush=True)

    rows: List[Dict[str, Any]] = []
    seen_sku: Set[str] = set()
    parents_done = 0

    for product in products:
        if limit is not None and len(rows) >= limit:
            break
        parents_done += 1
        try:
            expanded = player_expand_product_rows(product, session)
            kept = 0
            for row in expanded:
                if limit is not None and len(rows) >= limit:
                    break
                sku_key = (row.get("SKU") or "").upper()
                if sku_key and sku_key in seen_sku:
                    continue
                if sku_key:
                    seen_sku.add(sku_key)
                rows.append(row)
                kept += 1
            print(
                f"  [{parents_done}/{len(products)}] {(product.get('name') or '')[:40]:40} "
                f"→ {kept} size rows (total {len(rows)})",
                flush=True,
            )
        except Exception as e:
            print(f"  [{parents_done}/{len(products)}] FAILED: {e}", flush=True)
            continue

    return save_csv(rows, OUTPUT_PLAYER)



def main(
    limit_luxor: Optional[int] = None,
    limit_bb: Optional[int] = None,
    limit_ninja: Optional[int] = None,
    limit_player: Optional[int] = None,
    use_selenium: bool = False,
    luxor_only: bool = False,
    bb_only: bool = False,
    ninja_only: bool = False,
    player_only: bool = False,
):
    session = make_session()
    print("=" * 70)
    print("Wire Wheels scraper")
    print("=" * 70)

    run_all = not (luxor_only or bb_only or ninja_only or player_only)
    if run_all or luxor_only:
        scrape_luxor(session, limit=limit_luxor)
    if run_all or bb_only:
        scrape_bbwheels(session, use_selenium=use_selenium, limit=limit_bb)
    if run_all or ninja_only:
        scrape_ninja(session, limit=limit_ninja)
    if run_all or player_only:
        scrape_player(session, limit=limit_player)
    print("Done.")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Scrape Luxor + BB + Ninja Tire + Player Wheel Wire Wheels"
    )
    parser.add_argument("--limit-luxor", type=int, default=None)
    parser.add_argument("--limit-bb", type=int, default=None)
    parser.add_argument("--limit-ninja", type=int, default=None)
    parser.add_argument("--limit-player", type=int, default=None)
    parser.add_argument("--selenium", action="store_true")
    parser.add_argument("--luxor-only", action="store_true")
    parser.add_argument("--bb-only", action="store_true")
    parser.add_argument("--ninja-only", action="store_true")
    parser.add_argument("--player-only", action="store_true")
    args = parser.parse_args()

    main(
        limit_luxor=args.limit_luxor,
        limit_bb=args.limit_bb,
        limit_ninja=args.limit_ninja,
        limit_player=args.limit_player,
        use_selenium=args.selenium,
        luxor_only=args.luxor_only,
        bb_only=args.bb_only,
        ninja_only=args.ninja_only,
        player_only=args.player_only,
    )
