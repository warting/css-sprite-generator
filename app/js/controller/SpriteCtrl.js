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

	Sprite.repack = function(){
		repack(window._canvas, Sprite.json).then(Sprite.calcSize);
	};

	Sprite.onFileSelect = function() {
		var files = Sprite.files;
		var defers = files.map($q.defer);
		var promises = defers.map(function(defer) {
			return defer.promise;
		});
		var index = 0;
		var reader = new FileReader;
		var img = new Image;
		var newObjects = [];

		function imgOnload(){
			var file = files[index];

			var sprite = new fabric.Sprite({
				base64: reader.result,
				image: img,
				name: file.name,
				origType: file.type,
				origSize: file.size
			});

			file.type === "image/png" && WebP.encode(file).then(function(result){
				sprite.mimetype = "image/webp";
				sprite.base64 = result.data;
			});
			newObjects.push(sprite);
			defers[index].resolve(sprite);

			img = new Image;
			index++;
			file = files[index];
			file && reader.readAsDataURL(file);
		}

		reader.onload = function(){
			img.src = reader.result;
			img.onload = imgOnload;
		};

		reader.readAsDataURL(files[0]);




		$q.all(promises).then(function(results) {

			_canvas._objects.push.apply(_canvas._objects, newObjects);

			for (var i = 0, length = newObjects.length; i < length; i++) {
				_canvas._onObjectAdded(newObjects[i]);
			}

			_canvas.renderOnAddRemove && _canvas.renderAll();

			repack(win._canvas, Sprite.json);//.then(Sprite.calcSize);
		});



		Sprite.files = [];
	};

	Sprite.calcSize = function() {
		window._canvas.renderAll();

		var dataUrl = window._canvas.toDataURL({
			format: "png", //Sprite.json.output,
			quality: Sprite.json.quality
		});

		var blob = dataURLtoBlob(dataUrl);

		Sprite.json.size = blob.size;
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

