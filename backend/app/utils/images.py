import uuid
from pathlib import Path

from PIL import Image

from app.config import settings


def save_image(file_bytes: bytes, subdir: str, max_size: tuple[int, int]) -> str:
    """Save and optimize an image. Returns the relative path."""
    directory = Path(settings.upload_dir) / subdir
    directory.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}.webp"
    filepath = directory / filename

    img = Image.open(__import__("io").BytesIO(file_bytes))
    img.thumbnail(max_size, Image.LANCZOS)
    img.save(filepath, "WEBP", quality=85)

    return f"{subdir}/{filename}"


def delete_image(relative_path: str):
    filepath = Path(settings.upload_dir) / relative_path
    filepath.unlink(missing_ok=True)
