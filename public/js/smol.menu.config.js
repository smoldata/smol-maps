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
			$('#config-location').keypress(function(e) {
				setTimeout(self.places_show, 0);
			});
			$('#config-api-key').keypress(function(e) {
				setTimeout(function() {
					var api_key = $(e.target).val();
					self.validate_api_key(api_key);
				}, 0);
			});
		},

		show: function() {
			$('#menu-close').addClass('hidden');
		},

		hide: function() {
			$('#menu').removeClass('no-animation');
			$('#menu-close').removeClass('hidden');
		},

		submit: function() {
			smol.menu.hide();
		},

		validate_api_key: function(api_key) {
			var onerror = function() {
				valid_api_key = false;
				$('#config-location').attr('disabled', 'disabled');
				$('#config-location').attr('placeholder', 'Search for a default location (requires valid API key)');
			};
			var onsuccess = function(rsp) {
				if (rsp.stat == 'ok') {
					valid_api_key = true;
					$('#config-location').attr('disabled', null);
					$('#config-location').attr('placeholder', 'Search for a default location');
				} else {
					onerror();
				}
			};
			if (api_key == '') {
				onerror();
			}
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
		},

		places_show: function(cb) {
			var api_key = $('#config-api-key').val();
			self.validate_api_key(api_key);

			if (valid_api_key) {
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
						$('#config-places-select .place').click(self.place_click);
						if (typeof cb == 'function') {
							cb(rsp);
						}
					});
				}
			}
		},

		geolocate: function() {
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
