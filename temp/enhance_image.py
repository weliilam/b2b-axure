from PIL import Image, ImageEnhance, ImageFilter
import subprocess

img_path = r'C:\Users\Administrator\AppData\Local\Temp\image.8d374d697a.png'
output_path = r'C:\Users\Administrator\AppData\Local\Temp\image_enhanced.png'

img = Image.open(img_path)
# Scale up 3x for better OCR
w, h = img.size
img = img.resize((w * 3, h * 3), Image.LANCZOS)
# Convert to grayscale
img = img.convert('L')
# Increase contrast
enhancer = ImageEnhance.Contrast(img)
img = enhancer.enhance(2.0)
# Sharpen
img = img.filter(ImageFilter.SHARPEN)
img.save(output_path)
print(f'Saved enhanced image: {output_path} ({img.size[0]}x{img.size[1]})')
print('Done')
