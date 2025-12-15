/**
 * Cloud Database implementation using Supabase
 * Replaces db.js for online multiplayer features.
 */

// Placeholder Constants
// Now we expect window.GAME_CONFIG to be present from server.js
const DEFAULT_URL = '';
const DEFAULT_KEY = '';

let supabaseClient = null;

class CloudDatabase {
    constructor() {
        // Read injected config or fall back to defaults
        const config = window.GAME_CONFIG || {};

        const storedConfig = JSON.parse(localStorage.getItem('supabase_config') || '{}');

        this.params = {
            url: config.SUPABASE_URL || storedConfig.url || DEFAULT_URL,
            key: config.SUPABASE_KEY || storedConfig.key || DEFAULT_KEY
        };

        this.dbReady = false;
        this.tryInit();
    }

    tryInit() {
        if (this.params.url && this.params.key) {
            if (typeof supabase !== 'undefined') {
                try {
                    supabaseClient = supabase.createClient(this.params.url, this.params.key);
                    this.dbReady = true;
                    console.log('Supabase Connected');
                } catch (e) {
                    console.error('Supabase Init Failed:', e);
                }
            }
        } else {
            console.warn('Supabase Credentials missing. Check Server Environment Variables.');
        }
    }

    isConfigured() {
        return this.dbReady;
    }

    // Config saving is no longer needed on client
    // saveConfig(url, key) { ... } REMOVED


    getClient() {
        return supabaseClient;
    }

    // --- Users ---

    async findUserById(uuid) {
        if (!this.dbReady) return null;

        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', uuid)
            .single();

        if (error) {
            // console.error('Find User By ID Error:', error);
            return null;
        }
        return data;
    }

    async findUser(username) {
        if (!this.dbReady) {
            throw 'Database not connected';
        }

        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .ilike('username', username)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Find User Error:', error);
        }

        return data;
    }

    async createProfile(id, username, email) {
        if (!this.dbReady) throw new Error('Database not connected. Check your internet or Game Settings.');

        const { error } = await supabaseClient
            .from('profiles')
            .insert([{
                id: id,
                username: username,
                created_at: new Date()
                // Email is stored in Auth, not strictly needed in public profile unless desired
            }]);

        if (error) throw error;
    }

    // --- Scores ---

    async saveScore(score) {
        if (!this.dbReady) {
            throw 'Database not connected';
        }

        const points = this.calculatePoints(score.level, score.moves, score.timeSeconds);

        const { error } = await supabaseClient
            .from('scores')
            .insert([{
                username: score.username,
                level: score.level,
                moves: score.moves,
                time_seconds: score.timeSeconds,
                time_str: score.timeStr,
                points: points,
                date: new Date().toLocaleDateString(),
                created_at: new Date()
            }]);

        if (error) console.error('Save Score Error:', error);
    }

    calculatePoints(level, moves, timeSeconds) {
        const base = level * 1000;
        const penalty = (moves * 10) + (timeSeconds * 2);
        return Math.max(0, base - penalty);
    }

    // --- Rankings ---

    async getGlobalRankings(filter = 'all') {
        if (!this.dbReady) return [];

        let query = supabaseClient.from('scores').select('*');

        if (filter === 'daily') {
            const today = new Date().toLocaleDateString();
            query = query.eq('date', today);
        }

        const { data: allScores, error } = await query;

        if (error) {
            console.error('Rankings Error:', error);
            return [];
        }

        const userMap = {};

        allScores.forEach(score => {
            if (!userMap[score.username]) {
                userMap[score.username] = {};
            }

            const currentLevelBest = userMap[score.username][score.level];
            const newPoints = score.points;

            if (!currentLevelBest || newPoints > currentLevelBest.points) {
                userMap[score.username][score.level] = score;
            }
        });

        const globalRankings = Object.keys(userMap).map(username => {
            const levels = userMap[username];
            let totalScore = 0;
            let maxLevel = 0;

            Object.values(levels).forEach(run => {
                totalScore += run.points;
                if (run.level > maxLevel) maxLevel = run.level;
            });

            return {
                username: username,
                totalScore: totalScore,
                maxLevel: maxLevel
            };
        });

        return globalRankings.sort((a, b) => b.totalScore - a.totalScore);
    }

    async getUserMaxLevel(username) {
        if (!this.dbReady) return 0;

        // Query all scores for this user to find the max level
        // We could use .max() modifier if Supabase supported it easily in client lib, 
        // but ordering by level desc and taking 1 is synonymous.
        const { data, error } = await supabaseClient
            .from('scores')
            .select('level')
            .eq('username', username)
            .order('level', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error fetching max level:', error);
            return 0;
        }

        if (data && data.length > 0) {
            return data[0].level;
        }

        return 0;
    }
}

const db = new CloudDatabase();
