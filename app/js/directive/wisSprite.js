/*jshint loopfunc: true */
"use strict";

app.directive("wisSprite", ["$q", "WebP", function($q, WebP) {
	var sprite;

	fabric.Sprite = fabric.util.createClass(fabric.Rect, {

		type: 'sprite',

		initialize: function(options) {
			var canvas = options.image;

			options = options || {};

			this.origwidth = this.width = canvas.width;
			this.origheight = this.height = canvas.height;
			this.pad = "";
			this.mar = "";
			this.hasControls = false;
			this.borderColor = "red";
			this.lockMovementX = true;
			this.lockMovementY = true;
			this.repeat = false;

			options.className = options.className || options.name
				.replace(/\.[^/.]+$/g, '')
				// .replace(/_/g, ' ')
				.replace(/(\S)(\S*)/g, (function a($0,$1,$2){(a.i=-~a.i);return ($1[a.i===1?"toLowerCase":"toUpperCase"]())+$2.toLowerCase();})) // jshint ignore:line
				.replace(/\s|\./g,'')
				.replace(/[^a-z0-9]/g, function(s) {
					var c = s.charCodeAt(0);
					if (c === 32) {return '-';}
					if (c === 95 || c === 45) {return s;}
					return ('000' + c.toString(16)).slice(-4);
				});

			var pattern = new fabric.Pattern({
				source: canvas,
				repeat: 'repeat'
			});

			this.fill = pattern;

			this.callSuper('initialize', options);
		},

		toObject: function(){
			return {
				base64: this.base64,
				background: this.background,
				className: this.className,
				mimetype: this.mimetype,
				left: this.left,
				mar: this.mar,
				name: this.name,
				origSize: this.origSize,
				type: "sprite",
				top: this.top,
				origType: this.origType,
				pad: this.pad,
				repeat: this.repeat
			};
		},

		render: function(ctx) {

			this.width = (this.repeat && sprite.canRepeat === "x") ? ctx.canvas.width : this.origwidth;
			this.height = (this.repeat && sprite.canRepeat === "y") ? ctx.canvas.height : this.origheight;
			var pad = this.pad || sprite.padding || [0,0,0,0];
			var area = [
				this.left - pad[3],
				this.top - pad[0],
				this.width + pad[3] + pad[1],
				this.height + pad[0] + pad[2]
			];

			var oldFill = ctx.fillStyle;
			ctx.clearRect(area[0],area[1],area[2],area[3]);
			ctx.fillStyle = sprite.imageBackground;
			ctx.fillStyle = this.background;
			ctx.fillRect(area[0],area[1],area[2],area[3]);
			ctx.fillStyle = oldFill;

			this.callSuper('render', ctx);
		},
		_render: function(ctx){
			this.callSuper('_render', ctx);
		}
	});

	fabric.Sprite.fromObject = function (object) {
		return new fabric.Sprite(object);
	};

	return {
		restrict: "A",
		scope: {uuid: "&wisSprite", object:"&object", sprite:"&sprite"},
		link: function($scope, $element) {
			var uuid = $scope.uuid();
			var canvas = win._canvas = new fabric.Canvas($element[0], { selection: false, includeDefaultValues: false, hoverCursor: 'pointer', selectionColor:"rgba(255, 255, 255, 0.3)" });
			var $sprite = $scope.sprite() || angular.fromJson(localStorage.getItem(uuid));
			canvas.selectionLineWidth = 3;
			canvas.selectionBorderColor = "red";

			canvas.setWidth($sprite.width);
			canvas.setHeight($sprite.height);
			canvas.on('object:selected', function(options){
				$scope.$parent.Sprite.object = options.target;
				options.target.bringToFront();
				$scope.$apply();
				query("#thumbnail").html("").append(options.target.fill.source);
			});

			$q.all($sprite.datalessJSON.objects.map(function(obj) {
				var defer = $q.defer();
				if(!($scope.$parent.Main.supports || {}).webpAlpha && obj.base64.split(";")[0] == "data:image/webp"){
					obj.image = WebP.decode64(obj.base64);
					return;
				}
				var img = new Image();
				img.src = obj.base64;
				img.onload = function() {
					obj.image = img;
					defer.resolve();
				};
				return defer.promise;
			})).then(function() {
				$scope.$emit('canvasReady');
				sprite = $sprite;
				canvas.loadFromJSON(sprite.datalessJSON);
				canvas.renderAll();
			});
		}
	};

}]);




app.factory("repack", ["$filter", "$q", function($filter, $q){




	function packer(canvas, sprite){

		function mapper(obj) {
			var pad = obj.pad || sprite.padding || [0,0,0,0];
			var mar = obj.mar || sprite.margin || [0,0,0,0];

			return {
				w: obj.origwidth  + mar[1] + mar[3] + pad[1] + pad[3],
				h: obj.origheight + mar[0] + mar[2] + pad[0] + pad[2],
				repeat: obj.repeat,
				name: obj.name,
				obj: obj
			};

		}

		var deferred = $q.defer();

		var blocks = canvas._objects.map(mapper);

		var packer = new window.GrowingPacker(canvas.width, canvas.height, sprite.canRepeat);

		packer.fit(blocks);

		var len = blocks.length;

		var block, obj, pad, mar;


		while(len--){
			block = blocks[len];
			obj = block.obj;
			pad = obj.pad || sprite.padding || [0,0,0,0];
			mar = obj.mar || sprite.margin || [0,0,0,0];

			obj.set({ top: block.fit.y, left: block.fit.x });

			obj.left = block.fit.x + mar[3] + pad[3];
			obj.top = block.fit.y + mar[0] + pad[0];
		}

		var dimension = packer.dimension;

		canvas.setDimensions(dimension);

		setTimeout(function() {
			canvas.setDimensions(dimension);
			canvas._objects.forEach(function(obj) {
				obj.setCoords();
			});
			deferred.resolve();
		},0);

        angular.extend(sprite, dimension);
		canvas.renderAll();

		return deferred.promise;
	}

	return packer;
}]);