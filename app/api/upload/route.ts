import { env } from 'cloudflare:workers';
import { handleUpload } from '../../../lib/upload-handler';
import type { UploadConfig } from '../../../lib/upload-handler';
export async function POST(request: Request) {
  return handleUpload(request,env as unknown as UploadConfig);
}
