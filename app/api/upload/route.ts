import { env } from 'cloudflare:workers';
import { handleUpload } from '../../../lib/upload-handler';
import type { AIConfig } from '../../../lib/ai-handler';
export async function POST(request: Request) {
  return handleUpload(request,env as unknown as AIConfig);
}
