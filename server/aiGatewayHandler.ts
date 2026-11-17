import {isConfiguredAdminEmail} from '../src/lib/adminAccess';

type Environment = Record<string, string | undefined>;

const MODEL = '@cf/meta/llama-3.1-8b-instruct';
const MAX_REQUEST_BYTES = 16_000;
const MAX_PROMPT_LENGTH = 2_000;

function jsonResponse(status: number, body: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readRequestBody(request: Request): Promise<string | null> {
  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function handleAIGatewayRequest(
  request: Request,
  env: Environment,
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse(405, {error: 'Method not allowed.'});
  }

  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return jsonResponse(401, {error: 'Sign in with the authorized admin account.'});
  }

  const supabaseUrl = env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const gatewayId = env.CLOUDFLARE_AI_GATEWAY_ID;
  const cloudflareToken = env.CLOUDFLARE_API_TOKEN;

  if (!supabaseUrl || !supabaseAnonKey || !accountId || !gatewayId || !cloudflareToken) {
    console.error('[AI Gateway] Required server environment variables are missing.');
    return jsonResponse(503, {error: 'AI service is not configured.'});
  }

  let userResponse: Response;
  try {
    userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return jsonResponse(503, {error: 'Unable to verify admin access.'});
  }

  if (!userResponse.ok) {
    return jsonResponse(401, {error: 'Your admin session is invalid or expired.'});
  }

  const user: unknown = await userResponse.json().catch(() => null);
  if (!isRecord(user) || typeof user.id !== 'string') {
    return jsonResponse(401, {error: 'Unable to verify the signed-in user.'});
  }

  if (!isConfiguredAdminEmail(typeof user.email === 'string' ? user.email : null)) {
    return jsonResponse(403, {error: 'This account is not authorized to use the AI service.'});
  }

  let membershipResponse: Response;
  try {
    const membershipUrl = new URL(`${supabaseUrl}/rest/v1/app_admins`);
    membershipUrl.searchParams.set('select', 'user_id');
    membershipUrl.searchParams.set('user_id', `eq.${user.id}`);
    membershipResponse = await fetch(membershipUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return jsonResponse(503, {error: 'Unable to verify admin permissions.'});
  }

  if (!membershipResponse.ok) {
    console.error(`[AI Gateway] Supabase admin check failed (${membershipResponse.status}).`);
    return jsonResponse(503, {error: 'Unable to verify admin permissions.'});
  }

  const memberships: unknown = await membershipResponse.json().catch(() => null);
  if (!Array.isArray(memberships) || memberships.length === 0) {
    return jsonResponse(403, {error: 'This account is not authorized to use the AI service.'});
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return jsonResponse(415, {error: 'Send a JSON request.'});
  }

  const bodyText = await readRequestBody(request);
  if (bodyText === null) {
    return jsonResponse(413, {error: 'The request is too large.'});
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return jsonResponse(400, {error: 'The request body is not valid JSON.'});
  }

  const prompt = isRecord(body) && typeof body.prompt === 'string'
    ? body.prompt.trim()
    : '';
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    return jsonResponse(400, {error: `Prompt must be between 1 and ${MAX_PROMPT_LENGTH} characters.`});
  }

  let aiResponse: Response;
  try {
    aiResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cloudflareToken}`,
          'cf-aig-gateway-id': gatewayId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{role: 'user', content: prompt}],
          max_tokens: 400,
        }),
        signal: AbortSignal.timeout(25_000),
      },
    );
  } catch (error) {
    console.error('[AI Gateway] Upstream request failed.', error);
    return jsonResponse(502, {error: 'The AI service could not be reached.'});
  }

  if (!aiResponse.ok) {
    console.error(`[AI Gateway] Cloudflare request failed (${aiResponse.status}).`);
    return jsonResponse(502, {error: 'The AI service returned an error.'});
  }

  const result: unknown = await aiResponse.json().catch(() => null);
  const choices = isRecord(result) && Array.isArray(result.choices) ? result.choices : [];
  const firstChoice = choices[0];
  const message = isRecord(firstChoice) && isRecord(firstChoice.message)
    ? firstChoice.message
    : null;
  const answer = message && typeof message.content === 'string'
    ? message.content
    : null;

  if (!answer) {
    console.error('[AI Gateway] Cloudflare response did not contain a chat completion.');
    return jsonResponse(502, {error: 'The AI service returned an unexpected response.'});
  }

  return jsonResponse(200, {text: answer});
}
