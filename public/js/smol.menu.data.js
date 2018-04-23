var smol = smol || {};
smol.menu = smol.menu || {};

smol.menu.data = (function() {

	var self = {

		init: function() {

			$('#data-import').change(function(e) {
				var file = $('#data-import')[0].files[0];
				if (! file.name.match(/\.geojson$/i)) {
					self.import_status('Sorry, you can only upload .geojson files.');
					return;
				}
				self.import(file);
			});

			$('#data-export-geojson').click(function() {
				smol.menu.hide();
			});
		},

		show: function() {
			var map = smol.maps.data.map;
			$('#data-export-geojson').attr('href', '/api/export/' + map.slug);
		},

		import: function(file) {

			self.import_status('Importing GeoJSON...');

			var reader = new FileReader();
			reader.onload = function(e) {

				if (! e.target ||
				    ! e.target.result) {
					self.import_status('Error loading GeoJSON.')
					return;
				}

				try {
					var collection = JSON.parse(e.target.result);
				} catch(e) {
					self.import_status('Error parsing GeoJSON.')
					return;
				}

				if (collection.type != 'FeatureCollection' ||
				    ! "smol" in collection) {
					self.import_status('Sorry, we are currently unable to import this kind of GeoJSON file.');
					return;
				}

				self.import_map(collection.smol);
				for (var i = 0; i < collection.features.length; i++) {
					self.import_feature(collection.features[i]);
				}

				self.import_status('');
				smol.menu.hide();
			};
			reader.readAsText(file);
		},

		import_status: function(status) {
			$('#data-import-status').html(status);
		},

		import_map: function(map) {
			delete map.id;
			delete map.slug;
			map = L.extend(smol.maps.data.map, map);
			smol.maps.update_map(map);
		},

		import_feature: function(feature) {
			var venue = self.feature_to_venue(feature);
			venue.map_id = smol.maps.data.map.id;
			if (! venue) {
				return;
			}
			if ('id' in venue) {
				if (venue.id in smol.maps.markers) {
					for (var i = 0; i < smol.maps.data.venues.length; i++) {
						if (smol.maps.data.venues[i].id == venue.id) {
							venue = L.extend(smol.maps.data.venues[i], venue);
							smol.maps.data.venues[i] = venue;
						}
					}
					smol.sidebar.update_venue(venue);
					smol.maps.update_marker(venue);
					$.post('/api/venue', venue);
					return;
				}
			}
			delete venue.id;
			smol.maps.create_venue(null, venue);
		},

		feature_to_venue: function(feature) {

			if (feature.geometry.type != 'Point') {
				return null;
			}

			var venue = {
				latitude: feature.geometry.coordinates[1],
				longitude: feature.geometry.coordinates[0]
			};

			for (var prop in feature.properties) {
				if (prop == 'geom:latitude' || prop == 'geom:longitude') {
					// Use geometry lat/lng
					continue;
				} else if (prop == 'wof:name') {
					venue.name = feature.properties['wof:name'];
				} else if (prop == 'addr:full') {
					venue.address = feature.properties['addr:full'];
				} else if (prop.match(/^\w+:/)) {
					var key = prop.match(/^\w+:(.+)/)[1];
					venue[key] = feature.properties[prop];
				} else {
					venue[prop] = feature.properties[prop];
				}
			}

			return venue;
		}

	};

	return self;
})();
