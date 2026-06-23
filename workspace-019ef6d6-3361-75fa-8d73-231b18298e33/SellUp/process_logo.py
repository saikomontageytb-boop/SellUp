from PIL import Image
import os

SRC = '/home/user/uploads/Max_a_Fais_un_logo_simple_.png'
OUT_DIR = '/home/user/SellUp/sellup-premium-landing-page/public/logo'
os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SRC).convert('RGB')
w, h = img.size
print(f'Source: {w}x{h}')

# Bounding box of non-black pixels
px = img.load()
threshold = 50
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

pad = int(max(max_x - min_x, max_y - min_y) * 0.08)
crop_x1 = max(0, min_x - pad)
crop_y1 = max(0, min_y - pad)
crop_x2 = min(w, max_x + pad)
crop_y2 = min(h, max_y + pad)

cw = crop_x2 - crop_x1
ch = crop_y2 - crop_y1
if cw != ch:
    diff = abs(cw - ch) // 2
    if cw > ch:
        crop_y1 = max(0, crop_y1 - diff)
        crop_y2 = min(h, crop_y2 + diff)
    else:
        crop_x1 = max(0, crop_x1 - diff)
        crop_x2 = min(w, crop_x2 + diff)

cropped = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
print(f'Cropped: {cropped.size}')

cropped.save(os.path.join(OUT_DIR, 'logo-black.png'), 'PNG', optimize=True)

# Transparent white version
img_rgba = cropped.convert('RGBA')
data = img_rgba.getdata()
new_data = []
for r, g, b, a in data:
    brightness = max(r, g, b)
    if brightness < 30:
        new_data.append((255, 255, 255, 0))
    else:
        alpha = min(255, brightness * 2)
        new_data.append((255, 255, 255, alpha))
img_rgba.putdata(new_data)
img_rgba.save(os.path.join(OUT_DIR, 'logo-white.png'), 'PNG', optimize=True)

# Sized versions
for size in [512, 256, 192, 128, 64, 32]:
    resized = img_rgba.resize((size, size), Image.LANCZOS)
    resized.save(os.path.join(OUT_DIR, f'logo-{size}.png'), 'PNG', optimize=True)

# Favicon
favicon = img_rgba.resize((64, 64), Image.LANCZOS)
favicon.save(os.path.join(OUT_DIR, '..', 'favicon.ico'), format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64)])

# OG image 1200x630 black bg + centered logo with violet glow
from PIL import ImageDraw, ImageFilter
og = Image.new('RGB', (1200, 630), (8, 8, 12))
# Add purple glow
glow = Image.new('RGBA', (1200, 630), (0,0,0,0))
gd = ImageDraw.Draw(glow)
gd.ellipse((400, 100, 800, 530), fill=(124, 58, 237, 80))
glow = glow.filter(ImageFilter.GaussianBlur(80))
og.paste(glow, (0,0), glow)

logo_for_og = cropped.resize((280, 280), Image.LANCZOS).convert('RGBA')
# convert black-bg logo to white-on-transparent for og
data2 = logo_for_og.getdata()
new_data2 = []
for r, g, b, a in data2:
    brightness = max(r, g, b)
    if brightness < 30:
        new_data2.append((255, 255, 255, 0))
    else:
        new_data2.append((255, 255, 255, min(255, brightness * 2)))
logo_for_og.putdata(new_data2)
og.paste(logo_for_og, (460, 175), logo_for_og)

og.save(os.path.join(OUT_DIR, '..', 'og-image.png'), 'PNG', optimize=True)

print('All logo assets generated')
print(os.listdir(OUT_DIR))
