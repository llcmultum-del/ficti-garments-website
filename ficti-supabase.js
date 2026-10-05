// Ficti Garments — Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://nusuluxjeckjcdgxzgyf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_i8jwxXfkwQKCApZOCFu8SA_JrwICvqK';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: get current user + profile
export async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    return { ...user, profile: profile || {} };
}

// Helper: redirect if not logged in
export async function requireAuth(redirect = 'login.html') {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = redirect + '?redirect=' + encodeURIComponent(window.location.pathname);
        return null;
    }
    return session;
}
