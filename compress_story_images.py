from PIL import Image
import os
import sys

# UTF-8 출력 설정 (Windows)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def compress_story_images(source_dir, output_dir, max_width=400):
    """
    지정된 디렉터리의 모든 이미지를 웹에 최적화된 크기로 압축합니다.
    결과는 하위 디렉터리에 저장됩니다.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"'{output_dir}' 디렉터리를 생성했습니다.")

    image_files = [f for f in os.listdir(source_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    if not image_files:
        print(f"'{source_dir}' 디렉터리에서 이미지를 찾을 수 없습니다.")
        return

    print(f"총 {len(image_files)}개의 이미지를 압축합니다...")

    for filename in image_files:
        input_path = os.path.join(source_dir, filename)
        output_path = os.path.join(output_dir, filename)

        # Skip directories
        if os.path.isdir(input_path):
            continue

        try:
            with Image.open(input_path) as img:
                if img.width <= max_width:
                    print(f"- '{filename}'은 이미 충분히 작아 건너뜁니다 (너비: {img.width}px).")
                    # Still save it to the compressed folder to have all images in one place
                    img.save(output_path)
                    continue

                aspect_ratio = img.height / img.width
                new_width = max_width
                new_height = int(new_width * aspect_ratio)

                img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                # Convert RGBA to RGB for JPEG saving
                if img_resized.mode == 'RGBA' and output_path.lower().endswith(('.jpg', '.jpeg')):
                    img_resized = img_resized.convert('RGB')

                if output_path.lower().endswith('.png'):
                    img_resized.save(output_path, 'PNG', optimize=True)
                else:
                    img_resized.save(output_path, 'JPEG', quality=85)

                original_size = os.path.getsize(input_path)
                compressed_size = os.path.getsize(output_path)
                reduction_percent = (1 - compressed_size / original_size) * 100

                print(f"+ '{filename}' 압축 완료 (너비: {new_width}px). "
                      f"크기: {original_size/1024:.1f}KB -> {compressed_size/1024:.1f}KB "
                      f"({reduction_percent:.1f}% 감소)")

        except Exception as e:
            print(f"오류: '{filename}' 처리 중 문제 발생 - {e}")

    print("\n모든 이미지 처리가 완료되었습니다.")

if __name__ == "__main__":
    source_directory = "image"
    output_directory = os.path.join(source_directory, "compressed")
    compress_story_images(source_directory, output_directory)
