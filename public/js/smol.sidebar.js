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
		},

		show: function() {
			$('#sidebar').addClass('active');
			$('#leaflet').addClass('show-sidebar');
			smol.maps.map.invalidateSize(false);
			slippymap.crosshairs.draw_crosshairs('leaflet');
			$('#utility-export').attr('href', '/api/export/' + smol.maps.data.map.slug);
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
			$('#sidebar-map-name').html(map.name || map.slug);
			if (map.author) {
				$('#sidebar-map-author').html(map.author);
				$('#sidebar-map-author').removeClass('hidden');
			} else {
				$('#sidebar-map-author').addClass('hidden');
			}
			if (map.description) {
				$('#sidebar-map-description').html(map.description);
				$('#sidebar-map-description').removeClass('hidden');
			} else {
				$('#sidebar-map-description').addClass('hidden');
			}
		},

		add_venue: function(venue) {
			$('#sidebar-items').prepend('<li id="sidebar-venue-' + venue.id + '"></li>');
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
