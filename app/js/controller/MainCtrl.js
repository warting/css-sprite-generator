/* jshint unused: false, smarttabs: true, -W058, asi:true, -W041 */
"use strict";

app.controller("MainCtrl", ["$q", "$filter", "$location", "$route", function($q, $filter, $location, $route){
	var supports, webp64,
		Main = this,
		canvas = document.createElement('canvas');

	canvas.width = canvas.height = 1;
	Main.foo = "hej";
	Main.arrayRemove = arrayRemove;

	Main.activeUUID = localStorage.lastUUID;
	Main.activeJson = angular.fromJson(localStorage.getItem(Main.activeUUID));

	Main.uuidItems = function(){
		return Object.keys(localStorage).filter(function(str){
			return str.match("^css-sprite-generator-");
		});
	}

	Main.openUUID = function(uuid) {
		Main.activeUUID = localStorage.lastUUID = uuid;
		Main.activeJson = angular.fromJson(localStorage.getItem(uuid));
		$location.path() == "/canvas" ? $route.reload() : $location.path("/canvas");
	};

	Main.newUUID = function() {
		Main.openUUID('css-sprite-generator-'+(+new Date)+'-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);})) // jshint ignore:line
	};

	Main.deleteUUID = function(uuid){
		localStorage.removeItem(uuid);
	};

	// Syncrones test support
	supports = {
		js                 : true,
		aDownload          : "download" in document.createElement("a"),
		fileReader         : !!win.FileReader,
		blob               : win.Blob && type(new win.Blob) == "blob",
		canvas             : type(canvas) == "htmlcanvaselement" && canvas.getContext && !!canvas.getContext('2d'),
		localStorage       : function(){try{var a=localStorage;a.setItem("mod","mod");a.removeItem("mod");return"storage"==type(a)}catch(b){return true}}(),
		todataurlwebpalpha : false
	};

	// Deppendencies Syncrones support
	supports.todataurlwebp = supports.canvas && (webp64 = canvas.toDataURL('image/webp',0)).indexOf('data:image/webp') === 0;
	supports.todataurljpeg = supports.canvas && canvas.toDataURL('image/jpeg',0).indexOf('data:image/jpeg') === 0;
	supports.todataurlpng  = supports.canvas && canvas.toDataURL('image/png' ,0).indexOf('data:image/png' ) === 0;

	function check_webp_feature(c){var b=$q.defer(),a=new Image;a.onload=a.onerror=function(){b.resolve(a.width>0)};a.src="data:image/webp;base64,"+c;return b.promise}

	// Asyncrones support test
	$q.all([
		check_webp_feature("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA"),
		check_webp_feature("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="),
		check_webp_feature("UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA=="),
		check_webp_feature("UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA"),
		function() {
			if(!supports.todataurlwebp) {
				return false;
			}

			var deferred = $q.defer(),
				img = new Image,
				ctx = canvas.getContext("2d");

			img.src = webp64;

			img.onload = function() {
				ctx.drawImage(img, 0, 0);
				supports.todataurlwebpalpha = ctx.getImageData(0,0,1,1).data[3] == 0;
				deferred.resolve();
			};

			img.onerror = deferred.resolve;

			return deferred.promise;
		}(),
	]).then(function(result){
		var i = 4, tests = ["webpLossy", "webpLossless", "webpAlpha", "webpAnimation"];
		while(i--){ supports[tests[i]] = result[i] }

		Main.supports = supports;
	});

}]);