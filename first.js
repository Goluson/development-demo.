/**
 * Tic-Tac-Toe Game Engine
 * Features:
 * - Unbeatable Minimax AI & Casual AI
 * - Web Audio API sound synthesis (clicks, victory chime, draw)
 * - Canvas confetti particle celebration
 * - Match series system (Best-of-N)
 * - LocalStorage state persistence
 */

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const boxes = document.querySelectorAll(".box");
    const turnIndicator = document.querySelector("#turn-indicator");
    const scoreOEl = document.querySelector("#score-o");
    const scoreXEl = document.querySelector("#score-x");
    const scoreDrawEl = document.querySelector("#score-draw");
    const labelPlayerO = document.querySelector("#label-player-o");
    const labelPlayerX = document.querySelector("#label-player-x");

    const aiModeSelect = document.querySelector("#ai-mode-select");
    const soundBtn = document.querySelector("#sound-btn");
    const settingsBtn = document.querySelector("#settings-btn");
    const resetRoundBtn = document.querySelector("#resetbtn");
    const resetMatchBtn = document.querySelector("#reset-match-btn");

    const roundModal = document.querySelector("#round-modal");
    const roundIcon = document.querySelector("#round-icon");
    const msgEl = document.querySelector("#msg");
    const subMsgEl = document.querySelector("#sub-msg");
    const newBtn = document.querySelector("#new-btn");

    const matchModal = document.querySelector("#match-modal");
    const matchWinnerScore = document.querySelector("#match-winner-score");
    const matchContinueBtn = document.querySelector("#match-continue-btn");

    const settingsModal = document.querySelector("#settings-modal");
    const settingsSaveBtn = document.querySelector("#settings-save-btn");
    const settingsCloseBtn = document.querySelector("#settings-close-btn");
    const playerONameInput = document.querySelector("#player-o-name");
    const playerXNameInput = document.querySelector("#player-x-name");
    const bestOfSelect = document.querySelector("#best-of-select");
    const confettiCanvas = document.querySelector("#confetti-canvas");

    // Game State
    let turnO = true;
    let count = 0;
    let gameOver = false;
    let soundEnabled = localStorage.getItem("tttSound") !== "false";
    let scores = JSON.parse(localStorage.getItem("tttScores")) || { X: 0, O: 0, Draw: 0 };
    let playerNames = JSON.parse(localStorage.getItem("tttNames")) || { O: "Player O", X: "Computer" };
    let bestOf = parseInt(localStorage.getItem("tttBestOf")) || 5;
    let aiMode = localStorage.getItem("tttAiMode") || "unbeatable";

    const winpatterns = [
        [0, 1, 2],
        [0, 3, 6],
        [0, 4, 8],
        [1, 4, 7],
        [2, 5, 8],
        [2, 4, 6],
        [3, 4, 5],
        [6, 7, 8],
    ];

    // =========================================================================
    // Web Audio Synthesizer (Zero External Audio Files Needed)
    // =========================================================================
    let audioCtx = null;

    const initAudio = () => {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
    };

    const playTone = (freq, duration, type = "sine", gainVal = 0.1) => {
        if (!soundEnabled) return;
        try {
            initAudio();
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {}
    };

    const playClickSound = (isO) => {
        playTone(isO ? 520 : 380, 0.08, "triangle", 0.08);
    };

    const playWinSound = () => {
        if (!soundEnabled) return;
        setTimeout(() => playTone(523.25, 0.15, "sine", 0.12), 0);
        setTimeout(() => playTone(659.25, 0.15, "sine", 0.12), 120);
        setTimeout(() => playTone(783.99, 0.3, "sine", 0.14), 240);
        setTimeout(() => playTone(1046.50, 0.45, "sine", 0.16), 380);
    };

    const playDrawSound = () => {
        if (!soundEnabled) return;
        setTimeout(() => playTone(440, 0.15, "sine", 0.1), 0);
        setTimeout(() => playTone(349, 0.25, "sine", 0.1), 150);
    };

    // =========================================================================
    // Canvas Confetti Celebration
    // =========================================================================
    let confettiAnimationId = null;
    let confettiParticles = [];

    const triggerConfetti = () => {
        const canvas = confettiCanvas;
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ["#38bdf8", "#fb7185", "#34d399", "#fbbf24", "#a855f7"];
        confettiParticles = [];

        for (let i = 0; i < 90; i++) {
            confettiParticles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                w: Math.random() * 8 + 6,
                h: Math.random() * 6 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.5) * 16 - 3,
                tilt: Math.random() * 10,
                tiltAngle: Math.random() * Math.PI,
                tiltSpeed: Math.random() * 0.1 + 0.05,
                alpha: 1,
            });
        }

        if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);

        const renderConfetti = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let activeCount = 0;

            confettiParticles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.35; // gravity
                p.tiltAngle += p.tiltSpeed;
                p.tilt = Math.sin(p.tiltAngle) * 12;
                p.alpha -= 0.007;

                if (p.alpha > 0) {
                    activeCount++;
                    ctx.save();
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = Math.max(0, p.alpha);
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.tiltAngle);
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    ctx.restore();
                }
            });

            if (activeCount > 0) {
                confettiAnimationId = requestAnimationFrame(renderConfetti);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };

        renderConfetti();
    };

    // =========================================================================
    // UI Rendering
    // =========================================================================
    const renderScores = () => {
        scoreXEl.innerText = scores.X;
        scoreOEl.innerText = scores.O;
        scoreDrawEl.innerText = scores.Draw;
        labelPlayerO.innerText = playerNames.O || "Player O";
        labelPlayerX.innerText = playerNames.X || (aiMode === "pvp" ? "Player X" : "Computer (X)");
    };

    const renderTurnIndicator = () => {
        const isCurrentO = turnO;
        const currentName = isCurrentO ? playerNames.O : playerNames.X;
        const tagClass = isCurrentO ? "player-tag player-o" : "player-tag player-x";
        turnIndicator.innerHTML = `Turn: <span class="${tagClass}">${currentName} (${isCurrentO ? 'O' : 'X'})</span>`;
    };

    const applySettingsToUI = () => {
        playerONameInput.value = playerNames.O === "Player O" ? "" : playerNames.O;
        playerXNameInput.value = playerNames.X === "Player X" || playerNames.X === "Computer" ? "" : playerNames.X;
        bestOfSelect.value = String(bestOf);
        aiModeSelect.value = aiMode;
        soundBtn.innerText = soundEnabled ? "🔊" : "🔇";
    };

    const saveAndRenderScores = () => {
        localStorage.setItem("tttScores", JSON.stringify(scores));
        renderScores();
        checkMatchWinner();
    };

    // =========================================================================
    // Game Controls & Turns
    // =========================================================================
    const playMove = (box, index) => {
        if (gameOver || box.innerText !== "") return;

        const currentMark = turnO ? "O" : "X";
        box.innerText = currentMark;
        box.classList.add(currentMark === "O" ? "box-o" : "box-x");
        box.disabled = true;
        count++;

        playClickSound(turnO);
        turnO = !turnO;
        renderTurnIndicator();

        const winnerFound = checkWinner();

        if (!winnerFound && count === 9) {
            handleDraw();
            return;
        }

        // Trigger AI move if enabled and it's X's turn
        if (!winnerFound && count < 9 && aiMode !== "pvp" && !turnO) {
            setTimeout(executeAiTurn, 320);
        }
    };

    const checkWinner = () => {
        for (let pattern of winpatterns) {
            const pos1val = boxes[pattern[0]].innerText;
            const pos2val = boxes[pattern[1]].innerText;
            const pos3val = boxes[pattern[2]].innerText;

            if (pos1val !== "" && pos1val === pos2val && pos2val === pos3val) {
                showWinner(pos1val, pattern);
                return true;
            }
        }
        return false;
    };

    const showWinner = (winner, pattern) => {
        gameOver = true;
        pattern.forEach((i) => boxes[i].classList.add("winning-box"));
        scores[winner]++;

        const winnerName = winner === "O" ? playerNames.O : playerNames.X;
        roundIcon.innerText = winner === "O" ? "🎉" : "🤖";
        msgEl.innerText = `${winnerName} Wins!`;
        subMsgEl.innerText = `Secured 1 point for team ${winner}`;
        roundModal.classList.remove("hide");

        playWinSound();
        triggerConfetti();
        saveAndRenderScores();
        disableBoxes();
    };

    const handleDraw = () => {
        gameOver = true;
        scores.Draw++;
        roundIcon.innerText = "🤝";
        msgEl.innerText = "Round Draw!";
        subMsgEl.innerText = "Well played by both sides!";
        roundModal.classList.remove("hide");

        playDrawSound();
        saveAndRenderScores();
    };

    const disableBoxes = () => {
        boxes.forEach((b) => (b.disabled = true));
    };

    const resetRound = () => {
        turnO = true;
        count = 0;
        gameOver = false;
        boxes.forEach((box) => {
            box.disabled = false;
            box.innerText = "";
            box.classList.remove("winning-box", "box-o", "box-x");
        });
        roundModal.classList.add("hide");
        renderTurnIndicator();
    };

    const checkMatchWinner = () => {
        const target = Math.ceil(bestOf / 2);
        if (scores.O >= target) {
            showMatchChampion(playerNames.O, scores.O, scores.X);
        } else if (scores.X >= target) {
            showMatchChampion(playerNames.X, scores.X, scores.O);
        }
    };

    const showMatchChampion = (winnerName, winCount, loseCount) => {
        matchWinnerScore.innerText = `${winnerName} conquered the series ${winCount} - ${loseCount}!`;
        matchModal.classList.remove("hide");
        triggerConfetti();
        playWinSound();
    };

    const resetMatch = () => {
        scores = { X: 0, O: 0, Draw: 0 };
        saveAndRenderScores();
        resetRound();
        matchModal.classList.add("hide");
    };

    // =========================================================================
    // AI Algorithms (Minimax & Casual)
    // =========================================================================
    const checkPatternWinner = (state) => {
        for (const [a, b, c] of winpatterns) {
            if (state[a] && state[a] === state[b] && state[b] === state[c]) return state[a];
        }
        return null;
    };

    const minimax = (state, depth, isMaximizing) => {
        const winner = checkPatternWinner(state);
        if (winner === "X") return 10 - depth;
        if (winner === "O") return depth - 10;
        if (!state.includes("")) return 0;

        if (isMaximizing) {
            let best = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (state[i] === "") {
                    state[i] = "X";
                    best = Math.max(best, minimax(state, depth + 1, false));
                    state[i] = "";
                }
            }
            return best;
        } else {
            let best = Infinity;
            for (let i = 0; i < 9; i++) {
                if (state[i] === "") {
                    state[i] = "O";
                    best = Math.min(best, minimax(state, depth + 1, true));
                    state[i] = "";
                }
            }
            return best;
        }
    };

    const getBestMove = (state) => {
        let bestVal = -Infinity;
        let move = -1;
        for (let i = 0; i < 9; i++) {
            if (state[i] === "") {
                state[i] = "X";
                const moveVal = minimax(state, 0, false);
                state[i] = "";
                if (moveVal > bestVal) {
                    bestVal = moveVal;
                    move = i;
                }
            }
        }
        return move;
    };

    const getRandomAvailableMove = (state) => {
        const available = [];
        for (let i = 0; i < 9; i++) {
            if (state[i] === "") available.push(i);
        }
        return available[Math.floor(Math.random() * available.length)];
    };

    const executeAiTurn = () => {
        if (gameOver) return;

        const state = [...boxes].map((b) => b.innerText);
        let moveIndex = -1;

        if (aiMode === "easy" && Math.random() < 0.45) {
            moveIndex = getRandomAvailableMove(state);
        } else {
            moveIndex = getBestMove(state);
        }

        if (moveIndex !== -1 && boxes[moveIndex]) {
            playMove(boxes[moveIndex], moveIndex);
        }
    };

    // =========================================================================
    // Event Listeners
    // =========================================================================
    boxes.forEach((box, index) => {
        box.addEventListener("click", () => playMove(box, index));
        box.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                playMove(box, index);
            }
        });
    });

    resetRoundBtn.addEventListener("click", resetRound);
    newBtn.addEventListener("click", resetRound);
    resetMatchBtn.addEventListener("click", resetMatch);
    matchContinueBtn.addEventListener("click", resetMatch);

    soundBtn.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        localStorage.setItem("tttSound", String(soundEnabled));
        soundBtn.innerText = soundEnabled ? "🔊" : "🔇";
        if (soundEnabled) playClickSound(true);
    });

    aiModeSelect.addEventListener("change", (e) => {
        aiMode = e.target.value;
        localStorage.setItem("tttAiMode", aiMode);
        if (aiMode === "pvp" && playerNames.X === "Computer") {
            playerNames.X = "Player X";
        } else if (aiMode !== "pvp" && playerNames.X === "Player X") {
            playerNames.X = "Computer";
        }
        renderScores();
        resetRound();
    });

    settingsBtn.addEventListener("click", () => {
        settingsModal.classList.remove("hide");
    });

    settingsCloseBtn.addEventListener("click", () => {
        settingsModal.classList.add("hide");
    });

    settingsSaveBtn.addEventListener("click", () => {
        playerNames.O = playerONameInput.value.trim() || "Player O";
        playerNames.X = playerXNameInput.value.trim() || (aiMode === "pvp" ? "Player X" : "Computer");
        bestOf = parseInt(bestOfSelect.value);

        localStorage.setItem("tttNames", JSON.stringify(playerNames));
        localStorage.setItem("tttBestOf", String(bestOf));

        renderScores();
        renderTurnIndicator();
        settingsModal.classList.add("hide");
    });

    // Initial setup
    renderScores();
    applySettingsToUI();
    renderTurnIndicator();
});
