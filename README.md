# Sarmate / စာမိတ်

A student-team hackathon prototype for source-linked learning. Built with React, TypeScript, Vinext and Cloudflare Workers.

## Run locally

Use Node.js 22.13+ (Node 24 recommended).

```sh
npm install
npm run dev
```

On Windows PowerShell with restricted script execution, use `npm.cmd` instead of `npm`.

```sh
npm test
npm run typecheck
npm run build
```

## Works now

- Paste a short lesson (60–12,000 characters), or import images and documents into the editable lesson field.
- Source mode creates exact excerpts and up to three recall prompts locally.
- Expand original passages, reveal reference answers, search by keyword.
- Export a Markdown guide.
- Responsive layout and keyboard-accessible controls.
- No database, no analytics, no persistent lesson history. Reloading clears state.

## Learning material uploads

Choose or drop up to five files, each no larger than 5 MiB (10 MiB combined per selection). Allowed formats: JPG, JPEG, PNG, WEBP, PDF, PPT, PPTX, DOC, DOCX and TXT. Videos and other formats are rejected. Image thumbnails and local image/PDF/TXT previews are available; Office files show filename, type and size and can be opened in a local Office-compatible viewer before import. Remove any selected file before pressing **Import files**.

Imported text replaces the default sample or is appended to your own lesson. Review it in the editable field, then create a guide using either study mode. The original 12,000-character combined lesson limit still applies. A failed import batch leaves the previous lesson and selected files intact. TXT accepts UTF-8 and BOM-marked UTF-16, does not require an AI key, and is decoded by the app server. Other files use the OpenAI Responses API for extraction, requiring `OPENAI_API_KEY` and a compatible `OPENAI_MODEL` (or optional `OPENAI_EXTRACTION_MODEL` override; select a model that supports image and file inputs). This uses provider quota even if the subsequent guide is generated in source mode. Original files are not saved by the app. Do not upload sensitive information; AI-extracted text may contain mistakes and should be checked before use. Source references identify the imported text, not the original page or slide. The provider may reject corrupt, encrypted, unsupported or unreadable files. The app checks extension, MIME, basic file signatures and Office container markers; this is not full malware scanning. Keep the site private until authenticated quotas and rate limits are implemented.

## Optional AI setup

Configure server-only `OPENAI_API_KEY` and `OPENAI_MODEL` in Sites runtime settings, then redeploy. For local development use an ignored `.dev.vars` file. Never put keys in browser code or commit them.

For agent-assisted OpenAI key provisioning, enable the OpenAI Developers plugin and use its API-key skill. This project does not include a key or assume a free quota. Set a provider spending cap before use. Keep the Site private until request quotas/auth requirements for broader access are implemented.

The server uses OpenAI Chat Completions JSON mode, a 35-second timeout, an input bound and an output token cap. It validates source IDs and exact quotes and rejects malformed results. It does NOT prove semantic support, translation quality or answer correctness. AI mode sends lesson text to OpenAI. `store:false` is set, but this does not promise zero provider retention. Do not upload private student data.

## Verification

`npm test` covers source fidelity, invalid inputs, chunk preservation, evidence retrieval, Myanmar text handling, fabricated references, API errors and mocked model responses. Mocked transport tests are not live-model evaluation. See `docs/HACKATHON.md` for the team schedule, evaluation protocol and honest submission draft.

## Limitations

Source mode is extractive, not generative AI. Keyword retrieval is not semantic or cross-language retrieval. Only the first six passages become source-mode cards; all passages are searchable. Image/document imports use AI transcription (except TXT); check the text against the originals. Office documents provide text only, not embedded diagram/image extraction. No voice, login database or training pipeline. The hosted Site starts private and is not yet judge-accessible. No hackathon submission has been made.

## Attribution

Development is AI-assisted. Framework/tooling originates from the Sites Vinext starter; open-source dependencies retain their own licenses. The example lesson was authored for this project. Confirm competition AI-code and reuse policies before submitting.
