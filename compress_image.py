#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
이미지 압축 스크립트
표지 이미지를 1/4 크기로 압축하여 로딩 속도 개선
"""

from PIL import Image
import os
import sys

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def compress_image(input_path, output_path, scale=0.5, quality=85):
    """
    이미지를 압축합니다.

    Args:
        input_path: 입력 이미지 경로
        output_path: 출력 이미지 경로
        scale: 크기 비율 (0.5 = 50% 크기)
        quality: JPEG/PNG 품질 (1-100)
    """
    try:
        # 이미지 열기
        img = Image.open(input_path)
        print(f"원본 크기: {img.size}")
        print(f"원본 모드: {img.mode}")

        # 새 크기 계산
        new_width = int(img.width * scale)
        new_height = int(img.height * scale)

        # 고품질 리샘플링으로 크기 조정
        img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        print(f"압축 후 크기: {img_resized.size}")

        # PNG로 저장 (최적화 옵션 사용)
        img_resized.save(output_path, 'PNG', optimize=True, quality=quality)

        # 파일 크기 비교
        original_size = os.path.getsize(input_path)
        compressed_size = os.path.getsize(output_path)

        print(f"\n원본 파일 크기: {original_size / (1024*1024):.2f} MB")
        print(f"압축 후 파일 크기: {compressed_size / (1024*1024):.2f} MB")
        print(f"압축률: {(1 - compressed_size/original_size) * 100:.1f}%")

        return True

    except Exception as e:
        print(f"오류 발생: {e}")
        return False

if __name__ == "__main__":
    # 현재 디렉토리의 모든 파일 확인
    files = os.listdir('.')
    print("Current files:", files)

    # PNG 파일 찾기
    cover_file = None
    for f in files:
        if 'cover' in f.lower() or '표지' in f:
            if f.endswith('.png'):
                cover_file = f
                break

    if not cover_file:
        # 직접 파일명 사용
        cover_file = "로맨스 전자책 표지.png"

    print(f"\nProcessing: {cover_file}")

    input_file = cover_file
    backup_file = cover_file.replace('.png', '_original.png')
    temp_file = cover_file.replace('.png', '_compressed.png')

    # 원본 백업
    if os.path.exists(input_file):
        if not os.path.exists(backup_file):
            import shutil
            shutil.copy2(input_file, backup_file)
            print(f"Backup saved to {backup_file}\n")
        else:
            print(f"Backup already exists\n")

        # 이미지 압축 (50% 크기로 = 1/4 용량)
        print("Compressing image...")
        success = compress_image(input_file, temp_file, scale=0.5, quality=90)

        if success:
            # 압축된 파일을 원래 이름으로 변경
            os.remove(input_file)
            os.rename(temp_file, input_file)
            print(f"\nCompression complete! Loading speed improved.")
            print(f"Original backup: {backup_file}")
        else:
            print("\nCompression failed!")
    else:
        print(f"File not found: {input_file}")
