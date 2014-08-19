/* jshint expr:true */
"use strict";

app.controller("SpriteCtrl", ["$q", "WebP", "$scope", "repack", function($q, WebP, $scope, repack){

	var Sprite = this,
		json = angular.fromJson(localStorage.getItem(localStorage.lastUUID));

	function move(e) {
		e.preventDefault();
		e.stopPropagation();
		var c = query("#excanvas")[0].getBoundingClientRect();

		var p = {};

		p.height = c.height + "px";
		p.width = c.width + "px";
		p.left = c.left + "px";
		p.bottom = c.bottom + "px";
		p.right = c.right + "px";
		p.top = c.top + "px";

		var sdisplay = angular.element('<div id=sdisplay><b></b></div>');

		sdisplay.css(p);



		query("body", doc)
			.css("cursor", "nw-resize")
			.append(sdisplay)
			.on('mousemove', function(e) {
				e.preventDefault();
				e.stopPropagation();
				var x = ~~(e.pageX - c.left); // jshint ignore:line
				var y = ~~(e.pageY - c.top);  // jshint ignore:line
				sdisplay.css({
					width: x+"px",
					height: y+"px"
				})
				.children('b').text(x + 'x' + y);
			})
			.one('mouseup', function(e) {
				e.preventDefault();
				e.stopPropagation();
				var style = sdisplay[0].style;

				window._canvas.width = parseInt(style.width);
				window._canvas.height = parseInt(style.height);
				repack(window._canvas, Sprite.json).then(Sprite.calcSize);

				$scope.$apply();

				query("body", doc).css("cursor", "").off('mousemove');
				sdisplay.remove();
			});
	}


	query("#scale").on('mousedown', move);


	Sprite.pickerOption = {
		responseType: "dataURL",
		maxFiles: 0,
		mimeType: "image/*",
		maxFileSize: 41943040, // 40 MB
		minFileSize: 100
	}

	Sprite.setBG = function(){
		window._canvas.backgroundColor = Sprite.json.datalessJSON.background;
		Sprite.calcSize();
	};

	Sprite.json = json || {
		imageBackground: "",
		datalessJSON: {
			objects: [],
			background: "rgba(0,0,0,0)"
		},
		prefix: "ui-",
		output: "png", // webp, jpeg, apng
		canRepeat: "x", // y
		version: 2,
		margin: "",
		padding: "",
		uuid: localStorage.lastUUID,
		retina: false,
		width: 200,
		height: 200,
		size: 0,
		quality: 1, // 0 to 1
		sameAspect: false
	};

	window.e=$q;

	Sprite.repack = function(){
		repack(window._canvas, Sprite.json).then(Sprite.calcSize);
	};

	Sprite.onFileSelect = function() {
		var files = Sprite.files;
		var promises = files.map(function(file){
			return $q(function(resolve, reject){
				var img = new Image;

				img.src = file.$dataURL;
				img.onload = function(){
					resolve(new fabric.Sprite({
						base64: file.$dataURL,
						image: this,
						name: file.name,
						origType: file.type,
						origSize: file.size
					}));
				};

			});
		});

		$q.all(promises).then(function(results) {

			_canvas._objects.push.apply(_canvas._objects, results);

			for (var i = 0, length = results.length; i < length; i++) {
				_canvas._onObjectAdded(results[i]);
			}

			_canvas.renderOnAddRemove && _canvas.renderAll();
			repack(win._canvas, Sprite.json);
			Sprite.calcSize();

			setTimeout(function() {
				$scope.$apply();
			},100);
		});

		Sprite.files = [];
	};

	Sprite.calcSize = function() {
		window._canvas.renderAll();

		Sprite.json.size = Math.round(_canvas.toDataURL().split(",")[1].replace(/=/g, "").length*3/4);

		Sprite.json.datalessJSON = window._canvas.toDatalessObject();
		localStorage.setItem(Sprite.json.uuid, angular.toJson(Sprite.json));
		$scope.Main.activeJson = Sprite.json;
	};

	query("html", doc).on('dragenter', function() {
		query("#app").addClass('hover');
	}).bind("drop", function() {
		query("#app").removeClass('hover');
	});

}]);