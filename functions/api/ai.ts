import {handleAIGatewayRequest} from '../../server/aiGatewayHandler';

interface Environment {
  [key: string]: string | undefined;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_AI_GATEWAY_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
}

interface PagesContext {
  request: Request;
  env: Environment;
}

export function onRequestPost({request, env}: PagesContext): Promise<Response> {
  return handleAIGatewayRequest(request, env);
}
