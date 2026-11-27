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
- A hideable, animated pixel-cat companion reacts to study activity and offers a local three-attempt practice nudge with hints and source-linked explanations (`docs/PET-COMPANION.md`).
- No database, no analytics, no persistent lesson history. Reloading clears state.

## Study companion (Mate)

Mate is a small pixel-cat study buddy in the corner of the study studio. It waves on load, inspects imported files, thinks while a guide is built, reads in the notes tab, focuses during practice, searches in the Ask tab, and reacts to errors. It celebrates correct answers and walks through **try again → hint → answer + explanation** across three incorrect attempts.

Core companion behavior is entirely client-side. It needs **no new backend, database, API key or analytics** and works in both source mode and AI mode. Speech bubbles follow the lesson language selector (English or Burmese), and hide/mute preferences persist in `localStorage`.

Use the eye button to hide Mate and the small **Show Mate** pill to restore it; the speaker button mutes speech bubbles. `prefers-reduced-motion` disables animation. On small screens the card shrinks and only its controls are clickable, so core study actions stay usable.

See `docs/PET-COMPANION.md` for architecture, states and sprite-asset details.

## Learning material uploads

Choose or drop up to five files, each no larger than 5 MiB (10 MiB combined per selection). Allowed formats: JPG, JPEG, PNG, WEBP, PDF, PPT, PPTX, DOC, DOCX and TXT. Videos and other formats are rejected. Image thumbnails and local image/PDF/TXT previews are available; Office files show filename, type and size and can be opened in a local Office-compatible viewer before import. Remove any selected file before pressing **Import files**.

Imported text replaces the default sample or is appended to your lesson. Review it in the editable field, then create a guide. TXT is decoded by the app server without an external service. Other formats are sent to the private free extractor service, which uses Tesseract, Poppler, and LibreOffice. Set server-only `EXTRACTOR_URL` and `EXTRACTOR_TOKEN`; configure the matching token on the extractor. No paid API fallback is used for uploads. The extractor handles at most 5 MiB and 20 pages/slides per file. Original files are deleted after extraction. OCR may make mistakes, especially for Myanmar text, so compare the editable text against the original. Keep the site private until authenticated quotas and rate limits are implemented. See `extractor/README.md` for deployment and `docs/UPLOAD-VERIFICATION.md` for verification.

## Optional AI setup

Configure server-only `OPENAI_API_KEY` and `OPENAI_MODEL` in Sites runtime settings, then redeploy. For local development use an ignored `.dev.vars` file. Never put keys in browser code or commit them.

For agent-assisted OpenAI key provisioning, enable the OpenAI Developers plugin and use its API-key skill. This project does not include a key or assume a free quota. Set a provider spending cap before use. Keep the Site private until request quotas/auth requirements for broader access are implemented.

The server uses OpenAI Chat Completions JSON mode, a 35-second timeout, an input bound and an output token cap. It validates source IDs and exact quotes and rejects malformed results. It does NOT prove semantic support, translation quality or answer correctness. AI mode sends lesson text to OpenAI. `store:false` is set, but this does not promise zero provider retention. Do not upload private student data.

## Verification

`npm test` covers source fidelity, invalid inputs, chunk preservation, evidence retrieval, Myanmar text handling, fabricated references, API errors and mocked model responses. Mocked transport tests are not live-model evaluation. See `docs/HACKATHON.md` for the team schedule, evaluation protocol and honest submission draft.

## Limitations

Source mode is extractive, not generative AI. Keyword retrieval is not semantic or cross-language retrieval. Only the first six passages become source-mode cards; all passages are searchable. Image/document imports use free OCR and document conversion (except TXT); check the text against the originals. Office documents provide text only, not embedded diagram/image extraction. No voice, login database or training pipeline. The hosted Site starts private and is not yet judge-accessible. No hackathon submission has been made.

## Attribution

Development is AI-assisted. Framework/tooling originates from the Sites Vinext starter; open-source dependencies retain their own licenses. The example lesson was authored for this project. Confirm competition AI-code and reuse policies before submitting.
