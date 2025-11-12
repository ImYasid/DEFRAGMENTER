// main.js

// === 1. Polyfill para requestAnimationFrame ===
// (Asegura que el bucle de juego funcione en navegadores antiguos)
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


// === 2. Bucle de Juego Global (Estructura del Profesor) ===

let last = 0; // Para calcular el Delta Time (dt)

function loop(ts){
    const dt = (ts - last) / 1000; 
    last = ts;
    
    // El bucle llama a las funciones globales:
    update(dt); 
    render();
    
    requestAnimationFrame(loop);
}

// === FUNCIONES PUENTE ===

function update(dt){
    // ⚠️ La función update global ahora llama al método update de tu objeto Game
    game.update(dt);
}

function render(){
    // ⚠️ La función render global ahora llama al método render de tu objeto Game
    game.render();
}

// === INICIO DEL JUEGO ===
$(window).load(function() {
    game.init();
    // Inicia el bucle una vez que el juego se inicializa
    requestAnimationFrame(loop); 
});