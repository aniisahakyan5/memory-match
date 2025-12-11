const gameBoard = document.getElementById('game-board');
const movesElement = document.getElementById('moves');
const maxMovesElement = document.getElementById('max-moves');
const timeElement = document.getElementById('time');
const levelElement = document.getElementById('level');
const restartBtn = document.getElementById('restart-btn');
const leaderboardList = document.getElementById('leaderboard-list');

// Modals
const winModal = document.getElementById('win-modal');
const gameOverModal = document.getElementById('game-over-modal');
const authModal = document.getElementById('auth-modal');

// Win Modal Elements
const finalTimeElement = document.getElementById('final-time');
const finalMovesElement = document.getElementById('final-moves');
const finalMaxMovesElement = document.getElementById('final-max-moves');
const finalLevelElement = document.getElementById('final-level');
const nextLevelBtn = document.getElementById('next-level-btn');
const retryLevelBtn = document.getElementById('retry-level-btn');

// Headers / Auth Elements
const userProfileBar = document.getElementById('user-profile-bar');
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');

// Auth Form Elements
const authTitle = document.getElementById('auth-title');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const authActionBtn = document.getElementById('auth-action-btn');
const authSwitchText = document.getElementById('auth-switch-text');
const authSwitchLink = document.getElementById('auth-switch-link');
const authError = document.getElementById('auth-error');

const BASE_ICONS = ['🚀', '🌟', '🎮', '💎', '👻', '🍕', '🐱', '🦄', '🌈', '🍦', '🎈', '🎁', '🏆', '🔥', '⚡', '💣', '🍎', '🌻'];
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let maxMoves = 0; // New Step Limit
let timer = null;
let seconds = 0;
let isBoardLocked = false;
let isGameStarted = false;
let currentLevel = 1;
let isLoginMode = true; // Auth Toggle

// --- Auth UI Logic ---

function updateAuthUI() {
    if (auth.isLoggedIn()) {
        authModal.classList.remove('visible');
        userProfileBar.classList.remove('hidden');
        gameBoard.classList.remove('blur-locked');
        usernameDisplay.textContent = auth.getCurrentUser().username;
        initGame(true); // Start fresh game on login
    } else {
        authModal.classList.add('visible');
        userProfileBar.classList.add('hidden');
        gameBoard.classList.add('blur-locked');
    }
}

authSwitchLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.textContent = "Welcome Back";
        authActionBtn.textContent = "Login";
        authSwitchText.textContent = "New here?";
        authSwitchLink.textContent = "Create Account";
    } else {
        authTitle.textContent = "Create Account";
        authActionBtn.textContent = "Register";
        authSwitchText.textContent = "Already have an account?";
        authSwitchLink.textContent = "Login";
    }
    authError.textContent = "";
});

authActionBtn.addEventListener('click', async () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    if (!user || !pass) {
        authError.textContent = "Please fill in all fields";
        return;
    }

    try {
        if (isLoginMode) {
            await auth.login(user, pass);
        } else {
            await auth.register(user, pass);
        }
        usernameInput.value = "";
        passwordInput.value = "";
        authError.textContent = "";
        updateAuthUI();
    } catch (err) {
        authError.textContent = err.message;
    }
});

logoutBtn.addEventListener('click', () => {
    auth.logout();
    updateAuthUI();
});

// --- Game Logic ---

// Level Config Generator
function getLevelConfig(level) {
    let pairs = level * 2;
    if (pairs > 18) pairs = 18;

    // Calculate Max Moves
    // Base estimation: Minimum moves is 'pairs' (perfect game)
    // We give a buffer factor that decreases as levels get harder?
    // Or just (Pairs * 2.5) + 2
    // Level 1 (2 pairs): 5 + 2 = 7 moves? That's tight.
    // Let's do Pairs * 3 for generous / pairs * 2 for strict

    // User asked "if steps=0 then level is failed"
    // Let's allow (Pairs * 2) + 6 as a buffer
    const limit = (pairs * 2) + 6;

    return {
        pairs: pairs,
        cards: pairs * 2,
        maxMoves: limit
    };
}

function initGame(resetLevel = false) {
    if (!auth.isLoggedIn()) return;

    if (resetLevel) currentLevel = 1;

    const config = getLevelConfig(currentLevel);
    maxMoves = config.maxMoves;

    // Update UI
    levelElement.textContent = currentLevel;
    movesElement.textContent = '0';
    maxMovesElement.textContent = maxMoves; // Show limit
    timeElement.textContent = '00:00';

    winModal.classList.remove('visible');
    gameOverModal.classList.remove('visible');

    // Reset State
    matchedPairs = 0;
    moves = 0;
    seconds = 0;
    flippedCards = [];
    isBoardLocked = false;
    isGameStarted = false;
    clearInterval(timer);

    generateBoard(config);
    updateLeaderboardUI();
}

function generateBoard(config) {
    gameBoard.innerHTML = '';
    cards = [];

    const levelIcons = [];
    for (let i = 0; i < config.pairs; i++) {
        levelIcons.push(BASE_ICONS[i % BASE_ICONS.length]);
    }

    const gameIcons = [...levelIcons, ...levelIcons];
    shuffle(gameIcons);

    const totalCx = config.cards;
    const cols = Math.ceil(Math.sqrt(totalCx));
    const finalCols = Math.min(cols, 6);

    gameBoard.style.gridTemplateColumns = `repeat(${finalCols}, 1fr)`;

    gameIcons.forEach((icon, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.icon = icon;
        card.dataset.index = index;

        const frontFace = document.createElement('div');
        frontFace.classList.add('card-face', 'card-front');

        const backFace = document.createElement('div');
        backFace.classList.add('card-face', 'card-back');
        backFace.textContent = icon;

        card.appendChild(frontFace);
        card.appendChild(backFace);

        card.addEventListener('click', () => handleCardClick(card));

        gameBoard.appendChild(card);
        cards.push(card);
    });
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function handleCardClick(card) {
    // Check Limits
    if (moves >= maxMoves) return;

    if (isBoardLocked) return;
    if (card.classList.contains('flipped')) return;

    if (!isGameStarted) {
        startTimer();
        isGameStarted = true;
    }

    flipCard(card);
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        moves++;
        movesElement.textContent = moves;
        checkStepLimit(); // Check if we died
        checkForMatch();
    }
}

function checkStepLimit() {
    if (moves >= maxMoves && matchedPairs < getLevelConfig(currentLevel).pairs) {
        // Technically we need to wait for match check first
        // But if we just hit max moves, we only lose if this LAST move wasn't the winning one
        // We'll handle Game Over in checkForMatch if no match
    }
}

function flipCard(card) {
    card.classList.add('flipped');
}

function checkForMatch() {
    isBoardLocked = true;
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.icon === card2.dataset.icon;

    if (isMatch) {
        disableCards();
    } else {
        // Validation for Game Over on miss
        if (moves >= maxMoves) {
            handleGameOver();
        } else {
            unflipCards();
        }
    }
}

function disableCards() {
    flippedCards = [];
    isBoardLocked = false;
    matchedPairs++;

    const config = getLevelConfig(currentLevel);

    if (matchedPairs === config.pairs) {
        handleWin();
    } else if (moves >= maxMoves) {
        // Corner case: if we matched but ran out of moves? 
        // Usually if you match, you're good. But if you hit limit, maybe you stop?
        // Let's say if you match, you survive to next turn. 
        // But if moves == max and not all pairs found...
        // Actually typical logic: if moves > max. 
        // If moves = max, and we found a pair, we are okay.
        // If we are at max moves and haven't won yet, we lose on NEXT click or now?
        // User said: "if steps=0 then level is failed"
        // Let's interpret: If currentMoves == maxMoves AND not win, GAME OVER.

        if (matchedPairs < config.pairs) {
            handleGameOver();
        }
    }
}

function unflipCards() {
    setTimeout(() => {
        flippedCards[0].classList.remove('flipped');
        flippedCards[1].classList.remove('flipped');
        flippedCards = [];
        isBoardLocked = false;
    }, 1000);
}

function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        timeElement.textContent = `${mins}:${secs}`;
    }, 1000);
}

async function handleWin() {
    // Stop Timer
    clearInterval(timer);

    const timeStr = timeElement.textContent;
    const timeSeconds = seconds;

    // Save Score
    if (auth.isLoggedIn()) {
        const user = auth.getCurrentUser();
        await db.saveScore({
            username: user.username, // We store username to avoid joins for now
            level: currentLevel,
            moves: moves,
            timeStr: timeStr,
            timeSeconds: timeSeconds,
            date: new Date().toLocaleDateString()
        });

        // Update Leaderboard immediately
        updateLeaderboardUI();
    }

    // Show Modal
    finalTimeElement.textContent = timeStr;
    finalMovesElement.textContent = moves;
    finalMaxMovesElement.textContent = maxMoves;
    finalLevelElement.textContent = currentLevel;

    winModal.classList.add('visible');
}

function handleGameOver() {
    clearInterval(timer);
    setTimeout(() => {
        gameOverModal.classList.add('visible');
    }, 500);
}

function nextLevel() {
    currentLevel++;
    initGame(false);
}

function retryLevel() {
    initGame(false); // Restart current level
}

// Filter Logic
const filterBtns = document.querySelectorAll('.filter-btn');
let currentFilter = 'daily';

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        updateLeaderboardUI();
    });
});

function updateLeaderboardUI() {
    // Get Consolidated Scores (One per user, best performance)
    const rankings = db.getGlobalRankings(currentFilter);

    leaderboardList.innerHTML = '';

    if (rankings.length === 0) {
        leaderboardList.innerHTML = '<li class="empty-state">No scores yet (' + (currentFilter === 'daily' ? 'Today' : 'All Time') + ')</li>';
        return;
    }

    // Top 10 Global
    rankings.slice(0, 10).forEach((score, index) => {
        const li = document.createElement('li');

        // Add Rank Classes
        if (index === 0) li.classList.add('rank-1');
        if (index === 1) li.classList.add('rank-2');
        if (index === 2) li.classList.add('rank-3');

        li.innerHTML = `
            <span>#${index + 1} ${score.username}</span>
            <span>Lvl ${score.maxLevel}</span>
            <span>${score.totalScore} pts</span>
        `;
        leaderboardList.appendChild(li);

        // Highlight current user
        if (auth.getCurrentUser() && score.username === auth.getCurrentUser().username) {
            li.classList.add('current-user');
        }
    });
}

// Event Listeners
restartBtn.addEventListener('click', () => initGame(true));
nextLevelBtn.addEventListener('click', nextLevel);
retryLevelBtn.addEventListener('click', retryLevel);

// Initial Check
if (!db.isConfigured()) {
    console.warn("DB not configured. Waiting for env injection or script load.");
    // We could show a generic error here if needed, but usually server injects it.
}
updateAuthUI();

async function updateLeaderboardUI() {
    // Get Consolidated Scores (One per user, best performance)
    // Now async compatible
    const rankings = await db.getGlobalRankings(currentFilter);

    leaderboardList.innerHTML = '';

    if (!rankings || rankings.length === 0) {
        leaderboardList.innerHTML = '<li class="empty-state">No scores yet (' + (currentFilter === 'daily' ? 'Today' : 'All Time') + ')</li>';
        return;
    }

    // Top 10 Global
    rankings.slice(0, 10).forEach((score, index) => {
        const li = document.createElement('li');

        // Add Rank Classes
        if (index === 0) li.classList.add('rank-1');
        if (index === 1) li.classList.add('rank-2');
        if (index === 2) li.classList.add('rank-3');

        li.innerHTML = `
            <span>#${index + 1} ${score.username}</span>
            <span>Lvl ${score.maxLevel}</span>
            <span>${score.totalScore} pts</span>
        `;
        leaderboardList.appendChild(li);

        // Highlight current user
        if (auth.getCurrentUser() && score.username === auth.getCurrentUser().username) {
            li.classList.add('current-user');
        }
    });
}
