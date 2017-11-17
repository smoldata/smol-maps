var fs = require('fs');

module.exports = {

	init: function() {
		var path = __dirname + '/.data';
		if (! fs.existsSync(path)) {
			fs.mkdirSync(path, 0o755);
		}
	},

	get: function(name) {
		return new Promise(function(resolve, reject) {
			var path = __dirname + '/.data/' + name + '.json';
			fs.readFile(path, 'utf8', function(err, json) {
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
			var path = __dirname + '/.data/' + name + '.json';
			fs.writeFile(path, json, 'utf8', function(err) {
				if (err) {
					return reject(err);
				}
				resolve(data);
			});
		});
	}
};
