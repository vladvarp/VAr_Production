import os
import json
from pathlib import Path

def get_file_type(filename):
    ext = Path(filename).suffix.lower()
    if ext in ['.txt']:
        return "text"
    elif ext in ['.jpg', '.jpeg', '.png']:
        return "image"
    else:
        return "file"

def scan_directory(root_path, output_file):
    def build_tree(dir_path, is_root=False):
        tree = {
            "name": Path(dir_path).name,
            "type": "directory",
            "children": []
        }
        try:
            entries = sorted(os.listdir(dir_path), key=lambda x: (not os.path.isdir(os.path.join(dir_path, x)), x.lower()))
            for entry in entries:
                if entry.startswith('.'):
                    continue
                full_path = os.path.join(dir_path, entry)
                if os.path.isdir(full_path):
                    if entry.lower() != "core":
                        tree["children"].append(build_tree(full_path, False))
                elif not is_root:
                    tree["children"].append({
                        "name": entry,
                        "type": get_file_type(entry)
                    })
        except PermissionError:
            tree["error"] = "Permission denied"
        return tree

    root_path = os.path.abspath(root_path)
    tree = {"tree": build_tree(root_path, True)}

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(tree, f, ensure_ascii=False, indent=2)

    print(f"Сканирование завершено. Результат сохранен в: {output_file}")

if __name__ == "__main__":
    root = os.getcwd()
    output = os.path.join(root, "directory_structure.json")
    scan_directory(root, output)
