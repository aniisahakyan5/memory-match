/**
 * Authentication Module
 * Handles Login/Register via Supabase Auth
 */

class Auth {
    constructor() {
        this.currentUser = null;

        // Listen for auth state changes
        if (typeof supabase !== 'undefined') {
            const client = db.getClient(); // Access raw client
            if (client) {
                client.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                        this.currentUser = session.user;
                        // We also need the profile (username)
                        // Trigger a UI update explicitly if needed, or let the app poll
                        // Ideally we dispatch an event
                        window.dispatchEvent(new Event('auth-changed'));
                    } else if (event === 'SIGNED_OUT') {
                        this.currentUser = null;
                        window.dispatchEvent(new Event('auth-changed'));
                    }
                });
            }
        }
    }

    async register(username, email, password) {
        if (!email || !password || !username) throw new Error('All fields required');

        const client = db.getClient();
        if (!client) throw new Error('Supabase not connected');

        // 1. Sign Up
        const { data: authData, error: authError } = await client.auth.signUp({
            email: email,
            password: password
        });

        if (authError) throw authError;

        if (authData.user) {
            // 2. Create Profile
            // We need to store the username linked to this ID
            // db-cloud.js handle this? Or we do it here directly calling the table.

            // Note: If using Supabase 'public.profiles' table with Row Level Security, 
            // the INSERT must usually happen here or via a Trigger.
            // We'll try client-side insert first.
            const user = authData.user;

            await db.createProfile(user.id, username, email);

            return user;
        }
    }

    async login(email, password) {
        const client = db.getClient();
        if (!client) throw new Error('Supabase not connected');

        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        this.currentUser = data.user;
        return this.currentUser;
    }

    async resetPassword(email) {
        const client = db.getClient();
        if (!client) throw new Error('Supabase not connected');

        const { error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/?reset=true',
        });

        if (error) throw error;
    }

    async logout() {
        const client = db.getClient();
        if (client) {
            await client.auth.signOut();
        }
        this.currentUser = null;
    }

    isLoggedIn() {
        // Double check session if null? 
        // Sync check is faster for UI rendering.
        return !!this.currentUser;
    }

    async getCurrentUserFull() {
        if (!this.currentUser) return null;

        // Fetch profile data (username)
        const profile = await db.findUserById(this.currentUser.id);
        if (profile) {
            return {
                ...this.currentUser,
                username: profile.username
            };
        }
        return this.currentUser;
    }
}

const auth = new Auth();
