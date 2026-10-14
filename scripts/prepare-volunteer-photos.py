"""Prepare user-supplied volunteer photos for the public gallery.

Usage: python scripts/prepare-volunteer-photos.py SOURCE_DIRECTORY OUTPUT_DIRECTORY
"""

from pathlib import Path
import sys

from PIL import Image, ImageOps


FILES = {
    "turma-em-atividade": "a3b763c5-a3ca-445b-8e66-877c75932f20.jfif",
    "sala-de-informatica": "WhatsApp Image 2026-10-14 at 02.40.29 (1).jpeg",
    "projecao-em-aula": "WhatsApp Image 2026-10-14 at 03.09.45 (1).jpeg",
    "material-aula-1": "WhatsApp Image 2026-10-14 at 03.09.45.jpeg",
    "notebooks-organizados": "WhatsApp Image 2026-10-14 at 03.09.44.jpeg",
    "atividade-no-quadro": "WhatsApp Image 2026-10-14 at 02.40.29.jpeg",
    "grupo-da-turma": "WhatsApp Image 2026-10-14 at 02.40.28.jpeg",
}


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    source, output = map(Path, sys.argv[1:])
    output.mkdir(parents=True, exist_ok=True)
    for stem, filename in FILES.items():
        with Image.open(source / filename) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            for suffix, max_width in (("", 1600), ("-thumb", 540)):
                target = image.copy()
                target.thumbnail((max_width, 1800), Image.Resampling.LANCZOS)
                path = output / f"{stem}{suffix}.webp"
                target.save(path, "WEBP", quality=82, method=6)
                print(path.name, target.size, path.stat().st_size)


if __name__ == "__main__":
    main()
