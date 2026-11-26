"""Generate disposable real files for the Linux integration check."""
import pathlib
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from pptx import Presentation
from reportlab.pdfgen import canvas

out = pathlib.Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
phrase = "Binary search divides a sorted list in half."
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 34)
image = Image.new("RGB", (1200, 180), "white")
ImageDraw.Draw(image).text((30, 60), phrase, fill="black", font=font)
for ext in ("jpg", "jpeg", "png", "webp"):
    image.save(out / ("lesson." + ext))
image.save(out / "scan.png")
pdf = canvas.Canvas(str(out / "lesson.pdf"))
pdf.drawString(72, 700, phrase)
pdf.save()
scan = canvas.Canvas(str(out / "scanned.pdf"))
scan.drawImage(str(out / "scan.png"), 40, 650, width=500, height=75)
scan.save()
document = Document()
document.add_paragraph(phrase)
document.save(out / "lesson.docx")
slides = Presentation()
slide = slides.slides.add_slide(slides.slide_layouts[1])
slide.shapes.title.text = "Binary search"
slide.placeholders[1].text = phrase
slides.save(out / "lesson.pptx")
for ext in ("docx", "pptx"):
    source = out / ("lesson." + ext)
    subprocess.run(["soffice", "--headless", "--convert-to",
                    "doc" if ext == "docx" else "ppt", "--outdir", str(out), str(source)],
                   check=True, capture_output=True)
(out / "lesson.txt").write_text(phrase, encoding="utf-8")
(out / "myanmar.txt").write_text("ပညာရေးသည် လူတိုင်းအတွက် အရေးကြီးသည်။", encoding="utf-8")
