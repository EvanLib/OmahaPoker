

var OmahaHi = {
    PLAYER: 0,
    OPPONENT: 1
};

/**
 * This is a Card object, used through-out the game internally.
 * It consists of a sprite, a suit, and a card value.
 */
OmahaHi.Card = function (suit, value, texture) {

    if (texture === undefined) { texture = value; }

    this.suit = suit;
    this.value = value;
    this.texture = suit + texture;

    this.sprite = null;

};

OmahaHi.Game = function (game) {

    //  The default bet amount
    this.bet = 10;

    //Debug
    this.debug = true;
    this.debugText = 'debug';
    this.stage = 'init';
    //  The default amount of money in the bank
    this.money = 1000;

    //  This Group contains all the UI used when placing your bet
    this.betGroup = null;

    this.upButton = null;
    this.downButton = null;
    this.playButton = null;
    this.betText = null;
    this.moneyText = null;

    //  This Group contains the game playing screen and UI
    this.playGroup = null;

    this.hitButton = null;
    this.standButton = null;
    this.doubleDownButton = null;
    this.dealerText = null;
    this.playerText = null;

    this.cardsGroup = null;

    this.deck = null;
    this.hand = null;
    this.dealer = null;
    //Community Table stuff
    this.community = null;

    this.turn = OmahaHi.PLAYER;

    this.playerHandMin = 0;
    this.playerHandMax = 0;
    this.playerHandBest = 0;

    this.dealerHandMin = 0;
    this.dealerHandMax = 0;

    //Omoha hi game stats
    this.pot = 0;
    this.blind = 10;

    //Player starts betting
    this.playerBet = 0;


    //  Toggle this to change how the dealer responds to a soft 17
    this.hitOnSoft17 = true;

};

OmahaHi.Game.prototype = {

    preload: function () {

        this.load.path = 'assets/';

        this.load.atlas('cards');
        this.load.atlas('buttons');

    },

    create: function () {

        this.game.stage.backgroundColor = '#146105';

        this.bet = 10;
        this.money = 1000;

        //  Group 1 - The placing a bet screen

        this.betGroup = this.add.group();

        this.moneyText = this.add.text(0, 0, 'Bank $1000', { font: "bold 48px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" }, this.betGroup);
        this.moneyText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 2);
        this.moneyText.setTextBounds(0, 50, 800, 100);

        this.upButton = this.add.button(this.world.centerX, 200, 'buttons', this.clickIncreaseBet, this, 'up', 'up', null, null, this.betGroup);
        this.upButton.anchor.x = 0.5;

        this.betText = this.add.text(0, 0, 'Bet $10', { font: "bold 40px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" }, this.betGroup);
        this.betText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 2);
        this.betText.setTextBounds(0, 250, 800, 100);

        this.downButton = this.add.button(this.world.centerX, 350, 'buttons', this.clickDecreaseBet, this, 'down', 'down', null, null, this.betGroup);
        this.downButton.anchor.x = 0.5;

        this.playButton = this.add.button(this.world.centerX, 480, 'buttons', this.clickPlay, this, 'playOver', 'playOut', null, null, this.betGroup);
        this.playButton.anchor.x = 0.5;

        //  Group 2 - The playing screen

        this.playGroup = this.add.group();


        //Round betting Group
        this.roundBetGroup =  this.add.group();
        this.callButton = this.add.button(150, 530, 'buttons', this.clickCallBet, this, 'hitOver', 'hitOut', null, null, this.roundBetGroup);
        this.callButton.anchor.x = 0.5;
        this.foldButton = this.add.button(400, 530, 'buttons', this.clickFoldBet, this, 'standOver', 'standOut', null, null, this.roundBetGroup);
        this.foldButton.anchor.x = 0.5;
        this.raiseButton = this.add.button(650, 530, 'buttons', this.clickRaiseBet, this, 'doubleDownOver', 'doubleDownOut', null, null, this.roundBetGroup);
        this.raiseButton.anchor.x = 0.5;


        //player betting Group
        this.playerBetGroup = this.add.group();

        this.upButton = this.add.button(this.world.centerX, 200, 'buttons', this.clickIncreaseBet, this, 'up', 'up', null, null, this.playerBetGroup);
        this.upButton.anchor.x = 0.5;

        this.betText = this.add.text(0, 0, 'Bet $10', { font: "bold 40px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" }, this.playerBetGroup);
        this.betText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 2);
        this.betText.setTextBounds(0, 250, 800, 100);

        this.downButton = this.add.button(this.world.centerX, 350, 'buttons', this.clickDecreaseBet, this, 'down', 'down', null, null, this.playerBetGroup);
        this.downButton.anchor.x = 0.5;

        this.raise = this.add.button(this.world.centerX, 480, 'buttons', this.clickBet, this, 'playOver', 'playOut', null, null, this.playerBetGroup);
        this.raise.anchor.x = 0.5;




        //  Labels
        this.dealerText = this.add.text(0, 0, 'Dealer', { font: "bold 24px Arial", fill: "#fff", boundsAlignH: "left", boundsAlignV: "top" }, this.playGroup);
        this.dealerText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 2);
        this.dealerText.setTextBounds(620, 50, 100, 300);

        this.playerText = this.add.text(0, 0, 'Player', { font: "bold 24px Arial", fill: "#fff", boundsAlignH: "left", boundsAlignV: "top" }, this.playGroup);
        this.playerText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 2);
        this.playerText.setTextBounds(620, 270, 100, 300);

        this.cardsGroup = this.add.group();
        this.cardsGroup.scale.set(0.50);
        //Debug Info
       if( this.debug)
       {
           this.debugInfo= this.add.text(0, 0, this.debugText, { font: "bold 14px Arial", fill: "#ff0000", boundsAlignH: "left", boundsAlignV: "top" }, this.playGroup);

        this.debugInfo.setTextBounds(620, 425, 100, 300);
       }

        this.startRound();

    },

    /**
     * This starts a new round going.
     *
     * It removes all of the cards (if visible) and swaps in the betting UI
     * and text fields, unless you've run out of money!
     */
    startRound: function () {

        this.cardsGroup.removeAll(true, true);

        if (this.bet > this.money)
        {
            this.bet = this.money;
        }

        this.turn = OmahaHi.PLAYER;

        if (this.money === 0)
        {
            this.moneyText.text = "You are bankrupt!";

            this.playButton.visible = false;
            this.upButton.visible = false;
            this.downButton.visible = false;
            this.betText.visible = false;
        }
        else
        {
            this.moneyText.text = "Bank $" + this.money;
            this.betText.text = "Bet $" + this.bet;
        }

        this.betGroup.visible = true;
        this.playGroup.visible = false;
        this.roundBetGroup.visible = false;
        this.playerBetGroup.visible = false;


    },

    /** Called when the 'increase bet' arrow is clicked */
    clickIncreaseBet: function () {

        this.playerBet = this.math.maxAdd(this.playerBet, 10, this.money);

        this.betText.text = "Bet $" + this.playerBet;

    },

    /**
     * Called when the 'decrease bet' arrow is clicked
     */
    clickDecreaseBet: function () {

        this.playerBet = this.math.minSub(this.playerBet, 10, 10);

        this.betText.text = "Bet $" + this.playerBet;

    },

    clickCallBet: function() {
      this.updateDebugInfo("clicked call");
      this.pot += this.blind;
      this.money -= this.blind;

      this.turn = OmahaHi.OPPONENT;
      this.stageBet();
    },
    clickRaiseBet: function() {
      this.updateDebugInfo("clicked Raise");
      this.playerBetGroup.visible = true;
    },
    clickFoldBet: function() {
      this.opponentWins();
    },

    /*
    * During raise bet button
    */
    clickBet: function() {
      //make invisible
      this.playerBetGroup.visible = false;

      this.playersMoney -= this.playerBet;
      this.pot += this.playerBet;

      this.turn = OmahaHi.OPPONENT;
      this.stageBet();
    },

    /**
     * Called when the play button is clicked, after the bet has been set.
     */
    clickPlay: function () {

        this.betGroup.visible = false;

        this.dealerText.text = "Dealer";
        this.playerText.text = "Player\n\n\n\nBet $" + this.bet;

        this.playGroup.visible = true;
        this.resetDeck();

        this.hand = [];
        this.dealer = [];
        //Community card array
        this.community = [];
        this.initialDeal();

        this.pot = this.blind

    },

    //  The core Game Loop starts here

    /**
     * Resets the whole deck of cards.
     */
    resetDeck: function () {

        //  Create our deck of cards
        //
        //  Clubs, Spades, Hearts, Diamonds
        //  2 - 10, Ace, Jack, Queen, King

        this.deck = [];

        var suits = [ 'c', 's', 'h', 'd' ];

        for (var s = 0; s < suits.length; s++)
        {
            for (var i = 2; i <= 10; i++)
            {
                this.deck.push(new OmahaHi.Card(suits[s], i));
            }

            this.deck.push(new OmahaHi.Card(suits[s], 1, 'Ace'));
            this.deck.push(new OmahaHi.Card(suits[s], 11, 'Jack'));
            this.deck.push(new OmahaHi.Card(suits[s], 12, 'Queen'));
            this.deck.push(new OmahaHi.Card(suits[s], 13, 'King'));
        }

    },

    /**
     * The first deal is two cards the player and dealer,
     * after which the players hand is calculated.
     */
    initialDeal: function () {

        for (var i = 0; i < 4; i++) {
          this.dealCardToPlayer(500*i, true);
          tween = this.dealCardToDealer(600*i, false);
        }

        //betting stageBet
        tween.onComplete.add(this.stageBet(), this);
    },

    /**
     * Deals a random card to the player.
     *
     * You'll want to adjust the coordinates used in here if you change
     * the layout of the game screen around.
     */
    dealCardToPlayer: function (delay) {

        var card = this.getCardFromDeck();

        card.sprite = this.cardsGroup.create(400, -200, 'cards', card.texture);
        card.sprite.bringToTop();

        var x = 32 + (this.hand.length * 80);
        var y = 560

        this.add.tween(card.sprite).to( { y: y }, 500, "Sine.easeIn", true, delay);
        var tween = this.add.tween(card.sprite).to( { x: x }, 500, "Sine.easeIn", true, delay + 250);

        this.hand.push(card);

        return tween;

    },

    /**
     * Deals a random card to the dealer.
     *
     * You'll want to adjust the coordinates used in here if you change
     * the layout of the game screen around.
     */
    dealCardToDealer: function (delay, show) {

        var card = this.getCardFromDeck();

        var frame = (show) ? card.texture : 'back';

        card.sprite = this.cardsGroup.create(400, -200, 'cards', frame);
        card.sprite.bringToTop();

        var x = 32 + (this.dealer.length * 80);
        var y = 40

        this.add.tween(card.sprite).to( { y: y }, 500, "Sine.easeIn", true, delay);
        var tween = this.add.tween(card.sprite).to( { x: x }, 500, "Sine.easeIn", true, delay + 250);

        this.dealer.push(card);

        return tween;

    },
    dealFlop: function (delay, show)
    {
      var card1 = this.getCardFromDeck();
      var card2 = this.getCardFromDeck();
      var card3 = this.getCardFromDeck();

      card1.sprite = this.cardsGroup.create(400, -200, 'cards', card1.texture);
      card2.sprite = this.cardsGroup.create(400, -200, 'cards', card2.texture);
      card3.sprite = this.cardsGroup.create(400, -200, 'cards', card3.texture);


      this.community.push(card1, card2, card3);
      var x = 150
      var y = 300;

      //Card 1
      this.add.tween(card1.sprite).to( { y: y }, 500, "Sine.easeIn", true, delay);
      this.add.tween(card1.sprite).to( { x: x }, 500, "Sine.easeIn", true, delay + 250);

      //Card 2
      this.add.tween(card2.sprite).to( { y: y }, 500, "Sine.easeIn", true, delay);
      this.add.tween(card2.sprite).to( { x: x + 160 }, 500, "Sine.easeIn", true, delay + 250);

      //Card 3
      this.add.tween(card3.sprite).to( { y: y }, 500, "Sine.easeIn", true, delay);
      var tween = this.add.tween(card3.sprite).to( { x: x + 320 }, 500, "Sine.easeIn", true, delay + 250);

      return tween;

    },

    /**
    * Allow openent and player chagne betting...
    * should be cool and stuff.
    */

    stageBet: function() {
      this.updateDebugInfo("stage bet");
      this.complete = false;
      this.roundBetGroup.visible = false;

      switch (this.turn) {
        case 0:
            var complete = this.playerBetStage();
          break;
        case 1:
          this.opponentBetStage();
          break;
        default:
          return;

      }


      //Player is given 3 options
      //flop
      tween = this.dealFlop(0, false);
      tween.onComplete.add(this.stageBet(), this);
    },

    playerBetStage: function() {
      this.roundBetGroup.visible = true;
    },
    /**
     * Calculates what the player has in their hand.
     *
     * Called automatically after the initial deal, and also
     * after the players action.
     *
     * Automatically calls dealersTurn, and updates display text.
     */
    calculatePlayerHand: function (card, tween, doubleDown) {
      //debug text
      this.debugText = "calculate Hand Called";

    },

    /**
     * The dealers turn. Basically just fades out the UI buttons, turns
     * over the dealers cards, then calculates his hand.
     */
    dealersTurn: function () {

        this.hitButton.alpha = 0.5;
        this.standButton.alpha = 0.5;
        this.doubleDownButton.alpha = 0.5;

        this.turn = OmahaHi.OPPONENT;

        //  Turn over the hole card (tween it?)
        this.dealer[0].sprite.frameName = this.dealer[0].texture;

        this.calculateDealerHand();

    },

    /**
     * The dealers hand calculation.
     * Looks at the value in his hand, compares to the player, then carries
     * on going until he either wins or busts.
     */
    calculateDealerHand: function () {

        var min = 0;
        var max = 0;

        this.dealer.forEach(function(card) {

            //  A special condition for the Ace value (1 or 11)
            min += (card.value === 11) ? 1 : card.value;
            max += card.value;

        });

        this.dealerHandMin = min;
        this.dealerHandMax = max;
        this.dealerHandBest = max;

        if (max > 21)
        {
            this.dealerHandBest = min;
        }

        if (this.dealerHandBest > 21)
        {
            this.dealerText.text = "Dealer\n\n" + this.dealerHandBest + " BUST!";

            this.playerWins();
        }
        else
        {
            this.dealerText.text = "Dealer\n\n" + this.dealerHandBest;

            if (this.playerHandBest > 21)
            {
                this.dealerWins();
            }
            else
            {
                if (this.dealerHandBest < 17)
                {
                    var tween = this.dealCardToDealer(1500, true);
                    tween.onComplete.add(this.calculateDealerHand, this);
                }
                else
                {
                    if (this.dealerHandBest < this.playerHandBest)
                    {
                        this.playerWins();
                    }
                    else if (this.dealerHandBest > this.playerHandBest)
                    {
                        this.dealerWins();
                    }
                    else
                    {
                        if (this.playerHasOmahaHi() && this.dealerHasOmahaHi())
                        {
                            this.tie();
                        }
                        else if (this.dealerHasOmahaHi())
                        {
                            this.dealerWins();
                        }
                        else if (this.playerHasOmahaHi())
                        {
                            this.playerWins();
                        }
                        else
                        {
                            this.tie();
                        }
                    }
                }
            }
        }

    },

    //  From this point on is mostly UI related functions, such as clicking
    //  the various buttons and responding to them. You'll find text set
    //  in the functions, so be sure to update that as needed.

    clickHit: function () {

        if (this.turn === OmahaHi.OPPONENT)
        {
            return;
        }

        var tween = this.dealCardToPlayer(0);

        tween.onComplete.add(this.calculatePlayerHand, this);

    },

    clickStand: function () {

        if (this.turn === OmahaHi.OPPONENT)
        {
            return;
        }

        this.dealersTurn();

    },

    clickDoubleDown: function () {

        if (this.turn === OmahaHi.OPPONENT)
        {
            return;
        }

        this.bet *= 2;

        this.playerText.text = "Player\n\n" + this.playerHandBest + "\n\nBet $" + this.bet;

        var tween = this.dealCardToPlayer(0);

        tween.onComplete.add(this.calculatePlayerHand, this, 0, true);

    },

    playerHasOmahaHi: function () {

        if (this.hand.length === 2 && this.playerHandBest === 21)
        {
            if ((this.hand[0].value === 11 && this.hand[1].value === 10) ||
                (this.hand[0].value === 10 && this.hand[1].value === 11))
            {
                return true;
            }
        }

        return false;

    },

    dealerHasOmahaHi: function () {

        if (this.dealer.length === 2 && this.dealerHandBest === 21)
        {
            if ((this.dealer[0].value === 11 && this.dealer[1].value === 10) ||
                (this.dealer[0].value === 10 && this.dealer[1].value === 11))
            {
                return true;
            }
        }

        return false;

    },

    /**
     * Called if the players hand wins.
     * Adds the money to their winnings, updates the text, and adds a click listener
     * to take them back to the betting screen.
     */
    playerWins: function () {

        var winnings = this.bet;

        if (this.playerHasOmahaHi())
        {
            winnings = this.bet + (this.bet * 0.5);
        }

        console.log("Player won $" + winnings);

        this.money += winnings;

        if (this.dealerHandBest > 21)
        {
            this.dealerText.text = "Dealer LOST\n\n" + this.dealerHandBest + " BUST!";
        }
        else
        {
            this.dealerText.text = "Dealer LOST\n\n" + this.dealerHandBest;
        }

        this.playerText.text = "Player WINS\n\n" + this.playerHandBest + "\n\nBet $" + this.bet;

        this.input.onDown.addOnce(this.startRound, this);

    },

    /**
     * Called if the dealers hand wins.
     * Takes the money from the player, updates the text, and adds a click listener
     * to take them back to the betting screen.
     */
    dealerWins: function () {

        console.log("Player lost $" + this.bet);

        this.money -= this.bet;

        if (this.money < 0)
        {
            this.money = 0;
        }

        this.dealerText.text = "Dealer WON\n\n" + this.dealerHandBest;

        if (this.playerHandBest > 21)
        {
            this.playerText.text = "Player LOST\n\n" + this.playerHandBest + " BUST!\n\nBet $" + this.bet;
        }
        else
        {
            this.playerText.text = "Player LOST\n\n" + this.playerHandBest + "\n\nBet $" + this.bet;
        }

        this.input.onDown.addOnce(this.startRound, this);

    },

    tie: function () {

        this.dealerText.text = "Dealer TIE\n\n" + this.dealerHandBest;
        this.playerText.text = "Player TIE\n\n" + this.playerHandBest + "\n\nBet $" + this.bet;

        this.input.onDown.addOnce(this.startRound, this);

    },

    getCardFromDeck: function () {

        var index = this.rnd.between(0, this.deck.length - 1);

        var card = this.deck.splice(index, 1)[0];

        return card;

    },
    /*
    * Random Utillities

    */

    updateDebugInfo(debugInfoText) {

      this.debugInfo.text = debugInfoText;
    }
};





var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'game');

game.state.add('OmahaHi.Game', OmahaHi.Game, true);
