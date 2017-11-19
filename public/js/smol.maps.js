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
				var place_click = function(e) {
					var $place = $(e.target);
					if (! $place.hasClass('place')) {
						$place = $place.closest('.place');
					}
					$('#config-places .selected').removeClass('selected');
					$place.addClass('selected');
					var bbox = $place.data('bbox');
					var wof_id = $place.data('wof-id');
					$('input[name="default_bbox"]').val(bbox);
					$('input[name="default_wof_id"]').val(wof_id);
				};
				$('#config-places-random').click(place_click);

				var places_show = function(cb) {
					var api_key = $('#config-api-key').val();
					if (api_key == '') {
						$('#config-location').attr('disabled', 'disabled');
						$('#config-location').attr('placeholder', 'Search for a default location (requires API key)');
					} else {
						$('#config-location').attr('disabled', null);
						$('#config-location').attr('placeholder', 'Search for a default location');
					}
					var text = $('#config-location').val();
					if (text == '') {
						$('#config-places-select').html('');
						$('#config-places-random').trigger('click');
					} else {
						$.get('https://search.mapzen.com/v1/autocomplete?' + $.param({
							text: text,
							sources: 'wof',
							api_key: api_key
						})).then(function(rsp) {
							var $select = $('#config-places-select');
							var places = '';
							$.each(rsp.features, function(i, feature) {
								places += '<div class="place" data-bbox="' + feature.bbox.join(',') + '"data-wof-id="' + feature.properties.id + '"><span class="fa fa-check"></span> ' + feature.properties.label + '</div>'
							});
							$select.html(places);
							$('#config-places-select .place').click(place_click);
							if (typeof cb == 'function') {
								cb(rsp);
							}
						});
					}
				};

				$('#config-geolocate').click(function(e) {
					e.preventDefault();
					if ('geolocation' in navigator){
						navigator.geolocation.getCurrentPosition(function(position) {
							var api_key = $('#config-api-key').val();
							if (api_key != '') {
								$.get('https://search.mapzen.com/v1/reverse?' + $.param({
									'point.lat': position.coords.latitude,
									'point.lon': position.coords.longitude,
									layers: 'locality',
									sources: 'wof',
									api_key: api_key
								})).then(function(rsp) {
									$('#config-location').val(rsp.features[0].properties.label);
									places_show(function() {
										$('#config-places-select .place:first-child').trigger('click');
									});
								});
							}
						});
					} else {
						alert('Your browser does not support geolocation.');
					}
				});

				places_show();
				$('#config-location').keypress(function(e) {
					setTimeout(places_show, 0);
				});
				$('#config-api-key').change(places_show);
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
