

/**
 * Phaser Games Pack 1 - Black Jack Game Template
 * ----------------------------------------------
 *
 * This template is for the classic card game BlackJack, also often known as 21.
 *
 * To play the game, first set your bet. You start with $1000 in the bank. Use the
 * up and down arrows to increase or decrease the bet, then press Play to start.
 * The cards will be dealt, and then you can decide on your actions:
 * 
 * - Hit: Take another card from the dealer.
 * - Stand: Hold with the cards you've got.
 * - Double Down: Receive just one more card from the dealer, and double your bet.
 *
 * The aim is to have a total value of 21 from your cards. If you go over 21, you've
 * gone bust.
 *
 * See if you can break the casino, or go home shirtless!
 *
 * This version doesn't include the ability to surrender, or split your deck,
 * but aside from that it plays a mean game.
 *
 * See Wikipedia for the rules: https://en.wikipedia.org/wiki/Blackjack
 * 
 * In the 'psd' folder you'll find the PhotoShop files used to generate the
 * UI buttons in this game.
 *
 * The card assets are by Kenny Vleugels: http://kenney.nl/assets/boardgame-pack
 */

var BlackJack = {
    PLAYER: 0,
    DEALER: 1
};

/**
 * This is a Card object, used through-out the game internally.
 * It consists of a sprite, a suit, and a card value.
 */
BlackJack.Card = function (suit, value, texture) {

    if (texture === undefined) { texture = value; }

    this.suit = suit;
    this.value = value;
    this.texture = suit + texture;

    this.sprite = null;

};

BlackJack.Game = function (game) {

    //  The default bet amount
    this.bet = 10;

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

    this.turn = BlackJack.PLAYER;

    this.playerHandMin = 0;
    this.playerHandMax = 0;
    this.playerHandBest = 0;

    this.dealerHandMin = 0;
    this.dealerHandMax = 0;

    //  Toggle this to change how the dealer responds to a soft 17
    this.hitOnSoft17 = true;

};

BlackJack.Game.prototype = {

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

        this.hitButton = this.add.button(150, 530, 'buttons', this.clickHit, this, 'hitOver', 'hitOut', null, null, this.playGroup);
        this.hitButton.anchor.x = 0.5;

        this.standButton = this.add.button(400, 530, 'buttons', this.clickStand, this, 'standOver', 'standOut', null, null, this.playGroup);
        this.standButton.anchor.x = 0.5;

        this.doubleDownButton = this.add.button(650, 530, 'buttons', this.clickDoubleDown, this, 'doubleDownOver', 'doubleDownOut', null, null, this.playGroup);
        this.doubleDownButton.anchor.x = 0.5;

        //  Labels
        this.dealerText = this.add.text(0, 0, 'Dealer', { font: "bold 24px Arial", fill: "#fff", boundsAlignH: "left", boundsAlignV: "top" }, this.playGroup);
        this.dealerText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 2);
        this.dealerText.setTextBounds(620, 50, 100, 300);

        this.playerText = this.add.text(0, 0, 'Player', { font: "bold 24px Arial", fill: "#fff", boundsAlignH: "left", boundsAlignV: "top" }, this.playGroup);
        this.playerText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 2);
        this.playerText.setTextBounds(620, 270, 100, 300);

        this.cardsGroup = this.add.group();
        this.cardsGroup.scale.set(0.92);

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

        this.turn = BlackJack.PLAYER;

        this.hitButton.alpha = 1;
        this.standButton.alpha = 1;
        this.doubleDownButton.alpha = 1;

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

    },

    /**
     * Called when the 'increase bet' arrow is clicked
     */
    clickIncreaseBet: function () {

        this.bet = this.math.maxAdd(this.bet, 10, this.money);

        this.betText.text = "Bet $" + this.bet;

    },

    /**
     * Called when the 'decrease bet' arrow is clicked
     */
    clickDecreaseBet: function () {

        this.bet = this.math.minSub(this.bet, 10, 10);

        this.betText.text = "Bet $" + this.bet;

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

        this.initialDeal();

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

        var suits = [ 'clubs', 'spades', 'hearts', 'diamonds' ];

        for (var s = 0; s < suits.length; s++)
        {
            for (var i = 2; i <= 10; i++)
            {
                this.deck.push(new BlackJack.Card(suits[s], i));
            }
            
            this.deck.push(new BlackJack.Card(suits[s], 11, 'Ace'));
            this.deck.push(new BlackJack.Card(suits[s], 10, 'Jack'));
            this.deck.push(new BlackJack.Card(suits[s], 10, 'Queen'));
            this.deck.push(new BlackJack.Card(suits[s], 10, 'King'));
        }

    },

    /**
     * The first deal is two cards the player and dealer,
     * after which the players hand is calculated.
     */
    initialDeal: function () {

        this.dealCardToPlayer(0);

        this.dealCardToDealer(500, false);

        this.dealCardToPlayer(1000);

        var tween = this.dealCardToDealer(1500, true);

        tween.onComplete.add(this.calculatePlayerHand, this);

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
        var y = 300 + (this.hand.length * 10);

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
        var y = 40 + (this.dealer.length * 10);

        this.add.tween(card.sprite).to( { y: y }, 500, "Sine.easeIn", true, delay);
        var tween = this.add.tween(card.sprite).to( { x: x }, 500, "Sine.easeIn", true, delay + 250);

        this.dealer.push(card);

        return tween;

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

        if (doubleDown === undefined) { doubleDown = false; }

        var min = 0;
        var max = 0;

        this.hand.forEach(function(card) {

            //  A special condition for the Ace value (1 or 11)
            min += (card.value === 11) ? 1 : card.value;
            max += card.value;

        });

        this.playerHandMin = min;
        this.playerHandMax = max;
        this.playerHandBest = max;

        if (max > 21)
        {
            this.playerHandBest = min;
        }

        if (this.playerHandBest > 21)
        {
            this.playerText.text = "Player\n\n" + this.playerHandBest + " BUST!\n\nBet $" + this.bet;

            this.dealersTurn();
        }
        else
        {
            this.playerText.text = "Player\n\n" + this.playerHandBest + "\n\nBet $" + this.bet;

            if (this.playerHandBest === 21 || doubleDown)
            {
                //  Automatically switch to the dealers turn
                this.dealersTurn();
            }
        }

    },

    /**
     * The dealers turn. Basically just fades out the UI buttons, turns
     * over the dealers cards, then calculates his hand.
     */
    dealersTurn: function () {

        this.hitButton.alpha = 0.5;
        this.standButton.alpha = 0.5;
        this.doubleDownButton.alpha = 0.5;

        this.turn = BlackJack.DEALER;

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
                        if (this.playerHasBlackjack() && this.dealerHasBlackjack())
                        {
                            this.tie();
                        }
                        else if (this.dealerHasBlackjack())
                        {
                            this.dealerWins();
                        }
                        else if (this.playerHasBlackjack())
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

        if (this.turn === BlackJack.DEALER)
        {
            return;
        }

        var tween = this.dealCardToPlayer(0);

        tween.onComplete.add(this.calculatePlayerHand, this);

    },

    clickStand: function () {

        if (this.turn === BlackJack.DEALER)
        {
            return;
        }

        this.dealersTurn();

    },

    clickDoubleDown: function () {

        if (this.turn === BlackJack.DEALER)
        {
            return;
        }

        this.bet *= 2;

        this.playerText.text = "Player\n\n" + this.playerHandBest + "\n\nBet $" + this.bet;

        var tween = this.dealCardToPlayer(0);

        tween.onComplete.add(this.calculatePlayerHand, this, 0, true);

    },

    playerHasBlackjack: function () {

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

    dealerHasBlackjack: function () {

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

        if (this.playerHasBlackjack())
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

    }

};

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'game');

game.state.add('BlackJack.Game', BlackJack.Game, true);
