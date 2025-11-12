// engine/loader.js

var loader = {
    loaded: true,
    loadedCount: 0, // Assets that have been loaded so far
    totalCount: 0, // Total number of assets that need to be loaded
    
    init: function(){
        // Verifica el soporte de audio (MP3 y OGG)
        var mp3Support, oggSupport;
        var audio = document.createElement('audio');
        if (audio.canPlayType) {
            mp3Support = "" != audio.canPlayType('audio/mpeg');
            oggSupport = "" != audio.canPlayType('audio/ogg; codecs="vorbis"');
        } else {
            mp3Support = false;
            oggSupport = false; 
        }

        // Asigna la extensión de archivo de sonido soportada
        loader.soundFileExtn = oggSupport ? ".ogg" : mp3Support ? ".mp3" : undefined;        
    },
    
    // Método para cargar una imagen
    loadImage: function(url){
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var image = new Image();
        image.src = url;
        image.onload = loader.itemLoaded;
        return image;
    },
    
    // Método para cargar un sonido
    soundFileExtn: ".ogg", // Valor inicial
    loadSound: function(url){
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var audio = new Audio();
        // Carga el sonido con la extensión compatible detectada
        audio.src = url + loader.soundFileExtn; 
        audio.addEventListener("canplaythrough", loader.itemLoaded, false);
        return audio;   
    },
    
    // Maneja la cuenta de recursos cargados
    itemLoaded: function(){
        loader.loadedCount++;
        $('#loadingmessage').html('Loaded ' + loader.loadedCount + ' of ' + loader.totalCount);
        if (loader.loadedCount === loader.totalCount){
            // Cuando todo está cargado...
            loader.loaded = true;
            $('#loadingscreen').hide();
            if(loader.onload){
                loader.onload();
                loader.onload = undefined;
            }
        }
    }
};