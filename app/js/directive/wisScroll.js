/* jshint  asi:true, expr: true */
"use strict";

app.directive("wisScroll", function(){
	return {
		link: function($scope, $element){
			var
			time = 250,

			easeInOutQuad = function (a, b, d, c) {
				a /= c / 2;
				if (1 > a) return d / 2 * a * a + b; // jshint ignore:line
				a--;
				return -d / 2 * (a * (a - 2) - 1) + b
			};

			$element.on('click', function (event) {
				event.preventDefault();

				var scrollTop = body.scrollTop,
					to = (win.innerHeight || docElm.clientHeight || body.clientHeight) + 45 - scrollTop,
					currentTime = 0,
					animateScroll = function () {
						currentTime += 10;
						var val = easeInOutQuad(currentTime, scrollTop, to, time);
						scrollTo(0, val);
						currentTime < time && setTimeout(animateScroll, 10);
					};

				animateScroll();
			});
		}
	};
});