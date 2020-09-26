////////////////////////////////////////
// Slang v1.0                         //
////////////////////////////////////////

var slang = {
	Version: "0.0.0.1"
};

////////////////////////////////////////
// GLOBALIZE - Makes slang.* into *   //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Globalise = function( ) {
	delete slang.Globalise;
	for ( child in slang ) {
		window[ child ] = slang[ child ];
	}
	slang = window;
}

////////////////////////////////////////
// Element Manipulation               //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Element = {
	Append: function( el , color , src ) {
		if ( typeof src == "undefined" ) {
			el.innerHTML += color;
		} else {
			el.innerHTML += "<span style=\"color:" + color + "\">" + src + "<\/span>";
		}
	},
	Clear: function( el ) {
		el.innerHTML = "";
	},
	Get: function( el ) {
		return document.getElementById( el );
	}
};

////////////////////////////////////////
// Hook functions                     //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Hook = {
	hooks: [ ],
	Add: function( group , id , func ) {
		if ( typeof slang.Hook.hooks[ group ] == "undefined" ) {
			slang.Hook.hooks[ group ] = [ ];
		}
		if ( typeof slang.Hook.hooks[ group ][ id ] == "undefined" ) {
			slang.Hook.hooks[ group ][ id ] = func;
		}
	},
	Remove: function( group , id ) {
		delete slang.Hook.hooks[ group ][ id ];
	},
	Call: function( group , args ) {
		if ( typeof slang.Hook.hooks[ group ] != "undefined" ) {
			for ( h in slang.Hook.hooks[ group ] ) {
				try {
					slang.Hook.hooks[ group ][ h ]( args );
				} catch( err ) {
					slang.Error.Throw( "Hook Error: Hook '" + h + "' threw " + err + "." );
				}
			}
		}
	}
};

////////////////////////////////////////
// Event Hooks                        //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Event = {
	Hook: function( el , evt , func ) {
		if ( el.addEventListener ) {
			el.addEventListener( evt , func , false );
		} else if ( el.attachEvent ) {
			el.attachEvent( "on" + evt , func );
		} else {
			slang.Error.Throw( "No Event Support" );
		}
	}
};

////////////////////////////////////////
// Utilities                          //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Util = {
	IsSet: function( v ) {
		return ( typeof v != "undefined" );
	},
	Time: function( ) {
		var tmp = new Date( );
		return tmp.getTime( );
	},
	Wave: function( freq , amp , offset ) {
		return Math.sin( 0.002 * Math.PI * freq * slang.Util.Time( ) + slang.Maths.Radians( ( typeof offset != "undefined" ) ? offset : 0 ) ) * amp;
	},
	With: function( thing , func ) {
		func( thing );
	},
	RandomString: function( set , length ) {
		var r = set.split( "" );
		var out = "";
		while ( out.length < length ) {
			out += r[ Math.round( Math.random( ) * ( r.length - 1 ) ) ];
		}
		return out;
	},
	Dump: function( obj , indent , html ) {
		if ( typeof html != "undefined" & html ) {
			var newline = "<br \/>";
			var space = "&nbsp;";
		} else {
			var newline = "\n";
			var space = " ";
		}
		var linestart = ( typeof indent != "undefined" ) ? indent : "";
		if ( typeof obj == "undefined" ) {
			return linestart + "undefined";
		} else if ( typeof obj != "object" ) {
			return linestart + ( typeof obj ) + " " + obj;
		} else try {
			var out = linestart + ( typeof obj ) + " {" + newline;
			for ( var item in obj ) {
				out += linestart + space + space + item + " (" + ( typeof obj[ item ] ) + "): " + obj[ item ] + newline;
			}
			out += linestart + "}";
			return out;
		} catch ( err ) {
			return linestart + "[Object]";
		}
	},
	Reverse: function( str ) {
		return str.split( "" ).reverse( ).join( "" );
	},
	Scramble: function( mixed ) {
		var out;
		var type = typeof mixed;
		switch ( type ) {
			case "number":
				mixed = "" + mixed;
			case "string":
				mixed = mixed.split( "" );
			case "object":
				out = slang.Array.Scramble( mixed );
		}
		switch ( type ) {
			case "number":
				return parseInt( out.join( "" ) );
			case "string":
				return out.join( "" );
			case "object":
				return out;
		}
	},
	Chars: function( string ) {
		var out = "";
		var dat = string.split( "" );
		for ( digit in dat ) {
			if ( out.indexOf( dat[ digit ] ) == -1 ) {
				out += dat[ digit ];
			}
		}
		return out;
	},
	Chunks: function( string , chunksize ) {
		var out = [ ];
		while ( string.length > chunksize ) {
			out.push( string.substr( 0 , chunksize ) );
			string = string.substr( chunksize );
		}
		out.push( string );
		return out;
	}
};

////////////////////////////////////////
// Array functions                    //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Array = {
	IsArray: function( r ) {
		return ( r.constructor == Array );
	},
	Values: function( r ) {
		var out = [ ];
		for ( k in r ) {
			out.push( r[ k ] );
		}
		return out;
	},
	Keys: function( r ) {
		var out = [ ];
		for ( k in r ) {
			out[ out.length ] = k;
		}
		return out;
	},
	Remove: function( r , index ) {
		return r.splice( index , 1 );
	},
	Insert: function( r , index , value ) {
		return r.splice( index , 0 , value );
	},
	Scramble: function( r ) {
		var out = [ ];
		while ( r.length > 0 ) {
			var id = Math.round( Math.random( ) * ( r.length - 1 ) );
			if ( typeof r[ id ] == "undefined" ) { alert( id ) };
			out.push( r[ id ] );
			slang.Array.Remove( r , id );
		}
		return out;
	}
};

////////////////////////////////////////
// Cryptography                       //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Crypt = {
	algo: {
		Basic: {
			F: function( string , key ) {
				var sindex = parseInt( key.substr( 0 , 5 ) );
				key = key.substr( 5 );
				string = string.toLowerCase( );
				key = key.toLowerCase( );
				var kdat = key.split( "" );
				var dat = string.split( "" );
				for( digit in dat ) {
					var disp = key.indexOf( dat[ digit ] );
					if ( disp != -1 ) {
						dat[ digit ] = kdat[ ( parseInt( disp ) + parseInt( digit ) + sindex ) % key.length ];
					}
				}
				return dat.join( "" );
			},
			B: function( string , key ) {
				var sindex = key.substr( 0 , 5 );
				key = key.substr( 5 );
				return slang.Crypt.algo[ "Basic" ].F( string , sindex + slang.Util.Reverse( key ) );
			}
		},
		Cambridge: {
			F: function( string ) {
				return string.replace( /\b\w+\b/g , function( match ) {
					if ( match.length < 3 ) {
						return match;
					}
					var r = match.split( "" );
					match = r[ 0 ];
					var last = r[ r.length - 1 ];
					slang.Array.Remove( r , 0 );
					slang.Array.Remove( r , r.length - 1 );
					while ( r.length > 0 ) {
						var id = Math.round( Math.random( ) * ( r.length - 1 ) );
						if ( typeof r[ id ] == "undefined" ) { alert( id ) };
						match += r[ id ];
						slang.Array.Remove( r , id );
					}
					return match + last;
				} );
			}
		},
		Intermediate: {
			F: function( string , key ) {
				var len = string.length;
				var dlen = len + ( "" + len ).length;
				var size = -Math.round( - Math.sqrt( dlen ) - 0.5 );
				var rstr = slang.Util.RandomString( key.replace( /[0-9]*/g , "" ) , size * size - dlen ).split( "" );
				slang.Array.Insert( rstr , slang.Maths.RandInt( 0 , rstr.length - 1 ) , "" + len );
				var dat = slang.Crypt.algo[ "Basic" ].F( string + rstr.join( "" ) , key ).split( "" );
				var out = [ ];
				for ( var i = 0; i < ( size * 2 - 1 ); i++ ) {
					var x = Math.max( 0 , i - size + 1 );
					var y = Math.min( size - 1 , i );
					var ind = y * size + x;
					var row = i - 2 * Math.max( 0 , i - size + 1 ) + 1;
					for ( var j = 0; j < row; j++ ) {
						out[ ind - j * ( size - 1 ) ] = dat.shift( );
					}
				}
				var ret = slang.Crypt.algo[ "Basic" ].F( out.join( "" ) , key );
				return ret;
			},
			B: function( string , key ) {
				var str = slang.Crypt.algo[ "Basic" ].B( string , key );
				var size = Math.round( Math.sqrt( string.length ) );
				var dat = str.split( "" );
				var out = "";
				for ( var i = 0; i < ( size * 2 - 1 ); i++ ) {
					var x = Math.max( 0 , i - size + 1 );
					var y = Math.min( size - 1 , i );
					var ind = y * size + x;
					var row = i - 2 * Math.max( 0 , i - size + 1 ) + 1;
					for ( var j = 0; j < row; j++ ) {
						out += dat[ ind - j * ( size - 1 ) ];
					}
				}
				out = slang.Crypt.algo[ "Basic" ].B( out , key );
				var len = ( out.match( /[0-9]+[^0-9]*$/ ) ) ? parseInt( out.match( /[0-9]+[^0-9]*$/ )[ 0 ] ) : string.length;
				return out.substr( 0 , len );
			}
		}
	},
	Do: function( string , alg , key ) {
		if ( typeof key == "undefined" ) {
			if ( typeof alg == "undefined" ) {
				alg = "Basic";
			}
			key = "abcdefghijklmnopqrstuvwxyz 0123456789.";
		}
		if ( typeof slang.Crypt.algo[ alg ] != "undefined" & typeof slang.Crypt.algo[ alg ].F != "undefined" ) {
			return slang.Crypt.algo[ alg ].F( string , key );
		} else {
			return string;
		}
	},
	Undo: function( string , alg , key ) {
		if ( typeof key == "undefined" ) {
			if ( typeof alg == "undefined" ) {
				alg = "Basic";
			}
			key = "abcdefghijklmnopqrstuvwxyz 0123456789.";
		}
		if ( typeof slang.Crypt.algo[ alg ] != "undefined" & typeof slang.Crypt.algo[ alg ].B != "undefined" ) {
			return slang.Crypt.algo[ alg ].B( string , key );
		} else {
			return string;
		}
	},
	GenerateKey: function( string ) {
		var out = slang.Util.Chars( string.toLowerCase( ) );
		var shift = "" + slang.Maths.RandInt( 1 , out.length );
		return shift + slang.Util.RandomString( out , 5 - shift.length ) + slang.Util.Scramble( out );
	}
};

////////////////////////////////////////
// Compression                        //
////////////////////////////////////////
// WIP /////////////////////////////////

slang.Compress = {
	Do: function( string ) {
		var chars = slang.Util.Chars( string );
		var dat = string.split( "" );
		var out = chars + chars.charAt( 0 );
		var nbits = Math.ceil( slang.Maths.Log( 2 , chars.length ) );
		var dat = string.split( "" );
		var bin = "";
		for ( var d in dat ) {
			bin += slang.Maths.ToBinary( chars.indexOf( dat[ d ] ) , nbits );
		}
		dat = slang.Util.Chunks( bin , 7 );
		for ( d in dat ) {
			out += String.fromCharCode( slang.Maths.FromBinary( dat[ d ] ) + 33 );
		}
		return out;
	},
	Undo: function( string ) {
		var first = string.charAt( 0 );
		var i = 1;
		while ( string.charAt( i ) != first ) {
			i++;
		}
		var nbits = Math.ceil( slang.Maths.Log( 2 , i ) );
		i++;
		var chars = string.substr( 0 , i );
		var dat = string.substr( i );
		var bin = "";
		for ( var d = 0; d < string.length; d++ ) {
			bin += slang.Maths.ToBinary( string.charCodeAt( d ) - 33 , 7 );
		}
		var dat = slang.Util.Chunks( bin , nbits );
		var out = "";
		for ( var d in dat ) {
			out += chars.charAt( slang.Maths.FromBinary( dat[ d ] ) );
		}
		return out;
	}
};

////////////////////////////////////////
// Errors get handled here            //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Error = {
	hooks: [ ],
	Hook: function( id , func ) {
		if ( typeof slang.Error.hooks[ id ] == "undefined" ) {
			slang.Error.hooks[ id ] = func;
		}
	},
	Unhook: function( id ) {
		delete slang.Error.hooks[ id ];
	},
	Throw: function( err ) {
		for ( e in slang.Error.hooks ) {	
			var ret = slang.Error.hooks[ e ]( err );
			if ( typeof ret == "boolean" & ret ) {
				throw new Error( err );
			}
		}
	}
};

////////////////////////////////////////
// Maths functions                    //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Maths = {
	Log: function( base , num ) {
		if ( base == Math.E ) {
			return Math.log( num );
		} else {
			return Math.log( num ) / Math.log( base );
		}
	},
	ToBinary: function( num , numbits ) {
		var out = "";
		while ( out.length < numbits ) {
			var dig = num % 2;
			num = ( num - dig ) / 2;
			out = dig + out;
		}
		return out;
	},
	FromBinary: function( bin ) {
		return parseInt( bin , 2 );
	},
	RandInt: function( min , max ) {
		return Math.round( min + Math.random( ) * ( max - min ) );
	},
	Radians: function( v ) {
		return v * 180 / Math.PI;
	},
	Degrees: function( v ) {
		return v * Math.PI / 180;
	},
	Clamp: function( n , min , max ) {
		return Math.max( min , Math.min( max , n ) );
	}
};

////////////////////////////////////////
// Page Information                   //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Page = {
	Width: function( ) {
		if ( window.innerWidth != null ) {
			return window.innerWidth;
		} else if ( document.documentElement && document.documentElement.clientWidth ) {
			return document.documentElement.clientWidth;
		} else if ( document.body != null ) {
			return document.body.clientWidth;
		} else {
			return 0;
		}
	},
	Height: function( ) {
		if ( window.innerHeight != null ) {
			return window.innerHeight;
		} else if ( document.documentElement && document.documentElement.clientHeight ) {
			return document.documentElement.clientHeight;
		} else if ( document.body != null ) {
			return document.body.clientHeight;
		} else {
			return 0;
		}
	},
	ScrollLeft: function( ) {
		if ( typeof window.pageXOffset != 'undefined' ) {
			return window.pageXOffset;
		} else if ( document.documentElement && document.documentElement.scrollLeft ) {
			return document.documentElement.scrollLeft;
		} else if ( document.body.scrollLeft ) {
			return document.body.scrollLeft;
		} else {
			return 0;
		}
	},
	ScrollTop: function( ) {
		if ( typeof window.pageYOffset != 'undefined' ) {
			return window.pageYOffset;
		} else if ( document.documentElement && document.documentElement.scrollTop ) {
			return document.documentElement.scrollTop;
		} else if ( document.body.scrollTop ) {
			return document.body.scrollTop;
		} else {
			return 0;
		}
	}
};

////////////////////////////////////////
// Mouse Position                     //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Mouse = {
	x: 0,
	y: 0
};
slang.Hook.Add( "Initialize" , "MouseListener" , function( ) {
	slang.Event.Hook( document.body , "mousemove" , function( e ) {
		e = ( window.event ) ? window.event : e;
		var x = 0;
		var y = 0;

		if ( document.all ) {
			x = e.x + document.body.scrollLeft;
			y = e.y + document.body.scrollTop;
		} else {
			x = e.pageX;
			y = e.pageY;
		}
		slang.Mouse.x = x;
		slang.Mouse.y = y;
	} );
} );

////////////////////////////////////////
// Key events/functions               //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Keyboard = {
	keys: [ ],
	hooks: [ ],
	KeyID: function( key ) {
		return key.charCodeAt( 0 );
	},
	KeyDown: function( e ) {
		e = ( window.event ) ? window.event : e;
		slang.Keyboard.keys[ e.keyCode ] = true;
		for ( hook in slang.Keyboard.hooks[ e.keyCode ] ) {
			slang.Keyboard.hooks[ e.keyCode ][ hook ]( true , e.keyCode );
		}
		for ( hook in slang.Keyboard.hooks[ -1 ] ) {
			slang.Keyboard.hooks[ -1 ][ hook ]( true , e.keyCode );
		}
	},
	KeyUp: function( e ) {
		e = ( window.event ) ? window.event : e;
		delete slang.Keyboard.keys[ e.keyCode ];
		for ( hook in slang.Keyboard.hooks[ e.keyCode ] ) {
			slang.Keyboard.hooks[ e.keyCode ][ hook ]( false , e.keyCode );
		}
		for ( hook in slang.Keyboard.hooks[ -1 ] ) {
			slang.Keyboard.hooks[ -1 ][ hook ]( false , e.keyCode );
		}
	},
	Hook: function( key , func ) {
		var id = ( typeof func == "undefined" ) ? -1 : key;
		func = ( typeof func == "undefined" ) ? key : func;
		if ( typeof slang.Keyboard.hooks[ id ] == "undefined" ) {
			slang.Keyboard.hooks[ id ] = [ ];
		}
		slang.Keyboard.hooks[ id ][ slang.Keyboard.hooks[ id ].length ] = func;
	}
};
slang.Hook.Add( "Initialize" , "KeyboardListener" , function( ) {
	slang.Event.Hook( document.body , "keydown" , slang.Keyboard.KeyDown );
	slang.Event.Hook( document.body , "keyup" , slang.Keyboard.KeyUp );
	slang.Keyboard.KeyDown = function( keyID ) {
		return ( typeof slang.Keyboard.keys[ keyID ] == "undefined" ) ? false : true;
	}
} );

////////////////////////////////////////
// Server Requests ( AJAX )           //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Ajax = {
	Make: function( ) {
		var r;
		if ( window.XMLHttpRequest ) {
			r = new XMLHttpRequest( );
		} else if ( window.ActiveXObject ) {
			r = new ActiveXObject( "Microsoft.XMLHTTP" );
		} else {
			slang.Error.Throw( "No AJAX Support" );
		}
	},
	Get: function( url , data , callback ) {
		var a = slang.Request.Make( );
		var send = "";
		if ( typeof data != "undefined" ) {
			for ( item in data ) {
				send += item + "=" + encodeURI( data[ item ] ) + "&";
			}
		}
		send = send.substr( 0 , send.length - 1 );
		if ( typeof callback != "undefined" ) {
			a.open( "GET" , url + "?" + send , true );
			a.onreadystatechange = callback;
		} else {
			a.open( "GET" , url + "?" + send , false );
		}
		a.send( );
		return a;
	},
	Post: function( url , data , callback ) {
		var a = slang.Request.Make( );
		var send = "";
		if ( typeof data != "undefined" ) {
			for ( item in data ) {
				send += item + "=" + encodeURI( data[ item ] ) + "&";
			}
		}
		send = send.substr( 0 , send.length - 1 );
		a.setRequestHeader( "Content-type" , "application/x-www-form-urlencoded");
		a.setRequestHeader( "Content-length" , send.length );
		a.setRequestHeader( "Connection" , "close");
		if ( typeof callback != "undefined" ) {
			a.open( "POST" , url , true );
			a.onreadystatechange = callback;
		} else {
			a.open( "POST" , url , false );
		}
		a.send( send );
		return a;
	}
};

////////////////////////////////////////
// Automatic Initialization           //
////////////////////////////////////////
// WORKS ///////////////////////////////

slang.Event.Hook( window , "load" , function( ) {
	slang.Hook.Call( "Initialize" );
} );