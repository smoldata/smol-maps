var smol = smol || {};
smol.maps = (function() {

	var self = {

		map: null,
		config: null,

		map_marker_icon: L.divIcon({
			className: 'map-marker'
		}),

		init: function() {
			$.get('/api/dotdata/config').then(function(rsp) {
				if (rsp.ok) {
					self.config = rsp.data;
					self.setup_map();
					smol.menu.config.setup(self.config);
				} else {
					$('#menu').addClass('no-animation');
					smol.menu.show('config');
				}
			});
		},

		setup_map: function() {

			var default_bbox = self.config.default_bbox;
			if (! default_bbox) {
				default_bbox = self.random_megacity_bbox();
			}

			self.map = L.map('map', {
				zoomControl: false
			});
			self.set_bbox(default_bbox);

			if ($(document.body).width() > 640) {
				L.control.zoom({
					position: 'bottomleft'
				}).addTo(self.map);
				$('.leaflet-control-zoom-in').html('<span class="fa fa-plus"></span>');
				$('.leaflet-control-zoom-out').html('<span class="fa fa-minus"></span>');
				$('#map').addClass('has-zoom-controls');
			}

			Tangram.leafletLayer({
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
				click: self.add_venue
			}).addTo(self.map);

			slippymap.crosshairs.init(self.map);
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

		add_venue: function() {
			var venue = {
				coords: self.map.getCenter(),
				color: '#8442D5',
				icon: 'marker-stroked'
			};
			self.add_marker(venue);
			smol.sidebar.add_venue(venue);
		},

		add_marker: function(venue) {
			var marker = new L.marker(venue.coords, {
				icon: self.map_marker_icon,
				draggable: true,
				riseOnHover: true
			});
			marker.addTo(self.map);
			self.update_marker(marker, venue);
			marker.openPopup();
		},

		update_marker: function(marker, venue) {
			marker.venue = venue;
			var data_id = venue.id ? ' data-venue-id="' + venue.id + '"' : '';
			var hsl = smol.color.hex2hsl(venue.color);
			var icon_inverted = (hsl.l < 0.66) ? ' inverted' : '';
			var html = '<div class="icon-bg" style="background-color: ' + venue.color + ';">' +
					'<div class="icon' + icon_inverted + '" style="background-image: url(/img/icons/' + venue.icon + '.svg);"></div></div>';
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
