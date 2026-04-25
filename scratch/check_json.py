import json
import sys

def check_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            json.load(f)
        print(f"{file_path}: OK")
    except Exception as e:
        print(f"{file_path}: {e}")

if __name__ == "__main__":
    check_json(sys.argv[1])
