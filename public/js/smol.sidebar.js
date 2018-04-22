var smol = smol || {};

smol.sidebar = (function() {

	var self = {

		init: function() {

			$('#sidebar-config').click(function(e) {
				e.stopPropagation();
				$('#sidebar-config-utility').toggleClass('hidden');
			});

			$('#sidebar-close').click(function() {
				self.hide();
			});

			$('#sidebar-map-edit').click(function(e) {
				e.preventDefault();
				smol.menu.show('map');
			});

			$('#utility-config').click(function(e) {
				e.preventDefault();
				smol.menu.show('config');
			});

			$(document.body).click(function(e) {
				$('#sidebar-config-utility').addClass('hidden');
			});

			$.get('/api/map').then(function(rsp) {
				var html = '';
				$.each(rsp.maps, function(i, map) {
					var esc_id = smol.esc_html(map.id);
					var esc_name = smol.esc_html(map.name || map.slug);
					html += '<li id="sidebar-map-' + esc_id + '" class="sidebar-map">';
					html += '<h1 class="name">' + esc_name + '</h1>';
					if (map.author) {
						var esc_author = smol.esc_html(map.author);
						html += '<div class="author">' + esc_author + '</div>';
					} else {
						html += '<div class="author hidden"></div>';
					}
					var esc_slug = smol.esc_html(map.slug);
					html += '<a href="/' + esc_slug + '"></a>';
					html += '</li>';
				});
				$('#sidebar-maps').html(html);
			});

			$('#sidebar-map-browse').click(function(e) {
				e.preventDefault();
				$('#sidebar-map, #sidebar-buttons, #sidebar-venues, #sidebar-config').addClass('hidden');
				$('#sidebar-maps, #sidebar-back').removeClass('hidden');
			});

			$('#sidebar-back').click(function(e) {
				e.preventDefault();
				$('#sidebar-map, #sidebar-buttons, #sidebar-venues, #sidebar-config').removeClass('hidden');
				$('#sidebar-maps, #sidebar-back').addClass('hidden');
			});

			$('#utility-data').click(function(e) {
				e.preventDefault();
				smol.menu.show('data');
			});
		},

		show: function() {
			var map = smol.maps.data.map;
			$('#sidebar').addClass('active');
			$('#leaflet').addClass('show-sidebar');
			smol.maps.map.invalidateSize(false);
			slippymap.crosshairs.draw_crosshairs('leaflet');
			var esc_name = smol.esc_html(map.name || map.slug);
			var back_label = 'Back to ' + esc_name;
			$('#sidebar-back-name').html(back_label);
		},

		hide: function() {
			$('#sidebar').removeClass('active');
			$('#leaflet').removeClass('show-sidebar');
			smol.maps.map.invalidateSize(false);
			slippymap.crosshairs.draw_crosshairs('leaflet');
		},

		toggle: function() {
			if ($('#sidebar').hasClass('active')) {
				self.hide();
			} else {
				self.show();
			}
		},

		update_map: function(map) {

			var esc_name = smol.esc_html(map.name || map.slug);
			var esc_author = smol.esc_html(map.author);
			var esc_description = smol.esc_html(map.description);

			$('#sidebar-map .name').html(esc_name);
			if (map.author) {

				$('#sidebar-map .author').html(esc_author);
				$('#sidebar-map .author').removeClass('hidden');
			} else {
				$('#sidebar-map .author').addClass('hidden');
			}
			if (map.description) {
				$('#sidebar-map .description').html(esc_description);
				$('#sidebar-map .description').removeClass('hidden');
			} else {
				$('#sidebar-map .description').addClass('hidden');
			}
			$('#sidebar-map-' + map.id + ' .name').html(esc_name);
			if (map.author) {
				$('#sidebar-map-' + map.id + ' .author').html(esc_author);
				$('#sidebar-map-' + map.id + ' .author').removeClass('hidden');
			} else {
				$('#sidebar-map-' + map.id + ' .author').addClass('hidden');
			}
		},

		add_venue: function(venue) {
			$('#sidebar-venues').prepend('<li id="sidebar-venue-' + venue.id + '"></li>');
			self.update_venue(venue);
		},

		update_venue(venue) {

			var esc_color = smol.esc_html(venue.color);
			var esc_icon = smol.esc_html(venue.icon);
			var esc_name = smol.esc_html(venue.name);

			var hsl = smol.color.hex2hsl(venue.color);
			var icon_inverted = (hsl.l < 0.66) ? ' inverted' : '';

			if (! venue.name) {
				var lat = parseFloat(venue.latitude).toFixed(6);
				var lng = parseFloat(venue.longitude).toFixed(6);
				esc_name = smol.esc_html(lat + ', ' + lng);
			}

			var html =
				'<span class="icon-bg" style="background-color: ' + esc_color + ';">' +
				'<span class="icon' + icon_inverted + '" style="background-image: url(/img/icons/' + esc_icon + '.svg);"></span></span>' +
				'<span class="name">' + esc_name + '</span>' +
				'<br class="clear">';
			$('#sidebar-venue-' + venue.id).html(html);

			$('#sidebar-venue-' + venue.id).click(function(e) {
				e.preventDefault();
				var marker = smol.maps.markers[venue.id];
				if (! marker.isPopupOpen()) {
					marker.openPopup();
				}
			});
		}
	};

	$(document).ready(function() {
		self.init();
	});

	return self;
})();
