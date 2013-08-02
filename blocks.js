(function () {
	"use strict";
	/*global window*/
	/*global $*/
	/*jslint nomen: true*/
	/*global _*/

	var Block, // Block object constructor
		fadeout_dead = 300,
		fadeout_changed = 100,
		lock = false,
		colors,
		collapse,
		drawAll,
		updateScore,
		init;

	Block = function (args) {
		var that = this;

		that.color = args.color || colors[_.random(colors.length - 1)];
		that.dead = args.dead || false;

		that.element = args.element; // jQuery element
		that.changed = 'changed';

		_.each(['north', 'south', 'east', 'west'], function (direction) {
			that[direction] = args[direction];
		});

		if (that.north) { that.north.south = that; }
		if (that.south) { that.south.north = that; }
		if (that.west) { that.west.east = that; }
		if (that.east) { that.east.west = that; }

		that.visited = false;
	};

	Block.prototype.match = function (block) {
		return !this.dead && !block.dead && this.color === block.color;
	};

	Block.prototype.click = function () {
		var that = this,
			can_collapse;

		can_collapse = _.any([that.north, that.south, that.east, that.west], function (neighbor) {
			return neighbor && that.match(neighbor);
		});

		if (can_collapse) {
			that.allSameColoredNeighbors(function (neighbor) {
				neighbor.dead = true;
				neighbor.changed = 'died';
			});
		}

		return can_collapse;
	};

	Block.prototype.allSameColoredNeighbors = function (callback) {
		var that = this,
			ret = [that],
			neighbors;

		if (that.dead) {
			return [];
		}

		that.visited = true;

		neighbors = _.filter([that.north, that.south, that.east, that.west], function (n) {
			return n && !n.visited && that.match(n);
		});
		_.each(neighbors, function (neighbor) {
			ret.push.apply(ret, neighbor.allSameColoredNeighbors(callback));
		});

		that.visited = false;

		if (callback) {
			callback(that);
		}

		return ret;
	};

	Block.prototype.forAll = function (direction, callback) {
		var that = this,
			block = that;

		while (block) {
			callback.apply(block, [block]);
			block = block[direction];
		}
		return that;
	};

	Block.prototype.forAllFromTo = function (direction, block, callback) {
		var that = this,
			from = that,
			to = block;

		while (from && to) {
			callback.apply(from, [from, to]);
			from = from[direction];
			to = to[direction];
		}
		return that;
	};

	Block.prototype.collapseColumn = function () {
		var that = this,
			alives = [],
			anychanged = false;

		if (that.south) {
			return that.south.collapseColumn();
		}

		that.forAll('north', function (block) {
			if (!block.dead) {
				alives.push(block);
			} else if (block.changed) {
				anychanged = true;
			}
		});

		if (anychanged) {
			that.forAll('north', function (block) {
				if (alives.length > 0) {
					block.color = alives.shift().color;
					block.dead = false;
				} else {
					block.dead = true;
				}
				block.changed = block.changed || 'changed';
			});
		}

		return anychanged;
	};

	Block.prototype.collapseRow = function () {
		var that = this,
			alives = [],
			anychanged = false;

		if (that.south) {
			return that.south.collapseRow();
		}

		that.forAll('east', function (block) {
			if (!block.dead) {
				alives.push(block);
			} else {
				anychanged = true;
			}
		});

		if (anychanged) {
			that.forAll('east', function (block) {
				if (alives.length > 0) {
					alives.shift().forAllFromTo('north', block, function (from, to) {
						to.color = from.color;
						to.dead = from.dead;
						to.changed = to.changed || 'changed';
					});
				} else {
					block.forAll('north', function (block) {
						block.dead = true;
						block.changed = block.changed || 'changed';
					});
				}
			});
		}

		return anychanged;
	};

	Block.prototype.draw = function (args) {
		var that = this,
			transition = args.transition,
			always = args.always,
			duration = args.duration,
			color;

		if (transition === 'died') {
			that.element.animate({ backgroundColor: 'black' }, { always: always, duration: duration });
			that.changed = 'changed';
		} else if (transition === 'changed') {
			color = that.dead ? 'black' : that.color;
			that.element.animate({ backgroundColor: color }, {always: always, duration: duration });
			that.changed = false;
		}

		return that;
	};

	Block.prototype.quickDraw = function (args) {
		var that = this,
			color;

		if (that.changed === 'changed') {
			color = that.dead ? 'black' : that.color;
			that.element.css('background-color', color);
			that.changed = false;
		}

		return that;
	};

	Block.build = function (args) {
		var width = args.width,
			height = args.height,
			container = args.container,
			table = $('<table>'),
			rows = [];

		if (height > 100) { height = 100; }
		if (width > 100) { width = 100; }
		if (height < 1) { height = 1; }
		if (width < 1) { width = 1; }
		if (isNaN(height)) { height = 1; }
		if (isNaN(width)) { width = 1; }

		_.times(height, function (ii) {
			var tr = $('<tr>'),
				row = [];
			_.times(width, function (jj) {
				var td = $('<td>'),
					block;
				block = new Block({
					element: td,
					north: rows[ii - 1] ? rows[ii - 1][jj] : undefined,
					west: row[jj - 1]
				});
				tr.append(td);
				row.push(block);
			});
			table.append(tr);
			rows.push(row);
		});
		container.append(table);
		return rows;
	};

	collapse = function (rows) {
		_.each(rows[rows.length - 1], function (block) {
			block.collapseColumn();
		});
		rows[rows.length - 1][0].collapseRow();
		return rows;
	};

	drawAll = function (rows, fadeout_changed, fadeout_original) {
		var died = [], died_func, died_count = 0,
			all_changed = [], all_changed_func, all_changed_count = 0,
			dead = [];

		_.each(rows, function (row) {
			_.each(row, function (block) {
				if (block.dead) {
					dead.push(block);
				}
				if (block.changed === 'died') {
					died.push(block);
				}
				if (block.changed) {
					all_changed.push(block);
				}
			});
		});

		if (died.length === 0) {
			_.each(all_changed, function (block) {
				block.quickDraw();
			});
		}

		died_func = function () {
			died_count += 1;
			if (died_count === died.length) {
				_.each(all_changed, function (block) {
					block.draw({ transition: 'changed', duration: fadeout_changed, always: all_changed_func });
				});
			}
		};

		all_changed_func = function () {
			all_changed_count += 1;
			if (all_changed_count === all_changed.length) {
				lock = false;
			}
		};

		_.each(died, function (block) {
			block.draw({ transition: 'died', duration: fadeout_original, always: died_func });
		});

		updateScore({ deadcount: dead.length, height: rows.length, width: rows[0].length });

	};

	updateScore = function (args) {
		var deadcount = args.deadcount,
			height = args.height,
			width = args.width;

		$('#score').text(String(((deadcount * deadcount / (height * width)) * colors.length * 100).toFixed()));
	};

	init = function () {
		var height = Number($("#height").val()),
			width = Number($("#width").val()),
			container = $("#block_game"),
			rows;

		if (lock) {
			return;
		}
		lock = true;
		colors = _.map($('#colors :checked'), function (n) { return $(n).val(); });
		colors = colors.length <= 0 ? ['#FF00FF'] : colors;
		container.empty();
		rows = Block.build({ width: width, height: height, container: container });
		_.each(rows, function (row) {
			_.each(row, function (block) {
				block.element.click(function () {
					if (lock) {
						return;
					}
					lock = true;

					if (block.click()) {
						collapse(rows);
						drawAll(rows, fadeout_dead, fadeout_changed);
					} else {
						lock = false;
					}
				});
			});
		});
		drawAll(rows, fadeout_dead, fadeout_changed);
		lock = false;
	};

	$(window.document).ready(function () {
		init();
		$('#restart').click(init);
	});

}());
