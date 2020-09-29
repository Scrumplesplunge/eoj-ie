// Vector Constructor.
function vec( x, y ) {
	var obj = { };
	obj.x = x;
	obj.y = y;
	return obj;
}

// Add two vectors together.
function vadd( a, b ) {
	var obj = { };
	obj.x = a.x + b.x;
	obj.y = a.y + b.y;
	return obj;
}

// Subtract one vector from another.
function vsub( a, b ) {
	var obj = { };
	obj.x = a.x - b.x;
	obj.y = a.y - b.y;
	return obj;
}

// Multiply a vector by a scalar.
function vmul( a, b ) {
	var obj = { };
	obj.x = a.x * b;
	obj.y = a.y * b;
	return obj;
}

// Divide a vector by a scalar.
function vdiv( a, b ) {
	var obj = { };
	obj.x = a.x / b;
	obj.y = a.y / b;
	return obj;
}

// Return the length of a vector.
function vlen( a ) {
	return Math.sqrt( a.x * a.x + a.y * a.y );
}

// Return a normalized version of the vector (same direction, unit magnitude).
function vnorm( a ) {
	var len = vlen( a );
	return ( len == 0 ) ? vec( 1, 0 ) : vdiv( a, len );
}

// Alert a vector.
function valert( a ) {
	alert( "[" + a.x + "," + a.y + "]" );
}