var smol = smol || {};
smol.maps = (function() {

	var self = {

		map: null,
		config: null,

		init: function() {
			self.setup_menu();
			$.get('/api/dotdata/config').then(function(rsp) {
				if (rsp.ok) {
					self.config = rsp.data;
					self.setup_map();
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
			var coords = default_bbox.split(',');
			var bbox = [
				[coords[1], coords[0]],
				[coords[3], coords[2]]
			];

			self.map = L.map('map');
			self.map.fitBounds(bbox);
			Tangram.leafletLayer({
				scene: self.tangram_scene()
			}).addTo(self.map);
		},

		setup_menu: function() {

			$('#menu').on('config-submit', function(e, rsp) {
				self.config = rsp.data;
				self.setup_map();
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
		}

	};

	$(document).ready(function() {
		self.init();
	});

	return self;
})();
