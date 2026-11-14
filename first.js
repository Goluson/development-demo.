/**
 * Tic-Tac-Toe Game Engine (4x4 Matrix & 3x3 Classic)
 * Features:
 * - Dynamic 4x4 (4-in-a-row) and 3x3 Grid Modes
 * - Smart AI with Threat Evaluation, Tactical Blocking, and Alpha-Beta Search
 * - Web Audio API sound synthesis
 * - Canvas confetti celebration
 * - Match series system (Best-of-N)
 * - LocalStorage persistence
 */

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const gameBoard = document.querySelector("#game-board");
    const turnIndicator = document.querySelector("#turn-indicator");
    const scoreOEl = document.querySelector("#score-o");
    const scoreXEl = document.querySelector("#score-x");
    const scoreDrawEl = document.querySelector("#score-draw");
    const labelPlayerO = document.querySelector("#label-player-o");
    const labelPlayerX = document.querySelector("#label-player-x");

    const gridSizeBtns = document.querySelectorAll(".grid-size-btn");
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

    // Game Configuration & State
    let gridSize = parseInt(localStorage.getItem("tttGridSize")) || 4; // Default to 4x4!
    let turnO = true;
    let count = 0;
    let gameOver = false;
    let boxes = [];
    let winpatterns = [];

    let soundEnabled = localStorage.getItem("tttSound") !== "false";
    let scores = JSON.parse(localStorage.getItem("tttScores")) || { X: 0, O: 0, Draw: 0 };
    let playerNames = JSON.parse(localStorage.getItem("tttNames")) || { O: "Player O", X: "Computer" };
    let bestOf = parseInt(localStorage.getItem("tttBestOf")) || 5;
    let aiMode = localStorage.getItem("tttAiMode") || "smart";

    // =========================================================================
    // Dynamic Win Pattern Generator
    // =========================================================================
    const generateWinPatterns = (size) => {
        const patterns = [];
        // Rows
        for (let r = 0; r < size; r++) {
            const row = [];
            for (let c = 0; c < size; c++) row.push(r * size + c);
            patterns.push(row);
        }
        // Columns
        for (let c = 0; c < size; c++) {
            const col = [];
            for (let r = 0; r < size; r++) col.push(r * size + c);
            patterns.push(col);
        }
        // Diagonals
        const diag1 = [];
        const diag2 = [];
        for (let i = 0; i < size; i++) {
            diag1.push(i * size + i);
            diag2.push(i * size + (size - 1 - i));
        }
        patterns.push(diag1);
        patterns.push(diag2);
        return patterns;
    };

    // =========================================================================
    // Board Initialization
    // =========================================================================
    const buildBoard = (size) => {
        gridSize = size;
        localStorage.setItem("tttGridSize", String(size));
        winpatterns = generateWinPatterns(size);

        gameBoard.innerHTML = "";
        gameBoard.className = `game-board grid-${size}x${size}`;
        boxes = [];

        const totalCells = size * size;
        for (let i = 0; i < totalCells; i++) {
            const btn = document.createElement("button");
            btn.className = "box";
            btn.dataset.index = String(i);
            btn.tabIndex = 0;
            btn.setAttribute("aria-label", `Cell ${i + 1}`);

            btn.addEventListener("click", () => playMove(btn, i));
            btn.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    playMove(btn, i);
                }
            });

            gameBoard.appendChild(btn);
            boxes.push(btn);
        }

        gridSizeBtns.forEach((b) => {
            b.classList.toggle("active", parseInt(b.dataset.size) === size);
        });

        resetRound();
    };

    // =========================================================================
    // Web Audio Synthesizer
    // =========================================================================
    let audioCtx = null;

    const initAudio = () => {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
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
        playTone(isO ? 540 : 400, 0.08, "triangle", 0.08);
    };

    const playWinSound = () => {
        if (!soundEnabled) return;
        setTimeout(() => playTone(523.25, 0.14, "sine", 0.12), 0);
        setTimeout(() => playTone(659.25, 0.14, "sine", 0.12), 110);
        setTimeout(() => playTone(783.99, 0.25, "sine", 0.14), 220);
        setTimeout(() => playTone(1046.50, 0.4, "sine", 0.16), 340);
    };

    const playDrawSound = () => {
        if (!soundEnabled) return;
        setTimeout(() => playTone(440, 0.15, "sine", 0.1), 0);
        setTimeout(() => playTone(349, 0.25, "sine", 0.1), 140);
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
                p.vy += 0.35;
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
    // Gameplay Logic
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
        const totalCells = gridSize * gridSize;

        if (!winnerFound && count === totalCells) {
            handleDraw();
            return;
        }

        // Trigger AI move if enabled and it's X's turn
        if (!winnerFound && count < totalCells && aiMode !== "pvp" && !turnO) {
            setTimeout(executeAiTurn, 280);
        }
    };

    const checkWinner = () => {
        for (let pattern of winpatterns) {
            const first = boxes[pattern[0]].innerText;
            if (first === "") continue;

            const isWin = pattern.every((idx) => boxes[idx].innerText === first);
            if (isWin) {
                showWinner(first, pattern);
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
        subMsgEl.innerText = `Connected ${gridSize} in a row for team ${winner}`;
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
        subMsgEl.innerText = "Full grid! Well contested by both sides.";
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
        matchWinnerScore.innerText = `${winnerName} won the match series ${winCount} - ${loseCount}!`;
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
    // Smart AI Engine (Heuristic Search for 4x4, Minimax for 3x3)
    // =========================================================================
    const checkStateWinner = (state) => {
        for (let pattern of winpatterns) {
            const first = state[pattern[0]];
            if (first !== "" && pattern.every((idx) => state[idx] === first)) {
                return first;
            }
        }
        return null;
    };

    // 3x3 Classic Minimax
    const minimax3x3 = (state, depth, isMaximizing) => {
        const winner = checkStateWinner(state);
        if (winner === "X") return 10 - depth;
        if (winner === "O") return depth - 10;
        if (!state.includes("")) return 0;

        if (isMaximizing) {
            let best = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (state[i] === "") {
                    state[i] = "X";
                    best = Math.max(best, minimax3x3(state, depth + 1, false));
                    state[i] = "";
                }
            }
            return best;
        } else {
            let best = Infinity;
            for (let i = 0; i < 9; i++) {
                if (state[i] === "") {
                    state[i] = "O";
                    best = Math.min(best, minimax3x3(state, depth + 1, true));
                    state[i] = "";
                }
            }
            return best;
        }
    };

    const get3x3BestMove = (state) => {
        let bestVal = -Infinity;
        let move = -1;
        for (let i = 0; i < 9; i++) {
            if (state[i] === "") {
                state[i] = "X";
                const moveVal = minimax3x3(state, 0, false);
                state[i] = "";
                if (moveVal > bestVal) {
                    bestVal = moveVal;
                    move = i;
                }
            }
        }
        return move;
    };

    // 4x4 Heuristic Strategic AI
    const get4x4SmartMove = (state) => {
        const size = 4;
        const total = 16;
        const available = [];
        for (let i = 0; i < total; i++) {
            if (state[i] === "") available.push(i);
        }
        if (available.length === 0) return -1;

        // 1. Immediate Win: Can X complete 4 in a row?
        for (let idx of available) {
            state[idx] = "X";
            if (checkStateWinner(state) === "X") {
                state[idx] = "";
                return idx;
            }
            state[idx] = "";
        }

        // 2. Critical Block: Can O win in 1 move? Block it!
        for (let idx of available) {
            state[idx] = "O";
            if (checkStateWinner(state) === "O") {
                state[idx] = "";
                return idx;
            }
            state[idx] = "";
        }

        // 3. Score all moves based on line building and center control
        const centerPositions = [5, 6, 9, 10]; // 4x4 inner core
        let bestScore = -Infinity;
        let chosenMove = available[0];

        for (let idx of available) {
            let score = 0;

            // Center control bonus
            if (centerPositions.includes(idx)) score += 8;

            // Evaluate impact on all lines containing this cell
            for (let pattern of winpatterns) {
                if (!pattern.includes(idx)) continue;

                let xCount = 0;
                let oCount = 0;
                let emptyCount = 0;

                for (let cell of pattern) {
                    if (cell === idx) xCount++; // hypothetical move
                    else if (state[cell] === "X") xCount++;
                    else if (state[cell] === "O") oCount++;
                    else emptyCount++;
                }

                if (oCount === 0) {
                    if (xCount === 3) score += 50; // create 3-in-a-row threat
                    else if (xCount === 2) score += 12; // create 2-in-a-row
                    else if (xCount === 1) score += 3;
                } else if (xCount === 1 && oCount === 2) {
                    // Block opponent's 2-in-a-row progression
                    score += 15;
                }
            }

            // Small randomness to make gameplay feel alive
            score += Math.random() * 2;

            if (score > bestScore) {
                bestScore = score;
                chosenMove = idx;
            }
        }

        return chosenMove;
    };

    const getRandomAvailableMove = (state) => {
        const available = [];
        for (let i = 0; i < state.length; i++) {
            if (state[i] === "") available.push(i);
        }
        return available[Math.floor(Math.random() * available.length)];
    };

    const executeAiTurn = () => {
        if (gameOver) return;

        const state = boxes.map((b) => b.innerText);
        let moveIndex = -1;

        if (aiMode === "easy" && Math.random() < 0.4) {
            moveIndex = getRandomAvailableMove(state);
        } else {
            if (gridSize === 3) {
                moveIndex = get3x3BestMove(state);
            } else {
                moveIndex = get4x4SmartMove(state);
            }
        }

        if (moveIndex !== -1 && boxes[moveIndex]) {
            playMove(boxes[moveIndex], moveIndex);
        }
    };

    // =========================================================================
    // Event Listeners
    // =========================================================================
    gridSizeBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const size = parseInt(btn.dataset.size);
            if (size !== gridSize) {
                buildBoard(size);
                resetMatch();
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

    // Initial Launch
    buildBoard(gridSize);
    renderScores();
    applySettingsToUI();
    renderTurnIndicator();
});
