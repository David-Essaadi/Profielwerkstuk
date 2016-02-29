// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

//Include other files
var ranking = require('./ranking.js');

//Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-pokerserver';

//Port where we'll run the websocket server
var webSocketsServerPort = 1337;

//Websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

//Make a "class" to hold a card
function Card(value) {
	this.type = Math.floor(value / 13);
	this.value = value % 13;
	this.imagePath = "images/cards/" + value + ".png";
}

function EmptyCard() {
	this.imagePath = "images/cards/back.png";
}

function Player(connection, position, username, balance) {
	this.connection = connection;
	this.position = position;
	this.hand = [new EmptyCard(), new EmptyCard()];
	this.username = username;
	this.folded = false;
	this.bet = 0;
	this.balance = balance;
	this.rank = 0; //The best cards the player has determine this value, the lower the value the better
	this.acceptInput = false; //Flag that determines whether a player is allowed to send new data to the server
}

var players = [];
var availablePositions = []; //An array that will contain the available positions, new players will be asigned the first available position
var deck = []; //An array to contain every possible card in a deck
var tableCards = [new EmptyCard(), new EmptyCard(), new EmptyCard(), new EmptyCard(), new EmptyCard()];
var maxNumPlayers = 4;
var numPlayers = 0;
var updateInterval; //Variable to hold the interval that is set to update (needed to clear the interval later)
var updateIntervalTimeout = 2000; //Timeout in milliseconds between update calls

var started = false,
	handed = false,
	flopped = false,
	turned = false,
	rivered = false,
	ranked = false;

//Helper function for escaping input strings
function htmlEntities(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
//Http server setup
var server = http.createServer(function (request, response) {
    //Not important since the server used will be a websocket server, not an http server
});
server.listen(webSocketsServerPort, function () {
	console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});
//Websocket server setup
var ws = new webSocketServer({
	httpServer: server
});

(function init() {
	populateAvailablePositions();
	populateDeck();
	run();
})();



function getRandomCard() {
	var index = Math.floor(Math.random() * deck.length);
	var card = deck[index];
	deck.splice(index, 1);//Removes the element at the specified index and updates the array so that there are no missing elements
	return card;
}

function dealCards() {
	for (var i = 0; i < players.length; i++) {
		players[i].hand[0] = getRandomCard();
		players[i].hand[1] = getRandomCard();
	}
}

function sendData() {
	for (var i = 0; i < players.length; i++) {
		players[i].connection.sendUTF(JSON.stringify({
			type: 'message', data: {
				hand: players[i].hand,
				common: [tableCards[0], tableCards[1], tableCards[2], tableCards[3], tableCards[4]],
				position: players[i].position,
				numPlayers: numPlayers
			}
		}));
	}
}

function run() {
	update();
	updateInterval = setInterval(update, updateIntervalTimeout);
}

function allNamesSet(){
	for (var i = 0; i < numPlayers; i++) {
		if (players[i].username == null) {
			return false;
		}
	}
	return true;
}

function update() {
	if (!started) {
		if (numPlayers < maxNumPlayers) {
			return;
		} else if (!allNamesSet()) { 
			return;
		} else {
			started = true;
		}
	}
	if (!handed)
		handCards();
	else if (!flopped)
		flop();
	else if (!turned)
		turn();
	else if (!rivered)
		river();
	else if (!ranked)
		rank();
	else
		newRound();
	sendData();
}

function handCards() {
	dealCards();
	handed = true;
}

function flop() {
	for (var i = 0; i < 3; i++) {
		tableCards[i] = getRandomCard();
	}
	flopped = true;
}

function turn() {
	tableCards[3] = getRandomCard();
	turned = true;
}

function river() {
	tableCards[4] = getRandomCard();
	rivered = true;
}

function rank() {	
	for (var i = 0; i < numPlayers; i++) {
		ranking.determineRanking(players[i], tableCards);
	}
	console.log("*****************************");
	ranked = true;
}

function newRound() {
	clearInterval(updateInterval);
	tableCards = [new EmptyCard(), new EmptyCard(), new EmptyCard(), new EmptyCard(), new EmptyCard()];
	populateDeck();
	handed = false;
	flopped = false;
	turned = false;
	rivered = false;
	ranked = false;
	updateInterval = setInterval(update, updateIntervalTimeout);
	update();
}

function asignPosition() {
	for (var i = 0; i < availablePositions.length; i++) {
		if (availablePositions[i] != 0) {
			var asignedPos = availablePositions[i];
			availablePositions[i] = 0;
			return asignedPos;
		}
	}
}

function acceptInputFromPlayer(player) {
	//Set the acceptinput flag to true, so that the player can send data to the server at the allowed moment
	player.acceptInput = true;
}

function handleInput(player, input) {
	if (player.acceptInput) {

	}
}

//Populating functions:

//Fills the availablePositions array with positions
function populateAvailablePositions() {
	for (var i = 0; i < maxNumPlayers; i++) {
		availablePositions.push(i + 1);
	}
}

//Creates a new deck, and fills it with cards
function populateDeck() {
	deck = new Array();
	for (var i = 0; i < 52; i++) {
		deck.push(new Card(i));
	}
}

//Handling events
ws.on('request', function (request) {
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
	
	//Accepting connection - you should check 'request.origin' to make sure that the client is connecting from your website
	// (http://en.wikipedia.org/wiki/Same_origin_policy)
	
	var connection = request.accept(null, request.origin);
	if (numPlayers < maxNumPlayers) {
		//We need to know client index to remove them on 'close' event  
		var index = players.push(new Player(connection, asignPosition(), null, 50)) - 1;
		numPlayers++;
		console.log((new Date()) + ' Connection accepted.');
		sendData();
	}
	
	//Called when a client sends a message
	connection.on('message', function (message) {
		if (message.type === 'utf8') { //Accept only text
			console.log(message.utf8Data);
			//If the name has not been set yet, expect the message to be the player's username
			if (players[index].username == null) {
				players[index].username = message.utf8Data;
			}
			handleInput(players[index], message.utf8Data);
		}
	});
	
	//Called when a client disconnects
	connection.on('close', function (connection) {
		console.log((new Date()) + connection + " disconnected.");
		numPlayers--;
		players.splice(index);
    // remove user from the list of connected clients
    // TODO: clear up position, remove player from game
	});

});