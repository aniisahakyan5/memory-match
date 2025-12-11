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
            id: Date.now().toString(), // Simple ID
            username: username,
            passwordHash: passwordHash,
            createdAt: new Date().toISOString()
        };

        try {
            db.saveUser(newUser);
            return this.login(username, password); // Auto login
        } catch (e) {
            throw e;
        }
    }

    async login(username, password) {
        const user = db.findUser(username);
        if (!user) throw new Error('User not found');

        const inputHash = await this.hashPassword(password);
        if (inputHash !== user.passwordHash) throw new Error('Invalid Password');

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
