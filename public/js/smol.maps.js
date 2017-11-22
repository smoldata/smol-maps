var smol = smol || {};
smol.maps = (function() {

	var self = {

		map: null,
		config: null,

		init: function() {
			self.setup_sidebar();
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
				$('#map').toggleClass('show-sidebar');
				self.map.invalidateSize(false);
			});

			L.control.locate({
				position: 'bottomleft'
			}).addTo(self.map);
		},

		setup_sidebar: function() {
			$('#sidebar-config').click(function() {
				smol.menu.show('config');
			});
			$('#sidebar-close').click(function() {
				$('#map').removeClass('show-sidebar');
				self.map.invalidateSize(false);
			});
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
		}

	};

	$(document).ready(function() {
		self.init();
	});

	return self;
})();
