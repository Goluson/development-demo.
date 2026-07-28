document.addEventListener("DOMContentLoaded", () => {
    let boxes = document.querySelectorAll(".box");
    let resetbtn = document.querySelector("#resetbtn");
    let newGamebtn = document.querySelector("#new-btn");
    let msgContainer = document.querySelector(".msg-container");
    let msg = document.querySelector("#msg");
    let turnO = true;
    let count = 0;

// ============ NEW: element references for the added features ============
let turnIndicator = document.querySelector("#turn-indicator");
let scoreOEl = document.querySelector("#score-o");
let scoreXEl = document.querySelector("#score-x");
let scoreDrawEl = document.querySelector("#score-draw");
let vsComputerToggle = document.querySelector("#vs-computer-toggle");
let settingsBtn = document.querySelector("#settings-btn");
let settingsModal = document.querySelector("#settings-modal");
let settingsSaveBtn = document.querySelector("#settings-save-btn");
let settingsCloseBtn = document.querySelector("#settings-close-btn");
let playerONameInput = document.querySelector("#player-o-name");
let playerXNameInput = document.querySelector("#player-x-name");
let bestOfSelect = document.querySelector("#best-of-select");

// ============ NEW: game state for score tracking / settings / AI ============
let gameOver = false;
let scores = JSON.parse(localStorage.getItem("tttScores")) || { X: 0, O: 0, Draw: 0 };
let playerNames = JSON.parse(localStorage.getItem("tttNames")) || { X: "X", O: "O" };
let bestOf = parseInt(localStorage.getItem("tttBestOf")) || 5;

const winpatterns = [
    [0,1,2],
    [0,3,6],
    [0,4,8],
    [1,4,7],
    [2,5,8],
    [2,4,6],
    [3,4,5],
    [6,7,8],
];

// ============ NEW: render saved scores/settings into the UI on page load ============
const renderScores = () => {
    scoreXEl.innerText = scores.X;
    scoreOEl.innerText = scores.O;
    scoreDrawEl.innerText = scores.Draw;
};

const renderTurnIndicator = () => {
    const currentName = turnO ? playerNames.O : playerNames.X;
    turnIndicator.innerText = `Turn: ${currentName}`;
};

const applySettingsToUI = () => {
    playerONameInput.value = playerNames.O === "O" ? "" : playerNames.O;
    playerXNameInput.value = playerNames.X === "X" ? "" : playerNames.X;
    bestOfSelect.value = String(bestOf);
};

renderScores();
applySettingsToUI();
renderTurnIndicator();

const resetGame = () => {
    turnO = true;
    count = 0;
    gameOver = false;
    // NEW: clear the winning-box highlight from the previous round
    boxes.forEach((box) => box.classList.remove("winning-box"));
    enableBoxes();
    msgContainer.classList.add("hide");
    renderTurnIndicator();
};

boxes.forEach((box, index) => {
  box.addEventListener("click", () => {
    playMove(box, index);
  });

  // ============ NEW: keyboard support (Enter / Space to play a box) ============
  box.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      playMove(box, index);
    }
  });
});

// ============ NEW: extracted the click-handling logic into its own function
// so both mouse clicks and keyboard presses (and the AI) can reuse it ============
const playMove = (box, index) => {
    if (gameOver || box.innerText !== "") return;

    if(turnO){
      box.innerText = "O";
      turnO = false;
    } else {
      box.innerText = "X";
      turnO = true;
    }
    box.disabled = true;
    count++;
    renderTurnIndicator(); // NEW

    const winnerFound = checkWinner(); // FIXED: now actually returns true/false

    if (!winnerFound && count === 9) {
        handleDraw(); // FIXED: was previously unreachable-ish due to checkWinner() always being falsy
    }

    // ============ NEW: trigger the AI's move if "vs computer" is on and it's X's turn ============
    if (!winnerFound && count < 9 && vsComputerToggle.checked && turnO === false) {
        gameOver = false;
        setTimeout(aiMove, 300);
    }
};

const disableBoxes = () => {
    for (let box of boxes) {
        box.disabled = true;
    }
};

const enableBoxes = () => {
    for (let box of boxes) {
        box.disabled = false;
       //for reset all boxes
      box.innerText = "";
    }
};

// ============ NEW: split out so both a win and a draw can update the scoreboard ============
const handleDraw = () => {
    gameOver = true;
    msg.innerText = "Game Draw!";
    msgContainer.classList.remove("hide");
    scores.Draw++;
    saveAndRenderScores();
};

const showWinner = (winner, pattern) => {
    gameOver = true;
    const winnerName = playerNames[winner] || winner;

    // FIXED: was a single-quoted string, so `${Winner}` never interpolated,
    // and `Winner` (capital W) didn't even match the `winner` parameter.
    msg.innerText = `Congratulations, Winner is: ${winnerName}`;
    msgContainer.classList.remove("hide");

    // NEW: visually highlight the winning 3 boxes
    pattern.forEach((i) => boxes[i].classList.add("winning-box"));

    // NEW: update + persist the score
    scores[winner]++;
    saveAndRenderScores();

    disableBoxes();
};

// ============ NEW: persist scores to localStorage and refresh the UI ============
const saveAndRenderScores = () => {
    localStorage.setItem("tttScores", JSON.stringify(scores));
    renderScores();
    checkMatchWinner();
};

// ============ NEW: best-of-N match winner check ============
const checkMatchWinner = () => {
    const target = Math.ceil(bestOf / 2);
    if (scores.X >= target) {
        alert(`${playerNames.X} wins the match ${scores.X}-${scores.O}!`);
        resetMatch();
    } else if (scores.O >= target) {
        alert(`${playerNames.O} wins the match ${scores.O}-${scores.X}!`);
        resetMatch();
    }
};

const resetMatch = () => {
    scores = { X: 0, O: 0, Draw: 0 };
    saveAndRenderScores();
};

// FIXED: this used to check `pos1val` three times instead of pos1/pos2/pos3,
// never returned true/false, and never stopped after finding a winner.
const checkWinner = () => {
    for (let pattern of winpatterns) {
        let pos1val = boxes[pattern[0]].innerText;
        let pos2val = boxes[pattern[1]].innerText;
        let pos3val = boxes[pattern[2]].innerText;

        if (pos1val !== "" && pos2val !== "" && pos3val !== "") {
            if (pos1val === pos2val && pos2val === pos3val) {
                showWinner(pos1val, pattern);
                return true; // NEW: stop checking once a winner is found
            }
        }
    }
    return false; // NEW: previously nothing was returned at all
};

newGamebtn.addEventListener("click", resetGame);
resetbtn.addEventListener("click", resetGame);

// =====================================================================
// NEW SECTION: Minimax AI (unbeatable computer opponent, plays as "X")
// =====================================================================

// Pure helper: given a 9-length array of "", "X", "O", return the winner symbol or null.
const checkPatternWinner = (state) => {
    for (const [a, b, c] of winpatterns) {
        if (state[a] && state[a] === state[b] && state[b] === state[c]) return state[a];
    }
    return null;
};

// Classic minimax: X maximizes, O minimizes. Depth is subtracted/added so the
// AI prefers winning sooner and delaying losses as long as possible.
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

const bestMove = (state) => {
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

const aiMove = () => {
    if (gameOver) return;

    const state = [...boxes].map((b) => b.innerText);
    const idx = bestMove(state);
    if (idx === -1) return;

    boxes[idx].innerText = "X";
    boxes[idx].disabled = true;
    turnO = true; // hand the turn back to O
    count++;
    renderTurnIndicator();

    const winnerFound = checkWinner();
    if (!winnerFound && count === 9) {
        handleDraw();
    }
};


// NEW SECTION: Settings modal (player names + best-of-N match length)


settingsBtn.addEventListener("click", () => {
    settingsModal.classList.remove("hide");
});

settingsCloseBtn.addEventListener("click", () => {
    settingsModal.classList.add("hide");
});

settingsSaveBtn.addEventListener("click", () => {
    playerNames.O = playerONameInput.value.trim() || "O";
    playerNames.X = playerXNameInput.value.trim() || "X";
    bestOf = parseInt(bestOfSelect.value);

    localStorage.setItem("tttNames", JSON.stringify(playerNames));
    localStorage.setItem("tttBestOf", String(bestOf));

    renderTurnIndicator();
    settingsModal.classList.add("hide");
});
});
