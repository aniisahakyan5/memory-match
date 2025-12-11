/**
 * Cloud Database implementation using Supabase
 * Replaces db.js for online multiplayer features.
 */

// Placeholder Constants
const DEFAULT_URL = 'YOUR_SUPABASE_URL_HERE';
const DEFAULT_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

let supabaseClient = null;

class CloudDatabase {
    constructor() {
        this.params = {
            url: localStorage.getItem('sb_url') || DEFAULT_URL,
            key: localStorage.getItem('sb_key') || DEFAULT_KEY
        };

        this.dbReady = false;
        this.tryInit();
    }

    tryInit() {
        if (this.params.url && this.params.url !== DEFAULT_URL && this.params.key && this.params.key !== DEFAULT_KEY) {
            if (typeof supabase !== 'undefined') {
                try {
                    supabaseClient = supabase.createClient(this.params.url, this.params.key);
                    this.dbReady = true;
                    console.log('Supabase Connected');
                } catch (e) {
                    console.error('Supabase Init Failed:', e);
                }
            }
        }
    }

    isConfigured() {
        return this.dbReady;
    }

    saveConfig(url, key) {
        localStorage.setItem('sb_url', url);
        localStorage.setItem('sb_key', key);
        this.params.url = url;
        this.params.key = key;
        this.tryInit();
        location.reload();
    }

    // --- Users ---

    async findUser(username) {
        if (!this.dbReady) return null;

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

    async saveUser(user) {
        if (!this.dbReady) return;

        const { error } = await supabaseClient
            .from('profiles')
            .insert([{
                id: user.id,
                username: user.username,
                password_hash: user.passwordHash,
                created_at: new Date()
            }]);

        if (error) throw error;
    }

    // --- Scores ---

    async saveScore(score) {
        if (!this.dbReady) return;

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
}

const db = new CloudDatabase();
