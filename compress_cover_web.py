#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
웹 최적화 이미지 압축 스크립트
모바일에서 선명하면서도 빠른 로딩을 위한 압축
"""

from PIL import Image
import os
import sys

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def compress_for_web(input_path, output_path, max_width=800, quality=85):
    """
    웹용으로 이미지를 최적화합니다.

    Args:
        input_path: 입력 이미지 경로
        output_path: 출력 이미지 경로
        max_width: 최대 너비 (px)
        quality: 품질 (1-100)
    """
    try:
        img = Image.open(input_path)
        print(f"원본 크기: {img.size}")
        print(f"원본 모드: {img.mode}")

        # 비율 유지하며 크기 조정
        aspect_ratio = img.height / img.width
        new_width = max_width
        new_height = int(new_width * aspect_ratio)

        print(f"목표 크기: ({new_width}, {new_height})")

        # 고품질 리샘플링
        img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # PNG로 저장 (optimize 옵션)
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
    # 파일 찾기
    files = os.listdir('.')
    cover_file = None

    for f in files:
        if '표지' in f and f.endswith('.png'):
            if 'backup' not in f and 'original' not in f and 'compressed' not in f:
                cover_file = f
                break

    if not cover_file:
        cover_file = "로맨스 전자책 표지.png"

    print(f"처리 중: {cover_file}\n")

    input_file = cover_file
    backup_file = cover_file.replace('.png', '_2.7MB_backup.png')
    temp_file = cover_file.replace('.png', '_web_optimized.png')

    if os.path.exists(input_file):
        # 현재 파일 백업
        if not os.path.exists(backup_file):
            import shutil
            shutil.copy2(input_file, backup_file)
            print(f"백업 저장: {backup_file}\n")

        # 웹 최적화 압축 (800px 너비)
        print("웹 최적화 압축 중...")
        success = compress_for_web(input_file, temp_file, max_width=800, quality=85)

        if success:
            # 원본 제거 후 압축 파일을 원래 이름으로 변경
            os.remove(input_file)
            os.rename(temp_file, input_file)

            print(f"\n✓ 압축 완료!")
            print(f"✓ 모바일 환경에서 최적화됨 (800px 너비)")
            print(f"✓ 이전 버전 백업: {backup_file}")
        else:
            print("\n✗ 압축 실패!")
    else:
        print(f"파일을 찾을 수 없습니다: {input_file}")
