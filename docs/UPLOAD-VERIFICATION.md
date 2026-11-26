# Upload verification

## Automated checks

`npm test`, `npm run typecheck`, and `npm run build` cover the app. Upload tests cover the allowlist, signatures, rejected videos, size limits, origin checks, native TXT import, and forwarding of all nine binary extensions to the free extractor. The binary tests use a mocked service and do not prove OCR or production connectivity.

## Acceptance checklist

1. Build and start the Docker service in `extractor/` with a secret `EXTRACTOR_TOKEN`. Configure matching server-only `EXTRACTOR_URL` and `EXTRACTOR_TOKEN` for Sarmate.
2. Import real JPG, JPEG, PNG, WEBP, PDF, scanned PDF, DOC, DOCX, PPT, PPTX, English TXT, and Myanmar TXT through the actual app route. Compare extracted text against the originals. Verify generated notes, practice, evidence search, and Markdown export.
3. Reject MP4, MOV, WEBM, GIF, ZIP, corrupt files, empty files, 5 MiB oversize files, more than five files, and selections above 10 MiB. Check clear errors and unchanged lesson text.
4. Check file previews, removal, reselection, keyboard access, and mobile layout. Check pasted text remains usable without the extractor.
5. Deploy the Linux service and configure the production worker. Test at least one real file of every format through the deployed app. Check service health, timeout handling, access control, and resource usage. Keep the site private until quotas and rate limits are in place.

The issue remains open until real app and deployed environment checks pass. Local extraction tools alone do not count as route verification.
