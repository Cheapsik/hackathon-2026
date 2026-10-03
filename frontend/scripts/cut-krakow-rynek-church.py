# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy>=2",
#   "pillow>=11",
#   "torch>=2.4",
#   "transformers>=4.45",
# ]
# ///
"""
Occlusion mask of St. Mary's Basilica for the home page hero (/).

The hero sets the CASTOR wordmark behind the church towers. The page draws the photo twice: once under the wordmark
and once over it through this mask, so only the church covers the letters. Run it again whenever the photo changes.

Writes public/krakow-rynek-church-mask.png: same size as the photo, transparent everywhere except the church.

Run from frontend/:

  uv run scripts/cut-krakow-rynek-church.py [path/to/photo] [--preview path/to/preview.png]
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

FRONTEND = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = FRONTEND / "public/krakow-rynek.png"
OUT = FRONTEND / "public/krakow-rynek-church-mask.png"
DEPTH_MODEL = "depth-anything/Depth-Anything-V2-Small-hf"

# Depth Anything V2 returns relative inverse depth. On this photo the sky is 0, the city on the horizon stays
# below 1.1 and the church walls are above 2, so the cut sits comfortably between them.
CHURCH_DEPTH = 1.6
# Region of the church as fractions of the photo (left, top, right, bottom). Below the bottom edge the nave meets
# roofs of the same depth; the wordmark never reaches that far down, so the mask simply stops there.
CHURCH_REGION = (0.34, 0.0, 0.625, 0.6)
# A point on the Trumpeter tower; the mask keeps only what is connected to it.
TOWER_SEED = (0.5, 0.45)
# Pixels the guided filter may move the edge by; deeper inside the silhouette the mask is always opaque.
EDGE_BAND = 6
# Where the soft edge is cut (0.5 = in the middle). Higher eats further into the silhouette.
EDGE_CUT = 0.68


def estimate_depth(image: Image.Image) -> np.ndarray:
    import torch
    from transformers import pipeline

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    estimator = pipeline("depth-estimation", model=DEPTH_MODEL, device=device)
    predicted = estimator(image)["predicted_depth"]
    while predicted.dim() < 4:
        predicted = predicted[None]
    resized = torch.nn.functional.interpolate(
        predicted.float(), size=(image.height, image.width), mode="bicubic", align_corners=False
    )
    return resized[0, 0].cpu().numpy()


def connected_to(mask: np.ndarray, seed: tuple[int, int]) -> np.ndarray:
    """Flood fill from seed (x, y) over True pixels, 4-connected."""
    h, w = mask.shape
    keep = np.zeros_like(mask)
    stack = [seed]
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or keep[y, x] or not mask[y, x]:
            continue
        keep[y, x] = True
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return keep


def box(a: np.ndarray, r: int) -> np.ndarray:
    """Mean over a (2r+1)² window, edges clamped. Works on 2-D and channel-last 3-D arrays."""
    pad = [(r + 1, r), (r + 1, r)] + [(0, 0)] * (a.ndim - 2)
    s = np.pad(a, pad, mode="edge").cumsum(0).cumsum(1)
    n = 2 * r + 1
    return (s[n:, n:] - s[:-n, n:] - s[n:, :-n] + s[:-n, :-n]) / (n * n)


def guided_filter(guide: np.ndarray, src: np.ndarray, r: int, eps: float) -> np.ndarray:
    """
    Colour guided filter (He, Sun, Tang 2010). Snaps the soft depth edge onto the real edge of the photo, which the
    depth model only knows to a few pixels.
    """
    mean_i = box(guide, r)
    mean_p = box(src, r)
    cov_ip = box(guide * src[..., None], r) - mean_i * mean_p[..., None]
    var = box(guide[..., :, None] * guide[..., None, :], r) - mean_i[..., :, None] * mean_i[..., None, :]
    a = np.linalg.solve(var + eps * np.eye(3), cov_ip[..., None])[..., 0]
    b = mean_p - (a * mean_i).sum(-1)
    return (box(a, r) * guide).sum(-1) + box(b, r)


def church_mask(image: Image.Image) -> np.ndarray:
    depth = estimate_depth(image)
    h, w = depth.shape

    left, top, right, bottom = CHURCH_REGION
    region = np.zeros((h, w), dtype=bool)
    region[int(top * h) : int(bottom * h), int(left * w) : int(right * w)] = True

    seed = (int(TOWER_SEED[0] * w), int(TOWER_SEED[1] * h))
    coarse = connected_to((depth > CHURCH_DEPTH) & region, seed).astype(np.float32)

    guide = np.asarray(image, dtype=np.float32) / 255.0
    # Two passes: a wide one pulls the edge onto the silhouette, a narrow one sharpens it.
    alpha = guided_filter(guide, coarse, r=8, eps=1e-3)
    alpha = np.clip((alpha - 0.5) * 2.5 + 0.5, 0.0, 1.0)
    alpha = guided_filter(guide, alpha, r=2, eps=1e-4)
    # Centred above 0.5 on purpose: the guided filter keeps a bright halo of sky on the edge pixels, and the letters
    # are white, so any halo shows. Cutting a pixel deep removes it.
    alpha = np.clip((alpha - EDGE_CUT) * 1.8 + 0.5, 0.0, 1.0)

    # The filter only knows colour, so pale stone and lit windows inside the walls come out as pinholes the letters
    # would shine through. Only the edge band is the filter's to decide; the inside of the silhouette is solid.
    inside = box(coarse, EDGE_BAND) > 0.999
    alpha = np.maximum(alpha, inside)

    # Nothing outside the church region, and a soft lower edge where the mask stops.
    alpha *= region
    fade_rows = int(0.04 * h)
    end = int(bottom * h)
    alpha[end - fade_rows : end] *= np.linspace(1.0, 0.0, fade_rows, dtype=np.float32)[:, None]
    return alpha


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", nargs="?", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--preview", type=Path, help="also write the church over a white backdrop, for review")
    args = parser.parse_args()

    image = Image.open(args.source).convert("RGB")
    alpha = church_mask(image)
    alpha_8 = Image.fromarray((alpha * 255.0 + 0.5).astype(np.uint8), mode="L")

    # Only the alpha channel drives the CSS mask; the luminance is a flat zero so the PNG compresses to almost nothing.
    mask = Image.merge("LA", (Image.new("L", image.size, 0), alpha_8))
    mask.save(OUT, optimize=True)
    print(f"{OUT.relative_to(FRONTEND)}: {OUT.stat().st_size / 1024:.1f} KB")

    if args.preview:
        # White, like the wordmark: a halo of sky on the edge would show here.
        backdrop = Image.new("RGB", image.size, (255, 255, 255))
        Image.composite(image, backdrop, alpha_8).save(args.preview)


if __name__ == "__main__":
    main()
