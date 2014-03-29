$(function(){
    // ====== Initializing game ======
    var canvas = $("canvas")[0],
        ctx = canvas.getContext("2d");

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    var FPS = 50;
    var counter = 0;
    var t = new Toilet();
    var plungers = [];
    var keys = [];

    var freq = [0.66, 1, 1.2, 1.3, 1.4, 1.5]; // Plungers per second for each level
    var fallSpeed = [4, 4, 5, 5, 6, 6, 7, 7]; // Plungers falling speed for each level
    var score = 0;
    var highscore = 0;
    var maxHP = 5;
    var HP = maxHP;
    var level = 1;
    var remainingTime = TIME_PER_LEVEL;
    var gameOver = true;

    var toiletGrey = Sprite("hp", 0, 0, 50, 59); // HP toilet icon
    var toiletRed = Sprite("hp2", 0, 0, 50, 59); // HP toilet icon
    var mutedIcon = Sprite("muted", 0, 0, 128, 128);
    var unmutedIcon = Sprite("unmuted", 0, 0, 128, 128);
    var muted = false;
    var displayText = "";
    var lastDisplayText = "";
    var showCenterText = false;
    var backgroundColor = "white";
    var paused = false;
    var gameGoing = false;
    var initialLoad = true;
    var currentCD = 5;

    var soundURL = "sounds/";
    var soundsToLoad = ["bg.ogg", "applauseFlush.ogg","click.ogg", "coin.ogg", "down.ogg", "gameover.ogg", "pause.ogg", "up.ogg"];

//    var bg = Sprite("bg", 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    var soundsLoaded = false;
    var imagesLoaded = false;

    function loadingScreen(){
        draw(true);
        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = "50px Helvetica";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Loading...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        ctx.restore();

        setTimeout(function(){ // If game doesn't load in 3 seconds, start game
           if(gameover && !soundsLoaded) {
               start();
           }
        }, 3000);
    }

    function loadedScreen(){
        if(gameOver){
            start();
//            draw(true);
//            ctx.save();
//            ctx.fillStyle = "white";
//            ctx.font = "50px Helvetica";
//            ctx.textAlign = "center";
//            ctx.textBaseline = "middle";
//            ctx.fillText("Loaded", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
//            ctx.font = "30px Helvetica";
//            ctx.fillText("Press Spacebar to Start.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
//            ctx.restore();
            console.log("loaded screen display");
        }
    }

    // Setup Screen
    var bg = Sprite("bg", function(){  // loading background
        imagesLoaded = true;
        if(soundsLoaded){
            loadedScreen();
        } else {
            loadingScreen();
        }
    });

    // preload sounds
//    Sound = new Sound();
    Sounds = {};
//    if(is_firefox){ // prefer HTMLAudio over WebAudio
//        createjs.Sound.registerPlugins([createjs.WebAudioPlugin]);
//    }

//    $(Sound).bind("loaded", function(){
//        soundsLoaded = true;
//        if(soundsLoaded){
//            loadedScreen();
//        } else {
//            loadingScreen();
//        }
//    })

    for (var i = 0; i < soundsToLoad.length; i++){
        var src = soundsToLoad[i];
        var id = src.split(".", 1);
        src = soundURL + soundsToLoad[i];

//        function construct(id){
//            return function(event){
//                var id =
//                console.log("loaded "+ event.id[0]);
//                console.log(event);
//            };
//        }

        var callback = function(event){
            var id = event.id[0];
//            console.log("loaded "+ id);
//            console.log(event);
            var instance = createjs.Sound.createInstance(id);
            Sounds[id] = instance;
//            console.log(instance);
            if(id=="bg"){ // consider game loaded
                soundsLoaded = true;
                if(imagesLoaded){
                    loadedScreen();
                } else {
                    loadingScreen();
                }
            }
        };

        console.log("loading "+id);
        createjs.Sound.alternateExtensions = ["mp3"];
        createjs.Sound.addEventListener("fileload", callback);
        createjs.Sound.registerSound(src, id);
    }

    $(window).blur(function(){
        pause();
//        console.log("window blurred");
    });
    $(window).focus(function(){
//        resume();
//        console.log("window focused");
    });
    // TODO Add game loading bar


    // ====== Setting Game Loop ======
    var gameLoop = null;

    var startLoop = function(){
        return setInterval(function() {
            update();
            draw();
        }, 1000/FPS);
    }

    //var gameLoop = startLoop();
    //gameGoing = true;
    //gameOver = false;


//    plungers.push(plunger()); // Add a plunger right away to start off the game with

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
//                    ctx.fillStyle = "blue";
//                    ctx.fillRect(this.x, this.y, this.width, this.height);
            if(this.velX >= 0){
                this.spriteR.draw(ctx, this.x, this.y, this.width, this.height);
            } else {
                this.spriteL.draw(ctx, this.x, this.y, this.width, this.height);
            }


//            ctx.font = "12pt Helvetica";
    //        ctx.fillText("direction: "+this.direction, CANVAS_WIDTH - 400 , 150);
    //        ctx.fillText("plunger y: "+this.y, CANVAS_WIDTH - 150 , 150);

        }
    }

    // ====== Plunger object constructor =======
    function plunger(I) {
        I = I || {};

        I.alive = true;
        I.scored = false;
//        I.age = Math.floor(Math.random() * 128);
        I.age = 0;

        I.width = 40;
        I.height = 100;
        I.sprite = Sprite("plunger", 0, 0, 100, 253);

        I.x = 150 + Math.random() * (CANVAS_WIDTH - 300);
        I.y = 0;
        I.xVelocity = 0;
        I.yVelocity = getVal(fallSpeed, level-1);

        I.inBounds = function() {
            return I.x >= 0 && I.x <= CANVAS_WIDTH &&
                I.y >= 0 && I.y <= CANVAS_HEIGHT;
        };

        I.draw = function() {
            ctx.fillStyle = "white";
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
    //        ctx.font = "12pt Helvetica";
    //        ctx.fillText("plunger x: "+this.x, CANVAS_WIDTH - 400 , 150);
    //        ctx.fillText("plunger y: "+this.y, CANVAS_WIDTH - 150 , 150);
    //        ctx.fillText("plunger x: "+this.width, CANVAS_WIDTH - 400 , 250);
    //        ctx.fillText("plunger y: "+this.height, CANVAS_WIDTH - 150 , 250);
        };

        I.update = function() {

            if(I.scored){

                I.yVelocity *= 1.5;

                // plunger is in toilet so follow toilet
                if(I.x + I.xVelocity > t.x + t.hole().x2 || I.x + I.xVelocity < t.x + t.hole().x1){
                    I.xVelocity *= -0.9;
                }
            }
//            I.x += I.xVelocity;
            I.y += I.yVelocity;

                // For swirling
//                I.xVelocity = 3 * Math.sin(I.age * Math.PI / 64);
//                I.age++;

            // For vertical acceleration
            I.yVelocity += I.age * PLUNGER_ACCELERATION;
            I.age++;

            I.alive = I.alive && I.inBounds();

            if(collides (t,I)){
                if(!I.scored){
                    score++;
                    I.scored = true;
                    createjs.Sound.play("coin", {volume:0.5});
                }

            } else if(!I.inBounds() && !I.scored) {
                HP--;
                createjs.Sound.play("down");
            }

        };

        return I;
    }

    // Main draw function
    function draw(initial) {
        initial = initial || false;

        ctx.save();
        // - BACKGROUND -
        clearCanvas();

        // - FOREGROUND -
        if(!initial) {
            t.draw();
        }


        // - OVERLAY -
        ctx.fillStyle = "white";
        ctx.font = "20pt Helvetica";
        ctx.textBaseline = "middle";
//        ctx.fillText("Score:", CANVAS_WIDTH - 170 , 40);
        ctx.font = "24pt Helvetica";
//        ctx.fillText("Health", 440 , 30);
        drawHP(392, 53, 32, 38, 7);

        // Level Display
//        ctx.fillText("Level:", CANVAS_WIDTH - 170 , 90);

        // Time left for this level
//        ctx.fillText("Next Level:", CANVAS_WIDTH - 170 , 140);

        ctx.font = "26pt Helvetica";
        ctx.textAlign = "center";
        ctx.fillStyle = "#49a3fd";
        ctx.fillText(highscore, 666 , 80);
        ctx.fillText(score, 781 , 80);
        ctx.fillText(Math.ceil(remainingTime), 910 , 80);

        //Draw pause and mute instructions
        ctx.font = "10pt Helvetica";
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.fillText("P: Pause / Resume", CANVAS_WIDTH - 140, CANVAS_HEIGHT - 25);
        ctx.fillText("M: Mute / Unmute", CANVAS_WIDTH - 140, CANVAS_HEIGHT - 45);
        if(muted){
            mutedIcon.draw(ctx, 935, 120, 50, 50);
        } else {
            unmutedIcon.draw(ctx, 935, 120, 50, 50);
        }


        // - Plungers -
        plungers.forEach(function(plunger) {
            plunger.draw();
        });

        if(!initial){
            if(muted){

            }
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
                centerSubText("Press spacebar to play again.");
            } else if(showCenterText){
                centerText();
            }
        }

        ctx.restore();
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
            createjs.Sound.play("applauseFlush");
            newLevel();
            HP = maxHP;
            createjs.Sound.play("up.mp3");
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
            createjs.Sound.play("pause");
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
        ctx.save();
        ctx.font = "35pt Helvetica";
        ctx.textAlign = "center";
        ctx.fillText(displayText, CANVAS_WIDTH/2 , CANVAS_HEIGHT/3);
        ctx.restore();
    }

    // Draw subtext at center of screen
    function centerSubText(text){
        ctx.save();
        ctx.font = "20pt Helvetica";
        ctx.textAlign = "center";
        ctx.fillText(text, CANVAS_WIDTH/2 , CANVAS_HEIGHT/3 + 40);
        ctx.restore();
    }

    // Game end
    function end(){
        gameOver = true;
        gameGoing = false;
        highscore = score;
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

        // Countdown from 3
        var cd = 5;

        ctx.save();
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
//        demoPlunger = new plunger();
//        demoPlunger.x = t.x + 150;
//        demoPlunger.y = 370;

        var countDown = function(){
            if(cd > 0 && initialLoad){
//                clearCanvas();
                currentCD = cd;
                drawCDScreen();
                cd--;
                createjs.Sound.play("click");
                setTimeout(countDown, 1000);

            } else { // start actual game!
                ctx.restore();
                createjs.Sound.play("bg", {loop: -1});
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
                toiletRed.draw(ctx, x, y, w, h);
            } else {
                toiletGrey.draw(ctx, x, y, w, h);
            }
            x = x + w + margin;
        }
    }

    // Draws the countdown screen
    function drawCDScreen(cd){
        draw(true);
        ctx.font = "150px Helvetica";
        ctx.fillText(currentCD, CANVAS_WIDTH/2 , CANVAS_HEIGHT/3);
        ctx.font = "16pt Helvetica";
        ctx.fillText('Press "LEFT" and "RIGHT" keys to move toilet', CANVAS_WIDTH/2 , CANVAS_HEIGHT/3 + 120);
        ctx.fillText('Catch plungers in the toilet hole to score', CANVAS_WIDTH/2 , CANVAS_HEIGHT/3 + 150);
    }

    // Displays a new level indication
    function newLevel(){
        showCenterText = true;
        displayText = "NEW LEVEL";
        setTimeout(function(){ //stop display of new level after 1.5 seconds
            showCenterText = false;
        }, 2000);
    }

    // Clears the canvas, or covers it with background image
    function clearCanvas(){
//        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        bg.draw(ctx, 0, 0);
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
//    function pauseAllSounds(){
//        for(var id in Sounds){
//            Sounds[id].pause();
//            console.log('pausing '+id);
//        }
//    }
//
//    function resumeAllSounds(){
//        for(var id in Sounds){
//            Sounds[id].play();
//        }
//    }
});
