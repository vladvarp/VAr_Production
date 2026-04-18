import os
import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
OUTPUT_FILE = SCRIPT_DIR / "structure.json"

def scan_directory(root_path):
    children = []
    
    try:
        items = sorted(root_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
    except PermissionError:
        return children
    
    for item in items:
        if item.name.startswith('.') or item.suffix == '.py' or item.name == 'structure.json':
            continue
        
        if item.is_dir():
            children.append({
                "name": item.name,
                "type": "directory",
                "children": scan_directory(item)
            })
        else:
            children.append({
                "name": item.name,
                "type": "file"
            })
    
    return children

def main():
    tree = {
        "name": SCRIPT_DIR.name,
        "type": "directory",
        "children": scan_directory(SCRIPT_DIR)
    }
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(tree, f, ensure_ascii=False, indent=2)
    
    print(f"Structure saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()