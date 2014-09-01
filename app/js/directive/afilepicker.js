!function(){

angular.module("aFilePicker", [])

.service("aFilePicker", ["$q", function($q) {

	var onlyPostMsgString = !function(a){try{postMessage({toString:function(){a=1}},"*")}catch(e){}return!a}(),
		// origin = "https://afilepicker.eu01.aws.af.cm",
		origin = "https://app.afilepicker.com",
		win = window,
		doc = document,
		usingMsgChannel = !!win.MessageChannel,
		defered,
		emit,
		aFilePicker,
		aFileDialog;

	function el(tagName, attr, parent) {
		var el = doc.createElement(tagName);
		angular.extend(el, attr);
		parent.appendChild(el);
		return el;
	}

	function className(el,name){
		el.className = name || "";
	}

	function preventDefault(event) {
		event.preventDefault();
	}

	function keydown(event, key) {
		// TODO: can we move focus to the iframe and prevent everything
		// still want to be able to use cmd+l or ctrl+l win+d
		key = event.keyCode;
		key > 36 && key < 41 && preventDefault(event);
	}

	function disable_scroll() {
		// angular.element(document.documentElement).addClass('disable-scroll')
		angular.element([win, doc]).on('DOMMouseScroll, mousewheel, touchstart', preventDefault);
		angular.element(doc).on('keydown', keydown);
		window.onmousewheel = document.onmousewheel = preventDefault;
	}

	function enable_scroll() {
		angular.element([win, doc]).off('DOMMouseScroll, mousewheel, touchstart', preventDefault);
		angular.element(doc).off('keydown', keydown);
	    window.onmousewheel = document.onmousewheel = null;
	}

	// window.Source = Source;

	var hash = {}, curr, len, arr, id=0;

	function nextUID(){
		return id++;
	}

	function messageHandler(event) {
		if(typeof event.data.eventName === 'number'){
			hash[event.data.eventName](event.data.detail);
			delete hash[event.data.eventName];
			return
		}

		if(event.data.eventName == "aFilePicker::close") {

			if(event.data.status == 200 || event.data.status == 204){
				enable_scroll();
				try{
					aFilePicker.close();
				} catch(e){
					aFilePicker.removeAttribute('open');
				}

				function Read(id){
					this.id = id;
				};

				Read.prototype.emit = emit;

				Read.prototype.start = function(readAs, range, cb) {
					var callbackId = nextUID()
					hash[callbackId] = cb;
					this.emit({
						detail: {
							id: this.id,
							range: range || "0-",
							readAs: readAs || "Blob",
							onload: callbackId
						},
						eventName: "aFilePicker::FileReader"
					});
				};

				var sources = event.data.detail.map(function(source){
					source.getFile = (new Read(source.id));
					window.e = source;
					delete source.id;
					return source;
				});

				defered.resolve(sources);
			}

		};

	}

	function createChannel(){
		return channel;
	};

	function instace(option){
		delete option.progress;

		var message = {
			detail: option,
			eventName: "aFilePicker::init",
			version: "v1"
		}

		// Try using MessageChannel first of all
		if(win.MessageChannel){
			var mc = new MessageChannel();

	    	// initialize the picker option
	    	aFileDialog.contentWindow.postMessage(message, origin, [mc.port2]);

			// Set up our port event listener.
			mc.port1.onmessage = messageHandler;

			// Open the port
			mc.port1.start();

			emit = function (msg) {
				msg.version = "v1";
				mc.port1.postMessage(msg);
			}
		} else {
			var channel = "aFilePicker_" + (+new Date);
	    	// initialize the picker option

	    	emit = function (msg) {
	    		msg.version = "v1";
	    		msg.channel = channel;
	    		aFileDialog.contentWindow.postMessage(msg, origin);
	    	}

	    	emit(message);

			// Set up our event listener.
			window.addEventListener('message', function(event) {
				if(event.origin = origin && event.data.channel == message.channel){
					messageHandler(event);
				}
			});
		}

		// Show the filepicker dialog
		try{
			aFilePicker.showModal();
		} catch(e){
			aFilePicker.setAttribute('open', '');
		}
	}

	function open(option) {
		defered = $q.defer();

		if(!aFileDialog){
			aFileDialog = el("iframe", {
				id: "aFileDialog",
				src: origin + "/my-device",
				// allowTransparency: true,
				onload: function(){
					instace(option);
				}
			}, aFilePicker = el("dialog", {
				id: "aFilePicker"
			}, document.body));
		} else {
			instace(option);
		}

		aFileDialog.sandbox = "allow-same-origin allow-top-navigation allow-forms allow-popups allow-scripts allow-pointer-lock";

		disable_scroll();

		return defered.promise;
	}

	return {
		pick: open,
		save: function(option) {
			option.saveMode = true;
			open(option);
		}
	};
}])

.directive("aFilePicker", ["aFilePicker", function(aFilePicker) {
	return {
		restrict: "A",
		require: '^ngModel',
		link: function($scope, $element, $attr, $ctrl) {

			$element.on('click', function(){
				aFilePicker.pick($scope.$eval($attr.aFilePicker) || {}).then(function(files) {
					$ctrl.$setViewValue(files);
					$ctrl.$render();
				});
			});

		}
	}
}]);

}();

// allow-same-origin allow-top-navigation allow-forms allow-popups allow-scripts allow-pointer-lock

// 260051086
// 108626005

// 5C:F8:A1:B4:3C:C0 android-8b916...
// AC:CA:54:00:70:15 AC:CA:54:00:70:15
// 10:DD:B1:CB:90:7C BUDDLEJA
// 00:25:00:4E:C1:06 JIMMYS-MBP
// C0:9F:42:5D:05:08 SarahWagsiPhone
// A4:D1:D2:82:5E:A5 Sarahs-iPad
// 9C:20:7B:69:2D:31 Users-iPhone
// 4C:ED:DE:92:2E:94 USER-DATOR
// 84:38:38:DB:6A:1E android-c3a43...