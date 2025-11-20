import os
import json
import re
import sys

# UTF-8 output for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def generate_stories_js():
    stories = []
    
    # List all txt files
    files = [f for f in os.listdir('.') if f.endswith('.txt')]
    
    # Sort files numerically based on the number at the start of the filename
    def get_file_number(filename):
        match = re.match(r'(\d+)', filename)
        return int(match.group(1)) if match else 999
        
    files.sort(key=get_file_number)
    
    print(f"Found {len(files)} text files.")

    for filename in files:
        try:
            # Parse ID and Author from filename (e.g., "1.곽민서.txt")
            match = re.match(r'(\d+)\.(.+)\.txt', filename)
            if not match:
                print(f"Skipping {filename}: Invalid format")
                continue
                
            story_id = int(match.group(1))
            author = match.group(2)
            
            # Read content
            with open(filename, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract title from content (first line usually "제목 : ...")
            title_match = re.search(r'제목\s*[:]\s*(.+)', content)
            title = title_match.group(1).strip() if title_match else "무제"
            
            # Determine image path
            # Check for jpeg, jpg, png in image/compressed/
            image_path = ""
            base_name = f"{story_id}.{author}"
            
            # Possible extensions
            extensions = ['.jpeg', '.jpg', '.png']
            
            # Check in compressed folder first (preferred)
            found = False
            for ext in extensions:
                img_name = base_name + ext
                if os.path.exists(os.path.join('image', 'compressed', img_name)):
                    image_path = f"image/compressed/{img_name}"
                    found = True
                    break
            
            # If not in compressed, check in image folder
            if not found:
                 for ext in extensions:
                    img_name = base_name + ext
                    if os.path.exists(os.path.join('image', img_name)):
                        image_path = f"image/{img_name}"
                        found = True
                        break
            
            # Fallback for special cases (e.g. spaces in filename)
            if not found:
                 # Try with spaces if original didn't have them, or vice versa?
                 # Actually, let's just try to find any file starting with the ID in the image folder
                 for folder in ['image/compressed', 'image']:
                    if os.path.exists(folder):
                        for img_file in os.listdir(folder):
                            if img_file.startswith(f"{story_id}."):
                                image_path = f"{folder}/{img_file}"
                                found = True
                                break
                    if found: break

            if not found:
                print(f"Warning: No image found for {filename}")
                image_path = "image/placeholder.png" # Fallback

            story = {
                "id": story_id,
                "title": title,
                "author": author,
                "image": image_path,
                "content": content
            }
            stories.append(story)
            print(f"Processed: {filename} -> {title} ({author})")
            
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    # Generate JS content
    js_content = f"const stories = {json.dumps(stories, indent=4, ensure_ascii=False)};"
    
    with open('stories.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"\nSuccessfully generated stories.js with {len(stories)} stories.")

if __name__ == "__main__":
    generate_stories_js()
