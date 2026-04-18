import os
import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
OUTPUT_JS = SCRIPT_DIR / "data.js"

def load_existing_data():
    if not OUTPUT_JS.exists():
        return None
    
    try:
        with open(OUTPUT_JS, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = content.replace('const portfolioData = ', '').replace(';', '').strip()
        start = content.find('{')
        if start == -1:
            return None
        
        data = json.loads(content[start:])
        
        def build_index(items, parent_path=None, index=None):
            if index is None:
                index = {}
            if not items:
                return index
            for item in items:
                if item.get('type') == 'directory':
                    current_path = parent_path + "/" + item['name'] if parent_path else item['name']
                    index[current_path] = item
                    if 'children' in item:
                        build_index(item['children'], current_path, index)
                elif item.get('type') == 'URL':
                    current_path = parent_path + "/" + item['name'] if parent_path else item['name']
                    index[current_path] = item
            return index
        
        return build_index(data.get('children', []))
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def get_url_from_file(file_path):
    if file_path.exists() and file_path.is_file():
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                for line in content.splitlines():
                    if line.startswith('URL='):
                        return line[4:].strip()
        except Exception:
            pass
    return ""

def get_first_name_from_txt_or_url(folder_path, existing_first_name, existing_comment):
    txt_file = folder_path.with_suffix('.txt')
    if txt_file.exists() and txt_file.is_file():
        try:
            with open(txt_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                if lines:
                    first_name = lines[0].strip()
                    comment = ''.join(lines[1:]).strip() if len(lines) > 1 else ""
                    return first_name, comment
        except Exception:
            pass
    return existing_first_name if existing_first_name else "", existing_comment if existing_comment else ""

def scan_directory(root_path, existing_index, parent_path=None):
    children = []
    
    try:
        items = sorted(root_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
    except PermissionError:
        return children
    
    for item in items:
        if item.name.startswith('.') or item.suffix == '.py' or item.name == 'data.js':
            continue
        
        if item.is_dir():
            key = parent_path + "/" + item.name if parent_path else item.name
            existing = existing_index.get(key, {})
            existing_first_name = existing.get("first_name") if existing.get("first_name") is not None else ""
            existing_comment = existing.get("comment") if existing.get("comment") is not None else ""
            first_name, comment = get_first_name_from_txt_or_url(item, existing_first_name, existing_comment)
            
            children.append({
                "position": existing.get("position") if existing.get("position") is not None else "",
                "first_name": first_name,
                "comment": comment,
                "name": item.name,
                "type": "directory",
                "children": scan_directory(item, existing_index, key)
            })
        elif item.suffix == '.url':
            key = parent_path + "/" + item.name if parent_path else item.name
            existing = existing_index.get(key, {})
            existing_first_name = existing.get("first_name") if existing.get("first_name") is not None else ""
            existing_comment = existing.get("comment") if existing.get("comment") is not None else ""
            first_name, comment = get_first_name_from_txt_or_url(item.with_suffix(''), existing_first_name, existing_comment)
            url = get_url_from_file(item)
            
            children.append({
                "position": existing.get("position") if existing.get("position") is not None else "",
                "first_name": first_name,
                "comment": comment,
                "name": item.name,
                "type": "URL",
                "URL": url
            })
        else:
            children.append({
                "name": item.name,
                "type": "file"
            })
    
    return children

def main():
    existing_index = load_existing_data() or {}
    
    tree = {
        "name": SCRIPT_DIR.name,
        "type": "directory",
        "children": scan_directory(SCRIPT_DIR, existing_index)
    }
    
    js_content = "const portfolioData = " + json.dumps(tree, ensure_ascii=False, indent=2) + ";\n"
    with open(OUTPUT_JS, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Data saved to {OUTPUT_JS}")

if __name__ == "__main__":
    main()
