$(function(){

    // ====== Initializing game ======
    var onscreenCanvas = $("canvas")[0];
    onscreenCanvas.width = CANVAS_WIDTH;
    onscreenCanvas.height = CANVAS_HEIGHT;
    var drawContext = onscreenCanvas.getContext("2d");

    var FPS = 50;
    var counter = 0;
    var t = new Toilet();
    var plungers = [];
    var keys = [];

    var freq = [0.66, 1, 1.2, 1.3, 1.4, 1.5]; // Plungers per second for each level
    var fallSpeed = [4, 4, 5, 5, 6, 6, 7, 7]; // Plungers falling speed for each level
    var swirlSpeed = [2, 3, 4, 5];
    var score = 0;
    var highscore = parseInt(getCookie("highscore")) || 0;
    
    var maxHP = 5;
    var HP = maxHP;
    var level = 1;
    var levelToSwirl = 5;
    var remainingTime = TIME_PER_LEVEL;
    var gameOver = true;

    var helpText = Sprite("helpText", 0, 0, 169, 46); // help text (mute / pause)
    var header = Sprite("header", 0, 0, 1000, 114); // header background
    var toiletGrey = Sprite("hp", 0, 0, 50, 59); // HP toilet icon
    var toiletRed = Sprite("hp2", 0, 0, 50, 59); // HP toilet icon
    var bg = Sprite("bg", 0, 0, 1000, 700); // Canvas background 
    var muted = false;
    var displayText = "";
    var lastDisplayText = "";
    var lastPlungerXPos = 500;
    var showCenterText = false;
    var backgroundColor = "white";
    var paused = false;
    var gameGoing = false;
    var initialLoad = true;
    var currentCD = 5;

    // var soundURL = "sounds/";
    var imagesToLoad = ["hp", "hp2", "bg", "header", "helpText", "toiletLBig", "toiletRBig", "plunger"];
    var soundsToLoad = ["bg.ogg", "applauseFlush.ogg","click.ogg", "coin.ogg", "down.ogg", "gameover.ogg", "pause.ogg", "up.ogg"];
    var soundsLoaded = {};
    var soundsLoaded = false;
    var imagesLoaded = false;

    var imagesLeftToLoad = imagesToLoad.length;
    for (var i = 0; i < imagesToLoad.length; i++) {
        (function(){
            var imageLoader = new Image();
            imageLoader.onload = function() {
                imagesLeftToLoad--;
                if (imagesLeftToLoad <= 0) {
                    loadedScreen();
                }
            };
            imageLoader.src = SPRITE_IMAGE_PATH + "/" + imagesToLoad[i] + ".png";
        })();
    }
    loadingScreen();

    function loadingScreen(){
        draw(true, true);
        drawContext.save();
        drawContext.fillStyle = "#ddd";
        drawContext.font = "bold 50px 'Helvetica Neue', Helvetica";
        drawContext.textAlign = "center";
        drawContext.textBaseline = "middle";
        drawContext.fillText("Loading...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        drawContext.restore();
    }

    function loadedScreen(){
        if(gameOver){
            start();
        }
    }

    // preload sounds
    Sounds = {};
    for (var i = 0; i < soundsToLoad.length; i++){
        var src = soundsToLoad[i];
        var id = soundsToLoad[i].split(".", 1);        
        var callback = function(event){
            var id = event.id[0];
            var instance = createjs.Sound.createInstance(id);
            Sounds[id] = instance;
        };
        createjs.Sound.alternateExtensions = ["mp3"];
        createjs.Sound.addEventListener("fileload", callback);
        createjs.Sound.registerSound(src, id, null, true, SOUND_FILE_PATH + "/");
    }

    $(window).blur(function(){
        pause();
    });

    // ====== Setting Game Loop ======
    var gameLoop = null;

    var startLoop = function(){
        return setInterval(function() {
            update();
            draw();
        }, 1000/FPS);
    }

    // ====== Toilet object constructor =======
    function Toilet(){
        this.width= 237;
        this.height= 290;
        this.x = 150;
        this.y = CANVAS_HEIGHT - this.height;
        this.velX = 0;
        this.friction = 0.94;
        this.spriteL = Sprite("toiletLBig", 0, 0, 237, 290);
        this.spriteR = Sprite("toiletRBig", 0, 0, 237, 290);
        this.frontSpace = 0;
        this.turnCompensation = 82; // amount of horizontal space to adjust to keep hole unmoved after turning direction
        this.direction = 1; // -1 is for left, 1 is for right;
        this.bounce = 0.5;

        this.hole = function(){
            if(this.direction == 1){ //return hole location for right-facing toilet
                return {
                    x1 : 80,
                    x2 : this.width - 10,
                    y : 160
                };
            } else { // return hole location for left-facing toilet
                return {
                    x1 : 10,
                    x2 : this.width - 80,
                    y : 160
                };
            }
        }

        this.update = function(){

            if (keys[39]) { // right
                if (this.velX < TOILET_MAX_SPEED) {
                    this.velX += TOILET_ACCELERATION;
                }
            } else if (keys[37]) { // left
                if (this.velX > -TOILET_MAX_SPEED) {
                    this.velX -= TOILET_ACCELERATION;
                }
            } else {
                this.velX *= this.friction;
            }

            this.x += this.velX;


            if (this.x >= CANVAS_WIDTH - this.width + this.frontSpace && this.direction == 1) {
                this.x = CANVAS_WIDTH - this.width + this.frontSpace - this.turnCompensation;
                this.velX *= -this.bounce;
            } else if (this.x <= -this.frontSpace && this.direction == -1) {
                this.x = -this.frontSpace + this.turnCompensation;
                this.velX *= -this.bounce;
            }

            var lastDirection = this.direction;

            if(this.velX >= 0){
                this.direction = 1;
            } else {
                this.direction = -1;
            }

            // Adjust horizontally so hole is unmoved
            if(lastDirection != this.direction){
                this.x -= this.direction * this.turnCompensation;
            }
        }

        this.draw = function(){
            if(this.velX >= 0){
                this.spriteR.draw(drawContext, this.x, this.y, this.width, this.height);
            } else {
                this.spriteL.draw(drawContext, this.x, this.y, this.width, this.height);
            }
        }
    }

    // ====== Plunger object constructor =======
    function plunger(I) {
        I = I || {};

        I.alive = true;
        I.scored = false;
        I.age = 0;
        I.width = 40;
        I.height = 100;
        I.sprite = Sprite("plunger", 0, 0, 100, 253);

        I.x = 150 + Math.random() * (CANVAS_WIDTH - 300);

        if(Math.abs(I.x - lastPlungerXPos) > 600) {
            I.x -= (I.x - lastPlungerXPos) * 0.9;
        }
        lastPlungerXPos = I.x;
        I.y = 0;
        I.xVelocity = 0;
        I.yVelocity = getVal(fallSpeed, level-1);
        I.swirl = false;
        if(level >= levelToSwirl) {
            I.swirl = true;
        }
        I.randomPhase = Math.random() * Math.PI;

        I.inBounds = function() {
            return I.x >= 0 && I.x <= CANVAS_WIDTH &&
                I.y >= 0 && I.y <= CANVAS_HEIGHT;
        };

        I.draw = function() {
            drawContext.fillStyle = "white";
            if(I.scored){
                if(this.y <= t.y + t.hole().y){
                    I.sprite.draw(drawContext, this.x, this.y, this.width, t.y + t.hole().y - this.y);
                }
            } else {
                I.sprite.draw(drawContext, this.x, this.y, this.width, this.height);
            }
        };

        I.update = function() {

            if(I.scored){

                I.yVelocity *= 1.5;

                // plunger is in toilet so follow toilet
                if(I.x + I.xVelocity > t.x + t.hole().x2 || I.x + I.xVelocity < t.x + t.hole().x1){
                    I.xVelocity *= -0.9;
                }
            }
            I.y += I.yVelocity;

            // For swirling
            if(I.swirl) {
                I.xVelocity = getVal(swirlSpeed, level - levelToSwirl) * Math.sin(I.age * ((Math.PI + I.randomPhase) / 64));
                I.x += I.xVelocity;
            }
            I.age++;

            // For vertical acceleration
            I.yVelocity += I.age * PLUNGER_ACCELERATION;
            I.age++;

            I.alive = I.alive && I.inBounds();

            if(collides (t,I)){
                if(!I.scored){
                    score++;
                    I.scored = true;
                    createjs.Sound.play("coin", { volume: 0.1 });
                }

            } else if(!I.inBounds() && !I.scored) {
                HP--;
                createjs.Sound.play("down", { volume: 0.1 });
            }

        };

        return I;
    }

    // Main draw function
    function draw(initial, loading) {
        initial = initial || false;
        loading = loading || false;

        drawContext.save();
        // - BACKGROUND -
        clearCanvas();

        helpText.draw(drawContext, 796, 635);

        // - FOREGROUND -
        if(!initial) {
            t.draw();
        }

        if(!loading){

            // - OVERLAY -
            drawContext.fillStyle = "white";
            drawContext.font = "bold 20pt 'Helvetica Neue', Helvetica";
            drawContext.textBaseline = "middle";
            drawContext.font = "bold 24pt 'Helvetica Neue', Helvetica";
            drawHP(372, 55, 32, 38, 7);

            drawContext.font = "bold 26pt 'Helvetica Neue', Helvetica";
            drawContext.textAlign = "center";
            drawContext.fillStyle = "#49a3fd";
            drawContext.fillText(numToDigits(highscore), 666 , 80);
            drawContext.fillText(numToDigits(score), 782 , 80);
            drawContext.fillText(numToDigits(Math.ceil(remainingTime)), 910 , 80);
            drawContext.fillStyle = "white";
            
            // - Plungers -
            plungers.forEach(function(plunger) {
                plunger.draw();
            });
        }

        if(!initial){
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
                centerSubText("Press spacebar to play again");
            } else if(showCenterText){
                centerText();
            }
        }

        drawContext.restore();
    }

    // Main update function
    function update() {
        counter++;
        remainingTime -= 1/FPS;


        // end game if no more HP
        if(HP <= 0) {
            end();
        }

        if(remainingTime <= 0){
            remainingTime += TIME_PER_LEVEL;
            level++;
            createjs.Sound.play("applauseFlush", { volume: 0.1 });
            newLevel();
            if(HP < maxHP) {
                createjs.Sound.play("up", { volume: 0.1 });
            }
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
            counter = 0;
            plungers.push(plunger());
        }
    }

    // detection for whether the item fell straight into the toilet
    function collides(t, item) {
        var fallThreshold = 50; // height of the hitbox of the item falling into toilet
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
            } else {
                resume();
            }
        } else if(e.keyCode == 37) {
            resume();
        } else if(e.keyCode == 39) {
            resume();
        } else if(e.keyCode == 77) { // toggle mute
            if(muted){
                unmute();
            } else {
                mute();
            }
        }
    });

    // Pause game
    function pause(){
        if(!gameOver && !paused && gameGoing) {
            paused = true;
            createjs.Sound.play("pause", { volume: 0.1 });
        }
    }

    // Resume game
    function resume() {
        if(gameOver || !paused) {
            return;
        }
        displayText = lastDisplayText;
        paused = false;
        gameLoop = startLoop();
    }

    // Draw text at center of screen
    function centerText(){
        drawContext.save();
        drawContext.FOO
        drawContext.font = "bold 92px 'Helvetica Neue', Helvetica";
        drawContext.textAlign = "center";
        drawContext.textBaseline = "middle";
        drawContext.fillText(displayText, CANVAS_WIDTH/2 , CANVAS_HEIGHT/2);
        drawContext.restore();
    }

    // Draw subtext at center of screen
    function centerSubText(text){
        drawContext.save();
        drawContext.font = "bold 36px 'Helvetica Neue', Helvetica";
        drawContext.textAlign = "center";
        drawContext.textBaseline = "middle";
        drawContext.fillText(text, CANVAS_WIDTH/2 , CANVAS_HEIGHT/2 + 80);
        drawContext.restore();
    }

    // Game end
    function end(){
        gameOver = true;
        gameGoing = false;
        if(score > highscore) {
            highscore = score;
            setCookie('highscore', highscore, 365);
        }
        createjs.Sound.stop();
        createjs.Sound.play("gameover");
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

        // Countdown from 5
        var cd = 5;

        drawContext.save();
        drawContext.fillStyle = "white";
        drawContext.textAlign = "center";
        drawContext.textBaseline = "middle";

        var countDown = function(){
            if(cd > 0 && initialLoad){
                currentCD = cd;
                drawCDScreen();
                cd--;
                createjs.Sound.play("click");
                setTimeout(countDown, 1000);
            } else { // start actual game!
                drawContext.restore();
                createjs.Sound.play("bg", { loop: -1, volume: 0.3 });
                gameLoop = startLoop();
                gameGoing = true;
                initialLoad = false;
            }
        }

        countDown();
    }

    // draws number of toilet HP icons at (x,y) with 'margin' px between
    function drawHP(x, y, w, h, margin){
        for (var i = 0; i < maxHP; i++){
            if(i < HP){
                toiletRed.draw(drawContext, x, y, w, h);
            } else {
                toiletGrey.draw(drawContext, x, y, w, h);
            }
            x = x + w + margin;
        }
    }

    // Draws the countdown screen
    function drawCDScreen(cd){
        draw(true);
        drawContext.font = "bold 190px 'Helvetica Neue', Helvetica";
        drawContext.fillText(currentCD, CANVAS_WIDTH/2 , CANVAS_HEIGHT/2 - 20);
        drawContext.font = "bold 36px 'Helvetica Neue', Helvetica";
        drawContext.fillText('Use ' + String.fromCharCode(9664) + '  and  ' + String.fromCharCode(9654) + '  keys', CANVAS_WIDTH/2 , CANVAS_HEIGHT/2 + 140);
    }

    // Displays a new level indication
    function newLevel(){
        showCenterText = true;
        displayText = "NEW LEVEL";
        if(level == levelToSwirl) {
            displayText = "Look out!";
        }
        setTimeout(function(){ //stop display of new level after a short period
            showCenterText = false;
        }, 1250);
    }

    // Clears the canvas, or covers it with background image
    function clearCanvas(){
        bg.draw(drawContext, 0, 0);
        header.draw(drawContext, 0, 0);
    }

    function mute(){
        createjs.Sound.setMute(true);
        muted = true;
        if(gameGoing || gameOver) {
            draw();
        } else if(!gameOver){
            drawCDScreen();
        }
    }

    function unmute(){
        createjs.Sound.setMute(false);
        muted = false;
        if(gameGoing || gameOver) {
            draw();
        } else if(!gameOver){
            drawCDScreen();
        }
    }
});