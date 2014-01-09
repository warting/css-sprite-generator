'use strict';

/* jasmine specs for filters go here */
describe('filter', function() {
	beforeEach(module('wis'));

	describe('filesize', function() {
		it('should return filesize', inject(function(filesizeFilter) {
			expect(filesizeFilter(1000)).toEqual('1000 b');
			expect(filesizeFilter(1024)).toEqual('1 KB');
		}));
	});
});