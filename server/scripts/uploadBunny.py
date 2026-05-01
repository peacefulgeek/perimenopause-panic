#!/usr/bin/env python3
"""Pull every generated watercolor asset from its CloudFront source,
re-encode as compressed WebP, PUT it to Bunny Storage zone 'perimenopause'.
Nothing image-shaped is ever stored locally past this script's lifetime."""
import os, io, sys
from PIL import Image
import requests

CFG = {}
with open("/home/ubuntu/.bunny-perimenopause") as f:
    for line in f:
        line = line.strip()
        if not line or "=" not in line: continue
        k, v = line.split("=", 1)
        CFG[k.strip()] = v.strip()

ZONE = CFG["STORAGE_ZONE"]
HOST = CFG["STORAGE_HOST"]
KEY  = CFG["STORAGE_API_KEY"]
PULL = CFG["PULL_ZONE_HOST"]

# (remote-path-on-bunny, source-cloudfront-url)
ASSETS = [
    # Library 1-20
    ("library/lib-01.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-01-Eqh8TLabsLmqbyaHjdxmBM.png"),
    ("library/lib-02.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-02-TzRk7YgGRA3dEUYU6G54iB.png"),
    ("library/lib-03.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-03-8gU3hdNaNzFctxxwpfcwPw.png"),
    ("library/lib-04.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-04-QAYRCEof3QYKgUh2wXwcZf.png"),
    ("library/lib-05.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-05-YFbJF6k8zetVSo3w9zZCXe.png"),
    ("library/lib-06.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-06-fbMiDhRZC3X6HRd5VFd4nS.png"),
    ("library/lib-07.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-07-NsNvqsWtyKUYcLg7nchYuu.png"),
    ("library/lib-08.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-08-E3psuKan2Mwz2rDhdRUmBs.png"),
    ("library/lib-09.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-09-hACqJdbzFGaZL3vxqQpSEo.png"),
    ("library/lib-10.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-10-Sfrqbo9a4qKM8LyG2sUzHv.png"),
    ("library/lib-11.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-11-CdpvSTfBhvss2GWkowKEeX.png"),
    ("library/lib-12.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-12-EYJzpGREcRgqy8gBvoYii8.png"),
    ("library/lib-13.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-13-eCHzWiNT3pTjnMfUY2jZCT.png"),
    ("library/lib-14.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-14-WdHeFbLRFoxTe6eg4inNJ9.png"),
    ("library/lib-15.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-15-BJA3zF4bkmwUu9a4tKgHdL.png"),
    ("library/lib-16.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-16-ZnifYd7GekUNJXvtZyuDmC.png"),
    ("library/lib-17.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-17-ADqzepPfzGZCt9wobrThHk.png"),
    ("library/lib-18.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-18-KgEJGj8xBppc6HDCRuvdHm.png"),
    ("library/lib-19.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-19-UD4SYgEykcofQqUe4kjaZK.png"),
    ("library/lib-20.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-20-eiqy7yRj6DGB5L6Z794xSP.png"),
    # Heroes
    ("heroes/hero-home.webp",        "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/hero-home-U2ERnxtQjb2wcwtggHDaFY.png"),
    ("heroes/hero-articles.webp",    "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/hero-articles-7n2TKvFnaChHV4sXsisnEx.png"),
    ("heroes/hero-herbs.webp",       "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/hero-herbs-9rpb7yzG7tRrB4vRkjcSsC.png"),
    ("heroes/hero-assessments.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/hero-assessments-La8eAX5ZbcUmWi3hTujFUe.png"),
    ("heroes/hero-tools.webp",       "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/hero-tools-S8q79EgTndVu3HUYjo7VrS.png"),
    # Assessments
    ("assessments/assess-symptoms.webp",     "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/assess-symptoms-RKyUdwYu3WpqAskg3jjEMu.png"),
    ("assessments/assess-cycle.webp",        "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/assess-cycle-JQE2r9WZjAiz78uyWuEgQ3.png"),
    ("assessments/assess-mood.webp",         "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/assess-mood-PbmFUCCCodTdNrdCjHpgRp.png"),
    ("assessments/assess-sleep.webp",        "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/assess-sleep-NzURbfVcmDySdKdUWuuUQW.png"),
    ("assessments/assess-energy.webp",       "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/assess-energy-eSLjKscJKyB4FqxjDMYNvG.png"),
    ("assessments/assess-cognition.webp",    "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/assess-cognition-LqgjswLZNbq2jNvUoDhS2N.png"),
    ("assessments/assess-stress.webp",       "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/assess-stress-FD62chnZTQEyVXbE4sGZnC.png"),
    ("assessments/assess-relationship.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/assess-relationship-GkkQEyHwArUrwWPCRdJsKU.png"),
    ("assessments/assess-libido.webp",       "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/assess-libido-FpALMbypPc7ghzj3Anpp9q.png"),
    ("assessments/assess-nutrition.webp",    "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/assess-nutrition-aupKALkdXAwEyBDQTmRvoF.png"),
    ("assessments/assess-readiness.webp",    "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/assess-readiness-RXDeAafs9UDwXjRLxE6mbB.png"),
]

def download(url: str) -> bytes:
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    return r.content

def to_webp_bytes(png_bytes: bytes, max_w: int, quality: int) -> bytes:
    img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    if img.width > max_w:
        ratio = max_w / img.width
        img = img.resize((max_w, int(img.height * ratio)), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, "WEBP", quality=quality, method=6)
    return out.getvalue()

def upload(remote: str, body: bytes) -> tuple[bool, int]:
    url = f"https://{HOST}/{ZONE}/{remote}"
    r = requests.put(url, headers={
        "AccessKey": KEY,
        "Content-Type": "image/webp",
    }, data=body, timeout=90)
    return r.ok, r.status_code

def main():
    okc = 0
    for remote, src in ASSETS:
        try:
            png = download(src)
            # Heroes need to be wider
            max_w = 2200 if remote.startswith("heroes/") else 1600
            quality = 80 if remote.startswith("heroes/") else 78
            webp = to_webp_bytes(png, max_w, quality)
            ok, code = upload(remote, webp)
            kb = len(webp) // 1024
            print(f"  [{code}] {kb:>4} KB  {remote}  {'OK' if ok else 'FAIL'}")
            if ok: okc += 1
        except Exception as e:
            print(f"  ERR  {remote}: {e}")
    print(f"\nuploaded {okc}/{len(ASSETS)} → https://{PULL}/")

if __name__ == "__main__":
    main()
