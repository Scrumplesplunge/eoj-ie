// Jlib - Written by Joe Fowler
var Jlib = {
	version: 0.11,
	description: "Jlib is a simple prototype library that simplifies javascript."
}

var Ajax = { };

// Cross-browser XMLHttpRequest constructor.
// Usage: Ajax.create( );
// Returns: XMLHttpRequest Object
Ajax.create = function( ) {
	if ( window.XMLHttpRequest ) {
		return new XMLHttpRequest( );
	} else if ( window.ActiveXObject ) {
		try {
			return new ActiveXObject( "Microsoft.XMLHTTP" );
		} catch ( e ) {
			try {
				return new ActiveXObject( "Msxml2.XMLHTTP" );
			} catch ( e ) {
				return false;
			}
		}
	}
}

// GET requests a file. If a callback is provided, it is asynchronous.
// Usage: Ajax.get( url, [callback] );
// Returns: XMLHttpRequest Object
Ajax.get = function( path, callback ) {
	var q = this.create( );
	if ( !q ) return false;
	q.open( "GET", path, callback ? true : false );
	if ( callback ) {
		q.callback = callback;
		q.onreadystatechange = function( ) {
			if ( this.readyState == 4 ) {
				this.callback( this );
			}
		}
	}
	q.send( );
	return q;
}

// POST requests a file and sends some data. If a callback is provided, it is asynchronous.
// Usage: Ajax.post( url, data, [callback] );
// Returns: XMLHttpRequest Object
Ajax.post = function( path, data, callback ) {
	var q = this.create( );
	if ( !q ) return false;
	q.open( "POST", path, callback ? true : false );
	q.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
	q.setRequestHeader( "Content-length", data.length );
	q.setRequestHeader( "Connection", "close" );
	if ( callback ) {
		q.callback = callback;
		q.onreadystatechange = function( ) {
			if ( this.readyState == 4 ) {
				this.callback( this );
			}
		}
	}
	q.send( data );
	return q;
}

// Returns the first array entry.
// Usage: [1,2,3].first( );
// Returns: 1
Array.prototype.first = function( ) {
	return this[ 0 ];
}

// Returns the last array entry.
// Usage: [1,2,3].last( );
// Returns: 3
Array.prototype.last = function( ) {
	return this[ this.length - 1 ];
}

// Returns a random array entry.
// Usage: [1,2,3].random( );
// Returns: 1, 2, or 3
Array.prototype.random = function( ) {
	return this[ Math.round( Math.random( ) * ( this.length - 1 ) ) ];
}

// Removes and returns the value at the provided index.
// Usage: [1,2,3].remove( 2 );
// Returns: 3
Array.prototype.remove = function( a ) {
	return this.splice( a, 1 )[ 0 ];
}

// Scrambles an array.
// Usage: [1,2,3].scramble( );
// Returns: [2,1,3]
Array.prototype.scramble = function( ) {
	var out = [ ];
	var tmp = Util.copy( this );
	while ( tmp.length > 0 ) {
		out.push( tmp.remove( Math.round( Math.random( ) * ( tmp.length - 1 ) ) ) );
	}
	return out;
}

// Provides JSON support where it is not native.
if ( !JSON ) JSON = { };

// Parses a JSON encoded string safely. See JSON documentation for usage.
// Usage: JSON.parse( "[2,3,'hello']" );
// Returns: [2,3,"hello"]
if ( !JSON.parse ) JSON.parse = (function(){var at,ch,escapee={'"':'"','\\':'\\','/':'/',b:'\b',f:'\f',n:'\n',r:'\r',t:'\t'},text,error=function(m){throw{name:'SyntaxError',message:m,at:at,text:text}},next=function(c){if(c&&c!==ch){error("Expected '"+c+"' instead of '"+ch+"'")};ch=text.charAt(at);at+=1;return ch},number=function(){var number,string='';if(ch==='-'){string='-';next('-')};while(ch>='0'&&ch<='9'){string+=ch;next()};if(ch==='.'){string+='.';while(next()&&ch>='0'&&ch<='9'){string+=ch}};if(ch==='e'||ch==='E'){string+=ch;next();if(ch==='-'||ch==='+'){string+=ch;next()}while(ch>='0'&&ch<='9'){string+=ch;next()}};number=+string;if(!isFinite(number)){error("Bad number")}else{return number}},string=function(){var hex,i,string='',uffff;if(ch==='"'){while(next()){if(ch==='"'){next();return string}else if(ch==='\\'){next();if(ch==='u'){uffff=0;for(i=0;i<4;i+=1){hex=parseInt(next(),16);if(!isFinite(hex)){break};uffff=uffff*16+hex}string+=String.fromCharCode(uffff)}else if(typeof escapee[ch]==='string'){string+=escapee[ch]}else{break}}else{string+=ch}}};error("Bad string")},white=function(){while(ch&&ch<=' '){next()}},word=function(){switch(ch){case 't':next('t');next('r');next('u');next('e');return true;case 'f':next('f');next('a');next('l');next('s');next('e');return false;case 'n':next('n');next('u');next('l');next('l');return null};error("Unexpected '" + ch + "'")},value,array=function(){var array=[];if(ch==='['){next('[');white();if(ch===']'){next(']');return array};while(ch){array.push(value());white();if(ch===']'){next(']');return array};next(',');white()}};error("Bad array")},object=function(){var key,object={};if(ch==='{'){next('{');white();if(ch==='}'){next('}');return object};while(ch){key=string();white();next(':');if(Object.hasOwnProperty.call(object,key)){error('Duplicate key "'+key+'"')};object[key]=value();white();if(ch==='}'){next('}');return object};next(',');white()}};error("Bad object")};value=function(){white();switch(ch){case '{':return object();case '[':return array();case '"':return string();case '-':return number();default:return ch>='0'&&ch<='9'?number():word()}};return function(source,reviver){var result;text=source;at=0;ch=' ';result=value();white();if(ch){error("Syntax error")};return typeof reviver==='function'?(function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}};return reviver.call(holder,key,value)}({'':result},'')):result}}());

// Stores an object to a JSON encoded string. See JSON documentation for usage.
// Usage: JSON.stringify( {a:[2,3,4],b:"hi"} );
// Returns: '{"a":[2,3,4],"b":"hi"}'
if ( !JSON.stringify ) JSON.stringify = function( object, replacer, space ) {
	var tmp = function( self, obj, rep, spa, dep ) {
		var out = "";
		var find = function( r, v ) {
			for ( var i=0; i<r.length; i++ ) {
				if ( r[ i ] == v ) return i;
			}
			return false;
		}
		switch ( Util.typeof( obj ) ) {
			case "Array":
				out = "[" + ( spa ? "\n" : "" );
				for ( var i=0; i<obj.length; i++ ) {
					var val = obj[ i ];
					if ( typeof val === "undefined" ) {
						continue;
					}
					if ( Util.typeof( rep ) == "Function" ) {
						val = rep( i, val );
						if ( typeof val === "undefined" ) {
							continue;
						}
					}
					out += ( spa ? "\t".repeat( dep + 1 ) : "" ) + self( self, val, rep, spa, dep + 1 ) + "," + ( spa ? "\n" : "" );
				}
				out = out.replace( ( spa ? /,\n$/ : /,$/ ), "" ) + ( spa ? "\n" + "\t".repeat( dep ) : "" ) + "]";
				return out;
			case "Object":
				out = "{" + ( spa ? "\n" : "" );
				for ( var i in obj ) {
					var val = obj[ i ];
					if ( Util.typeof( rep ) == "Function" ) {
						val = rep( i, val );
						if ( typeof val === "undefined" ) {
							continue;
						}
					} else if ( Util.typeof( rep ) == "Array" ) {
						if ( find( rep, i ) === false ) continue;
					}
					out += ( spa ? "\t".repeat( dep + 1 ) : "" ) + "\"" + i + "\":" + ( spa ? " " : "" ) + self( self, val, rep, spa, dep + 1 ) + "," + ( spa ? "\n" : "" );
				}
				out = out.replace( ( spa ? /,\n$/ : /,$/ ), "" ) + ( spa ? "\n" + "\t".repeat( dep ) : "" ) + "}";
				return out;
			case "String":
				return "\"" + obj.replace( /([\\"'])/g, "\\$1" ).replace( /\0/g, "\\0" ) + "\"";
			case "Number":
			case "Function":
			default:
				return "" + obj;
		}
	}
	return tmp( tmp, object, replacer, space, 0 );
}

// Returns true if val is between min and max.
// Usage: Math.inRange( 3, 1, 5 );
// Returns: true
Math.inRange = function( val, min, max ) {
	return ( val >= min && val <= max );
}

// Forces val into the range min -> max
// Usage: Math.clamp( 5, 1, 3 );
// Returns: 3
Math.clamp = function( val, min, max ) {
	return Math.min( max, Math.max( min, val ) );
}

// Returns the log of b, base a.
// Usage: Math.logab( 2, 1024 );
// Returns: 10
Math.logab = function( a, b ) {
	return Math.log( b ) / Math.log( a );
}

var Mouse = { };

Mouse._pos = [ 0, 0 ];
Mouse._down = false;

// Horizontal position of mouse.
// Usage: Mouse.left( );
// Returns: Distance from left side of screen.
Mouse.left = function( ) {
	return Mouse._pos[ 0 ];
}

// Vertical position of mouse.
// Usage: Mouse.top( );
// Returns: Distance from top of screen.
Mouse.top = function( ) {
	return Mouse._pos[ 1 ];
}

// Returns true if the mouse is down
// Usage: Mouse.held( );
Mouse.held = function( ) {
	return Mouse._down;
}

var Page = { };

// Returns the page width.
// Usage: Page.width( ); 
// Returns: Width of page.
Page.width = function( ) {
	var doc = document.documentElement;
	var bod = document.body;
	if ( window.innerWidth ) {
		return window.innerWidth;
	} else if ( doc && doc.clientWidth ) {
		return doc.clientWidth;
	} else if ( bod && bod.clientWidth ) {
		return bod.clientWidth;
	} else {
		return 0;
	}
}

// Returns the page height.
// Usage: Page.height( );
// Returns: Height of page.
Page.height = function( ) {
	var doc = document.documentElement;
	var bod = document.body;
	if ( window.innerHeight ) {
		return window.innerHeight;
	} else if ( doc && doc.clientHeight ) {
		return doc.clientHeight;
	} else if ( bod && bod.clientHeight ) {
		return bod.clientHeight;
	} else {
		return 0;
	}
}

// Returns the amount that the client has scrolled right.
// Usage: Page.scrollLeft( );
// Returns: How far the user has scrolled right.
Page.scrollLeft = function( ) {
	var doc = document.documentElement;
	var bod = document.body;
	if ( typeof window.pageXOffset != "undefined" ) {
		return window.pageXOffset;
	} else if ( doc && doc.scrollLeft ) {
		return doc.scrollLeft;
	} else if ( bod && bod.scrollLeft ) {
		return bod.scrollLeft;
	} else {
		return 0;
	}
}

// Returns the amount that the client has scrolled down.
// Usage: Page.scrollTop( );
// Returns: How far the user has scrolled down.
Page.scrollTop = function( ) {
	var doc = document.documentElement;
	var bod = document.body;
	if ( typeof window.pageYOffset != "undefined" ) {
		return window.pageYOffset;
	} else if ( doc && doc.scrollTop ) {
		return doc.scrollTop;
	} else if ( bod && bod.scrollTop ) {
		return bod.scrollTop;
	} else {
		return 0;
	}
}

// Repeats a string the amount of times specified
// Usage: "bla".repeat( 3 )
// Returns: "blablabla"
String.prototype.repeat = function( reps ) {
	var out = "";
	for ( var i=0; i<reps; i++ ) out += this.valueOf( );
	return out;
}

// Returns a string containing one of each character present in the string.
// Usage: "blabla".chars( );
// Returns: "abl"
String.prototype.chars = function( ) {
	var tmp = [ ];
	var s = this.split( "" );
	for ( var i=0; i<s.length; i++ ) {
		if ( !tmp[ s[ i ].charCodeAt( 0 ) ] ) {
			tmp[ s[ i ].charCodeAt( 0 ) ] = true;
		}
	}
	var out = "";
	for ( var i=0; i<tmp.length; i++ ) {
		if ( tmp[ i ] ) out += String.fromCharCode( i );
	}
	return out;
}

// Scrambles the characters in a string.
// Usage: "cheese".scramble( );
// Returns: "escehe"
String.prototype.scramble = function( ) {
	return this.split( "" ).scramble( ).join( "" );
}

var Util = { };

// Creates a full copy of an object.
// Usage: Util.copy( myObject );
// Returns: A copy of myObject.
Util.copy = function( obj ) {
	var out;
	switch ( Util.typeof( obj ) ) {
		case "Array":
			out = [ ];
			for ( var i=0; i<obj.length; i++ ) {
				out[ i ] = Util.copy( obj[ i ] );
			}
			break;
		case "Object":
			out = { };
			for ( var iter in obj ) {
				out[ iter ] = Util.copy( obj[ iter ] );
			}
			break;
		default:
			out = obj;
			break;
	}
	return out;
}

// Gets an array of elements by ID, Class, or Tag type.
// Usage: Util.get( "body", "tag" );
// Returns: An array containing the document body element.
Util.get = function( v, type ) {
	if ( !type ) type = "id";
	switch ( type ) {
		case "id":
			return document.getElementById( v ) ? [ document.getElementById( v ) ] : [ ];
		case "class":
			return document.getElementsByClassName( v );
		case "tag":
			return document.getElementsByTagName( v );
	}
}

// Throws an error.
Util.error = function( type, msg ) {
	var err = new Error( msg );
	err.__proto__ = new Error( );
	err.__proto__.name = type;
	throw err;
}

// Adds an event listener.
// Usage: Util.event( [element], "load", myFunction );
// Returns: nothing.
Util.event = function( el, evt, func ) {
	if ( !func ) {
		func = evt;
		evt = el;
		el = window;
	}
	if ( el.addEventListener ) {
		el.addEventListener( evt, func, false );
	} else if ( el.attachEvent ) {
		el.attachEvent( "on" + evt, func );
	} else {
		el[ "on" + evt ] = func;
	}
}

// Returns the type of an object.
// Usage: Util.typeof( [ ] );
// Returns: The type of the variable given.
Util.typeof = function( obj ) {
	if ( obj && obj.__proto__ ) {
		if ( obj.__proto__.name && obj.__proto__.name != "Empty" ) return obj.__proto__.name;
		if ( obj.__proto__.constructor ) return obj.__proto__.constructor.name;
	}
	return typeof obj;
}



// Hook the mouse position listener.
Util.event( "mousemove", function( event ) {
	if (typeof event.clientX == "number" ) {
		var d = document.documentElement;
		var b = document.body;
		var x = event.clientX;
		var y = event.clientY;
		if ( d.scrollLeft && d.clientLeft ) {
			x += d.scrollLeft - d.clientLeft;
			y += d.scrollTop - d.clientTop;
		} else if ( b.scrollLeft ) {
			x += b.scrollLeft - b.clientLeft;
			y += b.scrollTop - b.clientTop;
		}
		Mouse._pos[ 0 ] = x;
		Mouse._pos[ 1 ] = y;
	} else {
		Mouse._pos[ 0 ] = event.pageX;
		Mouse._pos[ 1 ] = event.pageY;
	}
} );

// Hook the mouse state listeners.
Util.event( "mousedown", function( ) {
	Mouse._down = true;
} );
Util.event( "mouseup", function( ) {
	Mouse._down = false;
} );