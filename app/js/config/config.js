"use strict";

app.config(["$httpProvider", "$compileProvider", "$routeProvider", "$locationProvider",
	function($httpProvider,   $compileProvider,   $routeProvider,   $locationProvider) {

	$httpProvider.interceptors.push("HttpDataURL");

	// $compileProvider.imgSrcSanitizationWhitelist(/^\s*(blob):/);
	$compileProvider.imgSrcSanitizationWhitelist(/^\s*(blob:|data:image)/);

	$routeProvider.when("/", {
		templateUrl: "/"+version+"/views/index.html"
	});

	$routeProvider.when("/canvas", {
		templateUrl: "/"+version+"/views/canvas.html",
		controller: "SpriteCtrl",
		controllerAs: "Sprite"
	});

	$routeProvider.when("/mycanvas", {
		templateUrl: "/"+version+"/views/mycanvas.html"
	});

	$routeProvider.when("/download", {
		templateUrl: "/"+version+"/views/download.html",
		controller: "DownloadCtrl",
		controllerAs: "Download"
	});

	$locationProvider.html5Mode(true);

}]);