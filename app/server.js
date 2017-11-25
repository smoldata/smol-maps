
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

app.get("/api/config", function(request, response) {
	var onsuccess = function(data) {
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
			details: err,
			data: {}
		}).status(400);
	};
	dotdata.set("config", request.body)
	       .then(onsuccess, onerror);
});

var save_map = function(request, response) {
	if (request.params.slug) {
		var slug = request.params.slug;
	} else {
		var slug = url_words.random();
	}
	var root = path.dirname(__dirname);
	var filename = root + '/.data/maps/' + slug + '.json';
	fs.stat(filename, function(err, stats) {
		if (! request.params.slug &&
			(! err || err.code != 'ENOENT')) {
			// We were trying to pick a random URL slug, but accidentally picked
			// one that already exists!
			return save_map(request, response);
		}
		var map = request.body;
		map.id = sequence.next();
		map.slug = slug;
		dotdata.set('maps:' + slug, map);
		var dir = root + '/.data/maps/' + map.id;
		fs.mkdir(dir, 0o755, function() {
			response.send({
				ok: 1,
				map: map,
				venues: []
			});
		});
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

	dotdata.get('maps:' + request.params.slug).then(function(map) {

		var venues = [];
		var onsuccess = function() {
			response.send({
				ok: 1,
				map: map,
				venues: venues
			});
		};

		var get_venue = function(id) {
			return new Promise(function(resolve, reject) {
				dotdata.get("maps:" + map.id + ":" + id).then(function(venue) {
					venues.push(venue);
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
			Promise.all(venue_promises).then(onsuccess);
		});

	});
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

// listen for requests :)
var port = process.env.PORT || 4321;
var listener = app.listen(port, function() {
	console.log('Your app is listening on port ' + listener.address().port);
});
