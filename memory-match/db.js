/**
 * Simulated Database using LocalStorage
 * Handles Users and Scores tables
 */

class Database {
    constructor() {
        this.usersKey = 'memory-match-users';
        this.scoresKey = 'memory-match-scores';

        // Initialize if empty
        if (!localStorage.getItem(this.usersKey)) {
            localStorage.setItem(this.usersKey, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.scoresKey)) {
            localStorage.setItem(this.scoresKey, JSON.stringify([]));
        }
    }

    // --- Users Table ---

    getUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey));
    }

    saveUser(user) {
        const users = this.getUsers();
        // Check if username exists (Case Insensitive)
        if (users.find(u => u.username.toLowerCase() === user.username.toLowerCase())) {
            throw new Error('Username already exists');
        }
        users.push(user);
        localStorage.setItem(this.usersKey, JSON.stringify(users));
    }

    findUser(username) {
        const users = this.getUsers();
        return users.find(u => u.username === username);
    }

    // --- Scores Table ---

    saveScore(score) {
        // score: { userId, username, level, moves, timeStr, timeSeconds, date }
        const scores = this.getScores();
        scores.push(score);
        localStorage.setItem(this.scoresKey, JSON.stringify(scores));
    }

    getScores() {
        return JSON.parse(localStorage.getItem(this.scoresKey));
    }

    // Calculate points for a single run
    calculatePoints(level, moves, timeSeconds) {
        // Base: Level * 1000
        // Penalty: (Moves * 10) + (Time * 2)
        // Bonus: Harder levels give way more points to incentivize progression
        const base = level * 1000;
        const penalty = (moves * 10) + (timeSeconds * 2);
        return Math.max(0, base - penalty);
    }

    getGlobalRankings(filter = 'all') {
        let allScores = this.getScores();

        if (filter === 'daily') {
            const today = new Date().toLocaleDateString();
            allScores = allScores.filter(s => s.date === today);
        }

        // 1. Organize keys: user -> level -> bestRun
        const userMap = {};

        allScores.forEach(score => {
            if (!userMap[score.username]) {
                userMap[score.username] = {};
            }

            const currentLevelBest = userMap[score.username][score.level];

            // Logic to determine "better run" for THIS level
            // We can just compare calculated points!
            const newPoints = this.calculatePoints(score.level, score.moves, score.timeSeconds);
            score.points = newPoints; // Store for later

            if (!currentLevelBest || newPoints > currentLevelBest.points) {
                userMap[score.username][score.level] = score;
            }
        });

        // 2. Aggregate Total Score per User
        const globalRankings = Object.keys(userMap).map(username => {
            const levels = userMap[username];
            let totalScore = 0;
            let maxLevel = 0;
            let totalTime = 0;

            Object.values(levels).forEach(run => {
                totalScore += run.points;
                totalTime += run.timeSeconds;
                if (run.level > maxLevel) maxLevel = run.level;
            });

            return {
                username: username,
                totalScore: totalScore,
                maxLevel: maxLevel,
                totalTime: totalTime,
                timeStr: this.formatTime(totalTime) // Helper needed or just raw
            };
        });

        // 3. Sort by Total Score (Desc)
        return globalRankings.sort((a, b) => b.totalScore - a.totalScore);
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    getLevelRankings(level) {
        const scores = this.getScores().filter(s => s.level === level);
        return scores.sort((a, b) => {
            if (a.moves !== b.moves) return a.moves - b.moves;
            return a.timeSeconds - b.timeSeconds;
        });
    }
}

const db = new Database();
