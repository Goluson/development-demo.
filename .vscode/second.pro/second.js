let userScore = 0;
let compScore = 0;

const choices = document.querySelectorAll(".choice");

const msg = document.querySelector("#msg"); 

const userScorePara = document.querySelector("#user-score");
const compScorePara = document.querySelector("#comp-score");
// Generate computer's choice
const genCompChoice = () => { 
    const options = ["rock", "paper", "scisser"];
    const randIdx = Math.floor(Math.random() * 3);
    return options[randIdx];
};

const drawGame = () => {
    console.log("Game was draw.");
    msg.innerText= "Game Is Draw! Play Again :)";
    msg.computedStyleMap.backgroundcolor = "yelow"
};

const showWinner = (userWin, userChoice,compChoice) => {
   
    if(userWin){
        userScore++;
        userScorePara.innerText = userScore;
        console.log(`You win! ${userChoice} beats ${compChoice}`);
        msg.innerText = "You Win!";
        msg.computedStyleMap.backgroundcolor = "green";
    } else{
        compScore++;
        compScorePara.innerText = compScore;
        console.log(`You Lose! ${compChoice} beats ${userChoice}`);
         msg.innerText = "You Lose!";
        msg.computedStyleMap.backgroundcolor = "red";
    }
};

const playGame = (userChoice) => {
    console.log("User Choice =", userChoice);
    const compChoice = genCompChoice();
    console.log("Comp Choice =", compChoice);

    if (userChoice === compChoice) {
        drawGame();
    } else {
        let userWin = true;
        if(userChoice === "rock"){
            userWin = compChoice === "paper" ? false : true;
        } else if(userChoice === "paper") {
            userWin = compChoice === "scisser" ? false : true;
        } else {
            userWin = compChoice === "rock" ? false : true;
        }
        showWinner(userWin,userChoice,compChoice);
    }
};

// Add event listeners
choices.forEach((choice) => {
    choice.addEventListener("click", () => {
        const choiceId = choice.getAttribute("id");
        playGame(choiceId);
    });
});
