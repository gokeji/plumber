$(function(){
    // ====== Initializing game ======
    var canvas = $("canvas")[0],
        ctx = canvas.getContext("2d");

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    var FPS = 50;
    var counter = 0;
    var t = new Toilet();
    var plungers = [];
    var keys = [];

    var freq = [0.66, 1, 1.2, 1.3, 1.4, 1.5]; // Plungers per second for each level
    var fallSpeed = [4, 4, 5, 5, 6, 6, 7]; // Plungers falling speed for each level
    var score = 0;
    var maxHP = 3;
    var HP = maxHP;
    var level = 1;
    var remainingTime = TIME_PER_LEVEL;
    var gameOver = true;

    var toiletGrey = Sprite("toilet-grey", 0, 0, 50, 50); // HP toilet icon
    var toiletRed = Sprite("toilet-red", 0, 0, 50, 50); // HP toilet icon
    var muted = false;
    var displayText = "";
    var lastDisplayText = "";
    var showCenterText = false;
    var backgroundColor = "white";
    var paused = false;
    var gameGoing = false;

    //// preload sounds
    //Sound.preload(["bg.wav"], true);
    Sound = new Sound();
    Sound.init();

    // ====== Setting Game Loop ======

    var startLoop = function(){
        return setInterval(function() {
            update();
            draw();
        }, 1000/FPS);
    }

    var gameLoop = null;
    //var gameLoop = startLoop();
    //gameGoing = true;
    //gameOver = false;

    // Setup Screen
    ctx.save();
    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Press Spacebar to Start.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    ctx.restore();

    plungers.push(plunger()); // Add a plunger right away to start off the game with

    // ====== Toilet object constructor =======
    function Toilet(){
        this.width= 238;
        this.height= 338;
        this.x = 150;
        this.y = CANVAS_HEIGHT - this.height;
        this.velX = 0;
        this.friction = 0.96;
        this.spriteL = Sprite("toiletLBig", 0, 0, 238, 338);
        this.spriteR = Sprite("toiletRBig", 0, 0, 238, 338);
        this.direction = 1; // -1 is for left, 1 is for right;

    //    this.hole = {
    //        x1 : 35,
    //        x2 : 84,
    //        y : 96
    //    };
        this.hole = function(){
            if(this.direction == 1){ //return hole location for right-facing toilet
                return {
                    x1 : 86,
                    x2 : 205,
                    y : 221
                };
            } else { // return hole location for left-facing toilet
                return {
                    x1 : 33,
                    x2 : 152,
                    y : 221
                };
            }
        }

        this.update = function(){

            if (keys[39]) { // right
                if (this.velX < TOILET_MAX_SPEED) {
                    this.velX++;
                }
            }
            if (keys[37]) { // left
                if (this.velX > -TOILET_MAX_SPEED) {
                    this.velX--;
                }
            }

            this.velX *= this.friction;
            this.x += this.velX;

            if (this.x >= CANVAS_WIDTH - this.width) {
                this.x = CANVAS_WIDTH - this.width;
                this.velX *= -0.8;
            } else if (this.x <= 0) {
                this.x = 0;
                this.velX *= -0.8;
            }

            if(this.velX > 0){
                this.direction = 1;
            } else {
                this.direction = -1;
            }
        }

        this.draw = function(){
            if(this.velX > 0){
                this.spriteR.draw(ctx, this.x, this.y, this.width, this.height);
            } else {
                this.spriteL.draw(ctx, this.x, this.y, this.width, this.height);
            }
    //        ctx.fillStyle = "blue";
    //        ctx.fillRect(this.x, this.y, this.width, this.height);

            ctx.font = "12pt Arial";
    //        ctx.fillText("direction: "+this.direction, CANVAS_WIDTH - 400 , 150);
    //        ctx.fillText("plunger y: "+this.y, CANVAS_WIDTH - 150 , 150);

        }
    }

    // ====== Plunger object constructor =======
    function plunger(I) {
        I = I || {};

        I.alive = true;
        I.scored = false;
        I.age = Math.floor(Math.random() * 128);

        I.x = CANVAS_WIDTH / 4 + Math.random() * CANVAS_WIDTH / 2;
        I.y = 50;
        I.xVelocity = 0
        I.yVelocity = getVal(fallSpeed, level-1);

        I.width = 20;
        I.height = 55;
        I.sprite = Sprite("plunger2", 0, 0, 42, 114);

        I.inBounds = function() {
            return I.x >= 0 && I.x <= CANVAS_WIDTH &&
                I.y >= 0 && I.y <= CANVAS_HEIGHT;
        };

        I.draw = function() {
            ctx.fillStyle = "black";
            if(I.scored){
                if(this.y <= t.y + t.hole().y){
                    I.sprite.draw(ctx, this.x, this.y, this.width, t.y + t.hole().y - this.y);
    //                ctx.fillRect(this.x, this.y, this.width, this.width, t.y + t.hole().y - this.y);
                }
            } else {
                I.sprite.draw(ctx, this.x, this.y, this.width, this.height);
    //            ctx.fillRect(this.x, this.y, this.width, this.height);
            }

    //        ctx.fillRect(this.x, this.y, this.width, this.height);
    //        ctx.font = "12pt Arial";
    //        ctx.fillText("plunger x: "+this.x, CANVAS_WIDTH - 400 , 150);
    //        ctx.fillText("plunger y: "+this.y, CANVAS_WIDTH - 150 , 150);
    //        ctx.fillText("plunger x: "+this.width, CANVAS_WIDTH - 400 , 250);
    //        ctx.fillText("plunger y: "+this.height, CANVAS_WIDTH - 150 , 250);
        };

        I.update = function() {

            I.yVelocity = getVal(fallSpeed, level-1);

            if(I.scored){

                I.yVelocity *= 1.5;

                // plunger is in toilet so follow toilet
                if(I.x + I.xVelocity > t.x + t.hole().x2 || I.x + I.xVelocity < t.x + t.hole().x1){
                    I.xVelocity *= -0.9;
                }
            }
            I.x += I.xVelocity;
            I.y += I.yVelocity;

                // For swirling
                I.xVelocity = 3 * Math.sin(I.age * Math.PI / 64);
                I.age++;

            I.alive = I.alive && I.inBounds();

            if(collides (t,I)){
                if(!I.scored){
                    score++;
                    I.scored = true;
    //                Sound.play("explosion");
                }

            } else if(!I.inBounds() && !I.scored) {
                HP--;
            }

        };

        return I;
    }

    // Main draw function
    function draw() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // - BACKGROUND -


        // - FOREGROUND -
        t.draw();
        plungers.forEach(function(plunger) {
            plunger.draw();
        });


        // - OVERLAY -
        ctx.fillStyle = "black";
        ctx.font = "20pt Arial";
        ctx.textBaseline = "middle";
        ctx.fillText("Score:", CANVAS_WIDTH - 170 , 40);
        ctx.fillText("Health: ", CANVAS_WIDTH - 450 , 40);
        drawHP(CANVAS_WIDTH - 350, 20, 40, 40, 8, 3);

        // Level Display
        ctx.fillText("Level:", CANVAS_WIDTH - 170 , 90);


        // Time left for this level
        ctx.fillText("Next Level:", CANVAS_WIDTH - 170 , 140);

        ctx.font = "30pt Arial";
        ctx.fillText(score, CANVAS_WIDTH - 80 , 40);
        ctx.fillText(level, CANVAS_WIDTH - 80 , 90);
        ctx.font = "100px Arial";
        ctx.fillText(Math.ceil(remainingTime), CANVAS_WIDTH - 130 , 220);



        //Draw pause instructions
        ctx.font = "10pt Arial";

    //    ctx.textBaseline = "top"
    //    ctx.shadowColor = "#666"
    //    ctx.shadowOffsetX = 1;
    //    ctx.shadowOffsetY = 1;
    //    ctx.shadowBlur = 3;
        ctx.fillText("P: Pause/Resume", CANVAS_WIDTH - 130, CANVAS_HEIGHT - 30);

        // end game if no more HP
        if(HP <= 0)
            end();

        // pause game if paused
        if(paused){
            window.clearInterval(gameLoop);
            var lastDisplayText = displayText;
            displayText = "PAUSED";
            centerText();
        } else if(gameOver){ // End game if ended
            window.clearInterval(gameLoop);
            displayText = "GAME OVER";
            centerText();
            centerSubText("Press spacebar to play again.")
        } else if(showCenterText){
            centerText();
        }
    }

    // Main update function
    function update() {
        counter++;
        remainingTime -= 1/FPS;

        if(remainingTime <= 0){
            remainingTime += TIME_PER_LEVEL;
            level++;
            Sound.play("applauseFlush")
            newLevel();
            HP = maxHP;
        }

        // ========== Toilet movement ==========
        t.update();

        // ========== Plunger Movement ==========
        plungers.forEach(function(plunger) {
            plunger.update();

        });

        plungers = plungers.filter(function(plunger) {
            return plunger.alive;
        });

        // generate new plunger based on the value of freq
        if(counter >= FPS/getVal(freq, level-1) - 1){
    //    if(plungers.length == 0){
            counter = 0;
            plungers.push(plunger());
        }
    }

    // detection for whether the item fell straight into the toilet
    function collides(t, item) {
        var fallThreshold = 10; // height of the hitbox of the item falling into toilet
        return t.x + t.hole().x1 < item.x &&
            t.x + t.hole().x2 > item.x + item.width &&
            t.y + t.hole().y < item.y + item.height &&
            t.y + t.hole().y + fallThreshold > item.y + item.height;
    }

    document.body.addEventListener("keydown", function (e) {
        keys[e.keyCode] = true;
    });
    document.body.addEventListener("keyup", function (e) {
        keys[e.keyCode] = false;
        if(e.keyCode == 80) { // p
            if(!paused){
                // pause game
                pause();
            } else {
                resume();
            }
        } else if(e.keyCode == 32) {
            if(gameOver){
                start();
            }
        }
    });

    // Pause game
    function pause(){
        if(!gameOver && gameGoing) {
            paused = true;
            Sound.pauseAll();
            Sound.play("pause");
        }
    }

    // Resume game
    function resume() {
        if(gameOver || !paused)
            return;
        displayText = lastDisplayText;
        paused = false;
        gameLoop = startLoop();
        Sound.resumeAll();
    }

    // Draw text at center of screen
    function centerText(){
        ctx.save();
        ctx.font = "30pt Arial";
        ctx.textAlign = "center";
        ctx.fillText(displayText, CANVAS_WIDTH/2 , CANVAS_HEIGHT/3);
        ctx.restore();
    }

    // Draw subtext at center of screen
    function centerSubText(text){
        ctx.save();
        ctx.font = "20pt Arial";
        ctx.textAlign = "center";
        ctx.fillText(text, CANVAS_WIDTH/2 , CANVAS_HEIGHT/3 + 40);
        ctx.restore();
    }

    // Game end
    function end(){
        gameOver = true;
        Sound.stopAll();
        Sound.play("gameover");
    }

    // Start game
    function start(){
        gameOver = false;
        paused = false;
        gameGoing = false;
        HP = maxHP;
        counter = 0;
        t = new Toilet();
        plungers = [];
        score = 0;
        level = 1;
        remainingTime = TIME_PER_LEVEL;
        displayText = "";
        lastDisplayText = "";
        showCenterText = false;

        // Countdown from 3
        var cd = 3;

        ctx.save();
        ctx.font = "150px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        var countDown = function(){
            if(cd > 0){
                ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.fillText(cd, CANVAS_WIDTH/2 , CANVAS_HEIGHT/2);
                cd--;
                Sound.play("click");
                setTimeout(countDown, 1000);
            } else { // start actual game!
                ctx.restore();
                Sound.play("bg", true);
                gameLoop = startLoop();
                gameGoing = true;
            }
        }

        countDown();
    }

    // draws number of toilet HP icons at (x,y) with 'margin' px between
    function drawHP(x, y, w, h, margin){
        for (var i = 0; i < maxHP; i++){
            if(i < HP){
                toiletRed.draw(ctx, x, y, w, h);
            } else {
                toiletGrey.draw(ctx, x, y, w, h);
            }
            x = x + w + margin;
        }
    }

    // Displays a new level indication
    function newLevel(){
        showCenterText = true;
        displayText = "LEVEL "+ level;
        setTimeout(function(){ //stop display of new level after 1.5 seconds
            showCenterText = false;
        }, 2000);
    }
});
