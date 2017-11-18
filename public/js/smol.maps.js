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
			var lat = self.config.default_latitude || 0;
			var lng = self.config.default_longitude || 0;
			var zoom = self.config.default_zoom || 14;
			self.map = L.map('map');
			self.map.setView([lat, lng], zoom);
			Tangram.leafletLayer({
				scene: self.tangram_scene()
			}).addTo(self.map);
		},

		setup_menu: function() {

			$('#menu').on('config-setup', function() {
				$('#config-geolocate').click(function(e) {
					e.preventDefault();
					if ('geolocation' in navigator){
						navigator.geolocation.getCurrentPosition(function(position) {
							var lat = position.coords.latitude.toFixed(6);
							var lng = position.coords.longitude.toFixed(6);
							$('#config-latitude').val(lat);
							$('#config-longitude').val(lng);
						});
					} else {
						alert('Your browser does not support geolocation.');
					}
				});
			});

			$('#menu').on('config-show', function() {
				$('#menu-close').addClass('hidden');
			});

			$('#menu').on('config-hide', function() {
				$('#menu').removeClass('no-animation');
				$('#menu-close').removeClass('hidden');
			});

			$('#menu').on('config-submit', function(e, rsp) {
				self.config = rsp.data;
				self.setup_map();
				smol.menu.hide();
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
		}

	};

	$(document).ready(function() {
		self.init();
	});

	return self;
})();
