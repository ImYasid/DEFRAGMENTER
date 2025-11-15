var levels = {
    data:[
        {   
            foreground:'desert-foreground',
            background:'clouds-background',
            // single wave per level: a single array element -> spawn this many enemies
            entities:[
                // single, larger wave with some chance to shoot
                { count: 12, spawnInterval: 650, yMin: 40, yMax: 740, speed: 120, health: 1, score: 12, type: 'mixed', shootChance: 0.18, bobAmplitude: 8, bobFrequency: 1.0 }
            ],
            // Boss for level 1: easier, smaller and fewer bullets
            boss: {
                scale: 2,
                health: 120,
                speed: 40,
                shootCooldown: 1.6,
                color: 'rgba(109, 250, 15, 1)',
                shootCount: 3,
                shootSpread: Math.PI * 0.2
                ,
                // bullet speed base and variance
                bulletSpeedBase: 160,
                bulletSpeedVar: 40,
                // spawn boss after this many seconds (end of wave)
                spawnDelay: 3
            }
        },
        {  
             foreground:'desert-foreground',
            background:'clouds-background',
            entities:[
                // single wave medium difficulty; higher shoot chance and movement
                { count: 14, spawnInterval: 600, yMin: 40, yMax: 760, speed: 150, health: 2, score: 18, type: 'mixed', shootChance: 0.25, bobAmplitude: 14, bobFrequency: 1.4 }
            ],
            // Boss for level 2: medium difficulty
            boss: {
                scale: 3,
                health: 220,
                speed: 70,
                shootCooldown: 1.3,
                color: 'rgba(221, 255, 68, 1)',
                shootCount: 5,
                shootSpread: Math.PI * 0.35,
                // make vertical/horizontal bobbing larger so boss moves more
                bobAmplitude: 80,
                bobFrequency: 1.6,
                bobHorizontalAmplitude: 40,
                bobHorizontalFrequency: 0.6
                ,
                bulletSpeedBase: 200,
                bulletSpeedVar: 70,
                spawnDelay: 3
            }
        },
        {  
             foreground:'desert-foreground',
            background:'clouds-background',
            entities:[
                // single hard wave: more enemies, higher speed, and more shooters
                { count: 18, spawnInterval: 550, yMin: 40, yMax: 760, speed: 170, health: 2, score: 20, type: 'mixed', shootChance: 0.32, bobAmplitude: 22, bobFrequency: 1.8 }
            ],
            // Boss for level 3: hardest to kill
            boss: {
                scale: 4,
                health: 420,
                speed: 100,
                shootCooldown: 1.0,
                color: '#ff0000',
                shootCount: 7,
                shootSpread: Math.PI * 0.5,
                // larger, faster bobbing + horizontal dodge to be harder to hit
                bobAmplitude: 140,
                bobFrequency: 2.2,
                bobHorizontalAmplitude: 90,
                bobHorizontalFrequency: 1.0
                ,
                bulletSpeedBase: 240,
                bulletSpeedVar: 100,
                spawnDelay: 3
            }
        }
    ],

    // Inicializa la pantalla de selección de niveles (llamado desde game.init())
    init:function(){
        var html = "";
        for (var i=0; i < levels.data.length; i++) {
            var level = levels.data[i];
            html += '<input type="button" value="'+(i+1)+'">';
        };
        $('#levelselectscreen').html(html);
        
        // Set the button click event handlers to load level
        $('#levelselectscreen input').click(function(){
            levels.load(this.value-1);
            $('#levelselectscreen').hide();
        });
    },

    // Carga todos los datos y recursos para una oleada específica
    load:function(number){

        // declare a new current level object
        game.currentLevelNumber = number;
        game.currentLevel = {number:number,hero:[]};
		game.score=0;
		$('#score').html('Score: '+game.score);
        var level = levels.data[number];

        //Call game.start() once the assets have loaded
        if(loader.loaded){
            game.start()
        } else {
            loader.onload = game.start;
        }
    }
};