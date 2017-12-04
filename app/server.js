
// This file started its life as Glitch boilerplate. Time to make a mess.
// First off, tabs not spaces (except to align things). Make it work, then
// make it pretty. Keep it simple and dumb, no magic. (20171116/dphiffer)

var express = require('express');
var body_parser = require('body-parser');
var path = require('path');
var fs = require('fs');
var dotdata = require('./dotdata');
var sequence = require('./sequence');
var url_words = require('./url_words');

var app = express();

dotdata.init();

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
	var root = path.dirname(__dirname);
	response.sendFile(root + '/views/index.html');
});

app.get("/:id", function(request, response) {
	var root = path.dirname(__dirname);
	response.sendFile(root + '/views/index.html');
});

// http://expressjs.com/en/api.html#req.body
app.use(body_parser.json()); // application/json
app.use(body_parser.urlencoded({ extended: true })); // application/x-www-form-urlencoded

// Inspired by Artisinal Integers, this just returns an incrementing integer
app.get("/api/id", function(request, response) {
	response.send({
		ok: 1,
		id: sequence.next()
	});
});

// Load config
app.get("/api/config", function(request, response) {
	var onsuccess = function(data) {
		if (! data.default_slug) {
			data.random_slug = url_words.random();
		}
		response.send({
			ok: 1,
			data: data
		});
	};
	var onerror = function(err) {
		response.send({
			ok: 0,
			error: err,
			data: {}
		});
	};
	dotdata.get("config")
	       .then(onsuccess, onerror);
});

// Save config
app.post("/api/config", function(request, response) {
	var onsuccess = function(data) {
		response.send({
			ok: 1,
			data: data
		});
	};
	var onerror = function(err) {
		response.body({
			ok: 0,
			error: 'Error saving data.',
			data: {}
		}).status(400);
	};
	dotdata.set("config", request.body)
	       .then(onsuccess, onerror);
});

function load_map(slug) {

	return new Promise(function(load_resolve, load_reject) {

		dotdata.get('maps:' + slug).then(function(map) {

			var venues = [];

			var ready = function() {
				load_resolve({
					ok: 1,
					map: map,
					venues: venues
				});
			};

			var get_venue = function(id) {
				return new Promise(function(resolve, reject) {
					var name = "maps:" + map.id + ":" + id;
					dotdata.get(name).then(function(venue) {
						if (venue.active != "0") { // This is a kludge, the value should be 0 not "0"
							venues.push(venue);
						}
						resolve(venue);
					}, function(err) {
						reject(err);
					});
				});
			};

			dotdata.index("maps:" + map.id).then(function(index) {
				var venue_promises = [];
				for (var i = 0; i < index.data.length; i++) {
					venue_promises.push(get_venue(index.data[i]));
				}
				Promise.all(venue_promises).then(ready, load_reject);
			}, load_reject);

		}, load_reject);

	});
}

var save_map = function(request, response) {

	if (request.params.slug) {
		var slug = request.params.slug;
	} else {
		var slug = url_words.random();
	}

	var root = path.dirname(__dirname);
	var filename = root + '/.data/maps/' + slug + '.json';
	fs.stat(filename, function(err, stats) {

		var exists = (! err || err.code != 'ENOENT');
		if (! request.params.slug && exists) {
			// We were trying to pick a random URL slug, but accidentally picked
			// one that already exists! Try again...
			return save_map(request, response);
		}
		var map = request.body;
		if (! map.id) {
			map.id = sequence.next();
		}
		if (! map.slug) {
			map.slug = slug;
		}

		var onerror = function(details) {
			var error = details.error || 'Error saving map.';
			response.send({
				ok: 0,
				error: error
			});
		};

		var respond = function(data) {
			response.send({
				ok: 1,
				map: data.map,
				venues: data.venues
			});
		};

		var onsuccess = function() {
			if (map.slug != slug) {
				// Rename the data to match the new slug...
				var from = 'maps:' + slug;
				var to = 'maps:' + map.slug;
				dotdata.rename(from, to).then(function() {
					load_map(map.slug).then(respond, onerror);
				}, onerror);
			} else {
				load_map(map.slug).then(respond, onerror);
			}
		};

		if (map.slug != slug) {
			var rename_to = dotdata.filename('maps:' + map.slug);
			if (fs.existsSync(rename_to)) {
				return onerror({
					error: "The map '" + map.slug + "' already exists. Please choose another URL slug."
				});
			}
		}

		dotdata.set('maps:' + slug, map).then(onsuccess, onerror);
	});
};

// Create a new map
app.post("/api/map", function(request, response) {
	save_map(request, response);
});

// Update a map
app.post("/api/map/:slug", function(request, response) {
	save_map(request, response);
});

// Load a map
app.get("/api/map/:slug", function(request, response) {

	var onsuccess = function(data) {
		response.send({
			ok: 1,
			map: data.map,
			venues: data.venues
		});
	};

	var onerror = function() {

		// Doesn't exist? Presto, now it does!

		dotdata.get('config').then(function(config) {
			request.body = {
				name: config.default_name || request.params.slug,
				bbox: config.default_bbox
			};
			save_map(request, response);
		});
	};

	load_map(request.params.slug).then(onsuccess, onerror);
});

function hex2rgb(hex) {
	var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return rgb ? [
		parseInt(rgb[1], 16),
		parseInt(rgb[2], 16),
		parseInt(rgb[3], 16)
	] : null;
}

// Load Tangram venues layer (used for print)
app.get("/api/tangram/:slug", function(request, response) {

	var onsuccess = function(data) {

		var yaml =
			"styles:\n" +
			"    _points:\n" +
			"        base: points\n" +
			"        blend: overlay\n" +
			"        blend_order: 3\n" +
			"sources:\n";

		var venue;
		for (var i = 0; i < data.venues.length; i++) {
			venue = data.venues[i];
			yaml += "    _venue_source_" + i + ":\n";
			yaml += "        type: GeoJSON\n";
			yaml += "        url: /api/geojson/" + data.map.id + "/" + venue.id + "\n";
		}

		yaml += "layers:\n";
		var color;
		for (var i = 0; i < data.venues.length; i++) {

			venue = data.venues[i];
			color = hex2rgb(venue.color);
			color = color.join(', ');

			yaml += "    _venue_layer_" + i + ":\n";
			yaml += "        data: { source: _venue_source_" + i + " }\n";
			yaml += "        _dots:\n";
			yaml += "            draw:\n";
			yaml += "                _points:\n";
			yaml += "                    color: rgba(" + color + ", 0.7)\n";
			yaml += "                    size: 12px\n";
			yaml += "                    outline:\n";
			yaml += "                        width: 2px\n";
			yaml += "                        color: \"" + venue.color + "\"\n";
			yaml += "                    text:\n";
			yaml += "                        text_source: name\n";
			yaml += "                        font:\n";
			yaml += "                            family: global.text_font_family\n";
			yaml += "                            weight: bold\n";
			yaml += "                            fill: black\n";
			yaml += "                            size: 10pt\n";
			yaml += "                            stroke:\n";
			yaml += "                                width: 5px\n";
			yaml += "                                color: white\n";
		}

		response.set('Content-Type', 'text/plain');
		response.send(yaml);
	};

	var onerror = function() {
		response.status(500).send('Error loading Tangram venues');
	};

	load_map(request.params.slug).then(onsuccess, onerror);

});

// Load Tangram venues layer (used for print)
app.get("/api/geojson/:map_id/:id", function(request, response) {

	var onsuccess = function(data) {

		var feature = {
			type: 'Feature',
			properties: {
				name: data.name
			},
			geometry: {
				type: 'Point',
				coordinates: [
					parseFloat(data.longitude),
					parseFloat(data.latitude)
				]
			}
		};
		var collection = {
			type: 'FeatureCollection',
			features: [feature]
		}
		response.json(collection);
	};

	var onerror = function() {
		response.status(500).send('Error loading venue GeoJSON');
	};

	var name = "maps:" + request.params.map_id + ":" + request.params.id;
	dotdata.get(name).then(onsuccess, onerror);

});

// Export a map
app.get("/api/export/:slug", function(request, response) {

	var onsuccess = function(data) {
		var features = [],
		    props, props_list, prefix, key, value,
		    lat, lon, bbox, geom;
		for (var i = 0; i < data.venues.length; i++) {
			props_list = [];
			lat = parseFloat(data.venues[i].latitude);
			lon = parseFloat(data.venues[i].longitude);
			for (prop in data.venues[i]) {
				value = data.venues[i][prop];
				if (prop == 'latitude' ||
				    prop == 'longitude') {
					prefix = 'geom';
					value = parseFloat(value);
				} else if (prop == 'name') {
					prefix = 'wof';
				} else if (prop == 'address') {
					prefix = 'addr';
					prop = 'full';
				} else {
					prefix = 'smol';
				}
				key = prefix + ':' + prop;
				props_list.push({
					key: key,
					value: value
				});
			}
			props_list.sort(function(a, b) {
				return (a.key < b.key) ? -1 : 1;
			});
			props = {};
			for (var j = 0; j < props_list.length; j++) {
				key = props_list[j].key;
				value = props_list[j].value;
				props[key] = value;
			}
			bbox = [lon, lat, lon, lat];
			geom = {
				type: "Point",
				coordinates: [lon, lat]
			};
			features.push({
				type: "Feature",
				properties: props,
				bbox: bbox,
				geometry: geom
			});
		}
		var filename = dotdata.filename('maps:' + request.params.slug);
		filename = filename.replace(/\.json$/, '.geojson');
		var geojson = JSON.stringify({
			type: "FeatureCollection",
			features: features,
			smol: data.map
		}, null, 4);
		fs.writeFile(filename, geojson, function(err) {
			if (err) {
				response.status(500).send("Oops, something has gone wrong.");
			} else {
				response.download(filename);
			}
		});
	};

	var onerror = function() {
		response.status(500).send("Oops, something has gone wrong!");
	};

	load_map(request.params.slug).then(onsuccess, onerror);
});

// Save a venue
app.post("/api/venue", function(request, response) {
	var onsuccess = function(data) {
		response.send({
			ok: 1,
			data: data
		});
	};
	var onerror = function(err) {
		response.body({
			ok: 0,
			error: 'Error saving data.',
			details: err,
			data: {}
		}).status(400);
	};
	var data = request.body;
	dotdata.set("maps:" + data.map_id + ":" + data.id, data)
	       .then(onsuccess, onerror);
});

// List the available icons
app.get("/api/icons", function(request, response) {
	var icons_dir = path.dirname(__dirname) + '/public/img/icons';
	fs.readdir(icons_dir, function(err, files) {
		var icons = [];
		var icon;
		for (var i = 0; i < files.length; i++) {
			icon = files[i].match(/(.+)\.svg/);
			if (icon) {
				icons.push(icon[1]);
			}
		}
		icons.sort();
		response.json({
			ok: 1,
			icons: icons
		});
	});
});

// listen for requests :)
var port = process.env.PORT || 4321;
var listener = app.listen(port, function() {
	console.log('Your app is listening on port ' + listener.address().port);
});
