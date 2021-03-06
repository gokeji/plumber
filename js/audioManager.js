var Sound = function(){

    this.sounds = {};
    this.muted = false;
    this.nowPlaying = {};
    this.loadedCount = 0;

    // Load all existing audio files into sounds
    this.load = function(src, id, loadedCallback){
        loadedCallback = loadedCallback || function(){};
        var sound = $('<audio />').get(0);
        sound.preload = "auto";
        sound.oncanplaythrough = function(){
            Sound.loadedCount ++;
            loadedCallback();
            if(Sound.loadedCount == Object.keys(Sound.sounds).length){
                $(Sound).trigger("loaded");
            }
        };
        sound.src = src;

        Sound.sounds[id] = sound;
    }

    this.play = function(name, loop, volume){
        loop = loop || false;
        volume = volume || 1;
        if(Sound.muted)
            return;
        else{
            var s = Sound.sounds[name];
            if(s){
                var sClone = s.cloneNode(true);
                Sound.nowPlaying[name] = sClone;

                if(loop){
                    $(sClone).bind('ended', function(){
                        if (window.chrome) {
                            sClone.load();
                        }
                        sClone.play();
                    });
                } else {
                    $(sClone).bind('ended', function(){
                        delete Sound.nowPlaying[name];
                    });
                }

                sClone.volume = volume;
                sClone.play();
            }
        }
    }

    this.pause = function(name){
        var s = Sound.nowPlaying[name];
        if(s){
            s.pause();
        }
    }

    this.stop = function(name){
        var s = Sound.nowPlaying[name];
        if(s){
            s.pause();
            delete Sound.nowPlaying[name];
        }
    }

    this.pauseAll = function(){
        for(var name in Sound.nowPlaying){
            Sound.nowPlaying[name].pause();
        }
    }

    this.resumeAll = function(){
        for(var name in Sound.nowPlaying){
            Sound.nowPlaying[name].play();
        }
    }

    this.stopAll = function(){
        for(var name in Sound.nowPlaying){
            Sound.nowPlaying[name].pause();
        }
        Sound.nowPlaying = {};
    }

    this.mute = function(){
        // TODO muted handling
    }

    this.unmute = function(){

    }

    this.loaded = function(){
        return (Sound.loadedCount == Object.keys(Sound.sounds).length);
    }


}


