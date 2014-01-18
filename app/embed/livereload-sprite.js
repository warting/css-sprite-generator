!function(doc) {
	"use strict";

	var scripts = doc.getElementsByTagName("script");
	var iframe = doc.createElement("iframe");
	var style = doc.createElement("link");
	var self = scripts[scripts.length - 1];
	var uuid = self.getAttribute("data-uuid");

	style.rel = "stylesheet";

	iframe.src = "http://cssspritegenerator.net/download?uuid="+uuid;
	iframe.style.display = 'none';
	iframe.onload = showMeTheGoodStuff;

	doc.addEventListener('DOMContentLoaded', function() {
		doc.body.appendChild(iframe);
		doc.head.appendChild(style);

		window.addEventListener("message", receiveGoodStuff, false);
	});

	function showMeTheGoodStuff () {
		iframe.contentWindow.postMessage("showMeTheGoodStuff", "http://cssspritegenerator.net");
	};

	function receiveGoodStuff (event) {
		if (event.origin !== "http://cssspritegenerator.net") return;

		style.href = URL.createObjectURL(
			new Blob([
				event.data.css.replace("____sprite____.png", URL.createObjectURL(event.data.background))
			], {type: "text/css"})
		);

	}
}(document);