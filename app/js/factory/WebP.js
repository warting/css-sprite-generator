"use strict";

// This is a module for cloud persistance in mongolab - https://mongolab.com
app.factory('WebP', ["$http", "$q", function($http, $q){


	var queue=[];
	var execNext = function() {
		var task = queue[0];
		$http.post('https://warting-webp.p.mashape.com/', task.data, {
			headers: {'X-Mashape-Key':'YT9CrbRFurmsh1wK0vMxAT3OAaipp1Ghp3MjsnPIAPRuXDeIae','Content-Type':undefined},
			responseType: 'dataURL',
			transformRequest: angular.identity
		}).then(function(data) {
			queue.shift();
			task.defer.resolve(data);
			if (queue.length > 0) execNext();
		}, function(err) {
			task.defer.reject(err);
		});
	};

	var WebP = {
		encode64: function(base64) {
			return WebP.encode(window.dataURLtoBlob("data:image/png;base64,"+base64));
		},
		encode: function(blob) {
			var fd = new FormData();
			var config = {
				headers: {'X-Mashape-Key':'YT9CrbRFurmsh1wK0vMxAT3OAaipp1Ghp3MjsnPIAPRuXDeIae','Content-Type':undefined},
				responseType: 'dataURL',
				transformRequest: angular.identity
			};

			fd.append( 'file', blob );
			fd.append( 'quality', '100' );

			var defer = $q.defer();
			queue.push({data: fd, defer:defer});
			if (queue.length===1) execNext();
			return defer.promise;

			// return $http.post('https://warting-webp.p.mashape.com/', fd, config);
		},
		decode64: function(base64){
			return WebP.decodeBinary(atob(base64.split(",")[1]));
		},
		decodeBinary: function(binary){

			///--------- libwebpjs 0.2.0 decoder code start ---------------------------------------------
			var WebPImage = { width:{value:0},height:{value:0} };
			var decoder = new WebPDecoder();

			var data = new Array(binary.length);
			var i = binary.length;
			while(i--) data[i] = binary.charCodeAt(i);

			//Config, you can set all arguments or what you need, nothing no objeect
			var config = decoder.WebPDecoderConfig;
			var output_buffer = config.j;
			var bitstream = config.input;

			output_buffer.J = 4;

			decoder.WebPDecode(data, data.length, config);

			var bitmap = output_buffer.c.RGBA.ma;
			///--------- libwebpjs 0.2.0 decoder code end ---------------------------------------------

			if (bitmap) {
				var biHeight=output_buffer.height;
				var biWidth=output_buffer.width;
				var canvas = document.createElement('canvas');

				canvas.height=biHeight;
				canvas.width=biWidth;

				var context = canvas.getContext('2d');
				var output = context.createImageData(canvas.width, canvas.height);
				var outputData = output.data;

				for (var h=0;h<biHeight;h++) {
					for (var w=0;w<biWidth;w++) {
						outputData[0+w*4+(biWidth*4)*h] = bitmap[1+w*4+(biWidth*4)*h];
						outputData[1+w*4+(biWidth*4)*h] = bitmap[2+w*4+(biWidth*4)*h];
						outputData[2+w*4+(biWidth*4)*h] = bitmap[3+w*4+(biWidth*4)*h];
						outputData[3+w*4+(biWidth*4)*h] = bitmap[0+w*4+(biWidth*4)*h];
					}
				}

				context.putImageData(output, 0, 0);

				return canvas; //.toBlobSync('image/png', 1);
			}
		},
		decodeBlob: function(blob){
			// var base64 = atob(out.output);
		}
	};

	return WebP;
}]);