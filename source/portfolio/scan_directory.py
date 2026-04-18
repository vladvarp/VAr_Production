import os
import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
OUTPUT_JS = SCRIPT_DIR / "data.js"

def scan_directory(root_path):
    children = []
    
    try:
        items = sorted(root_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
    except PermissionError:
        return children
    
    for item in items:
        if item.name.startswith('.') or item.suffix == '.py' or item.name == 'data.js':
            continue
        
        if item.is_dir():
            children.append({
                "first_name": "",
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
    
    js_content = "const portfolioData = " + json.dumps(tree, ensure_ascii=False, indent=2) + ";\n"
    with open(OUTPUT_JS, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Data saved to {OUTPUT_JS}")

if __name__ == "__main__":
    main()