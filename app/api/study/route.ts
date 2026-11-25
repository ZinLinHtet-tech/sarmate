import { env } from 'cloudflare:workers';
import { handleStudy, type AIConfig } from '../../../lib/ai-handler';
export async function POST(request: Request) {
  return handleStudy(request,env as unknown as AIConfig);
}
