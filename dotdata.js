var fs = require('fs');
var path = require('path');

var dotdata = {

	init: function() {
		var path = __dirname + '/.data';
		if (! fs.existsSync(path)) {
			fs.mkdirSync(path, 0o755);
		}
	},

	get: function(name) {
		return new Promise(function(resolve, reject) {
			filename = dotdata.filename(name);
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
		var json = JSON.stringify(data);
		return new Promise(function(resolve, reject) {
			filename = dotdata.filename(name);
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
			});
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
		filename = __dirname + '/.data/' + name + '.json';
		return filename;
	}
};

module.exports = dotdata;
