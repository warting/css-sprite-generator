/* jshint eqeqeq:false */
"use strict";

// register the interceptor as a service
app.factory('HttpDataURL', ["$q", function($q) {
	function decode(arraybuffer) {

		var binary = "",
			bytes = new Uint8Array( arraybuffer ),
			len = bytes.byteLength,
			i = 0;

		for (; i < len; i++) {
			binary += String.fromCharCode( bytes[ i ] );
		}

		return "data:image/webp;base64," + btoa( binary );
	}

	return {
		// optional method
		request: function(config) {
			if(config.responseType == "dataURL"){
				config.responseType = "arraybuffer";
				config.transformResponse = [decode];
			}
			// do something on success
			return config || $q.when(config);
		}
	};

}]);