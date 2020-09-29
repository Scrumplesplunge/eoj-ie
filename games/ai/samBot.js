CreateRobot( "SamBot", "rgb(0,138,255)", function( bots, bits ) {
	var dist = 999;
	var t = false;
	for ( var bot=0; bot<bots.length; bot++ ) {
		if ( bots[ bot ].name == this.name ) {
			continue;
		}
		var dst = vlen( vsub( bots[ bot ].pos, this.pos ) );
		if ( dst < dist ) {
			t = bots[ bot ];
			dist = dst;
		}
	}
	if ( t != false ) {
		//MOVEMENT CODE FOR ATTACKING TARGET GOES HERE
		var tvel = vec( Math.cos( GetTime( ) * Math.PI ) * 40, Math.sin( GetTime( ) * Math.PI ) * 10 );
		this.vel = vadd( vmul( this.vel, 0.8 ), tvel );
		// WEAPONS REALODING AND SPAWNING
		var ct = vlen( vsub( t.pos, this.pos ) ) / ( 10 * 10 );
		var rv = Math.random();
		if ( rv > 0.8 ) {
			var cpos = vadd( t.pos, vmul( t.vel, ct * ct * 50 ) );
			var dir = vnorm( vsub( cpos, this.pos ) );
			particles.AddRocket( this, vadd( this.pos, vmul( dir, 30 ) ), dir );
		} else if ( rv < 0.15 ) {
			particles.AddShield(this);
		} else {
			var cpos = vadd( t.pos, vmul( t.vel, ct * 60 ) );
			var dir = vnorm( vsub( cpos, this.pos ) );
			particles.AddBullet( this, vadd( this.pos, vmul( dir, 40 ) ), dir );
		}
	} else {
		/* MOVEMENT CODE FOR NO TARGET GOES HERE */
	}
} );