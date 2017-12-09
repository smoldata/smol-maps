var smol = smol || {};
smol.menu = smol.menu || {};

smol.menu.config = (function() {

	var valid_api_key = null;

	var self = {

		init: function() {
			$('#config-places-random').click(self.place_click);
			$('#config-geolocate').click(function(e) {
				e.preventDefault();
				self.geolocate();
			});
			self.places_show(function() {
				$('#config-places-select .place:first-child').trigger('click');
			});
			$('#config-location').focus(function(e) {
				if (e && e.target) {
					$(e.target).addClass('is-focused');
				}
			});
			$('#config-location').blur(function(e) {
				if (e && e.target) {
					$(e.target).removeClass('is-focused');
				}
			});
			$('#config-location').keypress(function(e) {
				if (! $('#config-location').hasClass('is-focused')) {
					return;
				}
				setTimeout(self.places_show, 0);
			});
			$('#config-api-key').change(function() {
				valid_api_key = -1; // -1 is a signal that we're checking
				var api_key = $('#config-api-key').val();
				api_key = api_key.trim();
				self.validate_api_key(api_key, function(rsp) {
					if (rsp.stat == 'ok') {
						valid_api_key = true;
					} else {
						valid_api_key = false;
					}
				}, function(rsp) {
					valid_api_key = false;
				});
			});
		},

		setup: function(config) {

			$('#config-api-key').val(config.mapzen_api_key);
			$('input[name="default_bbox"]').val(config.default_bbox);
			$('input[name="default_wof_id"]').val(config.default_wof_id);

			if (parseInt(config.default_wof_id) != -1) {
				var onsuccess = function(rsp) {
					var feature = rsp.place;
					var esc_id = smol.esc_html(feature['wof:id']);
					var esc_bbox = smol.esc_html(feature['geom:bbox']);
					var esc_label = smol.esc_html(feature['wof:name']) + ', ' +
					                smol.esc_html(feature['wof:country']);
					var html = '<div class="place selected" data-wof-id="' + esc_id + '" data-bbox="' + esc_bbox + '"><span class="fa fa-check"></span> ' + esc_label + '</div>';
					$('#config-places-select').html(html);
					$('#config-location').val(esc_label);
					$('#config-places-random').removeClass('selected');
				};

				$.get('https://places.mapzen.com/v1?' + $.param({
					method: 'mapzen.places.getInfo',
					id: config.default_wof_id,
					extras: 'geom:bbox',
					api_key: config.mapzen_api_key
				})).then(onsuccess);
			}
		},

		show: function() {

			self.validate_api_key(smol.maps.config.mapzen_api_key, function(rsp) {
				if (rsp.stat == 'ok') {
					valid_api_key = true;
				} else {
					valid_api_key = false;
				}
			}, function(rsp) {
				valid_api_key = false;
			});

			if (smol.maps.config && smol.maps.config.mapzen_api_key) {
				return;
			}

			// Hide these on first run
			$('#menu-close').addClass('hidden');
			$('#config-cancel').addClass('hidden');
		},

		hide: function() {
			$('#menu').removeClass('no-animation');
		},

		validate: function() {
			if (valid_api_key == -1) {
				return { ok: -1 };
			} else if (valid_api_key) {
				return { ok: 1 };
			} else {
				return {
					ok: 0,
					error: 'Invalid API key.'
				};
			}
		},

		submit: function(config) {
			config.random_slug = smol.maps.config.random_slug;
			smol.maps.config = config;
			smol.maps.setup_data();
			smol.menu.hide();
			setTimeout(function() {
				$('#menu-close').removeClass('hidden');
				$('#config-cancel').removeClass('hidden');
			}, 2000);
		},

		validate_api_key: function(api_key, onsuccess, onerror) {
			$.get('https://places.mapzen.com/v1?' + $.param({
				api_key: api_key,
				method: 'api.test.echo'
			})).then(onsuccess, onerror);
		},

		place_click: function(e) {
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

			if (wof_id && wof_id != -1) {
				var api_key = $('#config-api-key').val().trim();
				$.get('https://places.mapzen.com/v1?' + $.param({
					method: 'mapzen.places.getInfo',
					id: wof_id,
					api_key: api_key
				})).then(function(rsp) {
					if (rsp['place'] &&
					    rsp['place']['wof:name']) {
						var default_name = rsp['place']['wof:name'];
						var default_slug = default_name.toLowerCase()
						                               .replace(/[^a-z0-9-]+/g, '-');
						$('input[name="default_slug"]').val(default_slug);
						$('input[name="default_name"]').val(default_name);
					}
				});
			}
		},

		places_show: function(cb) {

			var api_key = $('#config-api-key').val().trim();

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

						var esc_id = smol.esc_html(feature.properties.id);
						var esc_bbox = smol.esc_html(feature.bbox.join(','));
						var esc_label = smol.esc_html(feature.properties.label);

						places += '<div class="place" data-wof-id="' + esc_id + '" data-bbox="' + esc_bbox + '"><span class="fa fa-check"></span> ' + esc_label + '</div>';
					});
					$select.html(places);
					$('#config-places-select .place').click(self.place_click);

					var wof_id = $('input[name="default_wof_id"]').val();
					$('.place[data-wof-id="' + wof_id + '"]').trigger('click');
					if ($select.find('.selected').length == 0) {
						$('#config-places-random').trigger('click');
					}

					if (typeof cb == 'function') {
						cb(rsp);
					}
				}, function(rsp) {
					$('#config-places-select').html('<div class="response">Error loading places. Invalid API key?</div>');
				});
			}
		},

		geolocate: function() {
			if ('geolocation' in navigator){
				navigator.geolocation.getCurrentPosition(function(position) {
					var api_key = $('#config-api-key').val().trim();
					if (api_key != '') {
						$.get('https://search.mapzen.com/v1/reverse?' + $.param({
							'point.lat': position.coords.latitude,
							'point.lon': position.coords.longitude,
							layers: 'locality',
							sources: 'wof',
							api_key: api_key
						})).then(function(rsp) {
							if (rsp.features && rsp.features.length > 0) {
								$('#config-location').val(rsp.features[0].properties.label);
								self.places_show(function() {
									$('#config-places-select .place:first-child').trigger('click');
								});
							}
						});
					}
				});
			} else {
				alert('Your browser does not support geolocation.');
			}
		}
	};
	return self;
})();
