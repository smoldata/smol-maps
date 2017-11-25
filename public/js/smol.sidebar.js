var smol = smol || {};

smol.sidebar = (function() {

	var self = {

		init: function() {

			$('#sidebar-config').click(function() {
				smol.menu.show('config');
			});

			$('#sidebar-close').click(function() {
				self.hide();
			});
		},

		show: function() {
			$('#sidebar').addClass('active');
			$('#map').addClass('show-sidebar');
			smol.maps.map.invalidateSize(false);
		},

		hide: function() {
			$('#sidebar').removeClass('active');
			$('#map').removeClass('show-sidebar');
			smol.maps.map.invalidateSize(false);
		},

		toggle: function() {
			if ($('#sidebar').hasClass('active')) {
				self.hide();
			} else {
				self.show();
			}
		},

		add_venue: function(venue) {
			var hsl = smol.color.hex2hsl(venue.color);
			var icon_inverted = (hsl.l < 0.66) ? ' inverted' : '';
			var name = venue.name;
			if (! name) {
				var lat = parseFloat(venue.latitude).toFixed(6);
				var lng = parseFloat(venue.longitude).toFixed(6);
				name = lat + ', ' + lng;
			}
			var html = '<li>' +
				'<span class="icon-bg" style="background-color: ' + venue.color + ';">' +
				'<span class="icon' + icon_inverted + '" style="background-image: url(/img/icons/' + venue.icon + '.svg);"></span></span>' +
				'<span class="name"><span class="inner">' + name + '</span></span>' +
				'<br class="clear">' +
				'</li>';
			$('#sidebar-items').prepend(html);
		}
	};

	$(document).ready(function() {
		self.init();
	});

	return self;
})();
