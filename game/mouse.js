// game/InputHandler.js (Renombrado de mouse.js)

var mouse = { // Mantenemos el nombre 'mouse' por compatibilidad con el código original
    x:0,
    y:0,
    down:false,
    dragging:false,
    
    // === Variables de teclado para el Shooter ===
    keys: {}, 
    
    init:function(){
        // Eventos del mouse (Mantenidos si el juego los necesita, ej: para disparar con clic)
        $('#gamecanvas').mousemove(mouse.mousemovehandler);
        $('#gamecanvas').mousedown(mouse.mousedownhandler);
        $('#gamecanvas').mouseup(mouse.mouseuphandler);
        $('#gamecanvas').mouseout(mouse.mouseuphandler);
        
        // ** Eventos del teclado (Nuevos para el Arcade Shooter) **
        $(document).keydown(mouse.keydownHandler);
        $(document).keyup(mouse.keyupHandler);
    },
    
    // Handlers de Mouse (lógica original)
    mousemovehandler:function(ev){
        var offset = $('#gamecanvas').offset();
        mouse.x = ev.pageX - offset.left;
        mouse.y = ev.pageY - offset.top;
        if (mouse.down) { mouse.dragging = true; }
    },
    mousedownhandler:function(ev){
        mouse.down = true;
        mouse.downX = mouse.x;
        mouse.downY = mouse.y;
        ev.originalEvent.preventDefault();
    },
    mouseuphandler:function(ev){
        mouse.down = false;
        mouse.dragging = false;
    },
    
    // ** Handlers de Teclado (Lógica esencial para WASD) **
    keydownHandler: function(ev) {
        mouse.keys[ev.which] = true;
        
        // Manejo de la pausa con la tecla 'P'
        if (ev.which === 80) { // Tecla P
            // Aquí puedes llamar a game.togglePause() si la implementas
        }
    },
    keyupHandler: function(ev) {
        mouse.keys[ev.which] = false;
    }
};

// NOTA: Ahora, dentro de Player.js, puedes verificar si se presiona una tecla:
// if (mouse.keys[87]) { /* Mover arriba (W) */ }