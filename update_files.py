import os
import json

DATA_DIR = "data"
OUTPUT_FILE = "file-list.json"

def generate_manifest():
    files = []
    for fname in os.listdir(DATA_DIR):
        if fname.lower().endswith(".csv"):
            files.append({
                "filename": fname,
                "displayName": fname.replace(".csv", "").title()
            })

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(files, f, indent=4)

    print(f"Manifest written to {OUTPUT_FILE} with {len(files)} entries.")

if __name__ == "__main__":
    generate_manifest()
