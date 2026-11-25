# Upload verification

## Automated checks

Run `npm test`. Upload tests exercise the format allowlist, basic signature checks, spoofed video rejection, oversized and empty input, cross-origin rejection, TXT import through the existing learning engine, and mocked provider requests for all nine non-TXT extensions. They do not prove live model compatibility or transcription quality. Some signature fixtures are intentionally minimal; live acceptance requires real files.

## Manual acceptance checklist (requires installed dependencies and a configured AI provider)

1. Run `npm ci`, `npm run typecheck`, `npm run build`, and `npm run dev`. Keep the site private. Set server-only `OPENAI_API_KEY` and a Responses-compatible multimodal `OPENAI_MODEL` or `OPENAI_EXTRACTION_MODEL`.
2. Choose one real file of each of JPG, JPEG, PNG, WEBP, PDF, PPT, PPTX, DOC, DOCX, and TXT (including a Myanmar lesson). Verify names, sizes, thumbnails/preview links, removal, same-file reselection, and keyboard access. Office previews require a local viewer.
3. Import real files individually, compare the editable extracted text against the originals, and create guides using both modes. Check notes, practice, evidence search, and Markdown export. Include a scanned PDF or image with visible text, but do not assume OCR accuracy.
4. Drop MP4, MOV, WEBM, GIF, and ZIP files; verify clear rejection. Rename a video to JPG or TXT and verify it cannot be imported. Try empty, corrupt, oversized, and wrong-container files; check clear errors and no change to the previous lesson.
5. Try 6 files, a >10 MiB selection, and a >12,000-character combined lesson. Confirm no silent truncation. Test failed provider requests, timeouts, missing credentials, and removing a failing file.
6. Verify layout and controls on mobile and desktop, and confirm pasted lessons still work without AI. In source mode, TXT import works without an AI key; non-TXT extraction requires one.
