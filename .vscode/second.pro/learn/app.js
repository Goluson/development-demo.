let btn = document.querySelector("button");
btn.addEventListener("click", async ()=>{
   //console.log("button was clicked");
   let fact = await getFact();
   console.log(fact);
   let p = document.querySelector("#result");
   p.innerText = fact;
});

let url = "https://catfact.ninja/fact";

async function getFact() {
try {
    let res = await axios.get(url);
     return res.data.fact;
} catch (e) {
    console.log("ERROR -",e);
    return "no fact found";
}
}