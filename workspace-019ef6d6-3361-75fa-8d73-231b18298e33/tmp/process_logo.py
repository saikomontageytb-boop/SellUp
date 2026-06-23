"""
Process the SU logo:
- Crop to actual logo bounds (remove black padding)
- Create transparent version (white logo on transparent)
- Create dark version (black logo on transparent) for light themes
- Generate favicon sizes
"""
from PIL import Image
import os

SRC = '/home/user/uploads/Max_a_Fais_un_logo_simple_.png'
OUT_DIR = '/home/user/SellUp/sellup-premium-landing-page/public/logo'
os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SRC).convert('RGB')
w, h = img.size
print(f'Source: {w}x{h}')

# Step 1: detect bounding box of non-black pixels
px = img.load()
threshold = 50  # pixels below this brightness are considered "black bg"
min_x, min_y, max_x, max_y = w, h, 0, 0
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        if r > threshold or g > threshold or b > threshold:
            if x < min_x: min_x = x
            if y < min_y: min_y = y
            if x > max_x: max_x = x
            if y > max_y: max_y = y

print(f'Bounds: ({min_x},{min_y}) -> ({max_x},{max_y})')

# Add small padding (5% on each side)
logo_w = max_x - min_x
logo_h = max_y - min_y
pad = int(max(logo_w, logo_h) * 0.08)
crop_x1 = max(0, min_x - pad)
crop_y1 = max(0, min_y - pad)
crop_x2 = min(w, max_x + pad)
crop_y2 = min(h, max_y + pad)

# Make square crop
cw = crop_x2 - crop_x1
ch = crop_y2 - crop_y1
if cw != ch:
    diff = abs(cw - ch) // 2
    if cw > ch:
        crop_y1 -= diff
        crop_y2 += diff
    else:
        crop_x1 -= diff
        crop_x2 += diff

cropped = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
print(f'Cropped: {cropped.size}')

# Save the cropped black-bg version (logo on black)
cropped.save(os.path.join(OUT_DIR, 'logo-black.png'), 'PNG', optimize=True)

# Create transparent version: black bg -> transparent, white logo stays
img_rgba = cropped.convert('RGBA')
data = img_rgba.getdata()
new_data = []
for r, g, b, a in data:
    # Black-ish pixel -> transparent
    brightness = max(r, g, b)
    if brightness < 30:
        new_data.append((255, 255, 255, 0))
    else:
        # Keep as white with alpha based on brightness
        alpha = min(255, brightness * 2)
        new_data.append((255, 255, 255, alpha))
img_rgba.putdata(new_data)
img_rgba.save(os.path.join(OUT_DIR, 'logo-white.png'), 'PNG', optimize=True)
print(f'logo-white.png: {img_rgba.size}')

# Create black version (for light backgrounds)
img_rgba_b = cropped.convert('RGBA')
data = img_rgba_b.getdata()
new_data = []
for r, g, b, a in data:
    brightness = max(r, g, b)
    if brightness < 30:
        new_data.append((0, 0, 0, 0))
    else:
        alpha = min(255, brightness * 2)
        new_data.append((0, 0, 0, alpha))
img_rgba_b.putdata(new_data)
img_rgba_b.save(os.path.join(OUT_DIR, 'logo-black-tr.png'), 'PNG', optimize=True)

# Generate sized versions: 512, 256, 192, 128, 64, 32
for size in [512, 256, 192, 128, 64, 32]:
    resized = img_rgba.resize((size, size), Image.LANCZOS)
    resized.save(os.path.join(OUT_DIR, f'logo-{size}.png'), 'PNG', optimize=True)
    print(f'logo-{size}.png saved')

# Favicon (multi-size ICO)
favicon = img_rgba.resize((64, 64), Image.LANCZOS)
favicon.save(os.path.join(OUT_DIR, '..', 'favicon.ico'), format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64)])
print('favicon.ico saved')

# OG image (1200x630) - logo centered on black with text
og = Image.new('RGB', (1200, 630), (8, 8, 12))
logo_for_og = cropped.resize((300, 300), Image.LANCZOS).convert('RGBA')
og.paste(logo_for_og, (180, 165), logo_for_og if logo_for_og.mode == 'RGBA' else None)
og.save(os.path.join(OUT_DIR, '..', 'og-image.png'), 'PNG', optimize=True)
print('og-image.png saved')

print('\n✅ All logo assets generated')
