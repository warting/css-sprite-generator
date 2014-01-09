"use strict";

app.directive('wisColorValidate', function (){
	return {
		require: 'ngModel',
		link: function(scope, elem, attr, ngModel) {

			var ctx = document.createElement("canvas").getContext("2d");

			function validate(color) {
				//Alter the following conditions according to your need.
				if (color === "") { return true; }

				ctx.fillStyle = "#000000";
				ctx.fillStyle = color;
				if (ctx.fillStyle !== "#000000") { return true; }
				ctx.fillStyle = "#ffffff";
				ctx.fillStyle = color;
				return ctx.fillStyle !== "#ffffff";
			}

			ngModel.$parsers.unshift(function(value) {
				var valid = validate(value);
				ngModel.$setValidity('color', valid);
				return valid ? value : undefined;
			});

			ngModel.$formatters.unshift(function(value) {
				ngModel.$setValidity('color', validate(value));
				return value;
			});
		}
	};
});