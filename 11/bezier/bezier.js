function lerp( a, b, t ) {
	return [ a[0] + ( b[0] - a[0] ) * t, a[1] + ( b[1] - a[1] ) * t ];
}
 
function berp( points, t, cv ) {
	var temp = [ ];
	if ( cv ) {
		if ( points.length == 2 ) {
			cv.strokeStyle = "rgb(60,60,60)";
		} else {
			cv.strokeStyle = "rgb(200,200,200)";
		}
		cv.beginPath( );
		cv.moveTo( points[ 0 ][ 0 ], points[ 0 ][ 1 ] );
	}
	for ( var i=0; i<points.length-1; i++ ) {
		if ( cv ) {
			cv.lineTo( points[ i + 1 ][ 0 ], points[ i + 1 ][ 1 ] );
		}
		temp[ i ] = lerp( points[ i ], points[ i + 1 ], t );
	}
	if ( cv ) {
		cv.stroke( );
	}
	if ( points.length == 1 ) {
		return points[ 0 ];
	} else if ( points.length == 2 ) {
		var p = lerp( points[ 0 ], points[ 1 ], t );
		if ( cv ) {
			cv.fillStyle = "rgb(0,0,255)";
			cv.beginPath( );
			cv.arc( p[ 0 ], p[ 1 ], 2, 0, 2 * Math.PI, false );
			cv.fill( );
		}
		return p;
	}
	return berp( temp, t, cv );
}
 
function squaresep( a, b ) {
	return Math.pow( a[0] - b[0], 2 ) + Math.pow( a[1] - b[1], 2 );
}
 
function _bezier( points, ta, tb ) {
	var pa = berp( points, ta );
	var pb = berp( points, tb );
	var pc = berp( points, ( ta + tb ) / 2 ); 
	if ( squaresep( pa, pb ) > 9 || ( squaresep( pa, pc ) > 2.5 && squaresep( pb, pc ) > 2.5 ) ) {
		return [].concat( _bezier( points, ta, ( ta + tb ) / 2 ), _bezier( points, ( ta + tb ) / 2, tb ) );
	} else {
		return [ pa, pb ];
	}
}
 
function drawBezier( points, cv ) {
	var line = _bezier( points, 0, 1 );
	cv.strokeStyle = "rgb(255,0,0)";
	cv.beginPath( );
	cv.moveTo( line[ 0 ][ 0 ], line[ 0 ][ 1 ] );
	for ( var i=1; i<line.length; i++ ) {
		cv.lineTo( line[ i ][ 0 ], line[ i ][ 1 ] );
	}
	cv.stroke( );
}
 
function drawControlPoints( points, cv ) {
	cv.fillStyle = "rgb(200,200,200)";
	for ( var i=0; i<points.length; i++ ) {
		cv.beginPath( );
		cv.arc( points[ i ][ 0 ], points[ i ][ 1 ], 2, 0, 2 * Math.PI, false );
		cv.fill( );
	}
}
 
function drawBezierWorking( points, t, cv ) {
	cv.clearRect( 0, 0, 640, 480 );
	drawControlPoints( points, cv );
	berp( points, t, cv );
	drawBezier( points, cv );
}
 
function addPoint( ) {
	bezier.push( [ slang.Mouse.x - 5, slang.Mouse.y - 5 ] );
}
 
var canvas;
var bezier = [ ];
 
window.onload = function( ) {
	canvas = document.getElementById( "cv" ).getContext( "2d" );
	setInterval( function( ) {
		var time = 0.5 + 0.5 * Math.sin( (new Date()).getTime( ) / 5000 );
		drawBezierWorking( bezier, time, canvas );
	}, 20 );
}