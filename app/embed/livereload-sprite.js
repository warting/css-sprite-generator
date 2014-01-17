var scripts = document.getElementsByTagName("script");
var selfScript = scripts[scripts.length - 1];
var uuid = selfScript.getAttribute("data-uuid");
var doc = document;
var iframe = doc.createElement("iframe");
var style = doc.createElement("link");

style.rel = "stylesheet";

iframe.src = "http://localhost:9001/download?uuid="+uuid;
iframe.style.display = 'none';
iframe.onload = showMeTheGoodStuff;

document.addEventListener('DOMContentLoaded', function() {
	doc.body.appendChild(iframe);

	window.addEventListener("message", receiveMessage, false);
});

function showMeTheGoodStuff () {
	iframe.contentWindow.postMessage("showMeTheGoodStuff", "http://localhost:9001");
};

function receiveMessage (event) {
	if (event.origin !== "http://localhost:9001") return;

	var bgHref = URL.createObjectURL(event.data.background);
	var href = URL.createObjectURL(new Blob([event.data.css.replace("____sprite____.png", bgHref)], {type: "text/css"}))

	style.href = href;
	doc.head.appendChild(style);
	// event.source.postMessage("hi there yourself!  the secret response is: rheeeeet!", event.origin);
}