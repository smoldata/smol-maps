var smol = smol || {};
smol.maps = (function() {

	var self = {

		map: null,
		config: null,
		data: null,
		markers: {},

		map_marker_icon: L.divIcon({
			className: 'map-marker'
		}),

		init: function() {
			$.get('/api/config').then(function(rsp) {
				if (rsp.ok) {
					self.config = rsp.data;
					smol.menu.config.setup(self.config);
					self.setup_map();
				} else {
					$('#menu').addClass('no-animation');
					smol.menu.show('config');
				}
			});
		},

		setup_map: function() {

			if (! self.data) {
				return self.setup_data();
			}

			self.map = L.map('leaflet', {
				zoomControl: false
			});

			var hash = location.hash.match(/^#([0-9.]+)\/(-?[0-9.]+)\/(-?[0-9.]+)$/);
			if (hash) {
				var zoom = parseFloat(hash[1]);
				var lat = parseFloat(hash[2]);
				var lng = parseFloat(hash[3]);
				self.map.setView([lat, lng], zoom);
			} else {
				var bbox = self.data.map.bbox;
				if (! bbox) {
					bbox = self.random_megacity_bbox();
				}
				self.set_bbox(bbox);
			}

			if ($(document.body).width() > 640) {
				L.control.zoom({
					position: 'bottomleft'
				}).addTo(self.map);
				$('.leaflet-control-zoom-in').html('<span class="fa fa-plus"></span>');
				$('.leaflet-control-zoom-out').html('<span class="fa fa-minus"></span>');
				$('#map').addClass('has-zoom-controls');
			}

			self.tangram = Tangram.leafletLayer({
				scene: self.tangram_scene()
			}).addTo(self.map);

			L.control.geocoder(self.config.mapzen_api_key, {
				expanded: true,
				attribution: '<a href="https://mapzen.com/" target="_blank">Mapzen</a> | <a href="https://openstreetmap.org/">OSM</a>'
			}).addTo(self.map);
			$('.leaflet-pelias-search-icon').html('<span class="fa fa-bars"></span>');

			$('.leaflet-pelias-search-icon').click(function(e) {
				e.preventDefault();
				smol.sidebar.toggle();
			});

			L.control.locate({
				position: 'bottomleft'
			}).addTo(self.map);

			new L.Hash(self.map);

			L.control.addVenue({
				position: 'bottomright',
				click: function() {
					self.create_venue(function(marker) {
						marker.openPopup();
					});
				}
			}).addTo(self.map);

			slippymap.crosshairs.init(self.map);

			var initial_load = true;
			self.tangram.scene.subscribe({
				view_complete: function () {
					if (initial_load) {
						initial_load = false;
						for (var i = 0; i < self.data.venues.length; i++) {
							self.add_marker(self.data.venues[i]);
						}
					}
				}
			});

			if (self.data.map.name) {
				document.title = self.data.map.name;
			} else {
				document.title = self.data.map.slug;
			}

			$('#map').click(function(e) {
				if ($(e.target).hasClass('display') &&
				    $(e.target).closest('.name').length > 0 &&
				    ! $(e.target).closest('.leaflet-popup').hasClass('editing')) {
					self.venue_edit_name($(e.target).closest('.venue'));
					e.preventDefault();
				} else if ($(e.target).hasClass('icon') ||
				           $(e.target).closest('.icon').length > 0) {
					var venue_id = $(e.target).closest('.venue').data('venue-id');
					smol.menu.venue.edit(venue_id);
					e.preventDefault();
				}
			});

			self.setup_add_venue();
		},

		setup_data: function() {
			var path = location.pathname.match(/^\/([a-z0-9-]+)\/?$/);
			if (path) {
				var slug = path[1];
			} else if (self.config.default_slug) {
				var slug = self.config.default_slug;
			} else if (self.config.random_slug) {
				var slug = self.config.random_slug;
			} else {
				// In theory this should never get used...
				var slug = 'map';
			}
			self.load_map(slug);
		},

		setup_add_venue: function() {
			var color = self.config.default_color || '#8442D5';
			var icon = self.config.default_icon || 'marker-stroked';
			var image = 'url(/img/icons/' + icon + '.svg)';
			$('.leaflet-control-add-venue .icon-bg').css('background-color', color);
			$('.leaflet-control-add-venue .icon').css('background-image', image);
			var hsl = smol.color.hex2hsl(color);
			if (hsl.l < 0.66) {
				$('.leaflet-control-add-venue .icon').addClass('inverted');
			} else {
				$('.leaflet-control-add-venue .icon').removeClass('inverted');
			}
		},

		load_map: function(slug) {
			$.get('/api/map/' + slug, function(data) {
				self.data = data;
				self.setup_map();
				smol.sidebar.update_map(data.map);
				smol.menu.map.setup(data.map);
				if (location.pathname != '/' + data.map.slug) {
					history.pushState(data.map, data.map.name, '/' + data.map.slug);
				}
			});
		},

		create_map: function() {
			var map = {
				name: self.config.default_name || null,
				bbox: self.config.default_bbox || null
			};
			$.post('/api/map', map).then(function(data) {
				history.pushState(data.map, data.map.name, '/' + data.map.slug);
			});
		},

		tangram_scene: function() {
			return {
				global: {
					sdk_mapzen_api_key: self.config.mapzen_api_key
				},
				import: [
					"/scene/refill-style/refill-style.yaml"
				]
			};
		},

		random_megacity_bbox: function() {
			var index = Math.floor(Math.random() * wof.megacities.length);
			var place = wof.megacities[index];
			self.config.default_bbox = place['geom:bbox'];
			self.config.default_wof_id = place['wof:id'];
			return place['geom:bbox'];
		},

		set_bbox(bbox) {
			var coords = bbox.split(',');
			self.map.fitBounds([
				[coords[1], coords[0]],
				[coords[3], coords[2]]
			]);
		},

		create_venue: function(cb) {
			$.get('/api/id', function(rsp) {
				var center = self.map.getCenter();
				var color = self.config.default_color || '#8442D5';
				var icon = self.config.default_icon || 'marker-stroked';
				var venue = {
					id: rsp.id,
					map_id: self.data.map.id,
					active: 1,
					latitude: center.lat,
					longitude: center.lng,
					color: color,
					icon: icon
				};
				self.data.venues.push(venue);
				var marker = self.add_marker(venue);
				$.post('/api/venue', venue);
				if (typeof cb == 'function') {
					cb(marker);
				}
			});
		},

		add_marker: function(venue) {

			var coords = [venue.latitude, venue.longitude];
			var marker = new L.marker(coords, {
				icon: self.map_marker_icon,
				draggable: true,
				riseOnHover: true
			});

			self.markers[venue.id] = marker;

			marker.addTo(self.map);
			self.update_marker(venue);
			smol.sidebar.add_venue(venue);

			marker.on('popupopen', function() {
				this.unbindTooltip();
			});

			marker.on('popupclose', function() {
				if (this.venue.name) {
					this.bindTooltip(this.venue.name);
				}
			});

			marker.on('movestart', function() {
				this.unbindTooltip();
			});

			marker.on('moveend', function() {
				var ll = marker.getLatLng();
				venue.latitude = ll.lat;
				venue.longitude = ll.lng;
				if (! venue.name) {
					// Since this is labelled with lat/lng, we should update
					// the lat/lngs.
					self.update_marker(venue);
					smol.sidebar.update_venue(venue);
				}
				$.post('/api/venue', venue);

				if (this.venue.name) {
					this.bindTooltip(this.venue.name);
				}
			});

			return marker;
		},

		update_marker: function(venue) {

			var marker = self.markers[venue.id];
			marker.venue = venue;

			var data_id = venue.id ? ' data-venue-id="' + venue.id + '"' : '';
			var hsl = smol.color.hex2hsl(venue.color);
			var icon_inverted = (hsl.l < 0.66) ? ' inverted' : '';
			var name = venue.name;
			if (! name) {
				var lat = parseFloat(venue.latitude).toFixed(6);
				var lng = parseFloat(venue.longitude).toFixed(6);
				name = lat + ', ' + lng;
			}
			var html = '<form action="/api/venue" class="venue"' + data_id + ' onsubmit="smol.maps.venue_edit_name_save(); return false;">' +
					'<div class="icon-bg" style="background-color: ' + venue.color + ';">' +
					'<div class="icon' + icon_inverted + '" style="background-image: url(/img/icons/' + venue.icon + '.svg);"></div></div>' +
					'<div class="name">' +
					'<div class="display">' + name + '</div>' +
					'<input type="text" name="name" value="' + name + '">' +
					'<div class="buttons">' +
					'<input type="button" value="Cancel" class="btn btn-cancel">' +
					'<input type="submit" value="Save" class="btn btn-save">' +
					'</div>' +
					'</div>' +
					'<br class="clear">' +
					'</form>';
			marker.bindPopup(html);

			var rgb = smol.color.hex2rgb(venue.color);
			if (rgb && marker._icon) {
				var rgba = [rgb.r, rgb.g, rgb.b, 0.7];
				rgba = 'rgba(' + rgba.join(',') + ')';
				marker._icon.style.backgroundColor = rgba;
			}
			if (venue.name) {
				marker.bindTooltip(venue.name);
			} else {
				marker.unbindTooltip();
			}

			marker.on('popupopen', function(e) {

				// This is misguided, and doesn't work 100% of the time.
				// Replace me with a CSS-only approach, please! The sidebar
				// version is close, but it relies on a fixed container height
				// which isn't the case here.
				// (20171117/dphiffer)

				var h = $('.leaflet-popup .name').height();
				if (h < 30) {
					$('.leaflet-popup .name').addClass('single-line');
				} else {
					$('.leaflet-popup .name').removeClass('single-line');
				}
			});

			marker.on('popupclose', function(e) {
				$('.leaflet-popup.editing').removeClass('editing');
			});
		},

		venue_edit_name: function($venue) {
			if ($venue.length == 0) {
				return;
			}
			$venue.closest('.leaflet-popup').addClass('editing');
			var name = $venue.find('.name .display').html();
			$venue.find('.name input[type="text"]').val(name);
			$venue.find('.name input[type="text"]')[0].select();

			$venue.find('.btn-cancel').click(function(e) {
				e.preventDefault();
				e.stopPropagation();
				$(e.target).closest('.leaflet-popup').removeClass('editing');
			});
		},

		venue_edit_name_save: function() {

			var name = $('.leaflet-popup input').val();
			var id = $('.leaflet-popup form').data('venue-id');
			var venue = null;

			for (var i = 0; i < smol.maps.data.venues.length; i++) {
				if (smol.maps.data.venues[i].id == id) {
					venue = smol.maps.data.venues[i];
					venue.name = name;
					break;
				}
			}

			if (! venue) {
				console.error('could not save name for id ' + id);
				return;
			}

			$.post('/api/venue', venue).then(function(rsp) {
				$('.leaflet-popup .name .display').html(name);
				$('.leaflet-popup').removeClass('editing');
				smol.sidebar.update_venue(venue);
				self.update_marker(venue);

				// See comment above, in the popupopen handler, about doing this
				// CSS-only.

				var h = $('.leaflet-popup .name').height();
				if (h < 30) {
					$('.leaflet-popup .name').addClass('single-line');
				} else {
					$('.leaflet-popup .name').removeClass('single-line');
				}
			});
		}
	};

	$(document).ready(function() {
		self.init();
	});

	return self;
})();
