function init(){
	var ng = angular;
	var doc = document;
	var win = doc.getElementById("iframe").contentWindow;
	ng.element(doc).on('click', function(event) {
		event.target.id == "edit" &&

		win.postMessage(ng.toJson({
			action: "insertAndEdit",
			Sprite: Sprite
		}), "http://cssspritegenerator.net");

	});
}

app = angular.module('wis', ['ngRoute']);
app.controller('foo', ["$rootScope", "$location", function($rootScope, $location){

	$rootScope.path = $location.path() || $location.path('/about');

	$rootScope.Sprite = window.Sprite;

	$rootScope.repiClass = function() {
		$el = angular.element(document.getElementsByTagName("i")[0]);

		$el.removeClass("repeatX");
		$el.removeClass("repeatY");

		$rootScope.activeObj.repeat && setTimeout(function() {
			$el.addClass("repeat"+Sprite.canRepeat.toUpperCase());
		},0);
	};

	$rootScope.at = function(path) {
		return {active:path==$location.path()}
	};

	$rootScope.$watch(function() {
		return $location.path();
	}, function(newPath) {
		$rootScope.path = newPath;
	});

}]);
