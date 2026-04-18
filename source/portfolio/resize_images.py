import os
import sys
from pathlib import Path
from PIL import Image

def process_images():
    base_dir = Path(__file__).parent
    
    extensions = {'.jpg', '.jpeg', '.png'}
    
    all_images = []
    for ext in extensions:
        all_images.extend(base_dir.rglob(f'*{ext}'))
        all_images.extend(base_dir.rglob(f'*{ext.upper()}'))
    
    for img_path in all_images:
        try:
            with Image.open(img_path) as img:
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    if img.mode in ('RGBA', 'LA'):
                        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                        img = background
                    else:
                        img = img.convert('RGB')
                
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                width, height = img.size
                long_side = max(width, height)
                target_long = 2000
                
                if long_side != target_long:
                    scale = target_long / long_side
                    new_width = int(width * scale)
                    new_height = int(height * scale)
                    img = img.resize((new_width, new_height), Image.LANCZOS)
                
                new_path = img_path.with_suffix('.jpg')
                if new_path != img_path:
                    if new_path.exists():
                        new_path = img_path.with_name(f'{img_path.stem}_converted.jpg')
                    img.save(new_path, 'JPEG', quality=80)
                    img_path.unlink()
                else:
                    img.save(new_path, 'JPEG', quality=80)
                    
                print(f'Processed: {new_path}')
                
        except Exception as e:
            print(f'Error processing {img_path}: {e}')
    
    print('Done!')

if __name__ == '__main__':
    process_images()