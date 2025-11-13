var loader = {
    loaded:true,
    loadedCount:0,
    totalCount:0,
    
    init:function(){
        var mp3Support,oggSupport;
        var audio = document.createElement('audio');
    	if (audio.canPlayType) {
       		// Currently canPlayType() returns: "", "maybe" or "probably" 
      		mp3Support = "" != audio.canPlayType('audio/mpeg');
      		oggSupport = "" != audio.canPlayType('audio/ogg; codecs="vorbis"');
    	} else {
    		//The audio tag is not supported
    		mp3Support = false;
    		oggSupport = false;	
    	}

        loader.soundFileExtn = oggSupport?".ogg":mp3Support?".mp3":undefined;        
    },
    
    loadImage:function(url){
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var image = new Image();
        image.src = url;
        image.onload = loader.itemLoaded;
        return image;
    },
    soundFileExtn:".ogg",
    loadSound:function(url){
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var audio = new Audio();
        audio.src = url+loader.soundFileExtn;
		audio.addEventListener("canplaythrough", loader.itemLoaded, false);
        return audio;   
    },
    itemLoaded:function(){
        loader.loadedCount++;
        $('#loadingmessage').html('Loaded '+loader.loadedCount+' of '+loader.totalCount);
        if (loader.loadedCount === loader.totalCount){
            // Loader has loaded completely..
            loader.loaded = true;
            // Hide the loading screen 
            $('#loadingscreen').hide();
            //and call the loader.onload method if it exists
            if(loader.onload){
                loader.onload();
                loader.onload = undefined;
            }
        }
    }
}