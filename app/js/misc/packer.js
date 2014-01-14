/******************************************************************************

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
		this.initialW = width;
		this.initialH = height;
		this.sortMethod = "area";
		this.canRepeat = repeat;
		this.lock = {x: false, y: false}
	};




	GrowingPacker.prototype = {

		sort: {

			// Sorthing method
			random  : function (a,b) { return Math.random() - 0.5; },
			w       : function (a,b) { return b.w - a.w; },
			h       : function (a,b) { return b.h - a.h; },
			a       : function (a,b) { return b.w * b.h - a.w * a.h; },
			name    : function (a,b) { return a.name && b.name ? a.name < b.name ? -1 : 1 : 0; },
			max     : function (a,b) { return Math.max(b.w, b.h) - Math.max(a.w, a.h); },
			min     : function (a,b) { return Math.min(b.w, b.h) - Math.min(a.w, a.h); },
			repeat  : function (a,b) { return (a.repeat === b.repeat) ? 0 : a.repeat ? 1 : -1; },
			_repeat : function (a,b) { return (a.repeat === b.repeat) ? 0 : a.repeat ? -1 : 1; },

			// Sorthing choice
			height  : function (a,b) { return GrowingPacker.prototype.sort.msort(a, b, ['repeat', 'h', 'w', 'name']);               },
			width   : function (a,b) { return GrowingPacker.prototype.sort.msort(a, b, ['repeat', 'w', 'h', 'name']);               },
			area    : function (a,b) { return GrowingPacker.prototype.sort.msort(a, b, ['repeat', 'a', 'h', 'w', 'name']);          },
			maxside : function (a,b) { return GrowingPacker.prototype.sort.msort(a, b, ['repeat', 'max', 'min', 'h', 'w', 'name']); },

			// sort by multiple criteria
			msort: function(a, b, criteria) {
				var diff, n;
				for (n = 0 ; n < criteria.length ; n++) {
					diff = GrowingPacker.prototype.sort[criteria[n]](a,b);
					if (diff != 0)
						return diff;
				}
				return 0;
			},

			now: function(blocks, method) {
				if (this.sortMethod != 'none')
					blocks.sort(this[method]);
			}
		},

		widest: function(blocks) {
			var copy = blocks.slice(0);
			this.sort.now(copy, "w");
			return this.initialW > copy[0].w ? this.initialW : copy[0].w
		},

		highest: function(blocks) {
			var copy = blocks.slice(0);
			this.sort.now(copy, "h");
			return this.initialH > copy[0].h ? this.initialH : copy[0].h
		},

		fit: function(blocks) {
			var n, node, block, len = blocks.length;
			var w = this.widest(blocks);
			var h = this.highest(blocks);
			var i = 3;
			var maxW = 0;
			var maxH = 0;

			this.sort.now(blocks, this.sortMethod);

			!blocks[len-1].repeat && i--;

			this.root = { x: 0, y: 0, w: w, h: h };

			while (i--) {

				for (n = 0; n < len ; n++) {
					block = blocks[n];

					if(block.repeat){
						block[this.canRepeat == "x" ? "w":"h"] = this.canRepeat == "x" ? maxW:maxH;
						this.lock[this.canRepeat] = true;
					}

					if (node = this.findNode(this.root, block.w, block.h))
						block.fit = this.splitNode(node, block.w, block.h);

					else
						block.fit = this.growNode(block.w, block.h);

					if (!block.repeat) {
						if(maxH < block.fit.y + block.h){
							maxH = block.fit.y + block.h;
						}
						if(maxW < block.fit.x + block.w){
							maxW = block.fit.x + block.w
						}
					}
				}

				if(i!=1){
					this.dimension = { width: maxW, height: maxH };
					maxW = 0;
					maxH = 0;
				}

				this.root = { x: 0, y: 0, w: this.root.w, h: this.root.h };

				i == 1 && this.sort.now(blocks, "_repeat");
			}



		},

		findNode: function(root, w, h) {
			if (root.used)
				return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
			else if ((w <= root.w) && (h <= root.h))
				return root;
			else
				return null;
		},

		splitNode: function(node, w, h) {
			node.used = true;
			node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
			node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };
			return node;
		},

		growNode: function(w, h) {
			var canGrowDown  = !this.lock.y && (w <= this.root.w);
			var canGrowRight = !this.lock.x && (h <= this.root.h);

			var shouldGrowRight = canGrowRight && (this.root.h >= (this.root.w + w)); // attempt to keep square-ish by growing right when height is much greater than width
			var shouldGrowDown  = canGrowDown  && (this.root.w >= (this.root.h + h)); // attempt to keep square-ish by growing down  when width  is much greater than height

			if (shouldGrowRight)
				return this.growRight(w, h);
			else if (shouldGrowDown)
				return this.growDown(w, h);
			else if (canGrowRight)
				return this.growRight(w, h);
			else if (canGrowDown)
				return this.growDown(w, h);
			else
				return null; // need to ensure sensible root starting size to avoid this happening
		},

		growRight: function(w, h) {
			var node;
			this.root = {
				used: true,
				x: 0,
				y: 0,
				w: this.root.w + w,
				h: this.root.h,
				down: this.root,
				right: { x: this.root.w, y: 0, w: w, h: this.root.h }
			};
			if (node = this.findNode(this.root, w, h))
				return this.splitNode(node, w, h);
			else
				return null;
		},

		growDown: function(w, h) {
			var node;
			this.root = {
				used: true,
				x: 0,
				y: 0,
				w: this.root.w,
				h: this.root.h + h,
				down:  { x: 0, y: this.root.h, w: this.root.w, h: h },
				right: this.root
			};
			if (node = this.findNode(this.root, w, h))
				return this.splitNode(node, w, h);
			else
				return null;
		}

	}

	window.GrowingPacker = GrowingPacker;
}();