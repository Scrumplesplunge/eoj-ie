var defBot = {
	name: "DefaultBot",
	color: "rgb(200,200,200)",
	reload: 0,
	health: 500,
	pos: vec( 0, 0 ),
	vel: vec( 0, 0 ),
	Think: function( bots, bits ) {
		this.vel = vadd( this.vel, vec( Math.random( ) * 2 - 1, Math.random( ) * 2 - 1 ) );
		var spd = Math.min( 2, vlen( this.vel ) );
		this.vel = vmul( vnorm( this.vel ), spd );
	},
	Draw: function( c ) {
		c.fillStyle = this.color;
		c.beginPath( );
		c.arc( Math.round( this.pos.x ), Math.round( this.pos.y ), 25, 0, Math.PI * 2, true );
		c.fill( );
	}
};

function DrawHealthBar( c, bot ) {
	var len = Math.min( 1, bot.health / defBot.health );
	c.fillStyle = "rgb(0,0,0)";
	c.fillRect( Math.round( bot.pos.x - 26 ), Math.round( bot.pos.y - 35 ), 52, 5 );
	c.fillStyle = "rgb(" + Math.round( Math.cos( len * Math.PI / 2 ) * 255 ) + "," + Math.round( Math.sin( len * Math.PI / 2 ) * 255 ) + ",0)";
	c.fillRect( Math.round( bot.pos.x - 25 ), Math.round( bot.pos.y - 34 ), Math.round( 50 * len ), 3 );
}

function CreateRobot( name, color, think, draw ) {
	var tmp = defBot.clone( );
	if ( name ) {
		tmp.name = name;
	}
	if ( color ) {
		tmp.color = color;
	}
	if ( think ) {
		tmp.Think = think;
	}
	if ( draw ) {
		tmp.Draw = draw;
	}
	robots.AddRobot( tmp );
	return robots.all[ robots.all.length - 1 ];
}