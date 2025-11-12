// game/Game.js (Ubicado en la carpeta game/)

var game = {
    // === PROPIEDADES CENTRALES ===
    canvas: null,
    context: null,
    
    mode:"intro", // "intro", "playing", "paused", "gameover" (Gestión de Estados)
    animationFrame: null,
    ended: false,
    score: 0,
    
    // === METODOS DEL NUCLEO (Llamados por main.js) ===
    
    // 1. init: Inicializa componentes y Canvas (Llamado una vez por main.js)
    init: function(){
        // Inicialización de módulos
        levels.init(); // Inicializa la pantalla de selección de niveles
        loader.init(); // Inicializa el Loader (detección de audio)
        mouse.init();  // Inicializa la captura de entrada

        // Obtener el Canvas y Contexto
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');

        // Mostrar la pantalla de inicio (intro)
        game.hideScreens();
        $('#gamestartscreen').show();
        
        // Inicia el bucle de juego definido en main.js (solo para asegurar que todo el código se ejecute)
        // La llamada final requestAnimationFrame(loop) está en main.js, así que no se necesita aquí.
    },
    
    // 2. update(dt): Actualización de la lógica del juego (Llamado por main.js/loop)
    update: function(dt){
        // El dt (Delta Time) asegura un movimiento consistente independientemente de los FPS
        if (game.mode === "playing") {
            // ** Lógica Principal de Defragmenter (Arcade Shooter) **
            
            // 1. Actualizar el Jugador y las Balas
            // player.update(dt); 
            
            // 2. Actualizar los Enemigos y Oleadas
            // enemyManager.update(dt); // Lógica de movimiento/spawn de enemigos
            
            // 3. Ejecutar las Colisiones
            // collision.check(); 
        }
        
        if (game.ended) {
            // Cancelar el bucle de animación o cambiar el estado a Game Over
            // window.cancelAnimationFrame(game.animationFrame);
        }
    },
    
    // 3. render(): Lógica de dibujo (Llamado por main.js/loop)
    render: function(){
        // El bucle de main.js ya llamó a ctx.clearRect()
        game.context.clearRect(0, 0, game.canvas.width, game.canvas.height);

        if (game.mode === "playing") {
            // ** Dibuja el mundo de Defragmenter **
            
            // Dibuja el fondo (la Grid)
            // game.context.drawImage(game.currentLevel.backgroundImage, 0, 0, game.canvas.width, game.canvas.height);
            
            // Dibuja Entidades (Player, Enemies, Bullets)
            // player.render(game.context);
            // enemyManager.render(game.context);

            // Dibuja el HUD (barra de vida, puntuación)
            // ui.render(game.context); 
        }
    },
    
    // === METODOS DE FLUJO Y UI ===
    
    // start: Inicia el estado de JUEGO (llamado por el loader después de la carga)
    start:function(){
        // Oculta menús y muestra el juego
        game.hideScreens();
        $('#gamecanvas').show();
        $('#scorescreen').show();
        game.mode = "playing"; // Cambia el estado a JUEGO
        game.ended = false;
        
        // El bucle ya está corriendo gracias a main.js
    },  

    // Funciones de control de UI (para cambiar entre capas HTML)
    hideScreens: function() {
        $('.gamelayer').hide();
    },
    showScreen: function(id) {
        $('#' + id).show();
    },

    showEndingScreen:function(mode){
        // Lógica para mostrar la pantalla de éxito o fracaso
        if (mode=="level-success"){
            $('#endingmessage').html('¡Sistema Desfragmentado! Nivel Completo.');
        } else if (mode=="level-failure"){          
            $('#endingmessage').html('Fallo de Desfragmentación. Intenta de Nuevo.');
        }
        $('#endingscreen').show();
        game.ended = true; // Detiene el bucle si quieres que sea estricto
    },

    showLevelScreen:function(){
    // Oculta todas las capas del juego
    $('.gamelayer').hide(); 
    // Muestra la pantalla de selección de niveles (que fue llenada por levels.init())
    $('#levelselectscreen').show('slow');
    },
    
    // Lógica RTS/Slingshot eliminada: (panTo, handlePanning, slingshotX, slingshotY, etc.)
}