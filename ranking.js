var tableCards = [];

//Contains the functions that are accessible from other files
module.exports = {
	determineRanking: function (player, table) {
		tableCards = table;
		if (player.rank == 0) {
			console.log(player.username + ":");
			if (royalFlush(player) > -1) {
				console.log("royal flush: " + royalFlush(player));
			} else if (straightFlush(player).indexOf(-1) == -1) {
				console.log("straight flush: " + straightFlush(player));
			} else if (fourOfAKind(player) > 0) {
				console.log("four of a kind: " + fourOfAKind(player));
			}	else if (fullHouse(player).indexOf(0) == -1) {
				console.log("full house: " + fullHouse(player));
			} else if (flush(player) > -1) {
				console.log("flush: " + flush(player));
			} else if (straight(player) > -1) {
				console.log("straight: " + straight(player));
			} else if (threeOfAKind(player) > 0) {
				console.log("three of a kind: " + threeOfAKind(player));
			} else if (twoPair(player).indexOf(0) == -1) {
				console.log("two pair: " + twoPair(player));
				return twoPair(player);
			} else if (pair(player) > 0) {
				console.log("pair: " + pair(player));
				return pair(player);
			} else {
				console.log("high card: " + highCard(player));
				return highCard(player);
			}
		}
	}
};

//Function which returns all the cards the player has access to (his hand + the tablecards)
function getAllCards(player) {
	var cards = [];
	cards.push(player.hand[0], player.hand[1]);
	for (var i = 0; i < tableCards.length; i++) {
		cards.push(tableCards[i]);
	}
	return cards;
}

function getAllCardValues(player) {
	var cards = getAllCards(player);
	var cardValues = [];
	for (var i = 0; i < cards.length; i++) {
		cardValues.push(cards[i].value);
	}	
	return cardValues;
}

function getAllCardTypes(player) {
	var cards = getAllCards(player);
	var cardTypes = [];
	for (var i = 0; i < cards.length; i++) {
		cardTypes.push(cards[i].type);
	}	
	return cardTypes;
}

//Loops through the cards, returns an array with the number of times a value(the index of the returned array) occurs
function countCardValues(cardValues) {
	var counts = [];
	for (var i = 0; i < 13; i++) {
		counts.push(0);
	}
	for (var i = 0; i < cardValues.length; i++) {
		counts[cardValues[i]]++;
	}
	return counts;
}

function countCardTypes(cardTypes) {
	var counts = [];
	for (var i = 0; i < 4; i++) {
		counts.push(0);
	}
	for (var i = 0; i < cardTypes.length; i++) {
		counts[cardTypes[i]]++;
	}
	return counts;
}

function highCard(player) {
	var cardValues = getAllCardValues(player);
	cardValues.sort(function (a, b) { return b - a });
	if (cardValues[cardValues.length - 1] == 0) {
		return 13;
	}
	else return cardValues[0];
}

function pair(player) {
	var cardValues = getAllCardValues(player);
	var counts = countCardValues(cardValues);
	if (counts[0] == 2) {
		return 13;
	}
	for (var i = 12; i > 0; i--) {
		if (counts[i] == 2) {
			return i;
		}
	}
	return 0;
}

//Returns an array with the pair values, the value is 0 if no pair is found
function twoPair(player) {
	var firstPair = pair(player);
	var secondPair = 0;
	if (firstPair > 0) {
		var cardValues = getAllCardValues(player);
		var counts = countCardValues(cardValues);
		for (var i = 12; i > 0; i--) {
			if (counts[i] == 2 && i != firstPair) {
				secondPair = i;
			}
		}
	}
	return [firstPair, secondPair];
}

function threeOfAKind(player) {
	var cardValues = getAllCardValues(player);
	var counts = countCardValues(cardValues);
	if (counts[0] == 3) {
		return 13;
	}
	for (var i = 12; i > 0; i--) {
		if (counts[i] == 3) {
			return i;
		}
	}
	return 0;
}

function fourOfAKind(player) {
	var cardValues = getAllCardValues(player);
	var counts = countCardValues(cardValues);
	if (counts[0] == 4) {
		return 13;
	}
	for (var i = 12; i > 0; i--) {
		if (counts[i] == 4) {
			return i;
		}
	}
	return 0;
}

//RETURNS -1 in case the player has no flush
function flush(player) {
	var cardTypes = getAllCardTypes(player);
	var counts = countCardTypes(cardTypes);
	for (var i = 0; i < counts.length; i++) {
		if (counts[i] >= 5) {
			return i;
		}
	}
	return -1;
}

function straight(player) {
	var cardValues = getAllCardValues(player);
	cardValues.sort(function (a, b) { return b - a });
	if (cardValues[cardValues.length - 1] == 0) {
		cardValues.push(13);
	}
	cardValues.sort(function (a, b) { return b - a });
	for (var i = 0; i < cardValues.length - 4; i++) {
		var indexer = i;
		for (var j = 0; j < 4; j++) {
			if (cardValues[indexer] -1 == (cardValues[indexer + 1])) {
				indexer++;
			}
			else {
				break;
			}
		}
		if (indexer == i + 4) {
			return cardValues[i];
		}
	}
	return -1;
}

function fullHouse(player){
	//Since the functions threeOfAKind and pair only return values greater than 0 if they explicitly find 3 and 2 of the counts (respectively)
	//We can simply use:
	return [threeOfAKind(player), pair(player)];
	//If the player does not have a three of a kind, or pair the function will return 0, thus returning an array [0,0]	
}

//Returns an array which contains a -1 if there player does not have both a straight and a flush
function straightFlush(player){	
	return [straight(player), flush(player)];
}

function royalFlush(player){
	var straightFlushValues = straightFlush(player); //An array formatted like [straightValue, flushType]
	//If the straight starts at 13 (ace), and the flushtype is not equal to -1
	if (straightFlushValues[0] == 13 && straightFlushValues[1] > -1) {
		return straightFlushValues[1]; //Return only the type of flush, since it is already known what the straight values are
	}
	return -1;
}