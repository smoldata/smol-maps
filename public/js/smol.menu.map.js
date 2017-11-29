var smol = smol || {};
smol.menu = smol.menu || {};

smol.menu.map = (function() {

	var self = {

		init: function() {
			$('#map-set-view').click(function(e) {
				e.preventDefault();
				self.update_bbox();
			});
		},

		setup: function(map) {
			$('#map').attr('action', '/api/map/' + map.slug);
			$('#map-id').val(map.id);
			$('#map-name').val(map.name);
			$('#map-author').val(map.author);
			$('#map-slug').val(map.slug);
			$('#map-description').val(map.description);
			if (! map.bbox) {
				self.update_bbox();
			} else {
				$('#map-bbox').val(map.bbox);
			}
		},

		submit: function(map) {
			if (map.slug != smol.maps.data.map.slug) {
				$('#map').attr('action', '/api/map/' + map.slug);
				history.pushState(map, map.name, '/' + map.slug);
			}
			smol.maps.data.map = map;
			smol.sidebar.update_map(map);
			smol.menu.hide();
			document.title = map.name || map.slug;
		},

		update_bbox: function() {
			var bounds = smol.maps.map.getBounds();
			var bbox = [
				bounds._southWest.lng.toFixed(6),
				bounds._southWest.lat.toFixed(6),
				bounds._northEast.lng.toFixed(6),
				bounds._northEast.lat.toFixed(6)
			];
			$('#map-bbox').val(bbox.join(','));
		}

	}
	return self;
})();
