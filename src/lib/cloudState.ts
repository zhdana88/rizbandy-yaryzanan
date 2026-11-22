import type {SupabaseClient} from '@supabase/supabase-js';
import type {FullAppState} from '../utils/persistentStorage';
import {isConfiguredAdminEmail} from './adminAccess';
import type {Database, Json} from './supabase';

const APP_STATE_ID = 'default';

type AppSupabaseClient = SupabaseClient<Database>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFullAppState(value: unknown): value is FullAppState {
  if (!isRecord(value)) return false;

  return (
    typeof value.version === 'string' &&
    typeof value.lastSavedAt === 'string' &&
    Array.isArray(value.players) &&
    isRecord(value.config) &&
    isRecord(value.themeConfig) &&
    Array.isArray(value.matchHistory) &&
    Array.isArray(value.financeSessions) &&
    (value.lineup === undefined || value.lineup === null || isRecord(value.lineup))
  );
}

export function parseCloudAppState(value: unknown): FullAppState {
  if (!isFullAppState(value)) {
    throw new Error('The saved cloud app state has an invalid format.');
  }

  return {...value, lineup: value.lineup ?? null};
}

export function getCloudStateFingerprint(state: FullAppState): string {
  return JSON.stringify({
    players: state.players,
    config: state.config,
    themeConfig: state.themeConfig,
    matchHistory: state.matchHistory,
    financeSessions: state.financeSessions,
    lineup: state.lineup,
  });
}

function toJson(value: unknown): Json {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error('Unable to serialize app state for cloud storage.');
  }
  return JSON.parse(serialized) as Json;
}

async function assertAdmin(client: AppSupabaseClient): Promise<void> {
  const {data: {user}, error: userError} = await client.auth.getUser();
  if (userError) throw userError;
  if (!user || !isConfiguredAdminEmail(user.email)) {
    throw new Error('You must be signed in as an authorized admin to modify shared app state.');
  }

  const {data, error} = await client
    .from('app_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('This account is not authorized to modify shared app state.');
  }
}

export async function fetchCloudAppState(client: AppSupabaseClient): Promise<FullAppState | null> {
  const {data, error} = await client
    .from('app_state')
    .select('state')
    .eq('id', APP_STATE_ID)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return parseCloudAppState(data.state);
}

export async function insertCloudAppState(
  client: AppSupabaseClient,
  state: FullAppState,
): Promise<void> {
  await assertAdmin(client);
  const {error} = await client
    .from('app_state')
    .insert({id: APP_STATE_ID, state: toJson(state)});

  if (error) throw error;
}

export async function updateCloudAppState(
  client: AppSupabaseClient,
  state: FullAppState,
): Promise<void> {
  await assertAdmin(client);
  const {data, error} = await client
    .from('app_state')
    .update({state: toJson(state), updated_at: new Date().toISOString()})
    .eq('id', APP_STATE_ID)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Cloud state was not updated. Check admin access and database policies.');
  }
}

export function subscribeToCloudAppState(
  client: AppSupabaseClient,
  onState: (state: FullAppState) => void,
  onError: (message: string) => void,
  onConnectionChange?: (connected: boolean) => void,
): () => void {
  const channel = client
    .channel('public-app-state')
    .on(
      'postgres_changes',
      {event: '*', schema: 'public', table: 'app_state', filter: `id=eq.${APP_STATE_ID}`},
      (payload) => {
        if (payload.eventType === 'DELETE') return;

        try {
          if (!isRecord(payload.new)) {
            throw new Error('Realtime update did not contain a state row.');
          }
          onState(parseCloudAppState(payload.new.state));
        } catch (error) {
          onError(error instanceof Error ? error.message : 'Invalid realtime app state.');
        }
      },
    )
    .subscribe((status, error) => {
      onConnectionChange?.(status === 'SUBSCRIBED');
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError(error?.message ?? `Realtime subscription failed: ${status}`);
      }
    });

  return () => {
    void client.removeChannel(channel);
  };
}
