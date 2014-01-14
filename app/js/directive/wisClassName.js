"use strict";

app.directive('wisClassname', function() {
	return {
		// restrict to an attribute type.
		restrict: 'A',

		// element must have ng-model attribute.
		require: 'ngModel',

		scope: {set:'=wisClassname'},

		// scope = the parent scope
		// elem = the element the directive is on
		// attr = a dictionary of attributes on the element
		// ctrl = the controller for ngModel.
		link: function(scope, elem, attr, ctrl) {

			function validate(value) {

				value && ctrl.$setValidity('space', value.indexOf(" ") == -1);

				return value;
			}

			// add a parser that will process each time the value is
			// parsed into the model when the user updates it.
			ctrl.$parsers.unshift(function(value) {
				// test and set the validity after update.
				validate(value);

				// if it's valid, return the value to the model,
				// otherwise return undefined.
				return value; //ctrl.$valid ? value : undefined;
			});

			// add a formatter that will process each time the value
			// is updated on the DOM element.
			ctrl.$formatters.unshift(function(value) {
				// validate.
				validate(value);

				// return the value or nothing will be written to the DOM.
				return value;
			});


			var set = scope.set,
				previous,
				nr = 0.5; //angular calls the directive twice to ensure it works correctly so we need the half

			ctrl.$formatters.push(validator);
			ctrl.$parsers.push(validator);

			ctrl.$formatters.unshift(storePrevious);
			ctrl.$parsers.push(storePrevious);

			scope.$watch(function(){
				return set[ctrl.$viewValue] <= 1;
			}, function(value){
				ctrl.$setValidity('unique', value);
			});

			function validator(value) {
				if (value !== previous) {
					if (previous) {
						set[previous] = (set[previous] || 1) - 1;
					}
					if (value) {
						set[value] = (set[value] || 0) + nr;
						nr = 1;
					}
				}
				return value;
			}

			function storePrevious(v) {
				previous = v;
				return v;
			}
		}
	};
});