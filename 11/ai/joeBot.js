var tmp = CreateRobot( "JoeBot", "rgb(0,200,0)", function( bots, bits ) {
	var dist = 1000;
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
	this.target = t;
	if ( t != false ) {
		// Collision avoidance.
		var vacc = vec( 0, 0 );
		
		// Four edges.
		vacc = vadd( vacc, vec( -1 / this.pos.x, 0 ) );
		vacc = vadd( vacc, vec( 1 / ( screen.width - this.pos.x ), 0 ) );
		vacc = vadd( vacc, vec( 0, -1 / this.pos.y ) );
		vacc = vadd( vacc, vec( 0, 1 / ( screen.height - this.pos.y ) ) );
		
		// Avoid robots
		for ( var i=0; i<bots.length; i++ ) {
			if ( bots[ i ].name == this.name ) {
				continue;
			}
			var local = vsub( bots[ i ].pos, this.pos );
			vacc = vadd( vacc, vmul( vnorm( local ), 0.5 / vlen( local ) ) );
		}
		
		// Avoid projectiles
		for ( var i=0; i<bits.length; i++ ) {
			// Ignore harmless things
			if ( bits[ i ].type == "Shield" || bits[ i ].type == "ShieldPop" || bits[ i ].type == "Smoke" || bits[ i ].type == "Flame" || bits[ i ].type == "Blood" ) {
				continue;
			}
			// Ignore projectiles that are owned by self.
			if ( bits[ i ].owner == this.name ) {
				continue;
			}
			
			var local = vsub( bits[ i ].pos, this.pos );
			// If the distance is smaller than 40, try to put up a forcefield.
			if ( vlen( local ) < 40 ) {
				particles.AddShield( this );
			}
			var df = 1;
			if ( bits[ i ].type == "Rocket" ) {
				df = 10;
			} else if ( bits[ i ].type == "Explosion" ) {
				df = 5;
			}
			vacc = vadd( vacc, vmul( vnorm( local ), df / vlen( local ) ) );
		}
		
		// Choose a direction to go depending on the avoidance vector.
		var tvel = vmul( vnorm( vadd( vmul( vnorm( vacc ), -0.75 ), vdiv( vsub( vec( screen.width / 2, screen.height / 2 ), this.pos ), screen.width / 2 ) ) ), 1 );
		this.vel = vadd( vmul( this.vel, 0.8 ), tvel );
		
		if ( Math.random( ) > 0.75 ) {
			var ct = vlen( vsub( t.pos, this.pos ) ) / ( 20 * 20 );
			var rv = Math.random( );
			var cpos = vadd( t.pos, vmul( t.vel, ct * 15 ) );
			var dir = vnorm( vsub( cpos, this.pos ) );
			if ( rv > 0.9 ) {
				particles.AddRocket( this, vadd( this.pos, vmul( dir, 30 ) ), dir );
			} else {
				particles.AddBullet( this, vadd( this.pos, vmul( dir, 30 ) ), dir );
			}
		}
	} else {
		this.vel = vadd( this.vel, vec( Math.random( ) * 2 - 1, Math.random( ) * 2 - 1 ) );
		var spd = Math.min( 2, vlen( this.vel ) );
		this.vel = vmul( vnorm( this.vel ), spd );
	}
} );

function D( c ) {
	
}