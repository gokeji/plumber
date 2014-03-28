var Sound = function(){
    this.sounds = {};
    this.muted = false;
    this.nowPlaying = {};

    // Load all existing audio files into sounds
    this.init = function(){
        $('audio').each(function(){
            var name = this.id;
            Sound.sounds[name] = this;
        });
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
                    console.log(name + ' needs loop');
//                    sClone.loop = true;
                    $(sClone).bind('ended', function(){
                        // play again
                        console.log('restarting');
                        if (window.chrome) {
                            sClone.load();
                        }
                        sClone.play();
                    });
                } else {
                    console.log(name + ' DONT need loop');
                    $(sClone).bind('ended', function(){
                        // remove from nowPlaying
                        console.log('deleting sound '+name);
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
            console.log(Sound.nowPlaying);
            console.log(Sound.nowPlaying[name]);
            Sound.nowPlaying[name].pause();
        }
        Sound.nowPlaying = {};
    }

    this.mute = function(){
        // TODO muted handling
    }

    this.unmute = function(){

    }


}


