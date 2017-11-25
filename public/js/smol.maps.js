var smol = smol || {};
smol.maps = (function() {

	var self = {

		map: null,
		config: null,
		data: null,

		map_marker_icon: L.divIcon({
			className: 'map-marker'
		}),

		init: function() {
			$.get('/api/config').then(function(rsp) {
				if (rsp.ok) {
					self.config = rsp.data;
					smol.menu.config.setup(self.config);
					self.setup_map();
				} else {
					$('#menu').addClass('no-animation');
					smol.menu.show('config');
				}
			});
		},

		setup_map: function() {

			if (! self.data) {
				return self.setup_data();
			}

			self.map = L.map('map', {
				zoomControl: false
			});

			var bbox = self.data.map.bbox;
			if (! bbox) {
				bbox = self.random_megacity_bbox();
			}
			self.set_bbox(bbox);

			if ($(document.body).width() > 640) {
				L.control.zoom({
					position: 'bottomleft'
				}).addTo(self.map);
				$('.leaflet-control-zoom-in').html('<span class="fa fa-plus"></span>');
				$('.leaflet-control-zoom-out').html('<span class="fa fa-minus"></span>');
				$('#map').addClass('has-zoom-controls');
			}

			self.tangram = Tangram.leafletLayer({
				scene: self.tangram_scene()
			}).addTo(self.map);

			L.control.geocoder(self.config.mapzen_api_key, {
				expanded: true,
				attribution: '<a href="https://mapzen.com/" target="_blank">Mapzen</a> | <a href="https://openstreetmap.org/">OSM</a>'
			}).addTo(self.map);
			$('.leaflet-pelias-search-icon').html('<span class="fa fa-bars"></span>');

			$('.leaflet-pelias-search-icon').click(function(e) {
				e.preventDefault();
				smol.sidebar.toggle();
			});

			L.control.locate({
				position: 'bottomleft'
			}).addTo(self.map);

			new L.Hash(self.map);

			L.control.addVenue({
				position: 'bottomright',
				click: function() {
					self.create_venue(function(marker) {
						marker.openPopup();
					});
				}
			}).addTo(self.map);

			slippymap.crosshairs.init(self.map);

			self.tangram.scene.subscribe({
				view_complete: function () {
					for (var i = 0; i < self.data.venues.length; i++) {
						self.add_marker(self.data.venues[i]);
					}
				}
			});

		},

		setup_data: function() {
			var path = location.pathname.match(/^\/([a-z0-9-]+)\/?$/);
			if (location.pathname == '/') {
				self.create_map();
			} else if (path) {
				self.load_map(path);
			}
		},

		tangram_scene: function() {
			return {
				global: {
					sdk_mapzen_api_key: self.config.mapzen_api_key
				},
				import: [
					"/scene/refill-style/refill-style.yaml"
				]
			};
		},

		random_megacity_bbox: function() {
			var index = Math.floor(Math.random() * wof.megacities.length);
			var place = wof.megacities[index];
			self.config.default_bbox = place['geom:bbox'];
			self.config.default_wof_id = place['wof:id'];
			return place['geom:bbox'];
		},

		set_bbox(bbox) {
			var coords = bbox.split(',');
			self.map.fitBounds([
				[coords[1], coords[0]],
				[coords[3], coords[2]]
			]);
		},

		create_map: function() {
			var map = {
				name: 'Untitled map',
				bbox: self.config.default_bbox
			};
			$.post('/api/map', map).then(function(data) {
				self.data = data;
				history.pushState(data.map, 'Untitled map', '/' + data.map.slug);
				self.setup_map();
			});
		},

		load_map: function(path) {
			$.get('/api/map/' + path[1], function(data) {
				self.data = data;
				self.setup_map();
			});
		},

		create_venue: function(cb) {
			$.get('/api/id', function(rsp) {
				var center = self.map.getCenter();
				var venue = {
					id: rsp.id,
					map_id: self.data.map.id,
					latitude: center.lat,
					longitude: center.lng,
					color: '#8442D5',
					icon: 'marker-stroked'
				};
				var marker = self.add_marker(venue);
				$.post('/api/venue', venue);
				if (typeof cb == 'function') {
					cb(marker);
				}
			});
		},

		add_marker: function(venue) {
			var coords = [venue.latitude, venue.longitude];
			var marker = new L.marker(coords, {
				icon: self.map_marker_icon,
				draggable: true,
				riseOnHover: true
			});
			marker.addTo(self.map);
			self.update_marker(marker, venue);
			smol.sidebar.add_venue(venue);

			marker.on('moveend', function() {
				var ll = marker.getLatLng();
				venue.latitude = ll.lat;
				venue.longitude = ll.lng;
				$.post('/api/venue', venue);
			});

			return marker;
		},

		update_marker: function(marker, venue) {
			marker.venue = venue;
			var data_id = venue.id ? ' data-venue-id="' + venue.id + '"' : '';
			var hsl = smol.color.hex2hsl(venue.color);
			var icon_inverted = (hsl.l < 0.66) ? ' inverted' : '';
			var name = venue.name;
			if (! name) {
				var lat = parseFloat(venue.latitude).toFixed(6);
				var lng = parseFloat(venue.longitude).toFixed(6);
				name = lat + ', ' + lng;
			}
			var html = '<div class="icon-bg" style="background-color: ' + venue.color + ';">' +
					'<div class="icon' + icon_inverted + '" style="background-image: url(/img/icons/' + venue.icon + '.svg);"></div></div>' +
					'<div class="name"><span class="inner">' + name + '</span></div>' +
					'<br class="clear">';
			marker.bindPopup(html);
			var rgb = smol.color.hex2rgb(venue.color);
			if (rgb && marker._icon) {
				var rgba = [rgb.r, rgb.g, rgb.b, 0.7];
				rgba = 'rgba(' + rgba.join(',') + ')';
				marker._icon.style.backgroundColor = rgba;
			}
		}
	};

	$(document).ready(function() {
		self.init();
	});

	return self;
})();
