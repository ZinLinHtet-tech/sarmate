# Free extraction service

The Cloudflare upload route validates files, then sends non-TXT bytes to this private Linux service. It uses Tesseract OCR (English and Myanmar), Poppler, and LibreOffice. There is no paid API fallback. OCR and office conversion can be imperfect; users review extracted text before study guide generation.

Build the Docker image from this directory and run it with a long random `EXTRACTOR_TOKEN` environment variable. Expose port 8080 only to the Sarmate worker where possible. Configure the worker's server-only `EXTRACTOR_URL` (the service origin) and the same `EXTRACTOR_TOKEN`. Use HTTPS for a public network path. Do not commit the token. `GET /health` is a health check. `POST /extract` requires a bearer token and an encoded `X-File-Name` header.

The service accepts up to 5 MiB and at most 20 PDF pages or converted Office slides/pages. Files live only in a temporary directory for the request. Conversion and OCR have time limits. Hosting the service may incur charges even though extraction uses no paid API.

Local run, when Docker is available:

```sh
docker build -t sarmate-extractor .
docker run --rm -p 8080:8080 -e EXTRACTOR_TOKEN=choose-a-long-secret sarmate-extractor
```

Set `EXTRACTOR_URL=http://127.0.0.1:8080` and matching `EXTRACTOR_TOKEN` in the app's ignored `.dev.vars` for local development.
