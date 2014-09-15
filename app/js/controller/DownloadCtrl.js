"use strict";
var lastEvent;
app.controller("DownloadCtrl", ["$scope", "WebP", "$q", "$http", "$location", "$route", "aFilePicker", function($scope, WebP, $q, $http, $location, $route, aFilePicker){
	var Download = this;
	var Sprite = $scope.Main.activeJson;
	var type = {base64:true,binary:true};
	var demoReady = $http.get("/"+version+"/views/demo");
	var canvasReady = $q.defer();
	var asyncTasks = [demoReady, canvasReady];
	var internal = true;
	var internalIndex = 0;
	var cssHeading = "/*\n * Css generated by http://cssspritegenerator.net\n */\n";
	var uuid = $location.search().uuid
	var embedded = uuid && win !== win.top;
	var demo;

	var downloads = [];

	if(embedded){

		$scope.Main.activeUUID = uuid;
		$scope.Main.activeJson = angular.fromJson(localStorage.getItem(uuid));
		angular.extend(Sprite, $scope.Main.activeJson);

		Sprite.output = "png";
		Sprite.name = "____sprite____";
		internal = false;

		if(lastEvent)
			$scope.$on("canvasReady", function(){
				receiveMessage(lastEvent)
			});
		else
			angular.element(win).one("message", receiveMessage);

		function receiveMessage (event) {
			lastEvent = event;

			if(event.data === "showMeTheGoodStuff"){
				canvasReady.promise.then(function() {
					var background = dataURLtoBlob(_canvas.toDataURL());
					var canvasClone;

					if(Sprite.retina){
						canvasClone = document.createElement("canvas");
						canvasClone.width = Sprite.width / 2;
						canvasClone.height = Sprite.height / 2;
						canvasClone.getContext("2d").drawImage(_canvas.lowerCanvasEl, 0,0,canvasClone.width, canvasClone.height);

						background = dataURLtoBlob(canvasClone.toDataURL("",Sprite.quality));
					}

					event.source.postMessage({
						// since we only give them 1 background image to play with, we find all @media declarations in the CSS and remove them.
						css: css(Sprite).replace(/@media[\s\S]*?\}\s*\}/, ""),
						background: background
					}, event.origin);

				});

				angular.element(win).one('storage', function (event) {
					if(event.key === uuid && event.newValue !== event.oldValue){
						$route.reload();
					}
				});

			}


		}
	}


	function minify(value){return value?"-"+(Sprite.retina?value/2:value)+"px":0;}
	function css(it /**/) { var out='[class^="'+(it.prefix)+'"]{\n\tbackground-image: url('+(it.getName());if(it.output == "webp"){out+='.webp';}else{out+='.png';}out+=');\n\tbackground-repeat: no-repeat;\n\tdisplay: inline-block;\n\ttext-indent: -99999px;\n\toverflow: hidden;\n}\n\n';if(it.output == "webp/png"){out+='\n/* Result pending */\n.js [class^="'+(it.prefix)+'"]{\n\tbackground-image: none;\n}\n/* No WebP not supported */\n.js.no-webp [class^="'+(it.prefix)+'"] {\n\tbackground-image: url("'+(it.getName())+'.png");\n}\n/* WebP supported */\n.js.webp [class^="'+(it.prefix)+'"] {\n\tbackground-image: url("'+(it.getName())+'.webp");\n}\n';}out+='\n\n';if(it.retina){out+='\n@media\n\tonly screen and (-webkit-min-device-pixel-ratio: 2),\n\tonly screen and ( min--moz-device-pixel-ratio: 2),\n\tonly screen and ( -o-min-device-pixel-ratio: 2/1),\n\tonly screen and ( min-device-pixel-ratio: 2),\n\tonly screen and ( min-resolution: 192dpi),\n\tonly screen and ( min-resolution: 2dppx) {\n\t[class^="'+(it.prefix)+'"]{\n\t\tbackground-image: url(sprite-2x.png);\n\t\t-webkit-background-size: '+( Sprite.width / 2)+'px '+(Sprite.height / 2)+'px;\n\t\t-moz-background-size: '+( Sprite.width / 2)+'px '+(Sprite.height / 2)+'px;\n\t\tbackground-size: '+( Sprite.width / 2)+'px '+(Sprite.height / 2)+'px;\n\t}\n\n\t';if(it.output == "webp/png"){out+='\n\t/* No JS / WebP not supported */\n\t.js.no-webp [class^="'+(it.prefix)+'"]{\n\t\tbackground-image: url("'+(it.getName())+'-2x.png");\n\t}\n\t/* WebP supported */\n\t.js.webp [class^="'+(it.prefix)+'"]{\n\t\tbackground-image: url("'+(it.getName())+'-2x.webp");\n\t}\n\t';}out+='\n}\n';}out+='\n\n';var arr1=it.datalessJSON.objects;if(arr1){var file,i1=-1,l1=arr1.length-1;while(i1<l1){file=arr1[i1+=1];out+='\n.'+(it.getClassName(file))+'{ height: '+( it.getHeight(file) )+'px; width:'+( it.getWidth(file))+'px; background-position: '+( it.getPos(file) )+'; }';} } out+='\n\n.repeat'+(it.canRepeat.toUpperCase())+'{\n\t';if(it.canRepeat == "x"){out+='width';}else{out+='height';}out+=': 100%;\n\tbackground-repeat: repeat-'+(it.canRepeat)+';\n}';return out; }

	demoReady.then(function(result){
		demo = result.data;
	});

	$scope.$on("canvasReady", canvasReady.resolve);

	Download.set = {};

	Sprite.getClassName = function(obj) {
		return internal ? 'x-in'+internalIndex++ : Sprite.prefix + obj.className;
	};

	Sprite.getName = function(obj) {
		return Sprite.name || "sprite";
	};

	Sprite.getHeight = function(obj) {
		return Sprite.retina ? obj.origheight / 2 : obj.origheight;
	};

	Sprite.getWidth = function(obj) {
		return Sprite.retina ? obj.origwidth / 2 : obj.origwidth;
	};

	Sprite.getPos = function(obj) {

		return minify(obj.left) + " " + minify(obj.top);
	};

	Download.quick = function() {

		window.prompt(
			"Insert this code anywhere in your markup\n" +
			"and do something like:\n\n" +
			'<i class="'+Sprite.getClassName(_canvas._objects[0])+'"></i>\n\n'+
			"PS: this is only going to work for your own localStorage. " +
			"Meaning: only you this browser can use this (as long as you don't clear you browser storage) " +
			"It's only gona show you non-retina image in png format\n\n" +
			"In production you sould download the sprite and put it on your own server",
			'<script src="http://cssspritegenerator.net/embed/livereload-sprite.js" data-uuid="'+Sprite.uuid+'"></script>');
	};

	Download.update = function(){
		localStorage.setItem(Sprite.uuid, angular.toJson(Sprite));
	};

	Download.save = function(){
		var downloadName = Sprite.getName(),
		sCss = css(Sprite),
		folder = "/"+downloadName+"/",
		add = function(name, data, type){
			data.relativePath = folder + name;
			data.type = type;
			downloads.push(data);
		},

		base64 = 12, base64xs, canvasClone, blob;

		Download.disabled = true;

		_canvas._objects.forEach(function(file){
			add("original files/"+file.name, {$dataURL: file.base64}, file.origType);
		});

		add(downloadName+".css", {$text: cssHeading + sCss}, "text/css");
		add(downloadName+".min.css", {$text: cssHeading + minimizeData(sCss)}, "text/css");
		add(downloadName+".html", {$text: demo.replace("___SPRITENAME___", downloadName).replace("___SPRITE___", localStorage[Sprite.uuid])}, "text/html");

		base64 = base(_canvas.toDataURL({
			quality: Sprite.quality
		}));

		canvasClone = document.createElement("canvas");
		canvasClone.width = Sprite.width / 2;
		canvasClone.height = Sprite.height / 2;
		canvasClone.getContext("2d").drawImage(_canvas.lowerCanvasEl, 0,0,canvasClone.width, canvasClone.height);

		base64xs = base(canvasClone.toDataURL("",Sprite.quality));

		if(/webp/.test(Sprite.output)){

			if(Sprite.output == "webp/png"){
				if(Sprite.retina){
					add(downloadName+".png", {$base64: base64xs}, "image/png");
					add(downloadName+"-2x.png", {$base64: base64}, "image/png");
				} else{
					add(downloadName+".png", {$base64: base64}, "image/png");
				}
			}

			if(Sprite.retina){
				$q.all({
					base64: WebP.encode64(base64),
					base64xs: WebP.encode64(base64xs)
				}).then(function(result){
					add(downloadName+".webp", {$dataURL: result.base64xs}, "image/webp");
					add(downloadName+".webp", {$dataURL: result.base64}, "image/webp");
					save();
				});
			} else {
				WebP.encode64(base64).then(function(result) {
					add(downloadName+".webp", {$dataURL: base64}, "image/webp");
					save();
				});
			}
		} else {
			if(Sprite.retina){
				add(downloadName+".png", {$base64: base64xs}, "image/png");
				add(downloadName+"-2x.png", {$base64: base64}, "image/png");
			} else {
				add(downloadName+".png", {$base64: base64}, "image/png");
			}
			save();
		}
	};


	canvasReady.promise.then(function(){
		Sprite.datalessJSON.objects = _canvas._objects;
		var background = URL.createObjectURL(dataURLtoBlob(_canvas.toDataURL()));

		var backupPrefix = Sprite.prefix;
		var backupOutput = Sprite.output;
		var backupName = Sprite.name;
		var backupRetina = Sprite.retina;

		Sprite.prefix = "x-in";
		Sprite.output = "png";
		Sprite.retina = false;
		Sprite.name = "____sprite____";

		Download.css = css(Sprite).replace("____sprite____.png", background);

		Sprite.prefix = backupPrefix;
		Sprite.output = backupOutput;
		Sprite.name = backupName;
		Sprite.retina = backupRetina;

		internal = false;
	});


	/*
	function popupwindow(url, title, w, h, left, top) {
		left = (screen.width/2)-(w/2);
		top = (screen.height/2)-(h/2);
		window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
		return false;
	}



	app.directive('wisSub', function() {
		return function($scope, $el){
			setTimeout(function() {
				$el.submit();
			}, 0);
		};
	});
	*/

	function minimizeData( content ) {
		return content
		.replace( /\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, '' )
		.replace( /(\s)*:(\s)*/g, ':' )
		.replace( / {2,}/g, ' ' )
		.replace( / ([{:}]) /g, '$1' )
		.replace( /([;,]) /g, '$1' )
		.replace( / !/g, '!' );
	}


	function base(value){return value.split(",")[1];}
	function save(){
		aFilePicker.save({files: downloads});
	}


}]);

