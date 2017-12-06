var smol = smol || {};
smol.menu = smol.menu || {};

smol.menu.map = (function() {

	var self = {

		init: function() {

			$('#map-set-view').click(function(e) {
				e.preventDefault();
				self.update_bbox();
			});

			var base_url = location.href.match(/https?:\/\/.+?\//)[0];
			$('#map-base-url').html(base_url);

			$('#map-style').change(self.update);
			$('#map-theme').change(self.update);

			$('#map .edit-delete').click(function(e) {
				e.preventDefault();
				self.delete_map();
			});
		},

		update: function() {
			var style = $('#map-style').val();
			var theme = $('#map-theme').val();

			$('#map-base .selected').removeClass('selected');
			$('#map-base .style-specific.' + style).addClass('selected');

			if (style == 'refill-style') {
				var preview_url = '/img/preview/refill-' + theme + '.jpg';
			} else {
				var preview_url = '/img/preview/' + style + '.jpg';
			}
			$('#map-preview img').attr('src', preview_url);
		},

		setup: function(map) {
			$('#map').attr('action', '/api/map/' + map.slug);
			$('#map-id').val(map.id);
			$('#map-name').val(map.name);
			$('#map-author').val(map.author);
			$('#map-description').val(map.description);
			$('#map-slug').val(map.slug);

			if (! map.bbox) {
				self.update_bbox();
			} else {
				$('#map-bbox').val(map.bbox);
			}

			var style = map.style || 'refill-style';
			$('#map-style').val(style);

			var theme = map.theme || 'black';
			$('#map-theme').val(theme);

			// Note: this depends on the value "0" instead of 0
			var labels = map.labels || 5;
			$('#map-labels').val(labels);

			// Note: this depends on the value "0" instead of 0
			var detail = map.detail || 10;
			$('#map-detail').val(detail);

			var overlays = ['transit_overlay', 'trail_overlay', 'bike_overlay'];
			for (var overlay, i = 0; i < overlays.length; i++) {
				overlay = overlays[i];

				// Note: the "1" should be a 1
				$('#map-' + overlay)[0].checked = (map[overlay] == "1");
			}

			self.update();

			$('#map .response').html('');
		},

		submit: function(map) {
			if (map.slug != smol.maps.data.map.slug) {
				$('#map').attr('action', '/api/map/' + map.slug);
				history.pushState(map, map.name, '/' + map.slug);
			}
			smol.maps.data.map = map;
			smol.maps.tangram.scene.load(smol.maps.tangram_scene());
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
		},

		delete_map: function() {
			var map = smol.maps.data.map;
			var name = map.name || map.slug;
			if (! confirm("Are you sure you want to delete " + name + "?")) {
				return;
			}
			map.active = 0;
			$.post('/api/map/' + map.slug, map).then(function() {
				var base_url = window.location.href.match(/https?:\/\/(.+?)\//);
				window.location = base_url[0];
			});
		}

	}
	return self;
})();
