var Sound2 = (function ($) {
//  var format = $.browser.webkit ? ".mp3" : ".wav";
//    var format = ".wav";
    var soundPath = "sounds/";
    var sounds = {};
    var maxChan = 4;

    function loadSoundChannel(name, loop) {
        var sound = $('<audio />').get(0);
        sound.preload = "auto";
        sound.src = soundPath + name;
        if (loop) {
            sound.loop = true;
        }

        return sound;
    }

    function Sound2(name, maxChannels) {
        maxChan = maxChannels;

        return {
            play: Sound2.play,

            stop: function () {
                Sound2.stop(name);
            },

            pauseAll: Sound2.pauseAll,

            preload: Sound2.preload

        }
    }

    return $.extend(Sound2, {
        play: function (name, maxChannels) {
            if (muted) return; // TODO also pause current sounds
            // Note: Too many channels crash browsers
            maxChannels = maxChannels || maxChan;

            if (!sounds[name]) {
                sounds[name] = loadSoundChannel(name);
            }

//            var freeChannels = $.grep(sounds[name], function (sound) {
//                console.log(sounds);
//                return sound.currentTime == sound.duration || sound.currentTime == 0
//            });
//
//            if (freeChannels[0]) {
//                try {
//                    freeChannels[0].currentTime = 0;
//                } catch (e) {
//                }
//                freeChannels[0].play();
//                console.log('freechannels');
//            } else {
//                if (!maxChannels || sounds[name].length < maxChannels) {
//                    var sound = loadSoundChannel(name);
//                    sounds[name].push(sound);
//                    sound.play();
//                    console.log('other');
//                }
//            }
            console.log(sounds[name]);
            console.log(loadSoundChannel(name));
            sounds[name].play();
        },

        stop: function (name) {
            if (sounds[name]) {
                sounds[name].pause();
                sounds[name].currentTime = 0;
            }
        },

        preload: function (names, loop) {
            for (var idx in names) {
                var name = names[idx];
                sounds[name] = loadSoundChannel(name, loop);
            }
        },

        pauseAll: function () {
            for (var name in sounds) {
                var sound = sounds[name];
                sound.pause();
            }
        },

        resumeAll: function () {
            if (muted) return;
            for (var name in sounds) {
                var sound = sounds[name];
                sound.play();
            }
        },

        stopAll: function () {
            for (var name in sounds) {
                var sound = sounds[name];
                sound.pause();
                sound.currentTime = 0;
            }
        }


    });
}(jQuery));
