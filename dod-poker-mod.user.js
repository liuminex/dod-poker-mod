// ==UserScript==
// @name         Poker Mod
// @version      0.1
// @description  Poker Mod Script for calculating win probabilities and play automatically
// @author       Γουόλτερ
// @match        https://www.dod.gr/*
// @run-at       document-end
// ==/UserScript==





/* ================================ POKER FUNCTIONS ================================ */



// Card deck setup with specified format
const DECK = [
    "Ad", "Ac", "Ah", "As", "Kd", "Kc", "Kh", "Ks", "Qd", "Qc", "Qh", "Qs",
    "Jd", "Jc", "Jh", "Js", "Td", "Tc", "Th", "Ts", "9d", "9c", "9h", "9s",
    "8d", "8c", "8h", "8s", "7d", "7c", "7h", "7s", "6d", "6c", "6h", "6s",
    "5d", "5c", "5h", "5s", "4d", "4c", "4h", "4s", "3d", "3c", "3h", "3s",
    "2d", "2c", "2h", "2s"
];

// Utility function to remove played cards from the deck
function poker_removePlayedCards(deck, playedCards) {
    return deck.filter(card => !playedCards.includes(card));
}

// Hand ranking constants
const RANK_ORDER = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const HAND_RANKINGS = {
    "High Card": 100,
    "Pair": 200,
    "Two Pair": 300,
    "Three of a Kind": 400,
    "Straight": 500,
    "Flush": 600,
    "Full House": 700,
    "Four of a Kind": 800,
    "Straight Flush": 900,
    "Royal Flush": 1000
};

// Function to evaluate and rank a poker hand
function poker_evaluateHand(two_hand, community) { // not perfectly accurate winning hands, but pretty close
    let suits = {};
    let ranks = {};
    let isFlush = false;
    let isStraight = false;
    let rankCounts = [];
    let sortedRanks = [];

    const hand = [...two_hand, ...community];

    // Count suits and ranks
    hand.forEach(card => {
        const rank = card[0];
        const suit = card[1];
        suits[suit] = (suits[suit] || 0) + 1;
        ranks[rank] = (ranks[rank] || 0) + 1;
    });

    // Check for flush
    isFlush = Object.values(suits).some(count => count >= 5);

    // Check for straight
    sortedRanks = Object.keys(ranks).map(rank => RANK_ORDER[rank]).sort((a, b) => a - b);
    for (let i = 0; i <= sortedRanks.length - 5; i++) {
        if (sortedRanks[i + 4] - sortedRanks[i] === 4) {
            isStraight = true;
            break;
        }
    }

    // find max card of two_hand:
    const max = (RANK_ORDER[two_hand[0][0]] > RANK_ORDER[two_hand[1][0]]) ? two_hand[0] : two_hand[1];

    // Check for four of a kind, full house, three of a kind, two pair, and pair
    rankCounts = Object.values(ranks).sort((a, b) => b - a);

    if (isFlush && isStraight && sortedRanks.includes(RANK_ORDER['A']) && sortedRanks[0] === 10) return HAND_RANKINGS["Royal Flush"] + RANK_ORDER[max[0]];
    if (isFlush && isStraight) return HAND_RANKINGS["Straight Flush"] + RANK_ORDER[max[0]];
    if (rankCounts[0] === 4) return HAND_RANKINGS["Four of a Kind"] + RANK_ORDER[max[0]];
    if (rankCounts[0] === 3 && rankCounts[1] === 2) return HAND_RANKINGS["Full House"] + RANK_ORDER[max[0]];
    if (isFlush) return HAND_RANKINGS["Flush"] + RANK_ORDER[max[0]];
    if (isStraight) return HAND_RANKINGS["Straight"] + RANK_ORDER[max[0]];
    if (rankCounts[0] === 3) return HAND_RANKINGS["Three of a Kind"] + RANK_ORDER[max[0]];
    if (rankCounts[0] === 2 && rankCounts[1] === 2) return HAND_RANKINGS["Two Pair"] + RANK_ORDER[max[0]];
    if (rankCounts[0] === 2) return HAND_RANKINGS["Pair"] + RANK_ORDER[max[0]];

    return HAND_RANKINGS["High Card"] + RANK_ORDER[max[0]];
}

// Function to estimate win probability
function poker_estimateWinProbability(myCards, playedCards, nonFoldedPlayers) {
    let wins = 0;
    let simulations = 10000;  // Number of simulations to estimate probabilities

    for (let i = 0; i < simulations; i++) {
        let deck = poker_removePlayedCards([...DECK], [...myCards, ...playedCards]);

        // Simulate random hands for remaining players
        let hands = []; // Contains pairs of cards, one for each player
        for (let j = 0; j < nonFoldedPlayers - 1; j++) {
            let hand = [];
            for (let k = 0; k < 2; k++) {  // Each player gets 2 cards
                let randomCardIndex = Math.floor(Math.random() * deck.length);
                hand.push(deck.splice(randomCardIndex, 1)[0]);
            }
            hands.push(hand);
        }

        // Generate community cards (fill up to 5 if not already provided)
        let communityFullCards = [...playedCards];
        while (communityFullCards.length < 5) {
            let randomCardIndex = Math.floor(Math.random() * deck.length);
            communityFullCards.push(deck.splice(randomCardIndex, 1)[0]);
        }

        // Evaluate your hand with community cards
        let myBestHand = poker_evaluateHand(myCards, communityFullCards);

        // Evaluate each opponent's hand
        let hasWon = true;
        for (let hand of hands) {
            let opponentBestHand = poker_evaluateHand(hand, communityFullCards);
            if (opponentBestHand > myBestHand) {
                hasWon = false;
                break;
            }
        }

        if (hasWon) wins++;
    }

    return wins / simulations;
}

// Example usage
let myCards = []; //["Ad", "Kd"];
let playedCards = []; //["Ah", "Ac", "Jh"];
let nonFoldedPlayers = -1;

function poker_resetAll(n_nonfolded){
    myCards = [];
    playedCards = [];
    nonFoldedPlayers = n_nonfolded;
}

// poker_estimateWinProbability(myCards, playedCards, nonFoldedPlayers);
// console.log(`Estimated win probability: ${(winProbability * 100).toFixed(2)}%`);

// poker_estimateWinProbability(['9s','3s'], ['9d','3d','2d','5h'], 4);

/* ================================ UI FUNCTIONS ================================ */

/* FIND UI ELEMENTS */

function findGamesButton() {
    return document.getElementById("component_bottom_middle_main_games");
}
function findPokerButton() {
    return getElByXPath("/html/body/div/div/div[7]/div[2]/div[2]/div/div/div/div[4]/div[2]/div[1]");
}
function findAvrioPaliButton(){
    return getElByXPath("/html/body/div[1]/div/div[7]/div[2]/div[2]/div[1]/div[1]/div[10]/div[2]/div[2]/div[6]/div[2]/div[3]");
}
function findFirstTable(){
    return document.querySelector(".trtable");
}
function findMpeiteStoTrapeziButton(){
    return document.querySelector("#casinotablejoin");
}
function findCloseGamesButton() {
    return document.querySelector("#topBarCloseButton");
}
function findModBoxLog() {
    return document.getElementById("modBoxLog");
}
function findCommunityCardsArea(){
    return document.getElementById("maincard_deck");
}
function findCardsArea(){
    return document.getElementById("cardsArea");
}
function findAllPlayers(){
    return document.getElementsByClassName("txplh");
}

/* MOD BOX */

function createModBox() {
    const menuBtn = document.createElement("button");
    menuBtn.innerHTML = "Open Poker Mod Menu";
    menuBtn.id = "menuBtnOpen";
    menuBtn.style.cssText = "display: none; position: fixed; bottom: 0; left: 0; z-index: 9998; cursor: pointer; background-color: rgba(35,37,46,0.8); color: #dc0303; border: solid 2px rgba(39,123,245,1); padding: 10px; font-size: 20px;";
    menuBtn.onclick = openModMenu;
    document.body.appendChild(menuBtn);

    const modBox = document.createElement("div");
    modBox.id = "modBox";
    modBox.style.cssText = "position: fixed; top: 0; left: 0; width: 400px; height: 100vh; background-color: rgba(35,37,46,0.8); z-index: 9999; font-size: 15px; overflow-y: auto; font-weight: bold; box-sizing: border-box;";
    modBox.innerHTML = `
        <div style='height: 30px; font-weight: bold; font-size: 17px; color: #dc0303; text-align:center; padding: 2px;'>Poker Mod Box <button id='closeModMenuBtn'
        style='border: solid 1px black; padding: 3px; margin: 2px; background: rgb(13,43,85); background: linear-gradient(180deg, rgba(13,43,85,1) 0%, rgba(26,81,161,1) 35%, rgba(39,123,245,1) 100%); font-weight: bold; color: #f5f5f5; cursor: pointer;'
        >close</button></div>

        <hr style='margin: 0 2px; color: #dc0303;'>

        <div style='padding: 5px;'> <!-- tabs contents -->

            <div id='mod-extras' style='padding: 7px; margin: 5px; border: solid 1px #676767; max-height: 200px; overflow-y: auto;'>
                <button id='openPokerBtn' style='border: solid 1px black; padding: 3px; margin: 2px; background: rgb(13,43,85); background: linear-gradient(180deg, rgba(13,43,85,1) 0%, rgba(26,81,161,1) 35%, rgba(39,123,245,1) 100%); font-weight: bold; color: #f5f5f5; cursor: pointer;'>Open Poker</button>
                <button id='extra-btn-0' style='border: solid 1px black; padding: 3px; margin: 2px; background: rgb(13,43,85); background: linear-gradient(180deg, rgba(13,43,85,1) 0%, rgba(26,81,161,1) 35%, rgba(39,123,245,1) 100%); font-weight: bold; color: #f5f5f5; cursor: pointer;'>Reset</button>
                <button id='extra-btn-1' style='border: solid 1px black; padding: 3px; margin: 2px; background: rgb(13,43,85); background: linear-gradient(180deg, rgba(13,43,85,1) 0%, rgba(26,81,161,1) 35%, rgba(39,123,245,1) 100%); font-weight: bold; color: #f5f5f5; cursor: pointer;'>Read My Cards</button>
                <button id='extra-btn-2' style='border: solid 1px black; padding: 3px; margin: 2px; background: rgb(13,43,85); background: linear-gradient(180deg, rgba(13,43,85,1) 0%, rgba(26,81,161,1) 35%, rgba(39,123,245,1) 100%); font-weight: bold; color: #f5f5f5; cursor: pointer;'>READ ALL</button>
            </div>

            <div id='cardsArea' style='max-height: calc(100vh - 500px); font-size: 0.7em; overflow-y: auto;'></div>

            <div id='modBoxLog' style='border: solid 1px #676767; padding: 7px; margin: 5px; max-height: 100px; overflow-y: auto;'></div>

        </div>
        `;
    document.body.appendChild(modBox);

    document.getElementById("closeModMenuBtn").onclick = closeModMenu;
    document.getElementById("openPokerBtn").onclick = dod_openPoker;

    document.getElementById("extra-btn-0").onclick = function(){ poker_resetAll(); };
    document.getElementById("extra-btn-1").onclick = function(){ findMyCurrentCards(); };
    document.getElementById("extra-btn-2").onclick = function(){ readAll(); };
}
function log(str) {
    findModBoxLog().innerHTML += "<p class='logtry'>" + str + "</p>";
    let logtry = document.getElementsByClassName("logtry");
    logtry[logtry.length - 1].scrollIntoView();
}
function closeModMenu() {
    document.getElementById("modBox").style.display = "none";
    document.getElementById("menuBtnOpen").style.display = "block";
}
function openModMenu() {
    document.getElementById("modBox").style.display = "block";
    document.getElementById("menuBtnOpen").style.display = "none";
}

/* MISC */

function callMouseDown(el){
    el.dispatchEvent(new MouseEvent("mousedown", {bubbles: true, cancelable: true, view: window}));
}
function getElByXPath(xpath){
    var result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
}
function randomHex(){
    return "#" + Math.floor(Math.random()*8388607).toString(16);
}
// color codes from bright red to orange to green (and trhe middles), total colors: 20?
const shadesOfRedToGreen = [
  "#ff0000", "#ff1a00", "#ff3300", "#ff4d00", "#ff6600",
  "#ff8000", "#ff9900", "#ffb200", "#ffcc00", "#ffe500",
  "#ffff00", "#e5ff00", "#ccff00", "#b2ff00", "#99ff00",
  "#80ff00", "#66ff00", "#4dff00", "#33ff00", "#1aff00", "#00ff00"
];
function prob_color(val, inverse=false){
  // the closer to 0 the redder it gets, the closer to 100 the greener it gets
  // if inverse=true, the closer to 0 the greener it gets, the closer to 100 the redder it gets

  modifier = 0;

  if(val < 0) val = 0;
  if(val > 100) val = 100;
  let index_pct = val / 100;

  if(inverse) index_pct = 1 - index_pct;

  return shadesOfRedToGreen[Math.round(index_pct*20)];

}

/* PARSE DATA FROM UI ELEMENTS */

function readCommunityCards(delay=3000){

    setTimeout(function(){
        playedCards = [];

        const cardEls = Array.from(findCommunityCardsArea().children).filter(cardEl => cardEl.className.includes("maincard") && !cardEl.className.includes("_backSide"));
        for(const i of cardEls){
            cardname = i.className.split(" ").find(c => c.startsWith("_")).split("_")[1];
            //log('cardname: ' + cardname);
            playedCards.push(cardname);
        }

        //log('community cards: ' + playedCards.join(", "));

    }, delay);

}

// folder detection does not work correctly yet
function isFolded(playerEl){
    const j = playerEl.getElementsByClassName("txplh_roundstatus")[0];
    for(const i of j.children){
        if(i.className.includes("fold") && i.style.display != "none"){
            return true;
        }
    }
    return false;
}
function getNumberOfPlayers(){ // initial (non-folded)
    return findAllPlayers().length;
}
function nPlayersFolded(){
    let n = 0;
    for(const i of findAllPlayers()){
        if(isFolded(i)){
            n++;
        }
    }
    return n;
}

function findMyCurrentCards() {
    const myCardsParent = document.getElementById("txoppanel_cards");
    myCards = ["",""];
    let counter=0;
    for(const i of myCardsParent.children){
        if(i.className.includes("maincard") && !i.className.includes("_backSide")){
            cardname = i.className.split(" ").find(c => c.startsWith("_")).split("_")[1];
            myCards[counter++] = cardname;
        }
    }
}

/* ACTIONS */

function dod_openPoker(){
    // open games
    callMouseDown(findGamesButton());
    log('opened games');

    // wait until poker button exists, then open poker and close games
    let pokerButtonInterval = setInterval(function(){
        if(findPokerButton()){
            callMouseDown(findPokerButton());
            log('opened poker');
            findCloseGamesButton().click();
            log('closed games');

            // wait until avrio pali button exists
            let counter = 0;
            let avrioPaliInterval = setInterval(function(){
                if(findAvrioPaliButton()){
                    callMouseDown(findAvrioPaliButton());
                    log('clicked avrio pali');
                    clearInterval(avrioPaliInterval);
                }
                if((counter++)>10) clearInterval(avrioPaliInterval);
            }, 1000);

            /*setTimeout(function(){
                let firstTableInterval = setInterval(function(){
                    if(findFirstTable()){
                        callMouseDown(findFirstTable());
                        log('clicked first table');

                        // wait 1.5 seconds and then click start:
                        setTimeout(function(){
                            callMouseDown(findMpeiteStoTrapeziButton());
                            log('clicked mpeite sto trapezi');
                        }, 1500);

                        clearInterval(firstTableInterval);
                    }
                }, 1000);
            }, 1500);*/

            clearInterval(pokerButtonInterval);
        }
    }, 1000);
}
function styleCards(cards) {
    const order = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    const groupedCards = {};
    cards.forEach(card => {
        let rank = card[0];
        if (rank === "T") rank = "10";
        if (!groupedCards[rank]) {
            groupedCards[rank] = [];
        }
        groupedCards[rank].push(card);
    });

    let sortedKeys = Object.keys(groupedCards).sort((a, b) => order.indexOf(a) - order.indexOf(b));

    let formattedCards = sortedKeys.map(rank => {
        const cardGroup = groupedCards[rank].map(card => {
            let displayRank = rank; // Use rank without suit for display
            let color = "white";

            // Determine color based on suit (second character in card)
            if (card.includes("d")) {
                color = "black";
            } else if (card.includes("h")) {
                color = "red";
            } else if (card.includes("s")) {
                color = "blue";
            } else if (card.includes("c")) {
                color = "#0cb635";
            }

            return `<span style='font-size: 1.6em; color: ${color}; background-color: white; padding: 1px 5px; margin: 2px; border-radius: 4px;'>${displayRank}</span>`;
        }).join(" ");

        return cardGroup;
    });

    return formattedCards.join(" ");
}
function dod_displayHand(){
    const ca = findCardsArea();
    const wind_prob = poker_estimateWinProbability(myCards, playedCards, nonFoldedPlayers);
    const colors = prob_color(wind_prob*100);
    if(nonFoldedPlayers<2){
        ca.innerHTML = `no data`;
        return;
    }
    ca.innerHTML = `
            <p><span>Me: </span><span>${styleCards(myCards)}</span></p>
            <p><span>Community: </span><span>${styleCards(playedCards)}</span></p>
            <p><span><abbr title='not folded opponents'>Active</abbr>: </span><span>${nonFoldedPlayers}</span></p>
            <p><span><abbr title='win probability'>P[win]</abbr> = </span><span style='color: ${colors}; font-size: 5em;'>${(wind_prob*100).toFixed(0)}%</span></p>
        `;
}
function addCommunityCardsListener(){
    // add event listener to detect every time a card is played
    // wait until cards area exists, then add event listener
    let cardsAreaInterval = setInterval(function(){
        if(findCommunityCardsArea()){
            log('added community cards listener');
            findCommunityCardsArea().addEventListener("DOMNodeInserted", function(){
                readCommunityCards();
                dod_displayHand();
            });
            clearInterval(cardsAreaInterval);
        }
    }, 1000);
}
function readAll(){
    readCommunityCards(1);
    findMyCurrentCards();
    nonFoldedPlayers = getNumberOfPlayers() - nPlayersFolded();
    dod_displayHand();
}


function startHand(){ // resets all
    poker_resetAll(dod_findNumberOfPlayers());
    addCommunityCardsListener();
    dod_displayHand();
}



/* ================================ MAIN ================================ */


createModBox();
//addCommunityCardsListener();

// every 2 seconds call readAll
setInterval(readAll, 1500);