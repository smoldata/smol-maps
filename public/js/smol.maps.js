var smol = smol || {};
smol.maps = (function() {

	var self = {

		map: null,
		config: null,

		init: function() {
			$.get('/api/dotdata/config').then(function(rsp) {
				if (rsp.ok) {
					self.config = rsp.data;
					self.setup_map();
				} else {
					smol.menu.show('config');
				}
			});
		},

		setup_map: function() {
			self.map = L.map('map');
			self.map.setView([42.753356, -73.681473], 16);
			Tangram.leafletLayer({
				scene: self.tangram_scene()
			}).addTo(self.map);
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
		}

	};

	$(document).ready(function() {
		self.init();
	});

	return self;
})();
