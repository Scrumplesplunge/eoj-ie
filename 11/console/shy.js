var shy = { };
var KeyClass = [ ];
var out = [ ];
var sTag = [ ];
var eTag = [ ];
var rgx = [ ];
shy.Language = [ ];

shy.Highlight = function( in_id , out_id , lang ) {
	document.getElementById( out_id ).innerHTML = shy.FindSyntax( document.getElementById( in_id ).value , shy.Language[ lang ] , 0 );
}
shy.FindSyntax = function( data , lang , depth ) {
	out[ depth ] = data.replace( /</g , "&lt;" ).replace( />/g , "&gt;" );
	for ( KeyClass[ depth ] in lang ) {
		sTag[ depth ] = "<span title=\"" + lang[ KeyClass[ depth ] ][ 0 ] + "\" style=\"" + lang[ KeyClass[ depth ] ][ 1 ] + "\">";
		eTag[ depth ] = "</span>";
		for ( i=3 ; i<lang[ KeyClass[ depth ] ].length ; i++ ) {
			if ( lang[ KeyClass[ depth ] ][ 2 ] == "word" ) {
				rgx[ depth ] = new RegExp( "(?=([^<]*?<span|[^<]*$))(?!([^<]+)?>)\\b" + lang[ KeyClass[ depth ] ][ i ] + "\\b" , "g" );
				out[ depth ] = out[ depth ].replace( rgx[ depth ] , sTag[ depth ] + lang[ KeyClass[ depth ] ][ i ] + eTag[ depth ] );
			} else if ( lang[ KeyClass[ depth ] ][ 2 ] == "regex" ) {
				rgx[ depth ] = new RegExp( "(?=([^<]*?<span|[^<]*$))(?!([^<]+)?>)" + lang[ KeyClass[ depth ] ][ i ] , "g" );
				out[ depth ] = out[ depth ].replace( rgx[ depth ] , function( match ) {
					return sTag[ depth ] + match + eTag[ depth ];
				} );
			} else if ( lang[ KeyClass[ depth ] ][ 2 ] == "func" ) {
				out[ depth ] = lang[ KeyClass[ depth ] ][ 3 ]( out[ depth ] );
			}
		}
	}
	return out[ depth ];
}
shy.RegisterLanguage = function( name , language ) {
	shy.Language[ name ] = language;
}

shy.RegisterLanguage( "javascript" , [
	[ "Multiline Comment" , "color:rgb(75,150,75)" , "regex" , "\\/\\*(.|[\r\n]|\")*?(\\*/|$)" ],
	[ "Comment" , "color:rgb(75,150,75)" , "regex" , "\\\/\\\/.*(?!([^<]+)?>)" ],
	[ "String" , "color:rgb(150,150,150)" , "regex" , "\"([^\"\\\\]*(\\\\.[^\"\\\\]*)*)(\"|$)" ],
	[ "Keyword" , "font-weight:bold;font-style:italic;color:rgb(0,0,100)" , "word" , "with" , "else" , "for" , "if" , "in" , "function" , "return" , "var" , "delete" , "this" , "typeof" , "new" , "boolean" , "char" ],
	[ "Boolean" , "font-weight:bold;color:rgb(0,75,175)" , "word" , "true" , "false" ],
	[ "Method" , "color:rgb(100,150,200)" , "regex" , "\\b\\w*(?=[\(])" ],
	[ "Operator" , "font-weight:bold" , "regex" , "[\\+\\-\\*\/=!]" ],
	[ "Object" , "color:rgb(0,75,175)" , "regex" , "\\b[a-zA-Z][a-zA-Z0-9]*(?=\\.)" ],
	[ "Number" , "color:rgb(255,0,0)" , "regex" , "\\b[0-9]*(\\.[0-9]+)?\\b" ],
	[ "Variable" , "color:rgb(75,90,150)" , "regex" , "\\b[a-zA-Z][a-zA-Z0-9]*\\b" ]
] );

shy.RegisterLanguage( "xml" , [
	[ "Comment" , "color:rgb(75,150,75)" , "regex" , "(&lt;!--(.|[\\r\\n])*?(--&gt;)(?![\\s\\n\\r]*&lt;\\\/script&gt;)|&lt;!--(?!.*?--&gt;).*?$)" ],
	[ "Script" , "" , "func" , function( str ) {
		var str_out = str.replace( /(?=([^<]*?<span|[^<]*$))(?!([^<]+)?>)(&lt;script).*?(&gt;)((&lt;!--)(.|\r\n|\r|\n)*?(--&gt;)(\r\n|\r|\n|\s)*(&lt;\/script&gt;)|(.|\r\n|\r|\n)*?(&lt;\/script&gt;))/gi , function( smatch ) {
			var tags = smatch.match( /(^&lt;.+?&gt;(\s*&lt;!--)?|(--&gt;\s*)?&lt;.+?&gt;$)/g );
			var script = smatch.replace( /(^&lt;.+?&gt;([\s\n\r]*?&lt;!--)?|(--&gt;[\s\n\r]{0,})?&lt;.+?&gt;[\s\n\r]*?$)/gi , "" );
			var tag = "<span title=\"Script Escape\" style=\"color:rgb(75,150,75)\">";
			return tags[ 0 ].replace( /&lt;!--$/i , tag + "&lt;!--</span>" ) + shy.FindSyntax( script , shy.Language[ "javascript" ] , 1 ) + tags[ 1 ].replace( /^--&gt;/i , tag + "--&gt;</span>" );
		} );
		return str_out;
	} ],
	[ "Tag" , "" , "func" , function( str ) {
		var spTag = "<span title=\"";
		var mTag = "\" style=\"color:";
		var eTag = "</span>";
		var str_out = str.replace( /(?=([^<]*?<span|[^<]*$))(?!([^<]+)?>)(&lt;).*?(&gt;)/gi , function( match ) {
			match = match.replace( /(?=([^<]*?<span|[^<]*$))(?!([^<]+)?>)^(&lt;)\/?\w+?\b/i , function( smatch ) { return spTag + "Tag" + mTag + "rgb(0,0,255)\">" + smatch + eTag } );
			match = match.replace( /(?=([^<]*?<span|[^<]*$))(?!([^<]+)?>)\/?(&gt;)$/i , function( smatch ) { return spTag + "Tag" + mTag + "rgb(0,0,255)\">" + smatch + eTag } );
			match = match.replace( /(?=([^<]*?<span|[^<]*$))(?!([^<]+)?>)"([^"\\]*(\\.[^"\\]*)*)("|$)/gi , function( smatch ) { return spTag + "Value" + mTag + "rgb(150,0,255)\">" + smatch + eTag } );
			match = match.replace( /(?=([^<]*?<span|[^<]*$))(?!([^<]+)?>)\b\w*\b/gi , function( smatch ) { return spTag + "Attribute" + mTag + "rgb(255,0,0)\">" + smatch + eTag } );
			return "<span style=\"color:rgb(0,0,0)\">" + match + eTag;
		} );
		return str_out;
	} ],
] );