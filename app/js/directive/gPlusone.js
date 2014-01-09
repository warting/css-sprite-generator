"use strict";

app.directive('gPlusone', ["$http","$q", function ($http, $q){
    var readyState = 0;
	/*
	win.googlePlussed = function(event) {
		if(event.state == "on"){
			console.log("Thank you for likeing %s", event.href);
		} else {
			console.log("Basterd why won't you like %s", event.href);
		}
	};
	*/
	return {
		restrict: 'C',
		link: function(scope, $element, attr, ngModel) {
		    if(readyState == 0){
    			$http.jsonp("//apis.google.com/js/platform.js").finally(function(){
    			    readyState = 4;
    			});
    			readyState = 3;
		    }
		    if(readyState == 4){
		        gapi.plusone.go();
		    }
		}
	};

}]);