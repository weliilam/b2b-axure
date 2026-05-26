import subprocess
try:
    result = subprocess.run(['where', 'tesseract'], capture_output=True, text=True, shell=True)
    print(f'Tesseract location: {result.stdout.strip() or "Not found"}')
except:
    print('where command failed')

try:
    import easyocr
    print('easyocr available')
except ImportError:
    print('easyocr not available')

try:
    import pytesseract
    print('pytesseract available')
except ImportError:
    print('pytesseract not available')
