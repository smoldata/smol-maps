var smol = smol || {};
smol.menu = smol.menu || {};

smol.menu.map = (function() {

	var self = {

		setup: function(map) {
			$('#map').attr('action', '/api/map/' + map.slug);
			$('#map-id').val(map.id);
			$('#map-name').val(map.name);
			$('#map-author').val(map.author);
			$('#map-slug').val(map.slug);
			$('#map-description').val(map.description);
			$('#map-bbox').val(map.bbox);
		},

		submit: function(map) {
			if (map.slug != smol.maps.data.map.slug) {
				$('#map').attr('action', '/api/map/' + map.slug);
				history.pushState(map, map.name, '/' + map.slug);
			}
			smol.maps.data.map = map;
			smol.sidebar.update_map(map);
			smol.menu.hide();
		}

	}
	return self;
})();
