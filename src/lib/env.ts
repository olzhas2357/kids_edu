export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';
}
