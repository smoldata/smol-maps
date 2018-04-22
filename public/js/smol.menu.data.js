var smol = smol || {};
smol.menu = smol.menu || {};

smol.menu.data = (function() {

	var self = {

		show: function() {
			var map = smol.maps.data.map;
			$('#data-export-geojson').attr('href', '/api/export/' + map.slug);
		}

	};

	return self;
})();
