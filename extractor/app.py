"""Private, stateless text extraction service for Sarmate."""
import os
import pathlib
import subprocess
import tempfile
from urllib.parse import unquote

from fastapi import FastAPI, Header, HTTPException, Request

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
FORMATS = {".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx", ".ppt", ".pptx"}
MAX_BYTES = 5 * 1024 * 1024
MAX_PAGES = 20
MAX_TEXT = 12_000


def run(*args: str, timeout: int = 45) -> str:
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(422, "Extraction timed out. Try a smaller file.") from exc
    if result.returncode:
        raise HTTPException(422, "This file could not be read or is corrupt.")
    return result.stdout


def ocr(path: pathlib.Path) -> str:
    return run("tesseract", str(path), "stdout", "-l", "eng+mya", timeout=45)


def pdf_text(path: pathlib.Path, work: pathlib.Path) -> str:
    info = run("pdfinfo", str(path))
    page_line = next((line for line in info.splitlines() if line.startswith("Pages:")), "")
    try:
        pages = int(page_line.split(":", 1)[1].strip())
    except (ValueError, IndexError) as exc:
        raise HTTPException(422, "This PDF has no readable pages.") from exc
    if pages < 1 or pages > MAX_PAGES:
        raise HTTPException(422, "Use a document with 1 to 20 pages.")
    text = run("pdftotext", "-layout", str(path), "-")
    if text.strip():
        return text
    prefix = work / "page"
    run("pdftoppm", "-f", "1", "-l", str(MAX_PAGES), "-scale-to", "1600",
        "-png", str(path), str(prefix), timeout=45)
    images = sorted(work.glob("page-*.png"))
    if not images:
        raise HTTPException(422, "No readable pages were found.")
    return "\n\n".join(ocr(image) for image in images)


def extract(data: bytes, filename: str) -> str:
    ext = pathlib.Path(filename).suffix.lower()
    if ext not in FORMATS:
        raise HTTPException(415, "Unsupported file format.")
    if not data or len(data) > MAX_BYTES:
        raise HTTPException(413, "File must be between 1 byte and 5 MB.")
    with tempfile.TemporaryDirectory(prefix="sarmate-") as folder:
        work = pathlib.Path(folder)
        source = work / ("source" + ext)
        source.write_bytes(data)
        if ext in {".jpg", ".jpeg", ".png", ".webp"}:
            text = ocr(source)
        else:
            document = source
            if ext != ".pdf":
                run("soffice", "-env:UserInstallation=file://" + str(work / "profile"),
                    "--headless", "--convert-to", "pdf", "--outdir", str(work), str(source))
                document = work / "source.pdf"
                if not document.exists():
                    raise HTTPException(422, "This Office document could not be converted.")
            text = pdf_text(document, work)
    text = text.strip()
    if not text:
        raise HTTPException(422, "No readable lesson text was found.")
    if len(text) > MAX_TEXT:
        raise HTTPException(422, "This file contains more than 12,000 characters. Split it into smaller lessons.")
    return text


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/extract")
async def extract_route(request: Request, x_file_name: str = Header(""),
                        authorization: str = Header("")) -> dict[str, str]:
    token = os.environ.get("EXTRACTOR_TOKEN")
    if not token or authorization != "Bearer " + token:
        raise HTTPException(401, "Unauthorized.")
    filename = unquote(x_file_name)
    if not filename or pathlib.Path(filename).name != filename:
        raise HTTPException(400, "Invalid file name.")
    chunks = []
    size = 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > MAX_BYTES:
            raise HTTPException(413, "The file exceeds the 5 MB limit.")
        chunks.append(chunk)
    body = b"".join(chunks)
    return {"text": extract(body, filename)}
