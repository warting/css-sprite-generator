"use strict";
var path = require("path");


module.exports = function (grunt) {

	var pkgVersion = grunt.file.readJSON('package.json').version;
	var encloseObj = {};
	encloseObj['"'+pkgVersion+'"'] = "version";
	/*
		Grunt installation:
		-------------------
			npm install -g grunt-cli
			npm install -g grunt-init
			npm init (creates a `package.json` file)

		Project Dependencies:
		---------------------
			npm install grunt --save-dev
			npm install grunt-csso --save-dev
			npm install grunt-contrib-watch --save-dev
			npm install grunt-contrib-jshint --save-dev
			npm install grunt-contrib-uglify --save-dev
			npm install grunt-contrib-sass --save-dev
			npm install grunt-contrib-imagemin --save-dev
			npm install grunt-contrib-htmlmin --save-dev
			npm install grunt-contrib-connect --save-dev
			npm install grunt-contrib-jasmine --save-dev
			npm install grunt-template-jasmine-requirejs --save-dev
			npm install grunt-template-jasmine-istanbul --save-dev
			npm install load-grunt-tasks --save-dev
			npm install time-grunt --save-dev

		Simple Dependency Install:
		--------------------------
			npm install (from the same root directory as the `package.json` file)

		Gem Dependencies:
		-----------------
			gem install image_optim
	*/

	// Displays the elapsed execution time of grunt tasks
	require('time-grunt')(grunt);

	// Load NPM Tasks
	require('load-grunt-tasks')(grunt, ['grunt-*', '!grunt-template-jasmine-istanbul', '!grunt-template-jasmine-requirejs']);

	// Project configuration.
	grunt.initConfig({

		// Store your Package file so you can reference its specific data whenever necessary
		pkg: grunt.file.readJSON('package.json'),

		// Scripts
		uglify: {
			embed: {
				src: "app/embed/livereload-sprite.js",
				dest: 'release/embed/livereload-sprite.js',
				options: {
					compress: {
						global_defs: {
							"DEBUG": false
						},
						dead_code: true
					},
					screwIe8: true,
					exportAll: false
				}
			},
			dev: {
				src: ['app/js/bootstrap.js', 'app/js/**/*.js', '!app/js/lib/**/*.*'],
				dest: 'release/<%= pkg.version %>/js/bootstrap-min.js',
				options: {
					preserveComments: true,
					enclose: encloseObj,
					beautify: true,
					screwIe8: true,
					exportAll: false,
					lint: true,
					mangle: false,
					reserved: true,
					sourceMap: 'release/<%= pkg.version %>/js/bootstrap-min.js.map',
					sourceMappingURL: "bootstrap-min.js.map",
					sourceMapPrefix: 2,
					compress: {
						global_defs: {
							"DEBUG": true
						},
						dead_code: true
					}
				}
			},
			prod: {
				src: ['app/js/bootstrap.js', 'app/js/**/*.js', '!app/js/lib/**/*.*'],
				dest: 'release/<%= pkg.version %>/js/bootstrap-min.js',
				options: {
					compress: {
						global_defs: {
							"DEBUG": false
						},
						dead_code: true
					},
					enclose: encloseObj,
					screwIe8: true,
					wrap: "app",
					exportAll: false
				}
			}
		},

		express: {
			custom: {
				options: {
					port: 9005,
					bases: 'release',
					livereload: false,
					debug: true,
					middleware: function(req, res, next) {
						var fs = (require("fs"));
						var path = req._parsedUrl.pathname;

						if (path.split("/").pop().indexOf('.') === -1) {
							var file = __dirname + "/release" + path + '.html';
							// console.log(file);
							fs.exists(file, function(exists) {
								if (exists){
									res.end(grunt.file.read(file));
									return;
								}
								next();
							});
						}
						else
							next();
					},
				}
			}
		},


		karma: {
			unit: {
				configFile: 'karma.conf.js'
			}
		},

		jshint: {
			/*
				Note:
				In case there is a /release/ directory found, we don't want to lint that
				so we use the ! (bang) operator to ignore the specified directory
			*/
			files: ['Gruntfile.js', 'app/js/**/*.js', '!app/js/lib/**', 'test/js/**/*.js'],
			options: {
				curly:        false,
				eqeqeq:       false,
				supernew:     true,
				expr:         true,
				boss:         true,
				browser:      true,
				globalstrict: true,
				lastsemic:    true,

				globals: {
					// Environments
					console:       true,
					require:       true,

					// General Purpose Libraries
					angular:       true,
					app:           true,
					ga:            true,
					win:           true,
					doc:           true,
					fabric:        true,
					body:          true,
					docElm:        true,
					WebPDecoder:   true,
					type:          true,
					query:         true,
					JSZip:         true,
					_canvas:       true,
					saveAs:        true,
					arrayRemove:   true,
					arrayFrom:     true,
					dataURLtoBlob: true,

					// Testing
					inject:        true,
					module:        true,
					sinon:         true,
					describe:      true,
					it:            true,
					expect:        true,
					beforeEach:    true,
					afterEach:     true
				}
			}
		},

		ejs: {
			options: {
				version: '<%= pkg.version %>',
				url: 'http://localhost:<%= express.custom.options.port %>',
			},
			root: {
				files: [
					{cwd: 'app', expand: true, src: ['*.html'], dest: './release/'},
					{cwd: 'app', expand: true, src: ['views/*.html'], dest: './release/<%= pkg.version %>/'}
				]
			}
		},

		csso: {
			compress: {
				options: { report: 'gzip' },
				files: [
					{
						expand: true,
						cwd: './release',
						src: ['**/*.css','*.css'],
						dest: 'release'
					}
				]

			},
		},

		autoprefixer:{
			single_file: {
				src: 'app/css/default.css',
				dest: 'release/<%= pkg.version %>/css/default.css'
			},
		},

		// `optimizationLevel` is only applied to PNG files (not JPG)
		imagemin: {
			png: {
				options: { optimizationLevel: 7 },
				files: [
					{
						expand: true,
						cwd: './app/img/',
						src: ['*.png'],
						dest: 'release/<%= pkg.version %>/img/',
						ext: '.png'
					}
				]
			},
			jpg: {
				options: { progressive: true },
				files: [
					{
						expand: true,
						cwd: './app/img/',
						src: ['*.jpg'],
						dest: 'release/<%= pkg.version %>/img/',
						ext: '.jpg'
					}
				]
			}
		},

		htmlmin: {
			asset: {
				files: [
					{
						expand: true,
						cwd: './release',
						src: ['**/*.html','*.html'],
						dest: 'release'
					}
				]
			},
			options: {
				removeComments: true,
				removeCommentsFromCDATA: true,
				removeCDATASectionsFromCDATA: true,
				collapseWhitespace: true,
				collapseBooleanAttributes: true,
				removeAttributeQuotes: true,
				removeRedundantAttributes: true,
				useShortDoctype: true,
				removeEmptyAttributes: true,
				removeEmptyElements: false,
				removeOptionalTags: true,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true
			}
		},

		copy: {
			main: {
				files: [
					{
						expand: true,
						cwd: "app/js/lib/",
						src: ["libwebp-0.2.0.min.js", "fabric.min.js", "jszip.js"],
						dest: 'release/<%= pkg.version %>/js/lib/'
					}
				]
			},
			cname: {
				files: [
					{
						src: ["app/CNAME"],
						dest: 'release/CNAME'
					}
				]
			}
		},

		clean: {
			css: ["app/css/default.prefixed.css"],
			release: ["release"]
		},

		// Run: `grunt watch` from command line for this section to take effect
		watch: {
			javascript: {
				files: ['app/embed/livereload-sprite.js', 'app/js/bootstrap.js', 'app/js/**/*.js', '!app/js/lib/**/*.*'],
				tasks: ['uglify:dev', 'uglify:embed'],
				options: { livereload: true }
			},
			image: {
				files: ['<%= imagemin.png.files[0].src %>'],
				tasks: ['newer:imagemin'],
				options: { livereload: true }
			},
			css: {
				files: ['app/css/default.css'],
				tasks: ['autoprefixer'],
				options: { livereload: true }
			},
			html: {
				files: ['app/*.html', 'app/views/*.html', 'app/views/demo/*'],
				tasks: ['newer:ejs:root'],
				options: { livereload: true }
			}
		}

	});

	// Default Task
	grunt.registerTask('default', ['jshint', 'connect']);

	// Unit Testing Task
	grunt.registerTask('test', ['karma']);

	// Release Task
	grunt.registerTask('release', ['jshint', 'test', 'imagemin', 'htmlmin']);


	// Release Task
	grunt.registerTask('build', ['clean:release', 'copy', 'ejs', 'uglify:embed', 'uglify:prod', 'imagemin', 'autoprefixer', 'csso', 'htmlmin']);


	/*
		Notes:

		When registering a new Task we can also pass in any other registered Tasks.
		e.g. grunt.registerTask('release', 'default requirejs'); // when running this task we also run the 'default' Task

		We don't do this above as we would end up running `sass:dev` when we only want to run `sass:dist`
		We could do it and `sass:dist` would run afterwards, but that means we're compiling sass twice which (although in our example quick) is extra compiling time.

		To run specific sub tasks then use a colon, like so...
		grunt sass:dev
		grunt sass:dist
	*/

};