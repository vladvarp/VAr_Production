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
                original_mode = img.mode
                width, height = img.size
                long_side = max(width, height)
                target_long = 2000
                
                needs_resize = long_side != target_long
                has_transparency = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
                needs_convert = img.mode != 'RGB'
                
                if has_transparency:
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    if img.mode in ('RGBA', 'LA'):
                        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                        img = background
                    else:
                        img = img.convert('RGB')
                elif needs_convert:
                    img = img.convert('RGB')
                
                if needs_resize:
                    scale = target_long / long_side
                    new_width = int(width * scale)
                    new_height = int(height * scale)
                    img = img.resize((new_width, new_height), Image.LANCZOS)
                
                needs_save = needs_resize or has_transparency or needs_convert or img_path.suffix.lower() not in {'.jpg', '.jpeg'}
                
                if needs_save:
                    new_path = img_path.with_suffix('.jpg')
                    if new_path != img_path:
                        if new_path.exists():
                            new_path = img_path.with_name(f'{img_path.stem}_converted.jpg')
                        print(f'Processed: {img_path.name} → {new_path.name} (resize: {needs_resize}, convert: {needs_convert}, transparency: {has_transparency})')
                        img.save(new_path, 'JPEG', quality=80)
                        img_path.unlink()
                    else:
                        print(f'Processed: {img_path.name} (resize: {needs_resize}, convert: {needs_convert}, transparency: {has_transparency})')
                        img.save(new_path, 'JPEG', quality=80)
                else:
                    reasons = []
                    if not needs_resize:
                        reasons.append('size=2000')
                    if not needs_convert:
                        reasons.append('RGB')
                    if not has_transparency:
                        reasons.append('no transparency')
                    if img_path.suffix.lower() in {'.jpg', '.jpeg'}:
                        reasons.append('JPG')
                    print(f'Skipped: {img_path.name} ({", ".join(reasons)})')
                    
        except Exception as e:
            print(f'Error processing {img_path}: {e}')
    
    print('Done!')

if __name__ == '__main__':
    process_images()