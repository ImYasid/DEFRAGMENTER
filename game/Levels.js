// game/Levels.js

var levels = {
    // Datos de las 3 Oleadas/Niveles para Defragmenter
    data:[
        {   // Oleada 1: Tutorial/Fácil
            name: "Sector 1: Quick Scan",
            background: 'grid-background-1',
            enemyCount: 5,
            enemySpeed: 50, // Píxeles por segundo (ejemplo)
        },
        {   // Oleada 2: Media
            name: "Sector 2: Deep Dive",
            background: 'grid-background-2',
            enemyCount: 10,
            enemySpeed: 80, 
        },
        {   // Oleada 3: Difícil
            name: "Sector 3: The Core",
            background: 'grid-background-3',
            enemyCount: 15,
            enemySpeed: 100, 
        }
    ],

    // Inicializa la pantalla de selección de niveles (llamado desde game.init())
    init:function(){
        // Código para generar los botones de niveles en el DOM
        var html = "";
        for (var i = 0; i < levels.data.length; i++) {
             html += `<input type="button" value="${i + 1}" data-level="${i}">`;
        };
        $('#levelselectscreen').html(html);
        
        // Clic para cargar el nivel
        $('#levelselectscreen input').click(function(){
            levels.load($(this).data('level')); // Usa data-level para obtener el índice
            $('#levelselectscreen').hide();
        });
    },

    // Carga todos los datos y recursos para una oleada específica
    load:function(number){
        // Configura el nivel actual en el objeto game
        game.currentLevel = {number: number, data: levels.data[number]};
        game.score = 0;
        $('#score').html('Score: ' + game.score);

        // ** Llama al loader para cargar recursos de esta oleada **
        // Nota: Asume que tienes las imágenes de fondo en assets/images/backgrounds/
        game.currentLevel.backgroundImage = loader.loadImage(`images/backgrounds/${game.currentLevel.data.background}.png`);
        
        // Una vez que los assets cargan, game.start() inicia el juego
        if(loader.loaded){
            game.start();
        } else {
            loader.onload = game.start;
        }
    }
};