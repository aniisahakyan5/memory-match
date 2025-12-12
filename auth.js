/**
 * Authentication Module
 * Handles Login/Register and Session
 */

class Auth {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'memory-match-session'; // Simple session persistence

        // Check for existing session
        const savedUser = localStorage.getItem(this.sessionKey);
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    async hashPassword(password) {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async register(username, password) {
        if (!username || !password) throw new Error('Username and Password required');

        const passwordHash = await this.hashPassword(password);
        const newUser = {
            id: Date.now().toString(), // Simple ID (Supabase might generate one, but we pass it for now)
            username: username,
            passwordHash: passwordHash,
            createdAt: new Date().toISOString()
        };

        try {
            // Updated for Async Cloud DB
            await db.saveUser(newUser);
            return this.login(username, password); // Auto login
        } catch (e) {
            throw e;
        }
    }

    async login(username, password) {
        // Updated for Async Cloud DB
        const user = await db.findUser(username);

        if (!user) throw new Error('User not found');

        const inputHash = await this.hashPassword(password);
        // Supabase column might be 'password_hash' or 'passwordHash' depending on our mapper
        // In db-cloud.js saveUser: password_hash: user.passwordHash

        // Let's assume the DB returns what we inserted.
        // If using 'profiles' table select *, we get snake_case 'password_hash' usually if SQL defined that way.
        // Let's Handle both to be safe.
        const storedHash = user.password_hash || user.passwordHash;

        if (inputHash !== storedHash) throw new Error('Invalid Password');

        this.currentUser = {
            id: user.id,
            username: user.username
        };

        localStorage.setItem(this.sessionKey, JSON.stringify(this.currentUser));
        return this.currentUser;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.sessionKey);
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

const auth = new Auth();
