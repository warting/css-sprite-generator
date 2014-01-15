!function(a){!function(b,c){"use strict";function d(a,b){return angular.element((b||k).querySelectorAll(a))}function e(a,b){var c=a.indexOf(b);return c>=0&&a.splice(c,1),b}function f(a){if(a===h)return"global";var b=typeof a;return"object"!=b?b:m.call(a).slice(8,-1).toLowerCase()}function g(a){return l.slice.call(a)}c.app=b;var h=window,i=document,j=i.documentElement,k=i.body,l=[],m={}.toString,n=angular.module("wis",["ngRoute"]);j.className="",n.run(["$templateCache",function(a){var b=d("div[ng-view]");a.put(b.attr("ng-view"),b.html()),b.attr("ng-view","")}]),function(a,b,c){h.GoogleAnalyticsObject="ga",h.ga=h.ga||function(){(h.ga.q=h.ga.q||[]).push(arguments)},h.ga.l=+new Date,b=i.createElement(a),c=i.getElementsByTagName(a)[0],b.async=1,b.src="//www.google-analytics.com/analytics.js",c.parentNode.insertBefore(b,c)}("script"),ga("create","UA-46794389-1","cssspritegenerator.net"),ga("send","pageview"),n.config(["$httpProvider","$compileProvider","$routeProvider","$locationProvider",function(b,c,d,e){b.interceptors.push("HttpDataURL"),c.imgSrcSanitizationWhitelist(/^\s*(blob:|data:image)/),d.when("/",{templateUrl:"/"+a+"/views/index.html"}),d.when("/canvas",{templateUrl:"/"+a+"/views/canvas.html",controller:"SpriteCtrl",controllerAs:"Sprite"}),d.when("/mycanvas",{templateUrl:"/"+a+"/views/mycanvas.html"}),d.when("/download",{templateUrl:"/"+a+"/views/download.html",controller:"DownloadCtrl",controllerAs:"Download"}),e.html5Mode(!0)}]),n.controller("DownloadCtrl",["$scope","WebP","$q","$http",function(b,c,d,e){function f(a){return a?"-"+(m.retina?a/2:a)+"px":0}function g(a){var b='[class^="'+a.prefix+'"]{\n	background-image: url('+a.getName();b+="webp"==a.output?".webp":".png",b+=");\n	background-repeat: no-repeat;\n	display: inline-block;\n	text-indent: -99999px;\n	overflow: hidden;\n}\n\n","webp/png"==a.output&&(b+='\n/* Result pending */\n.js [class^="'+a.prefix+'"]{\n	background-image: none;\n}\n/* No WebP not supported */\n.js.no-webp [class^="'+a.prefix+'"] {\n	background-image: url("'+a.getName()+'.png");\n}\n/* WebP supported */\n.js.webp [class^="'+a.prefix+'"] {\n	background-image: url("'+a.getName()+'.webp");\n}\n'),b+="\n\n",a.retina&&(b+='\n@media\n	only screen and (-webkit-min-device-pixel-ratio: 2),\n	only screen and ( min--moz-device-pixel-ratio: 2),\n	only screen and ( -o-min-device-pixel-ratio: 2/1),\n	only screen and ( min-device-pixel-ratio: 2),\n	only screen and ( min-resolution: 192dpi),\n	only screen and ( min-resolution: 2dppx) {\n	[class^="'+a.prefix+'"]{\n		background-image: url(sprite-2x.png);\n		-webkit-background-size: '+m.width/2+"px "+m.height/2+"px;\n		-moz-background-size: "+m.width/2+"px "+m.height/2+"px;\n		background-size: "+m.width/2+"px "+m.height/2+"px;\n	}\n\n	","webp/png"==a.output&&(b+='\n	/* No JS / WebP not supported */\n	.js.no-webp [class^="'+a.prefix+'"]{\n		background-image: url("'+a.getName()+'-2x.png");\n	}\n	/* WebP supported */\n	.js.webp [class^="'+a.prefix+'"]{\n		background-image: url("'+a.getName()+'-2x.webp");\n	}\n	'),b+="\n}\n"),b+="\n\n";var c=a.datalessJSON.objects;if(c)for(var d,e=-1,f=c.length-1;f>e;)d=c[e+=1],b+="\n."+a.getClassName(d)+"{ height: "+a.getHeight(d)+"px; width:"+a.getWidth(d)+"px; background-position: "+a.getPos(d)+"; }";return b+="\n\n.repeat"+a.canRepeat.toUpperCase()+"{\n	",b+="x"==a.canRepeat?"width":"height",b+=": 100%;\n	background-repeat: repeat-"+a.canRepeat+";\n}"}function h(a){return a.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g,"").replace(/(\s)*:(\s)*/g,":").replace(/ {2,}/g," ").replace(/ ([{:}]) /g,"$1").replace(/([;,]) /g,"$1").replace(/ !/g,"!")}function i(a){return a.split(",")[1]}function j(){var a=m.getName()+".zip";o(n.generate({type:"blob"}),a)}var k,l=this,m=b.Main.activeJson,n=new JSZip,p={base64:!0,binary:!0},q=e.get("/"+a+"/views/demo"),r=d.defer(),s=!0,t=0,u="/*\n * Css generated by http://cssspritegenerator.net\n */\n";q.then(function(a){k=a.data}),b.$on("canvasReady",r.resolve),l.set={},m.getClassName=function(a){return s?"x-in"+t++:m.prefix+a.className},m.getName=function(){return m.name||"sprite"},m.getHeight=function(a){return m.retina?a.origheight/2:a.origheight},m.getWidth=function(a){return m.retina?a.origwidth/2:a.origwidth},m.getPos=function(a){return f(a.left)+" "+f(a.top)},l.update=function(){localStorage.setItem(m.uuid,angular.toJson(m))},l.save=function(){n=new JSZip;var a,b,e,f=m.getName(),o=g(m),q=n.folder(f);l.disabled=!0,_canvas._objects.forEach(function(a){var b="image/png"===a.origType&&"data:image/webp"===a.base64.split(";")[0]?c.decode64(a.base64).toDataURL("image/png",1):a.base64;q.file("original files/"+a.name,i(b),p)}),q.file(f+".css",u+o),q.file(f+".min.css",u+h(o)),q.file(f+".html",k.replace("___SPRITENAME___",f).replace("___SPRITE___",localStorage[m.uuid])),a=i(_canvas.toDataURL({quality:m.quality})),e=document.createElement("canvas"),e.width=m.width/2,e.height=m.height/2,e.getContext("2d").drawImage(_canvas.lowerCanvasEl,0,0,e.width,e.height),b=i(e.toDataURL("",m.quality)),/webp/.test(m.output)?("webp/png"==m.output&&(m.retina?(q.file(f+".png",b,p),q.file(f+"-2x.png",a,p)):q.file(f+".png",a,p)),m.retina?d.all([c.encode64(a),c.encode64(b)]).then(function(c){a=i(c[0].data),b=i(c[1].data),q.file(f+".webp",b,p),q.file(f+"-2x.webp",a,p),j()}):c.encode64(a).then(function(a){q.file(f+".webp",i(a.data),p),j()})):(m.retina?(q.file(f+".png",b,p),q.file(f+"-2x.png",a,p)):q.file(f+".png",a,p),j())},r.promise.then(function(){m.datalessJSON.objects=_canvas._objects;var a=URL.createObjectURL(dataURLtoBlob(_canvas.toDataURL())),b=m.prefix,c=m.output,d=m.name,e=m.retina;m.prefix="x-in",m.output="png",m.retina=!1,m.name="____sprite____",l.css=g(m).replace("____sprite____.png",a),m.prefix=b,m.output=c,m.name=d,m.retina=e,s=!1})}]),n.controller("MainCtrl",["$q","$filter","$location","$route",function(a,b,c,d){function g(b){var c=a.defer(),d=new Image;return d.onload=d.onerror=function(){c.resolve(d.width>0)},d.src="data:image/webp;base64,"+b,c.promise}var i,j,k=this,l=document.createElement("canvas");l.width=l.height=1,k.foo="hej",k.arrayRemove=e,k.activeUUID=localStorage.lastUUID,k.activeJson=angular.fromJson(localStorage.getItem(k.activeUUID)),k.uuidItems=function(){return Object.keys(localStorage).filter(function(a){return a.match("^css-sprite-generator-")})},k.openUUID=function(a){k.activeUUID=localStorage.lastUUID=a,k.activeJson=angular.fromJson(localStorage.getItem(a)),"/canvas"==c.path()?d.reload():c.path("/canvas")},k.newUUID=function(){k.openUUID("css-sprite-generator-"+ +new Date+"-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(a){var b=16*Math.random()|0,c="x"==a?b:3&b|8;return c.toString(16)}))},k.deleteUUID=function(a){localStorage.removeItem(a)},i={js:!0,aDownload:"download"in document.createElement("a"),fileReader:!!h.FileReader,blob:h.Blob&&"blob"==f(new h.Blob),canvas:"htmlcanvaselement"==f(l)&&l.getContext&&!!l.getContext("2d"),localStorage:function(){try{var a=localStorage;return a.setItem("mod","mod"),a.removeItem("mod"),"storage"==f(a)}catch(b){return!0}}(),todataurlwebpalpha:!1},i.todataurlwebp=i.canvas&&0===(j=l.toDataURL("image/webp",0)).indexOf("data:image/webp"),i.todataurljpeg=i.canvas&&0===l.toDataURL("image/jpeg",0).indexOf("data:image/jpeg"),i.todataurlpng=i.canvas&&0===l.toDataURL("image/png",0).indexOf("data:image/png"),a.all([g("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA"),g("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="),g("UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA=="),g("UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA"),function(){if(!i.todataurlwebp)return!1;var b=a.defer(),c=new Image,d=l.getContext("2d");return c.src=j,c.onload=function(){d.drawImage(c,0,0),i.todataurlwebpalpha=0==d.getImageData(0,0,1,1).data[3],b.resolve()},c.onerror=b.resolve,b.promise}()]).then(function(a){for(var b=4,c=["webpLossy","webpLossless","webpAlpha","webpAnimation"];b--;)i[c[b]]=a[b];k.supports=i})}]),n.controller("SpriteCtrl",["$q","WebP","$scope","repack",function(a,b,c,e){function f(a){a.preventDefault(),a.stopPropagation();var b=d("#excanvas")[0].getBoundingClientRect(),f={};f.height=b.height+"px",f.width=b.width+"px",f.left=b.left+"px",f.bottom=b.bottom+"px",f.right=b.right+"px",f.top=b.top+"px";var h=angular.element("<div id=sdisplay><b></b></div>");h.css(f),d("body",i).css("cursor","nw-resize").append(h).on("mousemove",function(a){a.preventDefault(),a.stopPropagation();var c=~~(a.pageX-b.left),d=~~(a.pageY-b.top);h.css({width:c+"px",height:d+"px"}).children("b").text(c+"x"+d)}).one("mouseup",function(a){a.preventDefault(),a.stopPropagation();var b=h[0].style;window._canvas.width=parseInt(b.width),window._canvas.height=parseInt(b.height),e(window._canvas,g.json).then(g.calcSize),c.$apply(),d("body",i).css("cursor","").off("mousemove"),h.remove()})}var g=this,j=angular.fromJson(localStorage.getItem(localStorage.lastUUID));d("#scale").on("mousedown",f),g.setBG=function(){window._canvas.backgroundColor=g.json.datalessJSON.background,g.calcSize()},g.json=j||{imageBackground:"",datalessJSON:{objects:[],background:"rgba(0,0,0,0)"},prefix:"ui-",output:"png",canRepeat:"x",version:2,margin:"",padding:"",uuid:localStorage.lastUUID,retina:!1,width:200,height:200,size:0,quality:1,sameAspect:!1},g.repack=function(){e(window._canvas,g.json).then(g.calcSize)},g.onFileSelect=function(){function c(){var a=d[j],c=new fabric.Sprite({base64:k.result,image:l,name:a.name,origType:a.type,origSize:a.size});"image/png"===a.type&&b.encode(a).then(function(a){c.mimetype="image/webp",c.base64=a.data}),m.push(c),f[j].resolve(c),l=new Image,j++,a=d[j],a&&k.readAsDataURL(a)}var d=g.files,f=d.map(a.defer),i=f.map(function(a){return a.promise}),j=0,k=new FileReader,l=new Image,m=[];k.onload=function(){l.src=k.result,l.onload=c},k.readAsDataURL(d[0]),a.all(i).then(function(){_canvas._objects.push.apply(_canvas._objects,m);for(var a=0,b=m.length;b>a;a++)_canvas._onObjectAdded(m[a]);_canvas.renderOnAddRemove&&_canvas.renderAll(),e(h._canvas,g.json)}),g.files=[]},g.calcSize=function(){window._canvas.renderAll();var a=window._canvas.toDataURL({format:"png",quality:g.json.quality}),b=dataURLtoBlob(a);g.json.size=b.size,g.json.datalessJSON=window._canvas.toDatalessObject(),localStorage.setItem(g.json.uuid,angular.toJson(g.json)),c.Main.activeJson=g.json},d("html",i).on("dragenter",function(){d("#app").addClass("hover")}).bind("drop",function(){d("#app").removeClass("hover")})}]),n.directive("gPlusone",["$http","$q",function(a){var b=0;return{restrict:"C",link:function(){0==b&&(a.jsonp("//apis.google.com/js/platform.js").finally(function(){b=4}),b=3),4==b&&gapi.plusone.go()}}}]),n.directive("wisClassname",function(){return{restrict:"A",require:"ngModel",scope:{set:"=wisClassname"},link:function(a,b,c,d){function e(a){return a&&d.$setValidity("space",-1==a.indexOf(" ")),a}function f(a){return a!==h&&(h&&(i[h]=(i[h]||1)-1),a&&(i[a]=(i[a]||0)+j,j=1)),a}function g(a){return h=a,a}d.$parsers.unshift(function(a){return e(a),a}),d.$formatters.unshift(function(a){return e(a),a});var h,i=a.set,j=.5;d.$formatters.push(f),d.$parsers.push(f),d.$formatters.unshift(g),d.$parsers.push(g),a.$watch(function(){return i[d.$viewValue]<=1},function(a){d.$setValidity("unique",a)})}}}),n.directive("wisColorValidate",function(){return{require:"ngModel",link:function(a,b,c,d){function e(a){return""===a?!0:(f.fillStyle="#000000",f.fillStyle=a,"#000000"!==f.fillStyle?!0:(f.fillStyle="#ffffff",f.fillStyle=a,"#ffffff"!==f.fillStyle))}var f=document.createElement("canvas").getContext("2d");d.$parsers.unshift(function(a){var b=e(a);return d.$setValidity("color",b),b?a:void 0}),d.$formatters.unshift(function(a){return d.$setValidity("color",e(a)),a})}}}),n.directive("wisDebounce",["$timeout",function(a){return{restrict:"A",require:"ngModel",priority:99,link:function(b,c,d,e){if("radio"!==d.type&&"checkbox"!==d.type){c.unbind("input");var f;c.bind("input",function(){a.cancel(f),f=a(function(){b.$apply(function(){e.$setViewValue(c.val())})},200)}),c.bind("blur",function(){b.$apply(function(){e.$setViewValue(c.val())})})}}}}]),n.directive("wisFile",["$sniffer","$parse",function(a,b){function c(a,b){return a.toLocaleLowerCase().endsWith(b)}function d(a,b){return a=a.split("/"),b=b.split("/"),a[0]===b[0]&&("*"===b[1]||b[1]===a[1])}function e(a){a.stopPropagation(),a.preventDefault()}function h(a,b,e,f){var h,i,j,k=[],l="directory"in e||"multiple"in e,m=!0,n=b.length;if(e.accept)for(j=e.accept.split(",");m&&n--;)for(h=j.length,m=!1;!m&&h--;)i=j[h].trim(),m="."==i[0]?c(b[n].name,i):d(b[n].type,i);f.$setValidity("file",m),m?k=l?g(b):b[0]:l&&(k=[]),f.$setViewValue(k)}return{restrict:"A",require:"?ngModel",link:function(c,d,g,i){var j=a&&a.vendorPrefix.toLocaleLowerCase()+"directory",k="htmlinputelement"==f(d[0])&&"file"==g.type;if(i){if(k&&"directory"in g&&!g.directory&&j in d[0]){var l=b(g.supported);l.assign(c,j in d[0]),d[0][j]=!0}i.$render=function(){},d.bind("dragover dragenter",e),d.bind("drop change",function(a){a=a.originalEvent||a;var b=(a.dataTransfer||a.target).files;a.preventDefault(),c.$apply(function(){h(c,b,g,i)})})}}}}]),n.directive("wisPadding",function(){return{require:"ngModel",link:function(a,b,c,d){var e=function(a){return a?new Array(5).join(a+" ").split(" ").slice(0,4).map(function(a){return+a}):""};d.$parsers.push(e),d.$formatters.push(function(a){return Array.isArray(a)&&!angular.equals([0,0,0,0],a)?a.join(" "):void 0}),d.$isEmpty=function(a){return!a||!a.length}}}}),n.directive("wisScroll",function(){return{link:function(a,b){var c=250,d=function(a,b,c,d){return a/=d/2,1>a?c/2*a*a+b:(a--,-c/2*(a*(a-2)-1)+b)};b.on("click",function(a){a.preventDefault();var b=k.scrollTop,e=(h.innerHeight||j.clientHeight||k.clientHeight)+45-b,f=0,g=function(){f+=20;var a=d(f,b,e,c);k.scrollTop=a,c>f&&setTimeout(g,20)};g()})}}}),n.directive("wisSprite",["$q","WebP",function(a,b){var c;return fabric.Sprite=fabric.util.createClass(fabric.Rect,{type:"sprite",initialize:function(a){var b=a.image;a=a||{},this.origwidth=this.width=b.width,this.origheight=this.height=b.height,this.pad="",this.mar="",this.hasControls=!1,this.borderColor="red",this.lockMovementX=!0,this.lockMovementY=!0,this.repeat=!1,a.className=a.className||a.name.replace(/\.[^/.]+$/g,"").replace(/(\S)(\S*)/g,function d(a,b,c){return d.i=-~d.i,b[1===d.i?"toLowerCase":"toUpperCase"]()+c.toLowerCase()}).replace(/\s|\./g,"").replace(/[^a-z0-9]/g,function(a){var b=a.charCodeAt(0);return 32===b?"-":95===b||45===b?a:("000"+b.toString(16)).slice(-4)});var c=new fabric.Pattern({source:b,repeat:"repeat"});this.fill=c,this.callSuper("initialize",a)},toObject:function(){return{base64:this.base64,background:this.background,className:this.className,mimetype:this.mimetype,left:this.left,mar:this.mar,name:this.name,origSize:this.origSize,type:"sprite",top:this.top,origType:this.origType,pad:this.pad,repeat:this.repeat}},render:function(a){this.width=this.repeat&&"x"===c.canRepeat?a.canvas.width:this.origwidth,this.height=this.repeat&&"y"===c.canRepeat?a.canvas.height:this.origheight;var b=this.pad||c.padding||[0,0,0,0],d=[this.left-b[3],this.top-b[0],this.width+b[3]+b[1],this.height+b[0]+b[2]],e=a.fillStyle;a.clearRect(d[0],d[1],d[2],d[3]),a.fillStyle=c.imageBackground,a.fillStyle=this.background,a.fillRect(d[0],d[1],d[2],d[3]),a.fillStyle=e,this.callSuper("render",a)},_render:function(a){this.callSuper("_render",a)}}),fabric.Sprite.fromObject=function(a){return new fabric.Sprite(a)},{restrict:"A",scope:{uuid:"&wisSprite",object:"&object",sprite:"&sprite"},link:function(e,f){var g=e.uuid(),i=h._canvas=new fabric.Canvas(f[0],{selection:!1,includeDefaultValues:!1,hoverCursor:"pointer",selectionColor:"rgba(255, 255, 255, 0.3)"}),j=e.sprite()||angular.fromJson(localStorage.getItem(g));i.selectionLineWidth=3,i.selectionBorderColor="red",i.setWidth(j.width),i.setHeight(j.height),i.on("object:selected",function(a){e.$parent.Sprite.object=a.target,a.target.bringToFront(),e.$apply(),d("#thumbnail").html("").append(a.target.fill.source)}),a.all(j.datalessJSON.objects.map(function(c){var d=a.defer();if(!(e.$parent.Main.supports||{}).webpAlpha&&"data:image/webp"==c.base64.split(";")[0])return c.image=b.decode64(c.base64),void 0;var f=new Image;return f.src=c.base64,f.onload=function(){c.image=f,d.resolve()},d.promise})).then(function(){e.$emit("canvasReady"),c=j,i.loadFromJSON(c.datalessJSON),i.renderAll()})}}}]),n.factory("repack",["$filter","$q",function(a,b){function c(a,c){function d(a){var b=a.pad||c.padding||[0,0,0,0],d=a.mar||c.margin||[0,0,0,0];return{w:a.origwidth+d[1]+d[3]+b[1]+b[3],h:a.origheight+d[0]+d[2]+b[0]+b[2],repeat:a.repeat,name:a.name,obj:a}}var e=b.defer(),f=a._objects.map(d),g=new window.GrowingPacker(a.width,a.height,c.canRepeat);g.fit(f);for(var h,i,j,k,l=f.length;l--;)h=f[l],i=h.obj,j=i.pad||c.padding||[0,0,0,0],k=i.mar||c.margin||[0,0,0,0],i.set({top:h.fit.y,left:h.fit.x}),i.left=h.fit.x+k[3]+j[3],i.top=h.fit.y+k[0]+j[0];var m=g.dimension;return a.setDimensions(m),setTimeout(function(){a.setDimensions(m),a._objects.forEach(function(a){a.setCoords()}),e.resolve()},0),angular.extend(c,m),a.renderAll(),e.promise}return c}]),n.factory("HttpDataURL",["$q",function(a){function b(a){for(var b="",c=new Uint8Array(a),d=c.byteLength,e=0;d>e;e++)b+=String.fromCharCode(c[e]);return"data:image/webp;base64,"+btoa(b)}return{request:function(c){return"dataURL"==c.responseType&&(c.responseType="arraybuffer",c.transformResponse=[b]),c||a.when(c)}}}]),n.factory("WebP",["$http","$q",function(a,b){var c=[],d=function(){var b=c[0];a.post("https://warting-webp.p.mashape.com/",b.data,{headers:{"X-Mashape-Authorization":"6fenynov1gvx968gscs0ptjx3pmbpi","Content-Type":void 0},responseType:"dataURL",transformRequest:angular.identity}).then(function(a){c.shift(),b.defer.resolve(a),c.length>0&&d()},function(a){b.defer.reject(a)})},e={encode64:function(a){return e.encode(window.dataURLtoBlob("data:image/png;base64,"+a))},encode:function(a){{var e=new FormData;({headers:{"X-Mashape-Authorization":"6fenynov1gvx968gscs0ptjx3pmbpi","Content-Type":void 0},responseType:"dataURL",transformRequest:angular.identity})}e.append("file",a),e.append("quality","100");var f=b.defer();return c.push({data:e,defer:f}),1===c.length&&d(),f.promise},decode64:function(a){return e.decodeBinary(atob(a.split(",")[1]))},decodeBinary:function(a){for(var b=new WebPDecoder,c=new Array(a.length),d=a.length;d--;)c[d]=a.charCodeAt(d);{var e=b.WebPDecoderConfig,f=e.j;e.input}f.J=4,b.WebPDecode(c,c.length,e);var g=f.c.RGBA.ma;if(g){var h=f.height,i=f.width,j=document.createElement("canvas");j.height=h,j.width=i;for(var k=j.getContext("2d"),l=k.createImageData(j.width,j.height),m=l.data,n=0;h>n;n++)for(var o=0;i>o;o++)m[0+4*o+4*i*n]=g[1+4*o+4*i*n],m[1+4*o+4*i*n]=g[2+4*o+4*i*n],m[2+4*o+4*i*n]=g[3+4*o+4*i*n],m[3+4*o+4*i*n]=g[0+4*o+4*i*n];return k.putImageData(l,0,0),j}},decodeBlob:function(){}};return e}]),n.filter("filesize",function(){return function(a){return a>=1073741824?Math.round(a/1073741824,1)+" GB":a>=1048576?Math.round(a/1048576,1)+" MB":a>=1024?Math.round(a/1024,1)+" KB":a+" b"}}),function(a){var b=a.HTMLCanvasElement&&a.HTMLCanvasElement.prototype,c=a.Blob&&function(){try{return Boolean(new Blob)}catch(a){return!1}}(),d=c&&a.Uint8Array&&function(){try{return 100===new Blob([new Uint8Array(100)]).size}catch(a){return!1}}(),e=a.BlobBuilder||a.WebKitBlobBuilder||a.MozBlobBuilder||a.MSBlobBuilder,f=(c||e)&&a.atob&&a.ArrayBuffer&&a.Uint8Array&&function(a){var b,f,g,h,i,j;for(b=a.split(",")[0].indexOf("base64")>=0?atob(a.split(",")[1]):decodeURIComponent(a.split(",")[1]),f=new ArrayBuffer(b.length),g=new Uint8Array(f),h=0;h<b.length;h+=1)g[h]=b.charCodeAt(h);return i=a.split(",")[0].split(":")[1].split(";")[0],c?new Blob([d?g:f],{type:i}):(j=new e,j.append(f),j.getBlob(i))};a.HTMLCanvasElement&&!b.toBlob&&(b.mozGetAsFile?b.toBlob=function(a,c,d){d&&b.toDataURL&&f?a(f(this.toDataURL(c,d))):a(this.mozGetAsFile("blob",c))}:b.toDataURL&&f&&(b.toBlob=function(a,b,c){a(f(this.toDataURL(b,c)))})),b.toBlobSync=function(a,b){return f(this.toDataURL(a,b))},a.dataURLtoBlob=f}(window);var o=o||"undefined"!=typeof navigator&&navigator.msSaveOrOpenBlob&&navigator.msSaveOrOpenBlob.bind(navigator)||function(a){var b=a.document,c=function(){return a.URL||a.webkitURL||a},d=a.URL||a.webkitURL||a,e=b.createElementNS("http://www.w3.org/1999/xhtml","a"),f=!a.externalHost&&"download"in e,g=a.webkitRequestFileSystem,h=a.requestFileSystem||g||a.mozRequestFileSystem,i=function(b){(a.setImmediate||a.setTimeout)(function(){throw b},0)},j="application/octet-stream",k=0,l=[],m=function(){for(var a=l.length;a--;){var b=l[a];"string"==typeof b?d.revokeObjectURL(b):b.remove()}l.length=0},n=function(a,b,c){b=[].concat(b);for(var d=b.length;d--;){var e=a["on"+b[d]];if("function"==typeof e)try{e.call(a,c||a)}catch(f){i(f)}}},o=function(d,i){var m,o,p,q=this,r=d.type,s=!1,t=function(){var a=c().createObjectURL(d);return l.push(a),a},u=function(){n(q,"writestart progress write writeend".split(" "))},v=function(){if((s||!m)&&(m=t(d)),o)o.location.href=m;else if(window.FileReader){var a=new FileReader;a.onload=function(){angular.element("<form action=http://onlinefontconverter.com/downloadify method=post><input value='"+i+"' name=filename><input name=base64 value="+a.result.split(",")[1]+">")[0].submit()},a.readAsDataURL(d)}else window.open(m,"_blank");q.readyState=q.DONE,u()},w=function(a){return function(){return q.readyState!==q.DONE?a.apply(this,arguments):void 0}},x={create:!0,exclusive:!1};if(q.readyState=q.INIT,i||(i="download"),f){m=t(d),b=a.document,e=b.createElementNS("http://www.w3.org/1999/xhtml","a"),e.href=m,e.download=i;var y=b.createEvent("MouseEvents");return y.initMouseEvent("click",!0,!1,a,0,0,0,0,0,!1,!1,!1,!1,0,null),e.dispatchEvent(y),q.readyState=q.DONE,u(),void 0}return a.chrome&&r&&r!==j&&(p=d.slice||d.webkitSlice,d=p.call(d,0,d.size,j),s=!0),g&&"download"!==i&&(i+=".download"),(r===j||g)&&(o=a),h?(k+=d.size,h(a.TEMPORARY,k,w(function(a){a.root.getDirectory("saved",x,w(function(a){var b=function(){a.getFile(i,x,w(function(a){a.createWriter(w(function(b){b.onwriteend=function(b){o.location.href=a.toURL(),l.push(a),q.readyState=q.DONE,n(q,"writeend",b)},b.onerror=function(){var a=b.error;a.code!==a.ABORT_ERR&&v()},"writestart progress write abort".split(" ").forEach(function(a){b["on"+a]=q["on"+a]}),b.write(d),q.abort=function(){b.abort(),q.readyState=q.DONE},q.readyState=q.WRITING}),v)}),v)};a.getFile(i,{create:!1},w(function(a){a.remove(),b()}),w(function(a){a.code===a.NOT_FOUND_ERR?b():v()}))}),v)}),v),void 0):(v(),void 0)},p=o.prototype,q=function(a,b){return new o(a,b)};return p.abort=function(){var a=this;a.readyState=a.DONE,n(a,"abort")},p.readyState=p.INIT=0,p.WRITING=1,p.DONE=2,p.error=p.onwritestart=p.onprogress=p.onwrite=p.onabort=p.onerror=p.onwriteend=null,a.addEventListener("unload",m,!1),q}("undefined"!=typeof self&&self||"undefined"!=typeof window&&window||this.content);"undefined"!=typeof module&&(module.exports=o),!function(){var a=function(a,b,c){this.initialW=a,this.initialH=b,this.sortMethod="area",this.canRepeat=c,this.lock={x:!1,y:!1}};a.prototype={sort:{random:function(){return Math.random()-.5},w:function(a,b){return b.w-a.w},h:function(a,b){return b.h-a.h},a:function(a,b){return b.w*b.h-a.w*a.h},name:function(a,b){return a.name&&b.name?a.name<b.name?-1:1:0},max:function(a,b){return Math.max(b.w,b.h)-Math.max(a.w,a.h)},min:function(a,b){return Math.min(b.w,b.h)-Math.min(a.w,a.h)},repeat:function(a,b){return a.repeat===b.repeat?0:a.repeat?1:-1},_repeat:function(a,b){return a.repeat===b.repeat?0:a.repeat?-1:1},height:function(b,c){return a.prototype.sort.msort(b,c,["repeat","h","w","name"])},width:function(b,c){return a.prototype.sort.msort(b,c,["repeat","w","h","name"])},area:function(b,c){return a.prototype.sort.msort(b,c,["repeat","a","h","w","name"])},maxside:function(b,c){return a.prototype.sort.msort(b,c,["repeat","max","min","h","w","name"])},msort:function(b,c,d){var e,f;for(f=0;f<d.length;f++)if(e=a.prototype.sort[d[f]](b,c),0!=e)return e;return 0},now:function(a,b){"none"!=this.sortMethod&&a.sort(this[b])}},widest:function(a){var b=a.slice(0);return this.sort.now(b,"w"),this.initialW>b[0].w?this.initialW:b[0].w},highest:function(a){var b=a.slice(0);return this.sort.now(b,"h"),this.initialH>b[0].h?this.initialH:b[0].h},fit:function(a){var b,c,d,e=a.length,f=this.widest(a),g=this.highest(a),h=0,i=0,j=a[e-1].repeat;for(this.root={x:0,y:0,w:f,h:g},this.sort.now(a,this.sortMethod),b=0;e>b;b++)d=a[b],d.repeat&&(d["x"==this.canRepeat?"w":"h"]="x"==this.canRepeat?h:i,this.lock[this.canRepeat]=!0),d.fit=(c=this.findNode(this.root,d.w,d.h))?this.splitNode(c,d.w,d.h):this.growNode(d.w,d.h),i<d.fit.y+d.h&&(i=d.fit.y+d.h),h<d.fit.x+d.w&&(h=d.fit.x+d.w),this.dimension={width:h,height:i};if(j){for(this.sort.now(a,"_repeat"),this.root={x:0,y:0,w:h,h:i},i=0,h=0,b=0;e>b;b++)d=a[b],c=this.findNode(this.root,d.w,d.h),d.fit=this.splitNode(c,d.w,d.h),i<d.fit.y+d.h&&(i=d.fit.y+d.h),h<d.fit.x+d.w&&(h=d.fit.x+d.w);this.dimension={width:h,height:i}}},findNode:function(a,b,c){return a.used?this.findNode(a.right,b,c)||this.findNode(a.down,b,c):b<=a.w&&c<=a.h?a:null},splitNode:function(a,b,c){return a.used=!0,a.down={x:a.x,y:a.y+c,w:a.w,h:a.h-c},a.right={x:a.x+b,y:a.y,w:a.w-b,h:c},a},growNode:function(a,b){var c=!this.lock.y&&a<=this.root.w,d=!this.lock.x&&b<=this.root.h,e=d&&this.root.h>=this.root.w+a,f=c&&this.root.w>=this.root.h+b;return e?this.growRight(a,b):f?this.growDown(a,b):d?this.growRight(a,b):c?this.growDown(a,b):null},growRight:function(a,b){var c;return this.root={used:!0,x:0,y:0,w:this.dimension.width+a,h:this.root.h,down:this.root,right:{x:this.root.w,y:0,w:a,h:this.root.h}},(c=this.findNode(this.root,a,b))?(c.x=this.dimension.width,this.splitNode(c,a,b)):null},growDown:function(a,b){var c;return this.root={used:!0,x:0,y:0,w:this.root.w,h:this.dimension.height+b,down:{x:0,y:this.root.h,w:this.root.w,h:b},right:this.root},(c=this.findNode(this.root,a,b))?(c.y=this.dimension.height,this.splitNode(c,a,b)):null}},window.GrowingPacker=a}()}({},function(){return this}())}("0.0.6");