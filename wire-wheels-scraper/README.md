# Wire Wheels Scraper

Scrapes **Wire Wheels only** from:

1. [luxorwirewheels.com](https://luxorwirewheels.com/) (Shopify)
2. [bbwheelsonline.com](https://www.bbwheelsonline.com/) (BigCommerce)
3. [ninjatire.com/product-category/wire-wheels](https://www.ninjatire.com/product-category/wire-wheels/) (WooCommerce)
4. [playerwheel.com/custom-wire-wheels](https://playerwheel.com/custom-wire-wheels/) (WooCommerce)

## Setup

```bash
cd wire-wheels-scraper
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

### Full scrape (all sites)

```bash
python scrape_wire_wheels.py
```

### Per site

```bash
# Luxor only
python scrape_wire_wheels.py --luxor-only

# BB Wheels only
python scrape_wire_wheels.py --bb-only

# Ninja Tire only
python scrape_wire_wheels.py --ninja-only

# Player Wheel only
python scrape_wire_wheels.py --player-only

# Player Wheel smoke test
python scrape_wire_wheels.py --player-only --limit-player 5
```

### Limited / combined tests

```bash
python scrape_wire_wheels.py --limit-luxor 5 --limit-ninja 5 --limit-player 5
python scrape_wire_wheels.py --selenium   # optional BB browser crawl
```

## Outputs

| File | Description |
|------|-------------|
| `luxor_wire_wheels.csv` | Luxor wire wheel catalog |
| `bbwheels_wire_wheels.csv` | BB Wheels wire-wheel matches (may be empty) |
| `ninjatire_wire_wheels.csv` | Ninja Tire wire wheels |
| `playerwheel_wire_wheels.csv` | Player Wheel custom wire wheels |
| `images/<brand>/<sku>/imageN.jpg` | Downloaded product images |

## How Player Wheel is scraped

- Collects product URLs from `https://playerwheel.com/custom-wire-wheels/`
  **and** every size tag page (`13`–`26` inch wire wheels)
- Enriches each product via WooCommerce Store API (`/wp-json/wc/store/v1/products`)
- **Expands each variable product into one CSV row per wheel size**
  (e.g. 13x7, 14x7, 15x7…) with size-specific price when available
- Extracts finishes, bolt patterns, offset, hub bore, prices, images
- Writes `playerwheel_wire_wheels.csv`

If `playerwheel.com` is blocked on your network, the scraper automatically falls back to:
1. text relay (`r.jina.ai`) + image relay (`images.weserv.nl`), then
2. local cache at `cache/playerwheel_all_products.json` (if present)

The red “13/14/15… INCH WIRE WHEELS” banners on the site are **size filters** over
the same parent products (different finishes/spoke styles), not separate catalogs.
Expect ~36 parent models expanded into ~80+ size rows — not hundreds of unique parents.

## Error handling

- HTTP retries with backoff (429/5xx)
- Per-product try/except (one failure never stops the run)
- Missing fields stored as blank
- Duplicate SKUs skipped
- Image download failures logged and skipped
