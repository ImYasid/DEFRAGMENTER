// engine/stateManager.js

var stateManager = {
    currentState: "intro",
    
    // Define todos los estados posibles para mayor claridad
    STATES: {
        INTRO: "intro",
        PLAYING: "playing",
        PAUSED: "paused",
        LEVEL_SELECT: "level_select",
        GAMEOVER: "gameover"
    },

    // Función para cambiar el estado
    changeState: function(newState) {
        this.currentState = newState;
        
        // Aquí se puede añadir lógica para pausar/reanudar el juego
        if (newState === this.STATES.PLAYING) {
            // Lógica para reanudar el bucle (si estaba pausado)
        } else if (newState === this.STATES.PAUSED) {
            // Lógica para pausar el bucle
        }
    },
    
    // Función para verificar el estado actual
    is: function(state) {
        return this.currentState === state;
    }
};

// NOTA: Debes adaptar game.js para usar stateManager.changeState() 
// en lugar de cambiar game.mode directamente.