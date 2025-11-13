var levels = {
    data:[
        {   
            foreground:'desert-foreground',
	        background:'clouds-background',
			entities:[]
        },
        {  
             foreground:'desert-foreground',
	        background:'clouds-background',
			entities:[]
        },
        {  
             foreground:'desert-foreground',
	        background:'clouds-background',
			entities:[]
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
        game.currentLevel = {number:number,hero:[]};
		game.score=0;
		$('#score').html('Score: '+game.score);
        var level = levels.data[number];

        //load the background, foreground and slingshot images
        game.currentLevel.backgroundImage = loader.loadImage("assets/images/backgrounds/"+level.background+".png");
        game.currentLevel.foregroundImage = loader.loadImage("assets/images/backgrounds/"+level.foreground+".png");
        game.slingshotImage = loader.loadImage("assets/images/slingshot.png");
        game.slingshotFrontImage = loader.loadImage("assets/images/slingshot-front.png");

        //Call game.start() once the assets have loaded
        if(loader.loaded){
            game.start()
        } else {
            loader.onload = game.start;
        }
    }
};