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

        // 1. Sign Up with Supabase Auth
        const { data: authData, error: authError } = await client.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username // Store username in auth metadata
                },
                emailRedirectTo: window.location.origin + window.location.pathname
            }
        });

        if (authError) throw authError;

        if (authData.user) {
            const user = authData.user;

            // 2. Wait a moment for auth to fully commit
            await new Promise(resolve => setTimeout(resolve, 500));

            // 3. Create Profile
            try {
                await db.createProfile(user.id, username, email);
            } catch (profileError) {
                console.error('Profile creation error:', profileError);
                // If profile creation fails, still return success
                // User can login and we'll create profile on first login
            }

            return { user, session: authData.session };
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
