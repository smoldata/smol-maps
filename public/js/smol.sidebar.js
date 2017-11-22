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
		}
	};

	$(document).ready(function() {
		self.init();
	});

	return self;
})();
