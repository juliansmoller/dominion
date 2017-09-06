

// ================================================== 
// ================================================== Model

// ================================================== Rules
var Dominion = {};

Dominion.cards = {};
Dominion.cards['province'] = {vp:6,cost:8,value:0,type:['victory'],supply:'victory'};
Dominion.cards['duchy'] = {vp:3,cost:5,value:0,type:['victory'],supply:'victory'};
Dominion.cards['estate'] = {vp:1,cost:2,value:0,type:['victory'],supply:'victory'};
Dominion.cards['curse'] = {vp:-1,cost:0,value:0,type:['curse'],supply:'victory'};
Dominion.cards['gold'] = {vp:0,cost:6,value:3,type:['treasure'],supply:'treasure'};
Dominion.cards['silver'] = {vp:0,cost:3,value:2,type:['treasure'],supply:'treasure'};
Dominion.cards['copper'] = {vp:0,cost:0,value:1,type:['treasure'],supply:'treasure'};
Dominion.cards['cellar'] = {vp:0,cost:2,value:0,type:['action'],supply:'action'};
Dominion.cards['chapel'] = {vp:0,cost:2,value:0,type:['action'],supply:'action'};
Dominion.cards['moat'] = {vp:0,cost:2,value:0,type:['action','reaction'],supply:'action'};
Dominion.cards['village'] = {vp:0,cost:3,value:0,type:['action'],supply:'action'};
Dominion.cards['woodcutter'] = {vp:0,cost:3,value:2,type:['action'],supply:'action'};
Dominion.cards['workshop'] = {vp:0,cost:3,value:0,type:['action'],supply:'action'};
Dominion.cards['militia'] = {vp:0,cost:4,value:2,type:['action','attack'],supply:'action'};
Dominion.cards['remodel'] = {vp:0,cost:4,value:0,type:['action'],supply:'action'};
Dominion.cards['smithy'] = {vp:0,cost:4,value:0,type:['action'],supply:'action'};
Dominion.cards['market'] = {vp:0,cost:5,value:1,type:['action'],supply:'action'};
Dominion.cards['mine'] = {vp:0,cost:5,value:0,type:['action'],supply:'action'};

Dominion.getVictorySupply = function(nPlayers=2){
	if (nPlayers==2) {victorySupply={'province':8,'duchy':8,'estate':8,'curse':10};}
	else if (nPlayers==3) {victorySupply={'province':12,'duchy':12,'estate':12,'curse':20};}
	else if (nPlayers==4) {victorySupply={'province':12,'duchy':12,'estate':12,'curse':30};}
	else if (nPlayers==5) {victorySupply={'province':15,'duchy':15,'estate':15,'curse':40};}
	return victorySupply;
};
Dominion.getTreasureSupply = function(nPlayers=2){
	if (nPlayers==2 || nPlayers==3 || nPlayers==4) {
		treasureSupply={'copper':60-nPlayers*7,'silver':40,'gold':30};
	} else if (nPlayers==5 || nPlayers==6) {
		treasureSupply={'copper':120-nPlayers*7,'silver':80,'gold':60};
	}
	return treasureSupply;
};
Dominion.getAllActionCards = function(){
	// Get a list of all known action cards
	allActionCards = [];
	for (card in Dominion.cards){
		if (Dominion.cards[card].supply=='action') {
			allActionCards.push(card);
		}
	}
	return allActionCards;
};
Dominion.getActionSupply = function(){
	actionSupply = {};
	cards = Dominion.pickActionCards(n=10);
	for (i in cards){
		actionSupply[cards[i]] = 10; // 10 cards per pile
	}
	return actionSupply;
};
Dominion.pickActionCards = function(n=10){
	allActionCards = Dominion.getAllActionCards();
	allActionCards.sort(function() { return 0.5 - Math.random() });
	cards = allActionCards.slice(0,n);
	return cards;
};
Dominion.getInitialDeck = function(){ 
	return Array(3).fill('estate').concat(Array(7).fill('copper'));
};

// ================================================== Player
function Player(name) {
  this.name = name;
  this.firstInitial = ((name.length>0) ? name[0] : '?');
  this.game = null;
  // Cards can be in deck, in hand, in play, or in discard pile
  this.deck = [];
  this.hand = [];
  this.discard = [];
  this.inplay = []; 
  // Turn values reset at start/end of turn
  this.nCoins = 0;
  this.nActions = 0;
  this.nBuys = 0;

  this.log = function(message){this.game.log(message);}

  this.shuffleDeck = function(){
  	this.deck.sort(function() { return 0.5 - Math.random() });
  };

  this.drawCards = function(n=5) {
  	for (i=0; i<n; i++) { 
  		if (this.deck.length>0) { // at least one card left to draw
  			this.drawCard();
  		} else { // no cards left in deck
  			if (this.discard.length>0) { // at least one card in discard
  				this.recycleDiscard();
  				this.drawCard();
  			} else { // no cards in deck or in discard
  				break;
  			}
  		}
  	}

  };

  this.drawCard = function(){
  	this.hand.push(this.deck.shift());
  };

  this.recycleDiscard = function(){
  	this.deck = this.deck.concat(this.discard); // add discard pile to deck
  	this.discard=[]; // clear discard pile
  	this.shuffleDeck(); // reshuffled your deck
  };

  this.cleanup = function(){
  	this.discardCardsInPlay();
  	this.discardCardsInHand();
  	this.resetTurnValues();
  	this.drawCards();
  };

 this.discardCardsInPlay = function(){
  	this.discard = this.discard.concat(this.inplay);
  	this.inplay = [];
  };
  this.discardCardsInHand = function(){
  	this.discard = this.discard.concat(this.hand);
  	this.hand = [];
  };
  this.resetTurnValues = function(){
  	this.nCoins = 0;
  	this.nActions = 0;
  	this.nBuys = 0;
  };

};

// ================================================== Game
function Game(){

	this.players = [];
	this.supply = {};

	this.makePlayers = function(playerNames){
		for (i in playerNames) {
			var player = new Player(playerNames[i]);
			player.game = this;
			this.players.push(player);
		}
	};

	this.makeSupply = function(){
		nPlayers = this.players.length;
		this.supply['victory'] = Dominion.getVictorySupply(nPlayers=nPlayers);
		this.supply['treasure'] = Dominion.getTreasureSupply(nPlayers=nPlayers);
		this.supply['action'] = Dominion.getActionSupply();
	};
	this.distributeCards = function(){
		for (i in this.players) {
			this.players[i].deck = Dominion.getInitialDeck();
			this.players[i].shuffleDeck(this.view);
			this.players[i].drawCards();
		}
	};


};

// ================================================== 
// ================================================== View
function View(){
	
	// Make containers to store game data
	this.players = [];
	this.supply = {};

	// Find pre-existing divs in document
	this.doc = {}
	this.doc['gameLog'] = document.getElementById('gameLog');
	this.doc['gameTable'] = document.getElementById('gameTable');
	this.doc['supply'] = document.getElementById('supply');
	this.doc['victorySupply'] = document.getElementById('victorySupply');
	this.doc['treasureSupply'] = document.getElementById('treasureSupply');
	this.doc['actionSupply'] = document.getElementById('actionSupply');
	this.doc['actionSupplyRow1'] = document.getElementById('actionSupplyRow1');
	this.doc['actionSupplyRow2'] = document.getElementById('actionSupplyRow2');

	this.log = function(message){
		this.doc.gameLog.innerHTML += '<br>' + message;
	};

// ================================================== Players
	this.makePlayers = function(game){
		this.copyPlayerInfo(game);
		this.makePlayerDivs();
		this.makePlayerInfoDivs();
		this.makePlayerDeckDivs();
		this.makePlayerHandDivs();
		this.makePlayerPlayDivs();
		this.makePlayerDiscardDivs();
		this.logPlayers();
	};
	this.copyPlayerInfo = function(game){
		for (p in game.players){
			player = {};
			player['name'] = game.players[p].name;
			player['id'] = 'p'+p;
			this.players.push(player);
		}
	};
	this.makePlayerDivs = function(){
		for (p in this.players) {this.makePlayerDiv(this.players[p]);}};
	this.makePlayerDiv = function(player){
		var playerDiv = document.createElement('div');
		playerDiv.id = player['id'];
		playerDiv.className = 'player';
		player['div'] = playerDiv;
		this.doc.gameTable.appendChild(playerDiv);
	};
	this.makePlayerInfoDivs = function(){
		for (p in this.players) {this.makePlayerInfoDiv(this.players[p]);}};
	this.makePlayerInfoDiv = function(player){
		var infoDiv = document.createElement('div');
		infoDiv.id = player['id']+'info';
		infoDiv.className = 'playerInfo';
		infoDiv.innerHTML = player['name'];
		player['infoDiv'] = infoDiv;
		player['div'].appendChild(infoDiv);
	};
	this.makePlayerDeckDivs = function(){
		for (p in this.players) {this.makePlayerDeckDiv(this.players[p]);}};
	this.makePlayerDeckDiv = function(player){
		var deckDiv = document.createElement('div');
		deckDiv.id = player['id']+'deck';
		deckDiv.className = 'playerDeck';
		deckDiv.innerHTML = 'deck';
		player['deckDiv'] = deckDiv;
		player['div'].appendChild(deckDiv);
	};
	this.makePlayerHandDivs = function(){
		for (p in this.players) {this.makePlayerHandDiv(this.players[p]);}};
	this.makePlayerHandDiv = function(player){
		var handDiv = document.createElement('div');
		handDiv.id = player['id']+'hand';
		handDiv.className = 'playerHand';
		handDiv.innerHTML = 'hand';
		player['handDiv'] = handDiv;
		player['div'].appendChild(handDiv);
	};
	this.makePlayerPlayDivs = function(){
		for (p in this.players) {this.makePlayerPlayDiv(this.players[p]);}};
	this.makePlayerPlayDiv = function(player){
		var playDiv = document.createElement('div');
		playDiv.id = player['id']+'play';
		playDiv.className = 'playerPlay';
		playDiv.innerHTML = 'play';
		player['playDiv'] = playDiv;
		player['div'].appendChild(playDiv);
	};
	this.makePlayerDiscardDivs = function(){
		for (p in this.players) {this.makePlayerDiscardDiv(this.players[p]);}};
	this.makePlayerDiscardDiv = function(player){
		var discardDiv = document.createElement('div');
		discardDiv.id = player['id']+'discard';
		discardDiv.className = 'playerDiscard';
		discardDiv.innerHTML = 'discard';
		player['discardDiv'] = discardDiv;
		player['div'].appendChild(discardDiv);
	};
	this.logPlayers = function(){
		this.log("New game!");
		message = "Players: ";
		for (p in this.players){
			message += this.players[p].name + ' ';
		}
		this.log(message);
	};

// ================================================== Cards

	this.makeSupply = function(game){
		this.makeSupplyPiles(game);
		this.orderSupplyPiles();
		this.makeSupplyPileDivs();
		this.addSupplyPileImages();
		this.addSupplyPileCardCounts();
		this.addSupplyPileCardCcsts();
	};
	this.makeSupplyPiles = function(game){
		for (supplyType in game.supply){
			this.supply[supplyType] = [];
			for (card in game.supply[supplyType]){
				pile = {}
				pile['cardType'] = card;
				pile['nCards'] = game.supply[supplyType][card];
				pile['cost'] = Dominion.cards[card]['cost']; // for ordering
				this.supply[supplyType].push(pile);
			}
		}
	};
	this.orderSupplyPiles = function(){
		for (supplyType in this.supply){
			this.supply[supplyType].sort(function(a,b){
				return (b.cost - a.cost);
			});
		}
	};
	this.makeSupplyPileDivs = function(){
		for (supplyType in this.supply){
			for (i in this.supply[supplyType]){
				pile = this.supply[supplyType][i];
				pile['order'] = i; // so we know where to put it 
				pile['supplyType'] = supplyType;
				var div = document.createElement('div');
				div.className = 'supplyPile';
				if (supplyType=='action'){ div.className += ' actionSupplyPile'; }
				pile['div'] = div;
				this.addSupplyPileToDocument(pile);
			}
		}
	};
	this.addSupplyPileToDocument = function(pile){
		if (pile.supplyType == 'victory'){
			this.doc.victorySupply.appendChild(pile['div']);
		} else if (pile.supplyType == 'treasure'){
			this.doc.treasureSupply.appendChild(pile['div']);
		} else if (pile.supplyType == 'action'){
			if (pile.order<5) {
				this.doc.actionSupplyRow1.appendChild(pile['div']);
			} else {
				this.doc.actionSupplyRow2.appendChild(pile['div']);
			}
		} 
	};
	this.addSupplyPileImages = function(){
		for (supplyType in this.supply){
			for (i in this.supply[supplyType]){
				pile = this.supply[supplyType][i];
				var img = document.createElement('img');
				img.src = 'assets/cards/'+pile['cardType']+'.jpg';
				img.alt = pile['cardType'];
				img.className = 'supplyPileImage';
				pile['img'] = img;
				pile['div'].appendChild(img);
			}
		}
	};
	this.addSupplyPileCardCounts = function(){
		for (supplyType in this.supply){
			for (i in this.supply[supplyType]){
				pile = this.supply[supplyType][i];
				var cardCount = document.createElement('div');
				cardCount.className = 'cardCount';
				cardCount.innerHTML = pile['nCards'];
				pile['cardCount'] = cardCount;
				pile['div'].appendChild(cardCount);
			}
		}
	};
	this.addSupplyPileCardCcsts = function(){
		for (supplyType in this.supply){
			for (i in this.supply[supplyType]){
				pile = this.supply[supplyType][i];
				var cardCost = document.createElement('div');
				cardCost.className = 'cardCost';
				cardCost.innerHTML = pile['cost'];
				pile['cardCost'] = cardCost;
				pile['div'].appendChild(cardCost);
			}
		}
	};

}

// ================================================== 
// ================================================== Controller
function Controller(){
	this.game = null;
	this.view = null;
	this.makeGame = function(){this.game = new Game();};
	this.makeView = function(){this.view = new View();};
	this.makePlayers = function(playerNames){
		this.game.makePlayers(playerNames);
		this.view.makePlayers(this.game);
	};
	this.makeSupply = function(){
		this.game.makeSupply();
		this.view.makeSupply(this.game);
	};
}




// ============================= Do stuff

window.onload = function(){
	
	var c = new Controller();
	c.makeGame();
	c.makeView();
	c.makePlayers(['jigga','anna']);
	c.makeSupply();
	//console.log(c.view.supply);
	

};