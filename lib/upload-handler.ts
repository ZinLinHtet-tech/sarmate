import { MAX_FILE_BYTES, extensionOf, validateFile, matchesContent, decodeText } from './uploads.ts';
import { MAX_LENGTH } from './study.ts';

export type UploadConfig = { EXTRACTOR_URL?: string; EXTRACTOR_TOKEN?: string };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });

export async function handleUpload(request: Request, config: UploadConfig, fetcher: typeof fetch = fetch): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const url = new URL(request.url), origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return json({ error: 'Cross-origin requests are not allowed.' }, 403);
  const name = url.searchParams.get('filename') || '', type = request.headers.get('content-type') || '';
  const lengthHeader = request.headers.get('content-length');
  const declared = lengthHeader === null ? undefined : Number(lengthHeader);
  const metadataError = validateFile({ name, type, size: declared ?? 1 });
  if (metadataError) return json({ error: metadataError }, declared !== undefined && declared > MAX_FILE_BYTES ? 413 : !extensionOf(name) || metadataError.includes('type') || metadataError.includes('format') ? 415 : 400);
  const ext = extensionOf(name)!;
  let bytes: Uint8Array;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Select a non-empty file.' }, 400);
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > MAX_FILE_BYTES) { await reader.cancel().catch(() => {}); return json({ error: 'The file exceeds the 5 MB limit.' }, 413); }
      chunks.push(value);
    }
    if (!length) return json({ error: 'The file is empty.' }, 400);
    bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  } catch { return json({ error: 'The file could not be read.' }, 400); }
  if (!matchesContent(bytes, ext)) return json({ error: 'The file content does not match its format, is corrupt, or exceeds safe document limits.' }, 415);
  if (ext === 'txt') {
    const text = decodeText(bytes).trim();
    if (!text) return json({ error: 'No readable lesson text was found.' }, 422);
    if (text.length > MAX_LENGTH) return json({ error: 'This file contains more than 12,000 characters. Split it into smaller lessons.' }, 422);
    return json({ text, method: 'text' });
  }
  if (!config.EXTRACTOR_URL) return json({ error: 'The free extraction service is not configured. TXT uploads and pasted lessons still work.' }, 503);
  let endpoint: URL;
  try {
    endpoint = new URL('/extract', config.EXTRACTOR_URL);
    if (!['https:', 'http:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) throw new Error('Invalid URL');
  } catch { return json({ error: 'The extraction service URL is invalid.' }, 503); }
  try {
    const headers: Record<string, string> = { 'Content-Type': type || 'application/octet-stream', 'X-File-Name': encodeURIComponent(name) };
    if (config.EXTRACTOR_TOKEN) headers.Authorization = `Bearer ${config.EXTRACTOR_TOKEN}`;
    const response = await fetcher(endpoint, { method: 'POST', headers, body: bytes.buffer as ArrayBuffer, signal: AbortSignal.timeout(60000) });
    const result = await response.json() as { text?: unknown; error?: unknown; detail?: unknown };
    if (!response.ok) return json({ error: typeof result.error === 'string' ? result.error : typeof result.detail === 'string' ? result.detail : 'The free extractor could not process this file.' }, response.status === 413 ? 413 : response.status === 422 ? 422 : 502);
    if (typeof result.text !== 'string') return json({ error: 'The extractor returned an invalid result.' }, 502);
    const text = result.text.trim();
    if (!text) return json({ error: 'No readable lesson text was found.' }, 422);
    if (text.length > MAX_LENGTH) return json({ error: 'This file contains more than 12,000 characters. Split it into smaller lessons.' }, 422);
    return json({ text, method: 'free-extracted' });
  } catch { return json({ error: 'The free extractor is unavailable or timed out. Your selected file is still available; try again.' }, 502); }
}
