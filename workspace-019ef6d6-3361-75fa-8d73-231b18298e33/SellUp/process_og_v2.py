"""Better OG image: SU logo + 'SellUp' text + tagline + glow"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

CROPPED = '/home/user/SellUp/sellup-premium-landing-page/public/logo/logo-black.png'
OUT = '/home/user/SellUp/sellup-premium-landing-page/public/og-image.png'

W, H = 1200, 630
bg = Image.new('RGB', (W, H), (8, 8, 12))

# Add subtle gradient / glow on the right
glow = Image.new('RGBA', (W, H), (0,0,0,0))
gd = ImageDraw.Draw(glow)
# Big purple glow on left
gd.ellipse((-200, 100, 600, 700), fill=(124, 58, 237, 100))
# Smaller indigo glow on right
gd.ellipse((700, 50, 1300, 600), fill=(99, 102, 241, 60))
glow = glow.filter(ImageFilter.GaussianBlur(100))
bg.paste(glow, (0,0), glow)

# Logo on left
src = Image.open(CROPPED).convert('RGB')
# Convert black bg to make logo white-on-transparent
logo = src.convert('RGBA')
data = logo.getdata()
new = []
for r, g, b, a in data:
    if max(r, g, b) < 30:
        new.append((255, 255, 255, 0))
    else:
        new.append((255, 255, 255, min(255, max(r, g, b) * 2)))
logo.putdata(new)
logo = logo.resize((240, 240), Image.LANCZOS)
bg.paste(logo, (130, 195), logo)

# Try to load a font, fallback to default
font_path = None
for p in [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
]:
    if os.path.exists(p):
        font_path = p
        break

d = ImageDraw.Draw(bg)
if font_path:
    title_font = ImageFont.truetype(font_path, 88)
    sub_font = ImageFont.truetype(font_path, 32)
    small_font = ImageFont.truetype(font_path, 22)
else:
    title_font = ImageFont.load_default()
    sub_font = ImageFont.load_default()
    small_font = ImageFont.load_default()

# SellUp title
d.text((430, 200), 'SellUp', font=title_font, fill=(255, 255, 255))

# Tagline
d.text((432, 310), 'Vendez vos produits numériques.', font=sub_font, fill=(255, 255, 255, 220))
d.text((432, 355), 'Sans limite. Sans friction.', font=sub_font, fill=(160, 130, 250))

# Bottom badge
d.rounded_rectangle((432, 430, 850, 480), radius=24, fill=(124, 58, 237, 80), outline=(124, 58, 237), width=2)
d.text((460, 442), '🚀 Lancez votre boutique en 30 secondes', font=small_font, fill=(255, 255, 255))

# bottom right URL
d.text((850, 580), 'sellup-1ry.pages.dev', font=small_font, fill=(150, 150, 170))

bg.save(OUT, 'PNG', optimize=True)
print(f'OG image saved: {OUT}')
