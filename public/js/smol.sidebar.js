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
					var name = map.name || map.slug;
					html += '<li id="sidebar-map-' + map.id + '" class="sidebar-map">';
					html += '<h1 class="name">' + name + '</h1>';
					if (map.author) {
						html += '<div class="author">' + map.author + '</div>';
					} else {
						html += '<div class="author hidden"></div>';
					}
					html += '<a href="/' + map.slug + '"></a>';
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
		},

		show: function() {
			var map = smol.maps.data.map;
			$('#sidebar').addClass('active');
			$('#leaflet').addClass('show-sidebar');
			smol.maps.map.invalidateSize(false);
			slippymap.crosshairs.draw_crosshairs('leaflet');
			$('#utility-save').attr('href', '/' + map.slug + '?save=1' + location.hash);
			$('#utility-export').attr('href', '/api/export/' + map.slug);
			var back_label = 'Back to ' + (map.name || map.slug);
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
			$('#sidebar-map .name').html(map.name || map.slug);
			if (map.author) {
				$('#sidebar-map .author').html(map.author);
				$('#sidebar-map .author').removeClass('hidden');
			} else {
				$('#sidebar-map .author').addClass('hidden');
			}
			if (map.description) {
				$('#sidebar-map .description').html(map.description);
				$('#sidebar-map .description').removeClass('hidden');
			} else {
				$('#sidebar-map .description').addClass('hidden');
			}
			$('#sidebar-map-' + map.id + ' .name').html(map.name || map.slug);
			if (map.author) {
				$('#sidebar-map-' + map.id + ' .author').html(map.author);
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
			var hsl = smol.color.hex2hsl(venue.color);
			var icon_inverted = (hsl.l < 0.66) ? ' inverted' : '';
			var name = venue.name;
			if (! name) {
				var lat = parseFloat(venue.latitude).toFixed(6);
				var lng = parseFloat(venue.longitude).toFixed(6);
				name = lat + ', ' + lng;
			}
			var html =
				'<span class="icon-bg" style="background-color: ' + venue.color + ';">' +
				'<span class="icon' + icon_inverted + '" style="background-image: url(/img/icons/' + venue.icon + '.svg);"></span></span>' +
				'<span class="name">' + name + '</span>' +
				'<br class="clear">';
			$('#sidebar-venue-' + venue.id).html(html);

			$('#sidebar-venue-' + venue.id).click(function(e) {
				e.preventDefault();
				smol.maps.markers[venue.id].openPopup();
			});
		}
	};

	$(document).ready(function() {
		self.init();
	});

	return self;
})();
