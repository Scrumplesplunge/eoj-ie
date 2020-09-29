var manual = {
	up: 87,
	down: 83,
	left: 65,
	right: 68,
	bullet: 81,
	rocket: 69,
	shield: 32,
	keys: [ ],
	mouse: false,
	mpos: vec( 0, 0 ),
	mode: false
};

app.AddEvent( window, "load", function( ) {
	var win = document.getElementsByTagName( "body" )[ 0 ];
	app.AddEvent( window, "keydown", function( ) {
		manual.keys[ window.event.keyCode ] = 1;
	} );
	app.AddEvent( window, "keyup", function( ) {
		manual.keys[ window.event.keyCode ] = 0;
	} );
	app.AddEvent( window, "mousedown", function( ) {
		manual.mouse = true;
	} );
	app.AddEvent( window, "mousemove", function( ) {
		var e = window.event;
		if ( e.pageX || e.pageY ) {
			manual.mpos.x = e.pageX;
			manual.mpos.y = e.pageY;
		} else if ( e.clientX || e.clientY ) {
			manual.mpos.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			manual.mpos.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		} else {
			manual.mpos.x = 0;
			manual.mpos.y = 0;
		}
		manual.mpos = vsub( manual.mpos, vec( parseInt( window.getComputedStyle( document.getElementById( "screen" ), null ).left ), parseInt( window.getComputedStyle( document.getElementById( "screen" ), null ).top ) ) );
	} );
	app.AddEvent( window, "mouseup", function( ) {
		manual.mouse = false;
	} );
	for ( var i=0; i<256; i++ ) {
		manual.keys[ i ] = 0;
	}
} );

CreateRobot( "ManualBot", "rgb(255,200,0)", function( bots, bits ) {
	var mov = vec( manual.keys[ manual.right ] - manual.keys[ manual.left ], manual.keys[ manual.down ] - manual.keys[ manual.up ] );
	mov = ( vlen( mov ) > 0.1 ) ? vnorm( mov ) : vec( 0, 0 );
	this.vel = vadd( vmul( this.vel, 0.9 ), vmul( mov, 3 ) );
	if ( manual.keys[ manual.rocket ] ) {
		manual.mode = true;
	}
	if ( manual.keys[ manual.bullet ] ) {
		manual.mode = false;
	}
	if ( manual.keys[ manual.shield ] ) {
		particles.AddShield( this );
	}
	if ( manual.mouse ) {
		var dir = vnorm( vsub( manual.mpos, this.pos ) );
		if ( manual.mode ) {
			particles.AddRocket( this, vadd( this.pos, vmul( dir, 30 ) ), dir );
		} else {
			particles.AddBullet( this, vadd( this.pos, vmul( dir, 30 ) ), dir );
		}
	}
} );