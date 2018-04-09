var smol = smol || {};
smol.menu = smol.menu || {};

smol.menu.config = (function() {

	var self = {

		setup: function(config) {
			$('#nextzen-api-key').val(config.nextzen_api_key);
		},

		show: function() {

			if (smol.maps.config && smol.maps.config.nextzen_api_key) {
				return;
			}

			// Hide these on first run
			$('#menu-close').addClass('hidden');
			$('#config-cancel').addClass('hidden');
		},

		hide: function() {
			$('#menu').removeClass('no-animation');
		},

		submit: function(config) {
			smol.maps.config = config;
			smol.maps.setup_data();
			smol.menu.hide();
			setTimeout(function() {
				$('#menu-close').removeClass('hidden');
				$('#config-cancel').removeClass('hidden');
			}, 2000);
		}
	};
	return self;
})();
