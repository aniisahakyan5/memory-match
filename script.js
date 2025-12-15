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
const emailInput = document.getElementById('email-input');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const authActionBtn = document.getElementById('auth-action-btn');
const authSwitchText = document.getElementById('auth-switch-text');
const authSwitchLink = document.getElementById('auth-switch-link');
const authError = document.getElementById('auth-error');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const otpLink = document.getElementById('otp-link');

// Reset Password Modal Elements
const resetModal = document.getElementById('reset-modal');
const resetEmailInput = document.getElementById('reset-email-input');
const resetActionBtn = document.getElementById('reset-action-btn');
const resetCancelBtn = document.getElementById('reset-cancel-btn');
const resetError = document.getElementById('reset-error');
const resetSuccess = document.getElementById('reset-success');

// OTP Modal Elements
const otpModal = document.getElementById('otp-modal');
const otpCodeInput = document.getElementById('otp-code-input');
const otpVerifyBtn = document.getElementById('otp-verify-btn');
const otpResendBtn = document.getElementById('otp-resend-btn');
const otpCancelBtn = document.getElementById('otp-cancel-btn');
const otpInstructions = document.getElementById('otp-instructions');
const otpError = document.getElementById('otp-error');
const otpSuccess = document.getElementById('otp-success');
let otpEmail = ''; // Store email for OTP verification
let otpUsername = ''; // Store username from registration

// Reset Game Confirmation Modal Elements
const resetModalConfirm = document.getElementById('reset-modal-confirm');
const resetFullGameBtn = document.getElementById('reset-full-game-btn');
const resetCurrentLevelBtn = document.getElementById('reset-current-level-btn');
const resetCancelBtnGame = document.getElementById('reset-cancel-btn-game');

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

async function updateAuthUI() {
    if (auth.isLoggedIn()) {
        authModal.classList.remove('visible');
        resetModal.classList.remove('visible');
        userProfileBar.classList.remove('hidden');
        gameBoard.classList.remove('blur-locked');

        const userFull = await auth.getCurrentUserFull();
        if (userFull && userFull.username) {
            usernameDisplay.textContent = userFull.username;

            // Restore Level BEFORE initializing game
            try {
                const maxLevel = await db.getUserMaxLevel(userFull.username);
                currentLevel = maxLevel + 1;
            } catch (e) {
                console.error("Failed to restore level:", e);
                currentLevel = 1;
            }

            // Now initialize game with the correct level (no flash!)
            initGame(false); // Start game at restored level (false = don't reset to 1)
        }
    } else {
        authModal.classList.add('visible');
        userProfileBar.classList.add('hidden');
        gameBoard.classList.add('blur-locked');
        currentLevel = 1; // Reset on logout
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
        usernameInput.parentElement.style.display = 'none'; // Hide username in login
        forgotPasswordLink.parentElement.style.display = 'block'; // Show forgot password
    } else {
        authTitle.textContent = "Create Account";
        authActionBtn.textContent = "Register";
        authSwitchText.textContent = "Already have an account?";
        authSwitchLink.textContent = "Login";
        usernameInput.parentElement.style.display = 'block'; // Show username in register
        forgotPasswordLink.parentElement.style.display = 'none'; // Hide forgot password
    }
    authError.textContent = "";
});

// Forgot Password Link
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    authModal.classList.remove('visible');
    resetModal.classList.add('visible');
    resetError.textContent = '';
    resetSuccess.textContent = '';
    resetEmailInput.value = '';
});

// Reset Password Action
resetActionBtn.addEventListener('click', async () => {
    const email = resetEmailInput.value.trim();

    if (!email) {
        resetError.textContent = 'Please enter your email';
        return;
    }

    try {
        await auth.resetPassword(email);
        resetSuccess.textContent = 'Reset link sent! Check your email.';
        resetError.textContent = '';
        resetEmailInput.value = '';

        // Return to login after 3 seconds
        setTimeout(() => {
            resetModal.classList.remove('visible');
            authModal.classList.add('visible');
            resetSuccess.textContent = '';
        }, 3000);
    } catch (err) {
        resetError.textContent = err.message || 'Failed to send reset link';
        resetSuccess.textContent = '';
    }
});

// Reset Cancel
resetCancelBtn.addEventListener('click', () => {
    resetModal.classList.remove('visible');
    authModal.classList.add('visible');
    resetError.textContent = '';
    resetSuccess.textContent = '';
});

// OTP Link - Send Magic Link
otpLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!email) {
        authError.textContent = 'Please enter your email address';
        return;
    }

    try {
        await auth.signInWithOTP(email);
        otpEmail = email;
        authModal.classList.remove('visible');
        otpModal.classList.add('visible');
        otpInstructions.textContent = `Enter the 6-digit code sent to ${email}`;
        otpError.textContent = '';
        otpSuccess.textContent = '';
        otpCodeInput.value = '';
    } catch (err) {
        authError.textContent = err.message || 'Failed to send code';
    }
});

// OTP Verify
otpVerifyBtn.addEventListener('click', async () => {
    const code = otpCodeInput.value.trim();

    if (!code || code.length !== 6) {
        otpError.textContent = 'Please enter a valid 6-digit code';
        return;
    }

    try {
        const { session, user } = await auth.verifyOTP(otpEmail, code);

        // If new user, create profile
        if (user) {
            const existingProfile = await db.findUserById(user.id);
            if (!existingProfile) {
                // Need username for new OTP users
                const username = prompt('Welcome! Please enter a username for the leaderboard:');
                if (username) {
                    try {
                        await db.createProfile(user.id, username, user.email);
                    } catch (e) {
                        console.error('Profile creation error:', e);
                    }
                }
            }
        }

        otpModal.classList.remove('visible');
        otpCodeInput.value = '';
        otpEmail = '';
        await updateAuthUI();
    } catch (err) {
        otpError.textContent = err.message || 'Invalid code. Please try again.';
    }
});

// OTP Resend
otpResendBtn.addEventListener('click', async () => {
    if (!otpEmail) return;

    try {
        await auth.signInWithOTP(otpEmail);
        otpSuccess.textContent = 'New code sent! Check your email.';
        otpError.textContent = '';
        setTimeout(() => {
            otpSuccess.textContent = '';
        }, 3000);
    } catch (err) {
        otpError.textContent = err.message || 'Failed to resend code';
    }
});

// OTP Cancel
otpCancelBtn.addEventListener('click', () => {
    otpModal.classList.remove('visible');
    authModal.classList.add('visible');
    otpCodeInput.value = '';
    otpError.textContent = '';
    otpSuccess.textContent = '';
    otpEmail = '';
});

// OTP Link - Send Magic Link
otpLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!email) {
        authError.textContent = 'Please enter your email address';
        return;
    }

    try {
        await auth.signInWithOTP(email);
        otpEmail = email;
        authModal.classList.remove('visible');
        otpModal.classList.add('visible');
        otpInstructions.textContent = `Enter the 6-digit code sent to ${email}`;
        otpError.textContent = '';
        otpSuccess.textContent = '';
        otpCodeInput.value = '';
    } catch (err) {
        authError.textContent = err.message || 'Failed to send code';
    }
});

// OTP Verify
otpVerifyBtn.addEventListener('click', async () => {
    const code = otpCodeInput.value.trim();

    if (!code || code.length !== 6) {
        otpError.textContent = 'Please enter a valid 6-digit code';
        return;
    }

    try {
        const { session, user } = await auth.verifyOTP(otpEmail, code);

        // If new user, create profile
        if (user) {
            const existingProfile = await db.findUserById(user.id);
            if (!existingProfile) {
                // Need username for new OTP users
                const username = prompt('Welcome! Please enter a username for the leaderboard:');
                if (username) {
                    try {
                        await db.createProfile(user.id, username, user.email);
                    } catch (e) {
                        console.error('Profile creation error:', e);
                    }
                }
            }
        }

        otpModal.classList.remove('visible');
        otpCodeInput.value = '';
        otpEmail = '';
        await updateAuthUI();
    } catch (err) {
        otpError.textContent = err.message || 'Invalid code. Please try again.';
    }
});

// OTP Resend
otpResendBtn.addEventListener('click', async () => {
    if (!otpEmail) return;

    try {
        await auth.signInWithOTP(otpEmail);
        otpSuccess.textContent = 'New code sent! Check your email.';
        otpError.textContent = '';
        setTimeout(() => {
            otpSuccess.textContent = '';
        }, 3000);
    } catch (err) {
        otpError.textContent = err.message || 'Failed to resend code';
    }
});

// OTP Cancel
otpCancelBtn.addEventListener('click', () => {
    otpModal.classList.remove('visible');
    authModal.classList.add('visible');
    otpCodeInput.value = '';
    otpError.textContent = '';
    otpSuccess.textContent = '';
    otpEmail = '';
});

authActionBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const username = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    if (isLoginMode) {
        if (!email || !pass) {
            authError.textContent = "Please fill in all fields";
            return;
        }
    } else {
        if (!email || !username || !pass) {
            authError.textContent = "Please fill in all fields";
            return;
        }
    }

    try {
        if (isLoginMode) {
            await auth.login(email, pass);
            emailInput.value = "";
            usernameInput.value = "";
            passwordInput.value = "";
            authError.textContent = "";
            await updateAuthUI();
        } else {
            const result = await auth.register(username, email, pass);
            emailInput.value = "";
            usernameInput.value = "";
            passwordInput.value = "";
            authError.textContent = "";

            // Show OTP modal for email verification
            const client = db.getClient();
            if (client) {
                const { data: sessionData } = await client.auth.getSession();
                if (!sessionData?.session) {
                    // No session means email verification is required
                    // Automatically show OTP modal
                    otpEmail = email;
                    otpUsername = username; // Store username from registration
                    authModal.classList.remove('visible');
                    otpModal.classList.add('visible');
                    otpInstructions.textContent = `✅ Account created! Enter the 6-digit code sent to ${email}`;
                    otpError.textContent = '';
                    otpSuccess.textContent = '';
                    otpCodeInput.value = '';
                    return;
                }
            }

            await updateAuthUI();
        }
    } catch (err) {
        authError.style.color = ''; // Reset to error color
        authError.textContent = err.message || 'Authentication failed';
    }
});

logoutBtn.addEventListener('click', async () => {
    await auth.logout();
    updateAuthUI();
});

// Listen for auth state changes
window.addEventListener('auth-changed', () => {
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
        const userFull = await auth.getCurrentUserFull();
        if (userFull && userFull.username) {
            await db.saveScore({
                username: userFull.username, // We store username to avoid joins for now
                level: currentLevel,
                moves: moves,
                timeStr: timeStr,
                timeSeconds: timeSeconds,
                date: new Date().toLocaleDateString()
            });

            // Update Leaderboard immediately
            updateLeaderboardUI();
        }
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
restartBtn.addEventListener('click', () => {
    // Show reset confirmation modal instead of directly resetting
    resetModalConfirm.classList.add('visible');
});

// Reset confirmation modal handlers
resetFullGameBtn.addEventListener('click', () => {
    resetModalConfirm.classList.remove('visible');
    initGame(true); // Reset to Level 1
});

resetCurrentLevelBtn.addEventListener('click', () => {
    resetModalConfirm.classList.remove('visible');
    initGame(false); // Restart current level
});

resetCancelBtnGame.addEventListener('click', () => {
    resetModalConfirm.classList.remove('visible');
});

nextLevelBtn.addEventListener('click', nextLevel);
retryLevelBtn.addEventListener('click', retryLevel);

// Initial Check
if (!db.isConfigured()) {
    console.warn("DB not configured.");

    // Add visual warning
    const warning = document.createElement('div');
    warning.style.position = 'fixed';
    warning.style.bottom = '10px';
    warning.style.right = '10px';
    warning.style.background = 'rgba(255, 0, 0, 0.8)';
    warning.style.color = 'white';
    warning.style.padding = '10px';
    warning.style.borderRadius = '5px';
    warning.style.zIndex = '9999';
    warning.innerHTML = '⚠️ Database Not Connected <br><u style="cursor:pointer">Click to Configure</u>';
    warning.addEventListener('click', () => {
        const url = prompt("Enter Supabase URL:");
        if (!url) return;
        const key = prompt("Enter Supabase Anon Key:");
        if (!key) return;

        localStorage.setItem('supabase_config', JSON.stringify({ url, key }));
        alert("Configuration saved! Reloading...");
        location.reload();
    });
    document.body.appendChild(warning);
}

// Initialize UI state
if (usernameInput && usernameInput.parentElement) {
    usernameInput.parentElement.style.display = 'none'; // Start in login mode
}
if (forgotPasswordLink && forgotPasswordLink.parentElement) {
    forgotPasswordLink.parentElement.style.display = 'block'; // Show forgot password in login
}

// Wait for auth to check session before updating UI
// This prevents the Level 1 flash by ensuring we only render ONCE with the correct level
(async function initializeApp() {
    const client = db.getClient();
    if (client) {
        // Check if user has an active session
        const { data: sessionData } = await client.auth.getSession();
        if (sessionData?.session) {
            auth.currentUser = sessionData.session.user;
        }
    }

    // Now update UI with the correct auth state
    await updateAuthUI();
})();

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
    const currentUser = auth.currentUser;
    let currentUsername = null;

    if (currentUser) {
        const userFull = await auth.getCurrentUserFull();
        if (userFull) currentUsername = userFull.username;
    }

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
        if (currentUsername && score.username === currentUsername) {
            li.classList.add('current-user');
        }
    });
}
