"use strict";

app.directive("wisPadding", function() {
	return {
		require: 'ngModel',
		link: function(scope, element, attr, ctrl) {
			var separator = ' ';

			var parse = function(viewValue) {
				// If the viewValue is invalid (say required but empty) it will be `undefined`
				if (!viewValue) return "";

				return new Array(5).join(viewValue+" ").split(" ").slice(0, 4).map(function(unit){return +unit});
			};

			ctrl.$parsers.push(parse);
			ctrl.$formatters.push(function(value) {
				if (Array.isArray(value) && !angular.equals([0,0,0,0], value)) {
					return value.join(' ');
				}

				return undefined;
			});

			// Override the standard $isEmpty because an empty array means the input is empty.
			ctrl.$isEmpty = function(value) {
				return !value || !value.length;
			};
		}
	};
});