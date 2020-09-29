// Screen info
var screen = {
	canvas: false,
	width: 800,
	height: 600
}

// This function allows for a full copy of an object to be made.
Object.prototype.clone = function( ) {
	var newObj = { };
	var i;
	for ( i in this ) {
		if ( i == "clone" ) {
			continue;
		}
		if ( typeof this[ i ] == "object" ) {
			// Recurse the function.
			newObj[ i ] = this[ i ].clone( );
		} else {
			// Copy the value.
			newObj[ i ] = this[ i ];
		}
	}
	return newObj;
}

// Robots array.
var robots = {
	// List of all the robots currently being used. 
	all: [ ],
	// Add a robot to the list.
	AddRobot: function( robot ) {
		var id = robots.all.length;
		robots.all[ id ] = robot.clone( );
		return id;
	},
	// Get the index of a robot in the list by it's name.
	GetIndex: function( name ) {
		for ( var i=0; i<robots.all.length; i++ ) {
			if ( robots.all[ i ].name == name ) {
				return i;
			}
		}
		return false;
	}
}

// Particles array.
var particles = {
	// List of all particles.
	all: [ ],
	// Add a particle to the list.
	AddParticle: function( particle ) {
		var id = particles.all.length;
		particles.all[ id ] = particle.clone( );
		return id;
	},
	// Add a bullet to the scene (constant velocity, 5 damage).
	AddBullet: function( owner, pos, dir ) {
		if ( owner.reload > GetTime( ) ) {
			return;
		}
		owner.reload = GetTime( ) + 0.2;
		var bullet = { };
		bullet.type = "Bullet";
		bullet.owner = owner.name;
		bullet.dir = vmul( vnorm( dir ), 20 );
		bullet.pos = pos;
		bullet.alive = true;
		// Called every tick that the bullet is alive.
		bullet.Think = function( bots, bits ) {
			this.pos = vadd( this.pos, this.dir );
			for ( var b=0; b<bots.length; b++ ) {
				if ( vlen( vsub( bots[ b ].pos, this.pos ) ) < 25 ) {
					this.alive = false;
					for ( var i=0; i<25; i++ ) {
						particles.AddBlood( this.pos );
					}
					bots[ b ].health -= 5;
					break;
				}
			}
			if ( this.pos.x > screen.width || this.pos.x < 0 || this.pos.y > screen.height || this.pos.y < 0 ) {
				this.alive = false;
			}
		}
		// Called every time the bullet is redrawn.
		bullet.Draw = function( c ) {
			c.fillStyle = "rgb(100,100,100)";
			c.fillRect( Math.round( this.pos.x - 1 ), Math.round( this.pos.y - 1 ), 3, 3 );
		}
		particles.AddParticle( bullet );
	},
	// Add a rocket (accelerates, 50 damage per tick that the explosion is in contact with a robot.
	AddRocket: function( owner, pos, dir ) {
		if ( owner.reload > GetTime( ) ) {
			return;
		}
		owner.reload = GetTime( ) + 1;
		var rocket = { };
		rocket.type = "Rocket";
		rocket.owner = owner.name;
		rocket.dir = vmul( vnorm( dir ), 5 );
		rocket.pos = pos;
		rocket.alive = true;
		// Called every tick that the rocket is live.
		rocket.Think = function( bots, bits ) {
			this.dir = vmul( vnorm( this.dir ), vlen( this.dir ) + 0.5 );
			this.pos = vadd( this.pos, this.dir );
			for ( var i=-0.5; i<0.5; i+=0.1 ) {
				var tmp = vsub( this.pos, vmul( this.dir, i ) );
				particles.AddSmoke( tmp );
			}
			for ( var b=0; b<bots.length; b++ ) {
				if ( vlen( vsub( bots[ b ].pos, this.pos ) ) < 25 ) {
					this.alive = false;
					particles.AddExplosion( this.owner, this.pos, 50 );
					break;
				}
			}
			if ( this.pos.x > screen.width || this.pos.x < 0 || this.pos.y > screen.height || this.pos.y < 0 ) {
				this.alive = false;
			}
		}
		// Called every time that the rocket is redrawn.
		rocket.Draw = function( c ) {
			c.fillStyle = "rgba(0,0,0,1)";
			c.fillRect( Math.round( this.pos.x - 1 ), Math.round( this.pos.y - 1 ), 3, 3 );
		}
		particles.AddParticle( rocket );
	},
	// Add an explosion (stationary, expands causing damage on contact every tick)
	AddExplosion: function( owner, pos, radius ) {
		var exp = { };
		exp.type = "Explosion";
		exp.owner = owner;
		exp.start = GetTime( );
		exp.pos = pos;
		exp.radius = 0;
		exp.tradius = radius;
		exp.alive = true;
		for ( var i=0; i<50; i++ ) {
			particles.AddFlame( exp.pos );
			particles.AddSmoke( exp.pos );
		}
		exp.Think = function( bots, bits ) {
			this.radius = Math.pow( ( GetTime( ) - this.start ) * 2, 0.25 ) * this.tradius;
			if ( this.radius >= this.tradius ) {
				this.alive = false;
			}
			for ( var i=0; i<bots.length; i++ ) {
				for ( var i=0; i<bots.length; i++ ) {
					if ( vlen( vsub( bots[ i ].pos, this.pos ) ) < this.radius ) {
						bots[ i ].health -= 25;
						bots[ i ].vel = vadd( bots[ i ].vel, vmul( vnorm( vsub( bots[ i ].pos, this.pos ) ), 5 ) );
					}
				}
			}
		}
		exp.Draw = function( c ) { }
		particles.AddParticle( exp );
	},
	// Add a mobile particle of smoke to the simulation
	AddFlame: function( pos ) {
		var exp = { };
		exp.type = "Flame";
		exp.start = GetTime( );
		exp.pos = pos;
		exp.vel = vmul( vec( Math.random( ) - 0.5, Math.random( ) - 0.5 ), Math.random( ) * 30 );
		exp.radius = 0;
		exp.tradius = 10;
		exp.alive = true;
		exp.Think = function( bots, bits ) {
			this.vel = vmul( this.vel, 0.9 );
			this.pos = vadd( this.pos, this.vel );
			this.radius = Math.pow( ( GetTime( ) - this.start ) * 2, 0.25 ) * this.tradius;
			if ( this.radius >= this.tradius ) {
				this.alive = false;
			}
		}
		exp.Draw = function( c ) {
			var bright = 0.5 - ( GetTime( ) - this.start );
			c.fillStyle = "rgba(255,150,0," + bright + ")";
			c.beginPath( );
			c.arc( Math.round( this.pos.x ), Math.round( this.pos.y ), this.radius, 0, Math.PI * 2, true );
			c.fill( );
			c.fillStyle = "rgb(0,0,0)";
		}
		particles.AddParticle( exp );
	},
	// Add a mobile particle of smoke to the simulation
	AddSmoke: function( pos ) {
		var exp = { };
		exp.type = "Smoke";
		exp.start = GetTime( );
		exp.pos = pos;
		exp.vel = vmul( vec( Math.random( ) - 0.5, Math.random( ) - 0.5 ), Math.random( ) * 5 );
		exp.radius = 0;
		exp.tradius = 10;
		exp.alive = true;
		exp.Think = function( bots, bits ) {
			this.vel = vmul( this.vel, 0.9 );
			this.pos = vadd( this.pos, this.vel );
			this.radius = Math.pow( ( GetTime( ) - this.start ) * 2, 0.25 ) * this.tradius;
			if ( this.radius >= this.tradius ) {
				this.alive = false;
			}
		}
		exp.Draw = function( c ) {
			var bright = 0.5 - ( GetTime( ) - this.start );
			c.fillStyle = "rgba(200,200,200," + bright + ")";
			c.beginPath( );
			c.arc( Math.round( this.pos.x ), Math.round( this.pos.y ), this.radius, 0, Math.PI * 2, true );
			c.fill( );
			c.fillStyle = "rgb(0,0,0)";
		}
		particles.AddParticle( exp );
	},
	// Add a mobile particle of blood to the simulation
	AddBlood: function( pos ) {
		var exp = { };
		exp.type = "Blood";
		exp.start = GetTime( );
		exp.pos = pos;
		exp.vel = vmul( vec( Math.random( ) - 0.5, Math.random( ) - 0.5 ), Math.random( ) * 15 );
		exp.radius = 0;
		exp.tradius = 3;
		exp.alive = true;
		exp.Think = function( bots, bits ) {
			this.vel = vmul( this.vel, 0.9 );
			this.pos = vadd( this.pos, this.vel );
			this.radius = Math.pow( ( GetTime( ) - this.start ) * 5, 0.25 ) * this.tradius;
			if ( this.radius >= this.tradius ) {
				this.alive = false;
			}
		}
		exp.Draw = function( c ) {
			var bright = 0.5 - ( GetTime( ) - this.start ) * 2.5;
			c.fillStyle = "rgba(200,0,0," + bright + ")";
			c.beginPath( );
			c.arc( Math.round( this.pos.x ), Math.round( this.pos.y ), this.radius, 0, Math.PI * 2, true );
			c.fill( );
			c.fillStyle = "rgb(0,0,0)";
		}
		particles.AddParticle( exp );
	},
	// Add a shield to the simulation.
	AddShield: function( owner ) {
		if ( owner.reload > GetTime( ) ) {
			return;
		}
		owner.reload = GetTime( ) + 2.5;
		var shield = { };
		shield.type = "Shield";
		shield.die = GetTime( ) + 2;
		shield.pos = owner.pos;
		shield.o = owner;
		shield.owner = owner.name;
		shield.alive = true;
		shield.Think = function( bots, bits ) {
			if ( typeof robots.GetIndex( this.owner ) == "boolean" ) {
				this.alive = false;
				return;
			}
			this.pos = bots[ robots.GetIndex( this.owner ) ].pos;
			for ( var i=0; i<bits.length; i++ ) {
				if ( bits[ i ].type == "Shield" || bits[ i ].type == "ShieldPop" || bits[ i ].type == "Smoke" ) {
					continue;
				}
				if ( vlen( vsub( bits[ i ].pos, this.pos ) ) < 50 ) {
					bits[ i ].alive = false;
					particles.AddShieldPop( bits[ i ].pos );
				}
			}
			if ( GetTime( ) > this.die ) {
				this.alive = false;
			}
		}
		shield.Draw = function( c ) {
			var bright = ( 2 - this.die + GetTime( ) ) / 2;
			var r = Math.round( 150 + 95 * bright );
			var g = Math.round( 200 + 45 * bright );
			c.fillStyle = "rgb(" + r + "," + g + ",255)";
			c.beginPath( );
			c.arc( Math.round( this.pos.x ), Math.round( this.pos.y ), 50, 0, Math.PI * 2, true );
			c.fill( );
		}
		particles.AddParticle( shield );
	},
	// Add a small pop where something hits the shield.
	AddShieldPop: function( pos ) {
		var exp = { };
		exp.type = "ShieldPop";
		exp.start = GetTime( );
		exp.pos = pos;
		exp.radius = 0;
		exp.tradius = 15;
		exp.alive = true;
		exp.Think = function( bots, bits ) {
			this.radius = Math.pow( ( GetTime( ) - this.start ) * 5, 0.25 ) * this.tradius;
			if ( this.radius >= this.tradius ) {
				this.alive = false;
			}
		}
		exp.Draw = function( c ) {
			var bright = 1 - ( GetTime( ) - this.start ) * 5;
			c.fillStyle = "rgba(150,200,255," + bright + ")";
			c.beginPath( );
			c.arc( Math.round( this.pos.x ), Math.round( this.pos.y ), this.radius, 0, Math.PI * 2, true );
			c.fill( );
		}
		particles.AddParticle( exp );
	}
}

// The application functions
var app = {
	Screen: false,
	// Tie a function to an event, making it be called when the event happens.
	AddEvent: function( ent, e, func ) {
		if ( ent.addEventListener ) {
			ent.addEventListener( e, func, false );
		} else if ( ent.attachEvent ) {
			ent.attachEvent( 'on' + e, func );
		} else {
			ent[ 'on' + e ] = func;
		}
	},
	// Called when the simulation begins.
	Init: function( ) {
		for ( var i=0; i<robots.all.length; i++ ) {
			robots.all[ i ].pos = vec( 25 + Math.random( ) * ( screen.width - 50 ), 25 + Math.random( ) * ( screen.height - 50 ) );
		}
		setInterval( app.Think, 50 );
	},
	// Called every tick during the simulation.
	Think: function( ) {
		var del = [ ];
		// Process the robots.
		for ( var bot=0; bot<robots.all.length; bot++ ) {
			if ( robots.all[ bot ].health > 0 ) {
				// If the robot is alive, run it's think, and redraw it.
				robots.all[ bot ].Think( robots.all, particles.all );
				// Limit the velocity.
				var spd = Math.min( 5, vlen( robots.all[ bot ].vel ) );
				robots.all[ bot ].vel = vmul( vnorm( robots.all[ bot ].vel ), spd );
				// Update the position.
				robots.all[ bot ].pos = vadd( robots.all[ bot ].pos, robots.all[ bot ].vel );
				// Limit the position so that the robot remains onscreen.
				if ( robots.all[ bot ].pos.x < 25 ) {
					robots.all[ bot ].pos.x = 25;
					robots.all[ bot ].vel.x = 0;
				}
				if ( robots.all[ bot ].pos.y < 25 ) {
					robots.all[ bot ].pos.y = 25;
					robots.all[ bot ].vel.y = 0;
				}
				if ( robots.all[ bot ].pos.x > ( screen.width - 25 ) ) {
					robots.all[ bot ].pos.x = ( screen.width - 25 );
					robots.all[ bot ].vel.x = 0;
				}
				if ( robots.all[ bot ].pos.y > ( screen.height - 25 ) ) {
					robots.all[ bot ].pos.y = ( screen.height - 25 );
					robots.all[ bot ].vel.y = 0;
				}
			} else {
				del[ del.length ] = bot;
				particles.AddExplosion( robots.all[ bot ].name, robots.all[ bot ].pos, 100 );
			}
		}
		
		// Delete the robots from the delete list.
		var tmp = [ ];
		for ( var i=0; i<del.length; i++ ) {
			robots.all[ del[ i ] ] = "DELETED";
		}
		for ( var i=0; i<robots.all.length; i++ ) {
			if ( robots.all[ i ] != "DELETED" ) {
				tmp[ tmp.length ] = robots.all[ i ].clone( );
			}
		}
		robots.all = tmp;
		
		del = [ ];
		// Process each particle in the simulation.
		for ( var ptcl=0; ptcl<particles.all.length; ptcl++ ) {
			if ( particles.all[ ptcl ].alive ) {
				// If the particle is alive, run it's think.
				particles.all[ ptcl ].Think( robots.all, particles.all );
			} else {
				// If it is dead, add it to the delete list.
				del[ del.length ] = ptcl;
			}
		}
		// Delete all the particles in the delete list.
		var tmp = [ ];
		for ( var i=0; i<del.length; i++ ) {
			particles.all[ del[ i ] ] = "DELETED";
		}
		for ( var i=0; i<particles.all.length; i++ ) {
			if ( particles.all[ i ] != "DELETED" ) {
				tmp[ tmp.length ] = particles.all[ i ].clone( );
			}
		}
		particles.all = tmp;
		
		// Clear the screen ready for redraw.
		app.Screen.clearRect( 0, 0, screen.width, screen.height );
		// Redraw the scene.
		for ( var i=0; i<particles.all.length; i++ ) {
			particles.all[ i ].Draw( app.Screen );
		}
		for ( var i=0; i<robots.all.length; i++ ) {
			robots.all[ i ].Draw( app.Screen );
			DrawHealthBar( app.Screen, robots.all[ i ], 500 );
		}
	}
}

app.AddEvent( window, "load", function( ) {
	screen.canvas = document.getElementById( "screen" );
	screen.canvas.width = screen.width;
	screen.canvas.height = screen.height;
	screen.canvas.style.width = screen.width + "px";
	screen.canvas.style.height = screen.height + "px";
	app.Screen = screen.canvas.getContext( "2d" );
	app.Init( );
} );

function GetTime( ) {
	var d = new Date( );
	return d.getTime( ) / 1000;
}