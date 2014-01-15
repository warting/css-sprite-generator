!function(version) {
    "use strict";
    function query(selector, con) {
        return angular.element((con || body).querySelectorAll(selector));
    }
    function arrayRemove(array, value) {
        var index = array.indexOf(value);
        return index >= 0 && array.splice(index, 1), value;
    }
    function type(obj) {
        if (obj === win) return "global";
        var test = typeof obj;
        return "object" != test ? test : toString.call(obj).slice(8, -1).toLowerCase();
    }
    function arrayFrom(arrayLike) {
        return arr.slice.call(arrayLike);
    }
    var // Constant value
    win = window, doc = document, docElm = doc.documentElement, body = doc.body, arr = [], toString = {}.toString, app = angular.module("wis", [ "ngRoute" ]);
    docElm.className = "", app.run([ "$templateCache", function($templateCache) {
        var view = query("div[ng-view]");
        $templateCache.put(view.attr("ng-view"), view.html()), view.attr("ng-view", "");
    } ]), function(o, a, m) {
        win.GoogleAnalyticsObject = "ga", win.ga = win.ga || function() {
            (win.ga.q = win.ga.q || []).push(arguments);
        }, win.ga.l = +new Date(), a = doc.createElement(o), m = doc.getElementsByTagName(o)[0], 
        a.async = 1, a.src = "//www.google-analytics.com/analytics.js", m.parentNode.insertBefore(a, m);
    }("script"), ga("create", "UA-46794389-1", "cssspritegenerator.net"), ga("send", "pageview"), 
    app.config([ "$httpProvider", "$compileProvider", "$routeProvider", "$locationProvider", function($httpProvider, $compileProvider, $routeProvider, $locationProvider) {
        $httpProvider.interceptors.push("HttpDataURL"), // $compileProvider.imgSrcSanitizationWhitelist(/^\s*(blob):/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(blob:|data:image)/), $routeProvider.when("/", {
            templateUrl: "/" + version + "/views/index.html"
        }), $routeProvider.when("/canvas", {
            templateUrl: "/" + version + "/views/canvas.html",
            controller: "SpriteCtrl",
            controllerAs: "Sprite"
        }), $routeProvider.when("/mycanvas", {
            templateUrl: "/" + version + "/views/mycanvas.html"
        }), $routeProvider.when("/download", {
            templateUrl: "/" + version + "/views/download.html",
            controller: "DownloadCtrl",
            controllerAs: "Download"
        }), $locationProvider.html5Mode(!0);
    } ]), app.controller("DownloadCtrl", [ "$scope", "WebP", "$q", "$http", function($scope, WebP, $q, $http) {
        function minify(value) {
            return value ? "-" + (Sprite.retina ? value / 2 : value) + "px" : 0;
        }
        function css(it) {
            var out = '[class^="' + it.prefix + '"]{\n	background-image: url(' + it.getName();
            out += "webp" == it.output ? ".webp" : ".png", out += ");\n	background-repeat: no-repeat;\n	display: inline-block;\n	text-indent: -99999px;\n	overflow: hidden;\n}\n\n", 
            "webp/png" == it.output && (out += '\n/* Result pending */\n.js [class^="' + it.prefix + '"]{\n	background-image: none;\n}\n/* No WebP not supported */\n.js.no-webp [class^="' + it.prefix + '"] {\n	background-image: url("' + it.getName() + '.png");\n}\n/* WebP supported */\n.js.webp [class^="' + it.prefix + '"] {\n	background-image: url("' + it.getName() + '.webp");\n}\n'), 
            out += "\n\n", it.retina && (out += '\n@media\n	only screen and (-webkit-min-device-pixel-ratio: 2),\n	only screen and ( min--moz-device-pixel-ratio: 2),\n	only screen and ( -o-min-device-pixel-ratio: 2/1),\n	only screen and ( min-device-pixel-ratio: 2),\n	only screen and ( min-resolution: 192dpi),\n	only screen and ( min-resolution: 2dppx) {\n	[class^="' + it.prefix + '"]{\n		background-image: url(sprite-2x.png);\n		-webkit-background-size: ' + Sprite.width / 2 + "px " + Sprite.height / 2 + "px;\n		-moz-background-size: " + Sprite.width / 2 + "px " + Sprite.height / 2 + "px;\n		background-size: " + Sprite.width / 2 + "px " + Sprite.height / 2 + "px;\n	}\n\n	", 
            "webp/png" == it.output && (out += '\n	/* No JS / WebP not supported */\n	.js.no-webp [class^="' + it.prefix + '"]{\n		background-image: url("' + it.getName() + '-2x.png");\n	}\n	/* WebP supported */\n	.js.webp [class^="' + it.prefix + '"]{\n		background-image: url("' + it.getName() + '-2x.webp");\n	}\n	'), 
            out += "\n}\n"), out += "\n\n";
            var arr1 = it.datalessJSON.objects;
            if (arr1) for (var file, i1 = -1, l1 = arr1.length - 1; l1 > i1; ) file = arr1[i1 += 1], 
            out += "\n." + it.getClassName(file) + "{ height: " + it.getHeight(file) + "px; width:" + it.getWidth(file) + "px; background-position: " + it.getPos(file) + "; }";
            return out += "\n\n.repeat" + it.canRepeat.toUpperCase() + "{\n	", out += "x" == it.canRepeat ? "width" : "height", 
            out += ": 100%;\n	background-repeat: repeat-" + it.canRepeat + ";\n}";
        }
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
        function minimizeData(content) {
            return content.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, "").replace(/(\s)*:(\s)*/g, ":").replace(/ {2,}/g, " ").replace(/ ([{:}]) /g, "$1").replace(/([;,]) /g, "$1").replace(/ !/g, "!");
        }
        function base(value) {
            return value.split(",")[1];
        }
        function save() {
            var filename = Sprite.getName() + ".zip";
            saveAs(zip.generate({
                type: "blob"
            }), filename);
        }
        var demo, Download = this, Sprite = $scope.Main.activeJson, zip = new JSZip(), type = {
            base64: !0,
            binary: !0
        }, demoReady = $http.get("/" + version + "/views/demo"), canvasReady = $q.defer(), internal = !0, internalIndex = 0, cssHeading = "/*\n * Css generated by http://cssspritegenerator.net\n */\n";
        demoReady.then(function(result) {
            demo = result.data;
        }), $scope.$on("canvasReady", canvasReady.resolve), Download.set = {}, Sprite.getClassName = function(obj) {
            return internal ? "x-in" + internalIndex++ : Sprite.prefix + obj.className;
        }, Sprite.getName = function() {
            return Sprite.name || "sprite";
        }, Sprite.getHeight = function(obj) {
            return Sprite.retina ? obj.origheight / 2 : obj.origheight;
        }, Sprite.getWidth = function(obj) {
            return Sprite.retina ? obj.origwidth / 2 : obj.origwidth;
        }, Sprite.getPos = function(obj) {
            return minify(obj.left) + " " + minify(obj.top);
        }, Download.update = function() {
            localStorage.setItem(Sprite.uuid, angular.toJson(Sprite));
        }, Download.save = function() {
            zip = new JSZip();
            var base64, base64xs, canvasClone, downloadName = Sprite.getName(), sCss = css(Sprite), folder = zip.folder(downloadName);
            Download.disabled = !0, _canvas._objects.forEach(function(file) {
                var blob = "image/png" === file.origType && "data:image/webp" === file.base64.split(";")[0] ? WebP.decode64(file.base64).toDataURL("image/png", 1) : file.base64;
                folder.file("original files/" + file.name, base(blob), type);
            }), folder.file(downloadName + ".css", cssHeading + sCss), folder.file(downloadName + ".min.css", cssHeading + minimizeData(sCss)), 
            folder.file(downloadName + ".html", demo.replace("___SPRITENAME___", downloadName).replace("___SPRITE___", localStorage[Sprite.uuid])), 
            base64 = base(_canvas.toDataURL({
                quality: Sprite.quality
            })), canvasClone = document.createElement("canvas"), canvasClone.width = Sprite.width / 2, 
            canvasClone.height = Sprite.height / 2, canvasClone.getContext("2d").drawImage(_canvas.lowerCanvasEl, 0, 0, canvasClone.width, canvasClone.height), 
            base64xs = base(canvasClone.toDataURL("", Sprite.quality)), /webp/.test(Sprite.output) ? ("webp/png" == Sprite.output && (Sprite.retina ? (folder.file(downloadName + ".png", base64xs, type), 
            folder.file(downloadName + "-2x.png", base64, type)) : folder.file(downloadName + ".png", base64, type)), 
            Sprite.retina ? $q.all([ WebP.encode64(base64), WebP.encode64(base64xs) ]).then(function(results) {
                base64 = base(results[0].data), base64xs = base(results[1].data), folder.file(downloadName + ".webp", base64xs, type), 
                folder.file(downloadName + "-2x.webp", base64, type), save();
            }) : WebP.encode64(base64).then(function(result) {
                folder.file(downloadName + ".webp", base(result.data), type), save();
            })) : (Sprite.retina ? (folder.file(downloadName + ".png", base64xs, type), folder.file(downloadName + "-2x.png", base64, type)) : folder.file(downloadName + ".png", base64, type), 
            save());
        }, canvasReady.promise.then(function() {
            Sprite.datalessJSON.objects = _canvas._objects;
            var background = URL.createObjectURL(dataURLtoBlob(_canvas.toDataURL())), backupPrefix = Sprite.prefix, backupOutput = Sprite.output, backupName = Sprite.name, backupRetina = Sprite.retina;
            Sprite.prefix = "x-in", Sprite.output = "png", Sprite.retina = !1, Sprite.name = "____sprite____", 
            Download.css = css(Sprite).replace("____sprite____.png", background), Sprite.prefix = backupPrefix, 
            Sprite.output = backupOutput, Sprite.name = backupName, Sprite.retina = backupRetina, 
            internal = !1;
        });
    } ]), app.controller("MainCtrl", [ "$q", "$filter", "$location", "$route", function($q, $filter, $location, $route) {
        function check_webp_feature(c) {
            var b = $q.defer(), a = new Image();
            return a.onload = a.onerror = function() {
                b.resolve(a.width > 0);
            }, a.src = "data:image/webp;base64," + c, b.promise;
        }
        var supports, webp64, Main = this, canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1, Main.foo = "hej", Main.arrayRemove = arrayRemove, 
        Main.activeUUID = localStorage.lastUUID, Main.activeJson = angular.fromJson(localStorage.getItem(Main.activeUUID)), 
        Main.uuidItems = function() {
            return Object.keys(localStorage).filter(function(str) {
                return str.match("^css-sprite-generator-");
            });
        }, Main.openUUID = function(uuid) {
            Main.activeUUID = localStorage.lastUUID = uuid, Main.activeJson = angular.fromJson(localStorage.getItem(uuid)), 
            "/canvas" == $location.path() ? $route.reload() : $location.path("/canvas");
        }, Main.newUUID = function() {
            Main.openUUID("css-sprite-generator-" + +new Date() + "-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
                var r = 16 * Math.random() | 0, v = "x" == c ? r : 3 & r | 8;
                return v.toString(16);
            }));
        }, Main.deleteUUID = function(uuid) {
            localStorage.removeItem(uuid);
        }, // Syncrones test support
        supports = {
            js: !0,
            aDownload: "download" in document.createElement("a"),
            fileReader: !!win.FileReader,
            blob: win.Blob && "blob" == type(new win.Blob()),
            canvas: "htmlcanvaselement" == type(canvas) && canvas.getContext && !!canvas.getContext("2d"),
            localStorage: function() {
                try {
                    var a = localStorage;
                    return a.setItem("mod", "mod"), a.removeItem("mod"), "storage" == type(a);
                } catch (b) {
                    return !0;
                }
            }(),
            todataurlwebpalpha: !1
        }, // Deppendencies Syncrones support
        supports.todataurlwebp = supports.canvas && 0 === (webp64 = canvas.toDataURL("image/webp", 0)).indexOf("data:image/webp"), 
        supports.todataurljpeg = supports.canvas && 0 === canvas.toDataURL("image/jpeg", 0).indexOf("data:image/jpeg"), 
        supports.todataurlpng = supports.canvas && 0 === canvas.toDataURL("image/png", 0).indexOf("data:image/png"), 
        // Asyncrones support test
        $q.all([ check_webp_feature("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA"), check_webp_feature("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="), check_webp_feature("UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA=="), check_webp_feature("UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA"), function() {
            if (!supports.todataurlwebp) return !1;
            var deferred = $q.defer(), img = new Image(), ctx = canvas.getContext("2d");
            return img.src = webp64, img.onload = function() {
                ctx.drawImage(img, 0, 0), supports.todataurlwebpalpha = 0 == ctx.getImageData(0, 0, 1, 1).data[3], 
                deferred.resolve();
            }, img.onerror = deferred.resolve, deferred.promise;
        }() ]).then(function(result) {
            for (var i = 4, tests = [ "webpLossy", "webpLossless", "webpAlpha", "webpAnimation" ]; i--; ) supports[tests[i]] = result[i];
            Main.supports = supports;
        });
    } ]), app.controller("SpriteCtrl", [ "$q", "WebP", "$scope", "repack", function($q, WebP, $scope, repack) {
        function move(e) {
            e.preventDefault(), e.stopPropagation();
            var c = query("#excanvas")[0].getBoundingClientRect(), p = {};
            p.height = c.height + "px", p.width = c.width + "px", p.left = c.left + "px", p.bottom = c.bottom + "px", 
            p.right = c.right + "px", p.top = c.top + "px";
            var sdisplay = angular.element("<div id=sdisplay><b></b></div>");
            sdisplay.css(p), query("body", doc).css("cursor", "nw-resize").append(sdisplay).on("mousemove", function(e) {
                e.preventDefault(), e.stopPropagation();
                var x = ~~(e.pageX - c.left), y = ~~(e.pageY - c.top);
                // jshint ignore:line
                sdisplay.css({
                    width: x + "px",
                    height: y + "px"
                }).children("b").text(x + "x" + y);
            }).one("mouseup", function(e) {
                e.preventDefault(), e.stopPropagation();
                var style = sdisplay[0].style;
                window._canvas.width = parseInt(style.width), window._canvas.height = parseInt(style.height), 
                repack(window._canvas, Sprite.json).then(Sprite.calcSize), $scope.$apply(), query("body", doc).css("cursor", "").off("mousemove"), 
                sdisplay.remove();
            });
        }
        var Sprite = this, json = angular.fromJson(localStorage.getItem(localStorage.lastUUID));
        query("#scale").on("mousedown", move), Sprite.setBG = function() {
            window._canvas.backgroundColor = Sprite.json.datalessJSON.background, Sprite.calcSize();
        }, Sprite.json = json || {
            imageBackground: "",
            datalessJSON: {
                objects: [],
                background: "rgba(0,0,0,0)"
            },
            prefix: "ui-",
            output: "png",
            // webp, jpeg, apng
            canRepeat: "x",
            // y
            version: 2,
            margin: "",
            padding: "",
            uuid: localStorage.lastUUID,
            retina: !1,
            width: 200,
            height: 200,
            size: 0,
            quality: 1,
            // 0 to 1
            sameAspect: !1
        }, Sprite.repack = function() {
            repack(window._canvas, Sprite.json).then(Sprite.calcSize);
        }, Sprite.onFileSelect = function() {
            function imgOnload() {
                var file = files[index], sprite = new fabric.Sprite({
                    base64: reader.result,
                    image: img,
                    name: file.name,
                    origType: file.type,
                    origSize: file.size
                });
                "image/png" === file.type && WebP.encode(file).then(function(result) {
                    sprite.mimetype = "image/webp", sprite.base64 = result.data;
                }), newObjects.push(sprite), defers[index].resolve(sprite), img = new Image(), index++, 
                file = files[index], file && reader.readAsDataURL(file);
            }
            var files = Sprite.files, defers = files.map($q.defer), promises = defers.map(function(defer) {
                return defer.promise;
            }), index = 0, reader = new FileReader(), img = new Image(), newObjects = [];
            reader.onload = function() {
                img.src = reader.result, img.onload = imgOnload;
            }, reader.readAsDataURL(files[0]), $q.all(promises).then(function() {
                _canvas._objects.push.apply(_canvas._objects, newObjects);
                for (var i = 0, length = newObjects.length; length > i; i++) _canvas._onObjectAdded(newObjects[i]);
                _canvas.renderOnAddRemove && _canvas.renderAll(), repack(win._canvas, Sprite.json);
            }), Sprite.files = [];
        }, Sprite.calcSize = function() {
            window._canvas.renderAll();
            var dataUrl = window._canvas.toDataURL({
                format: "png",
                //Sprite.json.output,
                quality: Sprite.json.quality
            }), blob = dataURLtoBlob(dataUrl);
            Sprite.json.size = blob.size, Sprite.json.datalessJSON = window._canvas.toDatalessObject(), 
            localStorage.setItem(Sprite.json.uuid, angular.toJson(Sprite.json)), $scope.Main.activeJson = Sprite.json;
        }, query("html", doc).on("dragenter", function() {
            query("#app").addClass("hover");
        }).bind("drop", function() {
            query("#app").removeClass("hover");
        });
    } ]), app.directive("gPlusone", [ "$http", "$q", function($http) {
        var readyState = 0;
        /*
	win.googlePlussed = function(event) {
		if(event.state == "on"){
			console.log("Thank you for likeing %s", event.href);
		} else {
			console.log("Basterd why won't you like %s", event.href);
		}
	};
	*/
        return {
            restrict: "C",
            link: function() {
                0 == readyState && ($http.jsonp("//apis.google.com/js/platform.js").finally(function() {
                    readyState = 4;
                }), readyState = 3), 4 == readyState && gapi.plusone.go();
            }
        };
    } ]), app.directive("wisClassname", function() {
        return {
            // restrict to an attribute type.
            restrict: "A",
            // element must have ng-model attribute.
            require: "ngModel",
            scope: {
                set: "=wisClassname"
            },
            // scope = the parent scope
            // elem = the element the directive is on
            // attr = a dictionary of attributes on the element
            // ctrl = the controller for ngModel.
            link: function(scope, elem, attr, ctrl) {
                function validate(value) {
                    return value && ctrl.$setValidity("space", -1 == value.indexOf(" ")), value;
                }
                function validator(value) {
                    return value !== previous && (previous && (set[previous] = (set[previous] || 1) - 1), 
                    value && (set[value] = (set[value] || 0) + nr, nr = 1)), value;
                }
                function storePrevious(v) {
                    return previous = v, v;
                }
                // add a parser that will process each time the value is
                // parsed into the model when the user updates it.
                ctrl.$parsers.unshift(function(value) {
                    // if it's valid, return the value to the model,
                    // otherwise return undefined.
                    // test and set the validity after update.
                    return validate(value), value;
                }), // add a formatter that will process each time the value
                // is updated on the DOM element.
                ctrl.$formatters.unshift(function(value) {
                    // return the value or nothing will be written to the DOM.
                    // validate.
                    return validate(value), value;
                });
                var previous, set = scope.set, nr = .5;
                //angular calls the directive twice to ensure it works correctly so we need the half
                ctrl.$formatters.push(validator), ctrl.$parsers.push(validator), ctrl.$formatters.unshift(storePrevious), 
                ctrl.$parsers.push(storePrevious), scope.$watch(function() {
                    return set[ctrl.$viewValue] <= 1;
                }, function(value) {
                    ctrl.$setValidity("unique", value);
                });
            }
        };
    }), app.directive("wisColorValidate", function() {
        return {
            require: "ngModel",
            link: function(scope, elem, attr, ngModel) {
                function validate(color) {
                    //Alter the following conditions according to your need.
                    //Alter the following conditions according to your need.
                    return "" === color ? !0 : (ctx.fillStyle = "#000000", ctx.fillStyle = color, "#000000" !== ctx.fillStyle ? !0 : (ctx.fillStyle = "#ffffff", 
                    ctx.fillStyle = color, "#ffffff" !== ctx.fillStyle));
                }
                var ctx = document.createElement("canvas").getContext("2d");
                ngModel.$parsers.unshift(function(value) {
                    var valid = validate(value);
                    return ngModel.$setValidity("color", valid), valid ? value : void 0;
                }), ngModel.$formatters.unshift(function(value) {
                    return ngModel.$setValidity("color", validate(value)), value;
                });
            }
        };
    }), app.directive("wisDebounce", [ "$timeout", function($timeout) {
        return {
            restrict: "A",
            require: "ngModel",
            priority: 99,
            link: function(scope, elm, attr, ngModelCtrl) {
                if ("radio" !== attr.type && "checkbox" !== attr.type) {
                    elm.unbind("input");
                    var debounce;
                    elm.bind("input", function() {
                        $timeout.cancel(debounce), debounce = $timeout(function() {
                            scope.$apply(function() {
                                ngModelCtrl.$setViewValue(elm.val());
                            });
                        }, 200);
                    }), elm.bind("blur", function() {
                        scope.$apply(function() {
                            ngModelCtrl.$setViewValue(elm.val());
                        });
                    });
                }
            }
        };
    } ]), app.directive("wisFile", [ "$sniffer", "$parse", function($sniffer, $parse) {
        function validateFileType(filename, acceptedExt) {
            return filename.toLocaleLowerCase().endsWith(acceptedExt);
        }
        function validateMimeType(type, acceptedMime) {
            return type = type.split("/"), acceptedMime = acceptedMime.split("/"), type[0] === acceptedMime[0] && ("*" === acceptedMime[1] || acceptedMime[1] === type[1]);
        }
        function processDragOverOrEnter(event) {
            event.stopPropagation(), event.preventDefault();
        }
        function vaildate(scope, files, attr, ngModel) {
            var j, accepted, accepts, viewValue = [], multiple = "directory" in attr || "multiple" in attr, isValid = !0, i = files.length;
            if (attr.accept) for (accepts = attr.accept.split(","); isValid && i--; ) for (j = accepts.length, 
            isValid = !1; !isValid && j--; ) accepted = accepts[j].trim(), isValid = "." == accepted[0] ? validateFileType(files[i].name, accepted) : validateMimeType(files[i].type, accepted);
            ngModel.$setValidity("file", isValid), isValid ? viewValue = multiple ? arrayFrom(files) : files[0] : multiple && (viewValue = []), 
            ngModel.$setViewValue(viewValue);
        }
        return {
            restrict: "A",
            require: "?ngModel",
            link: function(scope, element, attr, ngModel) {
                var directory = $sniffer && $sniffer.vendorPrefix.toLocaleLowerCase() + "directory", isFileInput = "htmlinputelement" == type(element[0]) && "file" == attr.type;
                if (ngModel) {
                    // Make directory vendor prefix free in input[type="file"]
                    if (isFileInput && "directory" in attr && !attr.directory && directory in element[0]) {
                        var model = $parse(attr.supported);
                        model.assign(scope, directory in element[0]), element[0][directory] = !0;
                    }
                    // Revalidates the model value if it would programmatlicly change
                    ngModel.$render = function() {}, // var fn = $parse(attr['ngChange']);
                    element.bind("dragover dragenter", processDragOverOrEnter), element.bind("drop change", function(event) {
                        event = event.originalEvent || event;
                        var files = (event.dataTransfer || event.target).files;
                        // Just want to prevent default on drop event...
                        event.preventDefault(), scope.$apply(function() {
                            vaildate(scope, files, attr, ngModel);
                        });
                    });
                }
            }
        };
    } ]), app.directive("wisPadding", function() {
        return {
            require: "ngModel",
            link: function(scope, element, attr, ctrl) {
                var parse = function(viewValue) {
                    // If the viewValue is invalid (say required but empty) it will be `undefined`
                    // If the viewValue is invalid (say required but empty) it will be `undefined`
                    return viewValue ? new Array(5).join(viewValue + " ").split(" ").slice(0, 4).map(function(unit) {
                        return +unit;
                    }) : "";
                };
                ctrl.$parsers.push(parse), ctrl.$formatters.push(function(value) {
                    return Array.isArray(value) && !angular.equals([ 0, 0, 0, 0 ], value) ? value.join(" ") : void 0;
                }), // Override the standard $isEmpty because an empty array means the input is empty.
                ctrl.$isEmpty = function(value) {
                    return !value || !value.length;
                };
            }
        };
    }), app.directive("wisScroll", function() {
        return {
            link: function($scope, $element) {
                var time = 250, easeInOutQuad = function(a, b, d, c) {
                    return a /= c / 2, 1 > a ? d / 2 * a * a + b : (// jshint ignore:line
                    a--, -d / 2 * (a * (a - 2) - 1) + b);
                };
                $element.on("click", function(event) {
                    event.preventDefault();
                    var scrollTop = body.scrollTop, to = (win.innerHeight || docElm.clientHeight || body.clientHeight) + 45 - scrollTop, currentTime = 0, animateScroll = function() {
                        currentTime += 20;
                        var val = easeInOutQuad(currentTime, scrollTop, to, time);
                        body.scrollTop = val, time > currentTime && setTimeout(animateScroll, 20);
                    };
                    animateScroll();
                });
            }
        };
    }), app.directive("wisSprite", [ "$q", "WebP", function($q, WebP) {
        var sprite;
        return fabric.Sprite = fabric.util.createClass(fabric.Rect, {
            type: "sprite",
            initialize: function(options) {
                var canvas = options.image;
                options = options || {}, this.origwidth = this.width = canvas.width, this.origheight = this.height = canvas.height, 
                this.pad = "", this.mar = "", this.hasControls = !1, this.borderColor = "red", this.lockMovementX = !0, 
                this.lockMovementY = !0, this.repeat = !1, options.className = options.className || options.name.replace(/\.[^/.]+$/g, "").replace(/(\S)(\S*)/g, function a($0, $1, $2) {
                    return a.i = -~a.i, $1[1 === a.i ? "toLowerCase" : "toUpperCase"]() + $2.toLowerCase();
                }).replace(/\s|\./g, "").replace(/[^a-z0-9]/g, function(s) {
                    var c = s.charCodeAt(0);
                    return 32 === c ? "-" : 95 === c || 45 === c ? s : ("000" + c.toString(16)).slice(-4);
                });
                var pattern = new fabric.Pattern({
                    source: canvas,
                    repeat: "repeat"
                });
                this.fill = pattern, this.callSuper("initialize", options);
            },
            toObject: function() {
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
                this.width = this.repeat && "x" === sprite.canRepeat ? ctx.canvas.width : this.origwidth, 
                this.height = this.repeat && "y" === sprite.canRepeat ? ctx.canvas.height : this.origheight;
                var pad = this.pad || sprite.padding || [ 0, 0, 0, 0 ], area = [ this.left - pad[3], this.top - pad[0], this.width + pad[3] + pad[1], this.height + pad[0] + pad[2] ], oldFill = ctx.fillStyle;
                ctx.clearRect(area[0], area[1], area[2], area[3]), ctx.fillStyle = sprite.imageBackground, 
                ctx.fillStyle = this.background, ctx.fillRect(area[0], area[1], area[2], area[3]), 
                ctx.fillStyle = oldFill, this.callSuper("render", ctx);
            },
            _render: function(ctx) {
                this.callSuper("_render", ctx);
            }
        }), fabric.Sprite.fromObject = function(object) {
            return new fabric.Sprite(object);
        }, {
            restrict: "A",
            scope: {
                uuid: "&wisSprite",
                object: "&object",
                sprite: "&sprite"
            },
            link: function($scope, $element) {
                var uuid = $scope.uuid(), canvas = win._canvas = new fabric.Canvas($element[0], {
                    selection: !1,
                    includeDefaultValues: !1,
                    hoverCursor: "pointer",
                    selectionColor: "rgba(255, 255, 255, 0.3)"
                }), $sprite = $scope.sprite() || angular.fromJson(localStorage.getItem(uuid));
                canvas.selectionLineWidth = 3, canvas.selectionBorderColor = "red", canvas.setWidth($sprite.width), 
                canvas.setHeight($sprite.height), canvas.on("object:selected", function(options) {
                    $scope.$parent.Sprite.object = options.target, options.target.bringToFront(), $scope.$apply(), 
                    query("#thumbnail").html("").append(options.target.fill.source);
                }), $q.all($sprite.datalessJSON.objects.map(function(obj) {
                    var defer = $q.defer();
                    if (!($scope.$parent.Main.supports || {}).webpAlpha && "data:image/webp" == obj.base64.split(";")[0]) return obj.image = WebP.decode64(obj.base64), 
                    void 0;
                    var img = new Image();
                    return img.src = obj.base64, img.onload = function() {
                        obj.image = img, defer.resolve();
                    }, defer.promise;
                })).then(function() {
                    $scope.$emit("canvasReady"), sprite = $sprite, canvas.loadFromJSON(sprite.datalessJSON), 
                    canvas.renderAll();
                });
            }
        };
    } ]), app.factory("repack", [ "$filter", "$q", function($filter, $q) {
        function packer(canvas, sprite) {
            function mapper(obj) {
                var pad = obj.pad || sprite.padding || [ 0, 0, 0, 0 ], mar = obj.mar || sprite.margin || [ 0, 0, 0, 0 ];
                return {
                    w: obj.origwidth + mar[1] + mar[3] + pad[1] + pad[3],
                    h: obj.origheight + mar[0] + mar[2] + pad[0] + pad[2],
                    repeat: obj.repeat,
                    name: obj.name,
                    obj: obj
                };
            }
            var deferred = $q.defer(), blocks = canvas._objects.map(mapper), packer = new window.GrowingPacker(canvas.width, canvas.height, sprite.canRepeat);
            packer.fit(blocks);
            for (var block, obj, pad, mar, len = blocks.length; len--; ) block = blocks[len], 
            obj = block.obj, pad = obj.pad || sprite.padding || [ 0, 0, 0, 0 ], mar = obj.mar || sprite.margin || [ 0, 0, 0, 0 ], 
            obj.set({
                top: block.fit.y,
                left: block.fit.x
            }), obj.left = block.fit.x + mar[3] + pad[3], obj.top = block.fit.y + mar[0] + pad[0];
            var dimension = packer.dimension;
            return canvas.setDimensions(dimension), setTimeout(function() {
                canvas.setDimensions(dimension), canvas._objects.forEach(function(obj) {
                    obj.setCoords();
                }), deferred.resolve();
            }, 0), angular.extend(sprite, dimension), canvas.renderAll(), deferred.promise;
        }
        return packer;
    } ]), // register the interceptor as a service
    app.factory("HttpDataURL", [ "$q", function($q) {
        function decode(arraybuffer) {
            for (var binary = "", bytes = new Uint8Array(arraybuffer), len = bytes.byteLength, i = 0; len > i; i++) binary += String.fromCharCode(bytes[i]);
            return "data:image/webp;base64," + btoa(binary);
        }
        return {
            // optional method
            request: function(config) {
                // do something on success
                return "dataURL" == config.responseType && (config.responseType = "arraybuffer", 
                config.transformResponse = [ decode ]), config || $q.when(config);
            }
        };
    } ]), // This is a module for cloud persistance in mongolab - https://mongolab.com
    app.factory("WebP", [ "$http", "$q", function($http, $q) {
        var queue = [], execNext = function() {
            var task = queue[0];
            $http.post("https://warting-webp.p.mashape.com/", task.data, {
                headers: {
                    "X-Mashape-Authorization": "6fenynov1gvx968gscs0ptjx3pmbpi",
                    "Content-Type": void 0
                },
                responseType: "dataURL",
                transformRequest: angular.identity
            }).then(function(data) {
                queue.shift(), task.defer.resolve(data), queue.length > 0 && execNext();
            }, function(err) {
                task.defer.reject(err);
            });
        }, WebP = {
            encode64: function(base64) {
                return WebP.encode(window.dataURLtoBlob("data:image/png;base64," + base64));
            },
            encode: function(blob) {
                {
                    var fd = new FormData();
                    ({
                        headers: {
                            "X-Mashape-Authorization": "6fenynov1gvx968gscs0ptjx3pmbpi",
                            "Content-Type": void 0
                        },
                        responseType: "dataURL",
                        transformRequest: angular.identity
                    });
                }
                fd.append("file", blob), fd.append("quality", "100");
                var defer = $q.defer();
                return queue.push({
                    data: fd,
                    defer: defer
                }), 1 === queue.length && execNext(), defer.promise;
            },
            decode64: function(base64) {
                return WebP.decodeBinary(atob(base64.split(",")[1]));
            },
            decodeBinary: function(binary) {
                for (///--------- libwebpjs 0.2.0 decoder code start ---------------------------------------------
                var decoder = new WebPDecoder(), data = new Array(binary.length), i = binary.length; i--; ) data[i] = binary.charCodeAt(i);
                //Config, you can set all arguments or what you need, nothing no objeect
                {
                    var config = decoder.WebPDecoderConfig, output_buffer = config.j;
                    config.input;
                }
                output_buffer.J = 4, decoder.WebPDecode(data, data.length, config);
                var bitmap = output_buffer.c.RGBA.ma;
                ///--------- libwebpjs 0.2.0 decoder code end ---------------------------------------------
                if (bitmap) {
                    var biHeight = output_buffer.height, biWidth = output_buffer.width, canvas = document.createElement("canvas");
                    canvas.height = biHeight, canvas.width = biWidth;
                    for (var context = canvas.getContext("2d"), output = context.createImageData(canvas.width, canvas.height), outputData = output.data, h = 0; biHeight > h; h++) for (var w = 0; biWidth > w; w++) outputData[0 + 4 * w + 4 * biWidth * h] = bitmap[1 + 4 * w + 4 * biWidth * h], 
                    outputData[1 + 4 * w + 4 * biWidth * h] = bitmap[2 + 4 * w + 4 * biWidth * h], outputData[2 + 4 * w + 4 * biWidth * h] = bitmap[3 + 4 * w + 4 * biWidth * h], 
                    outputData[3 + 4 * w + 4 * biWidth * h] = bitmap[0 + 4 * w + 4 * biWidth * h];
                    return context.putImageData(output, 0, 0), canvas;
                }
            },
            decodeBlob: function() {}
        };
        return WebP;
    } ]), app.filter("filesize", function() {
        return function(size) {
            // GB
            // GB
            return size >= 1073741824 ? Math.round(size / 1073741824, 1) + " GB" : // MB
            size >= 1048576 ? Math.round(size / 1048576, 1) + " MB" : // KB
            size >= 1024 ? Math.round(size / 1024, 1) + " KB" : size + " b";
        };
    }), function(window) {
        var CanvasPrototype = window.HTMLCanvasElement && window.HTMLCanvasElement.prototype, hasBlobConstructor = window.Blob && function() {
            try {
                return Boolean(new Blob());
            } catch (e) {
                return !1;
            }
        }(), hasArrayBufferViewSupport = hasBlobConstructor && window.Uint8Array && function() {
            try {
                return 100 === new Blob([ new Uint8Array(100) ]).size;
            } catch (e) {
                return !1;
            }
        }(), BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder, dataURLtoBlob = (hasBlobConstructor || BlobBuilder) && window.atob && window.ArrayBuffer && window.Uint8Array && function(dataURI) {
            var byteString, arrayBuffer, intArray, i, mimeString, bb;
            for (// Convert base64 to raw binary data held in a string:
            byteString = dataURI.split(",")[0].indexOf("base64") >= 0 ? atob(dataURI.split(",")[1]) : decodeURIComponent(dataURI.split(",")[1]), 
            // Write the bytes of the string to an ArrayBuffer:
            arrayBuffer = new ArrayBuffer(byteString.length), intArray = new Uint8Array(arrayBuffer), 
            i = 0; i < byteString.length; i += 1) intArray[i] = byteString.charCodeAt(i);
            // Write the ArrayBuffer (or ArrayBufferView) to a blob:
            // Separate out the mime component:
            return mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0], hasBlobConstructor ? new Blob([ hasArrayBufferViewSupport ? intArray : arrayBuffer ], {
                type: mimeString
            }) : (bb = new BlobBuilder(), bb.append(arrayBuffer), bb.getBlob(mimeString));
        };
        window.HTMLCanvasElement && !CanvasPrototype.toBlob && (CanvasPrototype.mozGetAsFile ? CanvasPrototype.toBlob = function(callback, type, quality) {
            quality && CanvasPrototype.toDataURL && dataURLtoBlob ? callback(dataURLtoBlob(this.toDataURL(type, quality))) : callback(this.mozGetAsFile("blob", type));
        } : CanvasPrototype.toDataURL && dataURLtoBlob && (CanvasPrototype.toBlob = function(callback, type, quality) {
            callback(dataURLtoBlob(this.toDataURL(type, quality)));
        })), CanvasPrototype.toBlobSync = function(type, quality) {
            return dataURLtoBlob(this.toDataURL(type, quality));
        }, window.dataURLtoBlob = dataURLtoBlob;
    }(window);
    /* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2013-12-27
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See LICENSE.md
 */
    /*global self */
    /*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */
    /*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
    var saveAs = saveAs || "undefined" != typeof navigator && navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator) || function(view) {
        var doc = view.document, get_URL = function() {
            return view.URL || view.webkitURL || view;
        }, URL = view.URL || view.webkitURL || view, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"), can_use_save_link = !view.externalHost && "download" in save_link, webkit_req_fs = view.webkitRequestFileSystem, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem, throw_outside = function(ex) {
            (view.setImmediate || view.setTimeout)(function() {
                throw ex;
            }, 0);
        }, force_saveable_type = "application/octet-stream", fs_min_size = 0, deletion_queue = [], process_deletion_queue = function() {
            for (var i = deletion_queue.length; i--; ) {
                var file = deletion_queue[i];
                "string" == typeof file ? // file is an object URL
                URL.revokeObjectURL(file) : // file is a File
                file.remove();
            }
            deletion_queue.length = 0;
        }, dispatch = function(filesaver, event_types, event) {
            event_types = [].concat(event_types);
            for (var i = event_types.length; i--; ) {
                var listener = filesaver["on" + event_types[i]];
                if ("function" == typeof listener) try {
                    listener.call(filesaver, event || filesaver);
                } catch (ex) {
                    throw_outside(ex);
                }
            }
        }, FileSaver = function(blob, name) {
            // First try a.download, then web filesystem, then object URLs
            var object_url, target_view, slice, filesaver = this, type = blob.type, blob_changed = !1, get_object_url = function() {
                var object_url = get_URL().createObjectURL(blob);
                return deletion_queue.push(object_url), object_url;
            }, dispatch_all = function() {
                dispatch(filesaver, "writestart progress write writeend".split(" "));
            }, fs_error = function() {
                if (// don't create more object URLs than needed
                (blob_changed || !object_url) && (object_url = get_object_url(blob)), target_view) target_view.location.href = object_url; else if (window.FileReader) {
                    var reader = new FileReader();
                    reader.onload = function() {
                        angular.element("<form action=http://onlinefontconverter.com/downloadify method=post><input value='" + name + "' name=filename><input name=base64 value=" + reader.result.split(",")[1] + ">")[0].submit();
                    }, reader.readAsDataURL(blob);
                } else window.open(object_url, "_blank");
                filesaver.readyState = filesaver.DONE, dispatch_all();
            }, abortable = function(func) {
                return function() {
                    return filesaver.readyState !== filesaver.DONE ? func.apply(this, arguments) : void 0;
                };
            }, create_if_not_found = {
                create: !0,
                exclusive: !1
            };
            if (filesaver.readyState = filesaver.INIT, name || (name = "download"), can_use_save_link) {
                object_url = get_object_url(blob), // FF for Android has a nasty garbage collection mechanism
                // that turns all objects that are not pure javascript into 'deadObject'
                // this means `doc` and `save_link` are unusable and need to be recreated
                // `view` is usable though:
                doc = view.document, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"), 
                save_link.href = object_url, save_link.download = name;
                var event = doc.createEvent("MouseEvents");
                return event.initMouseEvent("click", !0, !1, view, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), 
                save_link.dispatchEvent(event), filesaver.readyState = filesaver.DONE, dispatch_all(), 
                void 0;
            }
            // Object and web filesystem URLs have a problem saving in Google Chrome when
            // viewed in a tab, so I force save with application/octet-stream
            // http://code.google.com/p/chromium/issues/detail?id=91158
            return view.chrome && type && type !== force_saveable_type && (slice = blob.slice || blob.webkitSlice, 
            blob = slice.call(blob, 0, blob.size, force_saveable_type), blob_changed = !0), 
            // Since I can't be sure that the guessed media type will trigger a download
            // in WebKit, I append .download to the filename.
            // https://bugs.webkit.org/show_bug.cgi?id=65440
            webkit_req_fs && "download" !== name && (name += ".download"), (type === force_saveable_type || webkit_req_fs) && (target_view = view), 
            req_fs ? (fs_min_size += blob.size, req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
                fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
                    var save = function() {
                        dir.getFile(name, create_if_not_found, abortable(function(file) {
                            file.createWriter(abortable(function(writer) {
                                writer.onwriteend = function(event) {
                                    target_view.location.href = file.toURL(), deletion_queue.push(file), filesaver.readyState = filesaver.DONE, 
                                    dispatch(filesaver, "writeend", event);
                                }, writer.onerror = function() {
                                    var error = writer.error;
                                    error.code !== error.ABORT_ERR && fs_error();
                                }, "writestart progress write abort".split(" ").forEach(function(event) {
                                    writer["on" + event] = filesaver["on" + event];
                                }), writer.write(blob), filesaver.abort = function() {
                                    writer.abort(), filesaver.readyState = filesaver.DONE;
                                }, filesaver.readyState = filesaver.WRITING;
                            }), fs_error);
                        }), fs_error);
                    };
                    dir.getFile(name, {
                        create: !1
                    }, abortable(function(file) {
                        // delete file if it already exists
                        file.remove(), save();
                    }), abortable(function(ex) {
                        ex.code === ex.NOT_FOUND_ERR ? save() : fs_error();
                    }));
                }), fs_error);
            }), fs_error), void 0) : (fs_error(), void 0);
        }, FS_proto = FileSaver.prototype, saveAs = function(blob, name) {
            return new FileSaver(blob, name);
        };
        return FS_proto.abort = function() {
            var filesaver = this;
            filesaver.readyState = filesaver.DONE, dispatch(filesaver, "abort");
        }, FS_proto.readyState = FS_proto.INIT = 0, FS_proto.WRITING = 1, FS_proto.DONE = 2, 
        FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null, 
        view.addEventListener("unload", process_deletion_queue, !1), saveAs;
    }("undefined" != typeof self && self || "undefined" != typeof window && window || this.content);
    // `self` is undefined in Firefox for Android content script context
    // while `this` is nsIContentFrameMessageManager
    // with an attribute `content` that corresponds to the window
    "undefined" != typeof module && (module.exports = saveAs), /******************************************************************************

This is a binary tree based bin packing algorithm that is more complex than
the simple Packer (packer.js). Instead of starting off with a fixed width and
height, it starts with the width and height of the first block passed and then
grows as necessary to accomodate each subsequent block. As it grows it attempts
to maintain a roughly square ratio by making 'smart' choices about whether to
grow right or down.

When growing, the algorithm can only grow to the right OR down. Therefore, if
the new block is BOTH wider and taller than the current target then it will be
rejected. This makes it very important to initialize with a sensible starting
width and height. If you are providing sorted input (largest first) then this
will not be an issue.

A potential way to solve this limitation would be to allow growth in BOTH
directions at once, but this requires maintaining a more complex tree
with 3 children (down, right and center) and that complexity can be avoided
by simply chosing a sensible starting block.

Best results occur when the input blocks are sorted by height, or even better
when sorted by max(width,height).

Inputs:
------

  blocks: array of any objects that have .w and .h attributes

Outputs:
-------

  marks each block that fits with a .fit attribute pointing to a
  node with .x and .y coordinates

Example:
-------

  var blocks = [
    { w: 100, h: 100 },
    { w: 100, h: 100 },
    { w:  80, h:  80 },
    { w:  80, h:  80 },
    etc
    etc
  ];

  var packer = new GrowingPacker();
  packer.fit(blocks);

  for(var n = 0 ; n < blocks.length ; n++) {
    var block = blocks[n];
    if (block.fit) {
      Draw(block.fit.x, block.fit.y, block.w, block.h);
    }
  }


******************************************************************************/
    !function() {
        var GrowingPacker = function(width, height, repeat) {
            this.initialW = width, this.initialH = height, this.sortMethod = "area", this.canRepeat = repeat, 
            this.lock = {
                x: !1,
                y: !1
            };
        };
        GrowingPacker.prototype = {
            sort: {
                // Sorthing method
                random: function() {
                    return Math.random() - .5;
                },
                w: function(a, b) {
                    return b.w - a.w;
                },
                h: function(a, b) {
                    return b.h - a.h;
                },
                a: function(a, b) {
                    return b.w * b.h - a.w * a.h;
                },
                name: function(a, b) {
                    return a.name && b.name ? a.name < b.name ? -1 : 1 : 0;
                },
                max: function(a, b) {
                    return Math.max(b.w, b.h) - Math.max(a.w, a.h);
                },
                min: function(a, b) {
                    return Math.min(b.w, b.h) - Math.min(a.w, a.h);
                },
                repeat: function(a, b) {
                    return a.repeat === b.repeat ? 0 : a.repeat ? 1 : -1;
                },
                _repeat: function(a, b) {
                    return a.repeat === b.repeat ? 0 : a.repeat ? -1 : 1;
                },
                // Sorthing choice
                height: function(a, b) {
                    return GrowingPacker.prototype.sort.msort(a, b, [ "repeat", "h", "w", "name" ]);
                },
                width: function(a, b) {
                    return GrowingPacker.prototype.sort.msort(a, b, [ "repeat", "w", "h", "name" ]);
                },
                area: function(a, b) {
                    return GrowingPacker.prototype.sort.msort(a, b, [ "repeat", "a", "h", "w", "name" ]);
                },
                maxside: function(a, b) {
                    return GrowingPacker.prototype.sort.msort(a, b, [ "repeat", "max", "min", "h", "w", "name" ]);
                },
                // sort by multiple criteria
                msort: function(a, b, criteria) {
                    var diff, n;
                    for (n = 0; n < criteria.length; n++) if (diff = GrowingPacker.prototype.sort[criteria[n]](a, b), 
                    0 != diff) return diff;
                    return 0;
                },
                now: function(blocks, method) {
                    "none" != this.sortMethod && blocks.sort(this[method]);
                }
            },
            widest: function(blocks) {
                var copy = blocks.slice(0);
                return this.sort.now(copy, "w"), this.initialW > copy[0].w ? this.initialW : copy[0].w;
            },
            highest: function(blocks) {
                var copy = blocks.slice(0);
                return this.sort.now(copy, "h"), this.initialH > copy[0].h ? this.initialH : copy[0].h;
            },
            fit: function(blocks) {
                var n, node, block, len = blocks.length, w = this.widest(blocks), h = this.highest(blocks), maxW = 0, maxH = 0, hasRepetedItems = blocks[len - 1].repeat;
                for (this.root = {
                    x: 0,
                    y: 0,
                    w: w,
                    h: h
                }, // Repeated items get sorted last
                // (read next comment below)
                this.sort.now(blocks, this.sortMethod), n = 0; len > n; n++) block = blocks[n], 
                // When there is only repeatable items left
                // the bTree locks one axis and sets all the
                // remaining blocks to its widest or talest side
                block.repeat && (block["x" == this.canRepeat ? "w" : "h"] = "x" == this.canRepeat ? maxW : maxH, 
                this.lock[this.canRepeat] = !0), block.fit = (node = this.findNode(this.root, block.w, block.h)) ? this.splitNode(node, block.w, block.h) : this.growNode(block.w, block.h), 
                maxH < block.fit.y + block.h && (maxH = block.fit.y + block.h), maxW < block.fit.x + block.w && (maxW = block.fit.x + block.w), 
                this.dimension = {
                    width: maxW,
                    height: maxH
                };
                // Doing this process over again is necessary to move all
                // the repeated items first
                if (hasRepetedItems) {
                    for (// Now sort the repeated items in the beginnig
                    this.sort.now(blocks, "_repeat"), // The bTree has already grown to its full potential
                    // so we set it to a fixed size
                    this.root = {
                        x: 0,
                        y: 0,
                        w: maxW,
                        h: maxH
                    }, maxH = 0, maxW = 0, n = 0; len > n; n++) block = blocks[n], // This time we allways know it will return a fitting position (allways)
                    // so no need for growing checking :)
                    node = this.findNode(this.root, block.w, block.h), block.fit = this.splitNode(node, block.w, block.h), 
                    maxH < block.fit.y + block.h && (maxH = block.fit.y + block.h), maxW < block.fit.x + block.w && (maxW = block.fit.x + block.w);
                    this.dimension = {
                        width: maxW,
                        height: maxH
                    };
                }
            },
            findNode: function(root, w, h) {
                return root.used ? this.findNode(root.right, w, h) || this.findNode(root.down, w, h) : w <= root.w && h <= root.h ? root : null;
            },
            splitNode: function(node, w, h) {
                return node.used = !0, node.down = {
                    x: node.x,
                    y: node.y + h,
                    w: node.w,
                    h: node.h - h
                }, node.right = {
                    x: node.x + w,
                    y: node.y,
                    w: node.w - w,
                    h: h
                }, node;
            },
            growNode: function(w, h) {
                var canGrowDown = !this.lock.y && w <= this.root.w, canGrowRight = !this.lock.x && h <= this.root.h, shouldGrowRight = canGrowRight && this.root.h >= this.root.w + w, shouldGrowDown = canGrowDown && this.root.w >= this.root.h + h;
                // attempt to keep square-ish by growing down  when width  is much greater than height
                // attempt to keep square-ish by growing down  when width  is much greater than height
                return shouldGrowRight ? this.growRight(w, h) : shouldGrowDown ? this.growDown(w, h) : canGrowRight ? this.growRight(w, h) : canGrowDown ? this.growDown(w, h) : null;
            },
            growRight: function(w, h) {
                var node;
                return this.root = {
                    used: !0,
                    x: 0,
                    y: 0,
                    w: this.dimension.width + w,
                    h: this.root.h,
                    down: this.root,
                    right: {
                        x: this.root.w,
                        y: 0,
                        w: w,
                        h: this.root.h
                    }
                }, (node = this.findNode(this.root, w, h)) ? (node.x = this.dimension.width, this.splitNode(node, w, h)) : null;
            },
            growDown: function(w, h) {
                var node;
                return this.root = {
                    used: !0,
                    x: 0,
                    y: 0,
                    w: this.root.w,
                    h: this.dimension.height + h,
                    down: {
                        x: 0,
                        y: this.root.h,
                        w: this.root.w,
                        h: h
                    },
                    right: this.root
                }, (node = this.findNode(this.root, w, h)) ? (node.y = this.dimension.height, this.splitNode(node, w, h)) : null;
            }
        }, window.GrowingPacker = GrowingPacker;
    }();
}("0.0.5");
//# sourceMappingURL=bootstrap-min.js.map