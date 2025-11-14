// game/Audio.js

var audioManager = {
    // Variables para almacenar los objetos de audio
    musicLobby: null,   // Música del Menú/Selector de Niveles
    musicGame: null,    // Música del Juego (cuando se juega)
    sfx: {},
    musicEnabled: true,
    firstInteraction: false, // Bandera para rastrear el primer clic del usuario

    init: function() {
        // 1. Cargar la música de fondo (BGM) - Asumiendo que OnGame es la música del nivel
        this.musicLobby = loader.loadSound("assets/audio/Lobby");
        this.musicGame = loader.loadSound("assets/audio/OnGame");

        // 2. Cargar efectos de sonido (SFX)
        // Ejemplo de SFX, deberías tener archivos reales
        this.sfx.fire = loader.loadSound("assets/audio/Fire"); 
        this.sfx.explosion = loader.loadSound("assets/audio/Explosion");

        // 3. Configurar el control de mute/unmute
        $('#togglemusic').click(function() {
            // Se usa .bind en la llamada del listener, por lo que aquí no es necesario
            audioManager.toggleMusic(); 
        });
    },
    playSound: function(effectName) {
        if (this.musicEnabled && this.sfx[effectName]) {
            // Clona el sonido para que múltiples disparos puedan sonar al mismo tiempo
            var sound = this.sfx[effectName].cloneNode(); 
            sound.play().catch(e => console.warn('SFX play failed:', e));
        }
    },

    // Detiene ambas pistas, asegurando que solo suene una
    stopAllMusic: function() {
        if (this.musicLobby) {
            this.musicLobby.pause();
            this.musicLobby.currentTime = 0;
        }
        if (this.musicGame) {
            this.musicGame.pause();
            this.musicGame.currentTime = 0;
        }
    },

    // Inicia la música del Menú/Lobby
    playLobbyMusic: function() {
    // 🛑 QUITAR this.stopAllMusic(); de aquí.
    if (this.musicEnabled && this.musicLobby) {
        // Aseguramos que la otra música esté detenida si estamos en el lobby
        if(this.musicGame) this.musicGame.pause(); 
        
        this.musicLobby.loop = true;
        // La llamada a play() requiere el catch para manejar la promesa
        this.musicLobby.play().catch(e => console.log("Lobby play failed:", e));
    }
},

    // Inicia la música del Juego
    playGameMusic: function() {
    // 🛑 QUITAR this.stopAllMusic(); de aquí.
    if (this.musicEnabled && this.musicGame) {
        // Aseguramos que la otra música esté detenida si estamos en el juego
        if(this.musicLobby) this.musicLobby.pause(); 

        this.musicGame.loop = true;
        this.musicGame.play().catch(e => console.log("Game play failed:", e));
    }
},

    // Control de Mute/Unmute
    toggleMusic: function() {
        this.musicEnabled = !this.musicEnabled;
        
        if (this.musicEnabled) {
             // Si el audio estaba apagado, lo reanudamos basándonos en el modo actual
             if (game.mode === "running") {
                this.playGameMusic();
             } else {
                this.playLobbyMusic();
             }
        } else {
            this.stopAllMusic();
        }
        // TODO: Añadir lógica para cambiar el icono de #togglemusic
    },

    // Nuevo método para manejar el primer clic global del usuario (Políticas del navegador)
    setupFirstPlay: function() {
        if (this.firstInteraction) return;

        // Inicia la música del lobby (el estado inicial es menú/lobby)
        this.playLobbyMusic(); 
        
        this.firstInteraction = true; 
        
        // Desactivar el listener después de la primera ejecución
        window.removeEventListener('mousedown', this.setupFirstPlayBound);
        window.removeEventListener('mouseup', this.setupFirstPlayBound);
    },
};

// 🚨 BINDING CRÍTICO: Vincular el contexto una vez fuera del objeto
audioManager.setupFirstPlayBound = audioManager.setupFirstPlay.bind(audioManager);