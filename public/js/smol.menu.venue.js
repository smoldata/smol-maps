var smol = smol || {};
smol.menu = smol.menu || {};

smol.menu.venue = (function() {

	var self = {

		init: function() {

			$('#venue .edit-delete').click(function(e) {
				e.preventDefault();
				self.delete_venue();
			});

			$('#venue-color').change(function() {
				var color = $('#venue-color').val();
				$('#venue-icon-preview').css('background-color', color);
				var hsl = smol.color.hex2hsl(color);
				if (hsl.l < 0.66) {
					$('#venue-icon-preview .icon').addClass('inverted');
				} else {
					$('#venue-icon-preview .icon').removeClass('inverted');
				}
			});

			$('#venue-colors a').each(function(i, link) {
				var color = $(link).data('color');
				$(link).css('background-color', color);
				$(link).click(function(e) {
					e.preventDefault();
					$('#venue-color').val(color);
					$('#venue-icon-preview').css('background-color', color);
					var hsl = smol.color.hex2hsl(color);
					if (hsl.l < 0.66) {
						$('#venue-icon-preview .icon').addClass('inverted');
					} else {
						$('#venue-icon-preview .icon').removeClass('inverted');
					}
				});
			});
		},

		edit: function(id) {

			var venue = null;
			for (var i = 0; i < smol.maps.data.venues.length; i++) {
				if (smol.maps.data.venues[i].id == id) {
					venue = smol.maps.data.venues[i];
					break;
				}
			}

			if (! venue) {
				console.error('could not find venue ' + id + ' to edit');
				return;
			}

			$('#venue-id').val(id);
			$('#venue-map-id').val(venue.map_id);
			$('#venue-latitude').val(venue.latitude);
			$('#venue-longitude').val(venue.longitude);
			$('#venue-name').val(venue.name);
			$('#venue-address').val(venue.address);
			$('#venue-tags').val(venue.tags);
			$('#venue-url').val(venue.url);
			$('#venue-description').val(venue.description);
			$('#venue-icon').val(venue.icon);
			$('#venue-icon-preview').css('background-color', venue.color);
			$('#venue-icon-preview .icon').css('background-image', 'url("/img/icons/' + venue.icon + '.svg")');
			$('#venue-color').val(venue.color);

			var hsl = smol.color.hex2hsl(venue.color);
			if (hsl.l < 0.66) {
				$('#venue-icon-preview .icon').addClass('inverted');
			} else {
				$('#venue-icon-preview .icon').removeClass('inverted');
			}

			$('#venue .response').html('');

			self.setup_icons();
			smol.menu.show('venue');
		},

		show: function() {
			$('.leaflet-popup.editing').removeClass('editing');
		},

		submit: function(venue) {
			for (var i = 0; i < smol.maps.data.venues.length; i++) {
				if (smol.maps.data.venues[i].id == venue.id) {
					smol.maps.data.venues[i] = venue;
				}
			}
			smol.sidebar.update_venue(venue);
			smol.maps.update_marker(venue);
			self.add_recent_icon(venue.icon);
			smol.menu.hide();
		},

		setup_icons: function() {

			var default_recent = [
				'restaurant',
				'cafe',
				'grocery',
				'bar',
				'cinema',
				'garden',
				'park',
				'library',
				'shop'
			];

			var recent = smol.maps.config.recent_icons || [];
			for (var icon, i = 0; i < default_recent.length; i++) {
				icon = default_recent[i];
				if (recent.indexOf(icon) == -1) {
					recent.push(icon);
				}
			}

			var icons = [];
			for (var i = 0; i < recent.length; i++) {
				icons.push('<a href="#" class="icon-bg" data-icon="' + recent[i] + '"><span class="icon" style="background-image: url(/img/icons/' + recent[i] + '.svg);"></span><span class="icon-label">' + recent[i] + '</span></a>');
				if (icons.length == 9) {
					break;
				}
			}
			$('#venue-recent-icons .holder').html(icons.join(''));
			$('#venue-recent-icons .icon-bg').click(self.venue_icon_click);

			if ($('#venue-icons .icon-bg').length == 0) {

				$.get('/api/icons').then(function(rsp) {
					var icons = '';
					$.each(rsp.icons, function(i, icon) {
						icons += '<a href="#" class="icon-bg" data-icon="' + icon + '"><span class="icon" style="background-image: url(/img/icons/' + icon + '.svg);" title="' + icon + '"></span><span class="icon-label">' + icon + '</span></a>';
					});
					$('#venue-icons').html(icons);
					$('#venue-icons .icon-bg').click(self.venue_icon_click);
				});

				$('#venue-show-icons').click(function(e) {
					e.preventDefault();
					$('#venue-icons').toggleClass('hidden');
					if ($('#venue-icons').hasClass('hidden')) {
						$(this).html('show all icons');
					} else {
						$(this).html('hide all icons');
					}
				});

				$('#venue-default-icon').click(function(e) {
					e.preventDefault();
					var config = smol.maps.config;
					config.default_icon = $('#venue-icon').val();
					config.default_color = $('#venue-color').val();
					$.post('/api/config', config);
					smol.maps.setup_add_venue();
					$('#venue-default-icon').html('default icon updated');
				});
			}
		},

		add_recent_icon: function(icon) {
			var recent = smol.maps.config.recent_icons || [];
			var curr_index = recent.indexOf(icon);
			if (curr_index > -1) {
				recent.splice(curr_index, 1);
			}
			recent.unshift(icon);
			smol.maps.config.recent_icons = recent;
			$.post('/api/config', smol.maps.config);
		},

		venue_icon_click: function(e) {
			e.preventDefault();
			var icon = $(this).data('icon');
			$('#venue-icon-preview .icon').css('background-image', 'url("/img/icons/' + icon + '.svg")');
			$('#venue-icon').val(icon);
			if ($(this).closest('#venue-icons').length > 0) {
				$('#venue-icons').addClass('hidden');
				$('#venue-show-icons').html('show all icons');
				var scroll_offset = $('label[for="venue-icon"]').offset().top - 20;
				if (scroll_offset < 0) {
					$('#menu').animate({
						scrollTop: $('#menu').scrollTop() + scroll_offset
					}, 500, 'swing');
				}
			}
		},

		delete_venue: function() {

			var id = parseInt($('#venue-id').val());

			var new_venues = [];
			var delete_venue = null;
			for (var i = 0; i < smol.maps.data.venues.length; i++) {
				if (smol.maps.data.venues[i].id == id) {
					delete_venue = smol.maps.data.venues[i];
					continue;
				}
				new_venues.push(smol.maps.data.venues[i]);
			}
			smol.maps.data.venues = new_venues;
			smol.maps.map.eachLayer(function(layer) {
				if (layer.venue &&
				    layer.venue.id == id) {
					smol.maps.map.removeLayer(layer);
				}
			});

			$('.response').html('Deleting...');
			$('.response').removeClass('error');

			delete_venue.active = 0;

			$.post('/api/venue', delete_venue).then(function(rsp) {
				if (rsp.error) {
					$('.response').html(rsp.error);
					$('.response').addClass('error');
					return;
				}
				$('.response').html('');
				smol.menu.hide();
			});
		}

	};
	return self;
})();
