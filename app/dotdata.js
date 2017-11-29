var fs = require('fs');
var path = require('path');

var dotdata = {

	init: function() {
		var root = path.dirname(__dirname);
		var datadir = root + '/.data';
		if (! fs.existsSync(datadir)) {
			fs.mkdirSync(datadir, 0o755);
		}
	},

	get: function(name) {
		return new Promise(function(resolve, reject) {
			var filename = dotdata.filename(name);
			if (! filename) {
				return reject({
					error: 'Invalid name: ' + name
				});
			}
			fs.readFile(filename, 'utf8', function(err, json) {
				if (err) {
					return reject(err);
				}
				resolve(JSON.parse(json));
			});
		});
	},

	set: function(name, data) {
		var json = JSON.stringify(data, null, 4);
		return new Promise(function(resolve, reject) {
			var filename = dotdata.filename(name);
			if (! filename) {
				return reject({
					error: 'Invalid name: ' + name
				});
			}
			var dir = path.dirname(filename);
			if (! fs.existsSync(dir)) {
				fs.mkdirSync(dir, 0o755);
			}
			fs.writeFile(filename, json, 'utf8', function(err) {
				if (err) {
					return reject(err);
				}
				resolve(data);
				if (! filename.match(/\.index\.json$/)) {
					dotdata.update_index(dir);
				}
			});
		});
	},

	rename: function(from, to) {
		return new Promise(function(resolve, reject) {
			var from_filename = dotdata.filename(from);
			var to_filename = dotdata.filename(to);
			if (! from_filename) {
				return reject({
					error: 'Invalid name: ' + from
				});
			}
			if (! to_filename) {
				return reject({
					error: 'Invalid name: ' + to
				});
			}
			fs.rename(from_filename, to_filename, function(err) {
				if (err) {
					return reject({
						error: 'Could not rename ' + from + '.',
						details: err
					});
				} else {
					dotdata.update_index(path.dirname(to_filename));
					return resolve();
				}
			});
		});
	},

	update_index: function(dir) {
		fs.readdir(dir, function(err, files) {
			var root = path.dirname(__dirname);
			var name = dir.replace(root + '/.data', '')
			              .replace(/\//g, ':') + ':.index';
			if (name.substr(0, 1) == ':') {
				name = name.substr(1);
			}
			var index = {
				data: [],
				dirs: []
			};
			for (var file, i = 0; i < files.length; i++) {
				file = files[i];
				if (file.substr(0, 1) == '.') {
					continue;
				} else if (file.substr(-5, 5) == '.json') {
					index.data.push(file.substr(0, file.length - 5));
				} else {
					index.dirs.push(file);
				}
			}
			dotdata.set(name, index);
		});
	},

	index: function(name) {

		return new Promise(function(resolve, reject) {

			var onsuccess = function(data) {
				resolve(data);
			};

			var onerror = function(err) {
				if (err.code == 'ENOENT') {
					resolve({
						data: [],
						dirs: []
					});
				} else {
					reject(err);
				}
			};

			if (! name) {
				name = '';
			} else {
				name += ':';
			}
			name += '.index';

			dotdata.get(name).then(onsuccess, onerror);

		});
	},

	filename: function(name) {
		if (! name.match(/^[a-z0-9_:.-]+$/i)) {
			return null;
		}
		if (name.indexOf('..') != -1) {
			return null;
		}
		name = name.replace(/:/g, '/');
		var root = path.dirname(__dirname);
		filename = root + '/.data/' + name + '.json';
		return filename;
	}
};

module.exports = dotdata;
