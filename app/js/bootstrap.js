"use strict";

var
// Constant value
win = window,
doc = document,
docElm = doc.documentElement,
body = doc.body,
arr = [],
toString = {}.toString,
app = angular.module("wis", ["ngRoute", "aFilePicker"]);

docElm.className = "";

function query(selector, con) {
	return angular.element((con || body).querySelectorAll(selector));
}

function arrayRemove(array, value) {
	var index = array.indexOf(value);
	if (index >=0) {
		array.splice(index, 1);
	}
	return value;
}

function type(obj) {
	if (obj === win) {
		return "global";
	}
	var test = typeof obj;
	return (test != "object") ? test : toString.call(obj).slice(8,-1).toLowerCase();
}

function arrayFrom(arrayLike) {
	return arr.slice.call(arrayLike);
}

(function(o,a,m){
	win.GoogleAnalyticsObject = "ga";
	win.ga = win.ga || function(){
		(win.ga.q = win.ga.q || []).push(arguments);
    };
    win.ga.l = +new Date;
    a = doc.createElement(o),
	m = doc.getElementsByTagName(o)[0];
	a.async = 1;
	a.src = "//www.google-analytics.com/analytics.js";
	m.parentNode.insertBefore(a,m);
})("script");

ga("create", "UA-46794389-1", "cssspritegenerator.net");
ga("send", "pageview");