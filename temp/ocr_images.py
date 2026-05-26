# -*- coding: utf-8 -*-
'''OCR images to extract text content'''
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
import os

def ocr_image(img_path, name):
    print(f'\n=== {name} OCR结果 ===')
    
    img = Image.open(img_path)
    print(f'图片尺寸: {img.size}')
    
    # Scale up for better OCR
    w, h = img.size
    img = img.resize((w * 3, h * 3), Image.LANCZOS)
    
    # Convert to grayscale
    img = img.convert('L')
    
    # Increase contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    
    # Sharpen
    img = img.filter(ImageFilter.SHARPEN)
    
    # OCR
    text = pytesseract.image_to_string(img, lang='chi_sim+eng')
    
    # Also get detailed data with bounding boxes
    data = pytesseract.image_to_data(img, lang='chi_sim+eng', output_type=pytesseract.Output.DICT)
    
    print(text)
    
    # Print structured data (group by block/line)
    print(f'\n--- {name} 结构化数据 ---')
    prev_block = -1
    prev_line = -1
    for i in range(len(data['text'])):
        if data['text'][i].strip():
            block = data['block_num'][i]
            line = data['line_num'][i]
            if block != prev_block:
                print(f'\n[Block {block}]')
                prev_block = block
                prev_line = -1
            if line != prev_line:
                print(f'  Line {line}: ', end='')
                prev_line = line
            print(data['text'][i], end=' ')
    print()

# OCR all images
temp_dir = r'C:\Users\Administrator\AppData\Local\Temp'
targets = ['WEB端', '客户端', 'image.a1fc5f7a94.png', 'image.3bfbcf5172.png']

for target in targets:
    found = False
    for f in os.listdir(temp_dir):
        if (target.endswith('.png') and f == target) or (not target.endswith('.png') and target in f and f.endswith('.png')):
            full_path = os.path.join(temp_dir, f)
            ocr_image(full_path, f)
            found = True
            break
    if not found:
        print(f'未找到: {target}')
