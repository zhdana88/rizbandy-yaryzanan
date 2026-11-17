import {supabase} from './supabase';
import {isConfiguredAdminEmail} from './adminAccess';

interface AIResponse {
  text: string;
}

export async function askAI(prompt: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase authentication is not configured.');
  }

  const {data, error} = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session || !isConfiguredAdminEmail(data.session.user.email)) {
    throw new Error('Sign in with the authorized admin account to use AI.');
  }

  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({prompt}),
  });

  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'error' in result &&
      typeof result.error === 'string'
      ? result.error
      : 'The AI request failed.';
    throw new Error(message);
  }

  if (
    typeof result !== 'object' ||
    result === null ||
    !('text' in result) ||
    typeof result.text !== 'string'
  ) {
    throw new Error('The AI service returned an invalid response.');
  }

  return result.text;
}
