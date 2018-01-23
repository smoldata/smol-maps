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

		exif_orientation_classes: {
			case1: '',
			case2: 'flip-horiz',
			case3: 'rotate-180',
			case4: 'flip-horiz rotate-180',
			case5: 'flip-horiz rotate-90',
			case6: 'rotate-90',
			case7: 'flip-horiz rotate-270',
			case8: 'rotate-270'
		},

		init: function() {
			$.get('/api/config').then(function(rsp) {
				if (rsp.ok) {
					self.config = rsp.data;
					smol.menu.config.setup(self.config);
					self.setup_map();
				} else {
					$('#menu').addClass('no-animation');
					self.config = rsp.data;
					smol.menu.show('config');
				}
			}, function(rsp) {
				alert('Error: could not load config.');
			});
		},

		setup_map: function() {

			if (! self.data) {
				return self.setup_data();
			}

			self.map = L.map('leaflet', {
				zoomControl: false
			});

			self.tangram = Tangram.leafletLayer({
				scene: self.tangram_scene()
			}).addTo(self.map);

			var initial_load = true;
			self.tangram.scene.subscribe({
				load: function() {
					if (self.config.tiles_url) {
						var sources = self.tangram_sources();
						for (var source in sources) {
							if (sources[source].url.substr(0, 24) == 'https://tile.mapzen.com/') {
								sources[source].url_params = {
									api_key: self.config.mapzen_api_key
								};
							}
							self.tangram.scene.setDataSource(source, sources[source]);
						}
						self.tangram.scene.updateConfig();
					}
				},
				view_complete: function() {
					if (initial_load) {
						initial_load = false;
						if (location.search.indexOf('save') !== -1) {
							setTimeout(function() {
								// Wait 1s... to account for venues fading in
								self.screengrab();
							}, 1000);
						} else {
							for (var i = 0; i < self.data.venues.length; i++) {
								self.add_marker(self.data.venues[i]);
							}
						}
					}
				}
			});

			if (self.data.map.name) {
				document.title = self.data.map.name;
			} else {
				document.title = self.data.map.slug;
			}

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
					self.data.map.bbox = bbox;
					$.post('/api/map/' + self.data.map.slug, self.data.map);
				}
				self.set_bbox(bbox);
			}

			if (location.search.indexOf('save') !== -1) {
				// If we are saving a static map image, we're all done!
				return;
			}

			if ($(document.body).width() > 640) {
				L.control.zoom({
					position: 'bottomleft'
				}).addTo(self.map);
				$('.leaflet-control-zoom-in').html('<span class="fa fa-plus"></span>');
				$('.leaflet-control-zoom-out').html('<span class="fa fa-minus"></span>');
				$('#leaflet').addClass('has-zoom-controls');
			}

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
						self.venue_edit_name($('.leaflet-popup .venue'));
					});
				},
				longHold: function(e) {
					$('#map-upload').addClass('visible');
				}
			}).addTo(self.map);

			slippymap.crosshairs.init(self.map);

			$('#leaflet').click(function(e) {
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

			// This callback function should execute regardless of whether
			// localforage hits an error or not. (20171209/dphiffer)
			var cb = function() {
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
			};

			localforage.getItem('smol:maps:config').then(function(user_config) {
				// Merge user config into the global one
				self.config = L.extend(self.config, user_config);
				cb();
			}).catch(function(err) {
				console.error(err);
				cb();
			});
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

			self.setup_upload();
		},

		setup_upload: function() {
			var esc_map_id = parseInt(self.data.map.id);
			var html = '<div id="map-upload" class="icon-bg">' +
				'<span class="fa fa-camera"></span></div>' +
				'<form id="map-upload-form">' +
				'<input type="file" name="photos" id="map-upload-input" multiple>' +
				'<input type="hidden" name="map_id" id="map-upload-map-id" value="' + esc_map_id + '">' +
				'<input type="hidden" name="venue_ids" id="map-upload-ids" value="">' +
				'</form>';
			$('.leaflet-control-add-venue').append(html);

			$('#map-upload-input').change(function() {
				self.enqueue_photos();
			});
		},

		load_map: function(slug) {
			$.get('/api/map/' + slug).then(function(data) {
				if (data.map.active == "0") { // Blarg, change this "0" to 0 someday
					var base_url = window.location.href.match(/https?:\/\/(.+?)\//);
					window.location = base_url[0];
					return;
				}
				self.data = data;
				self.setup_map();
				smol.sidebar.update_map(data.map);
				smol.menu.map.setup(data.map);
				if (location.pathname != '/' + data.map.slug) {
					history.pushState(data.map, data.map.name, '/' + data.map.slug);
				}

				// Store this map slug as the default
				localforage.getItem('smol:maps:config').then(function(config) {
					if (! config) {
						config = {};
					}
					config.default_slug = slug;
					smol.maps.config.default_slug = slug;
					localforage.setItem('smol:maps:config', config);
				});
			}, function(rsp) {
				alert("Error: could not load map '" + slug + "'.");
			});
		},

		create_map: function() {
			var map = {
				name: self.config.default_name || null,
				bbox: self.config.default_bbox || null
			};
			$.post('/api/map', map).then(function(data) {
				history.pushState(data.map, data.map.name, '/' + data.map.slug);
			}, function(rsp) {
				var error = rsp.error || 'Error: Could not create map.';
				alert(error);
			});
		},

		tangram_scene: function() {

			var scene = {
				global: {
					sdk_mapzen_api_key: self.config.mapzen_api_key
				},
				import: []
			};

			var map = self.data.map;
			var style = map.style || 'refill-style';
			var theme = map.theme || 'black';
			var labels = map.labels || 5;
			var detail = map.detail || 10;

			if (style == 'refill-style') {
				scene.import = [
					'/scene/refill-style/refill-style.yaml',
					'/scene/refill-style/themes/color-' + theme + '.yaml',
					'/scene/refill-style/themes/detail-' + detail + '.yaml',
					'/scene/refill-style/themes/label-' + labels + '.yaml'
				];
			} else if (map.style == 'walkabout-style') {
				scene.import = [
					'/scene/walkabout-style/walkabout-style.yaml',
					'/scene/walkabout-style/themes/label-' + labels + '.yaml'
				];
			} else {
				scene.import = [
					'/scene/bubble-wrap/bubble-wrap-style.yaml',
					'/scene/bubble-wrap/themes/label-' + labels + '.yaml'
				];
			}
			scene.global.sdk_transit_overlay = (map.transit_overlay == "1");
			scene.global.sdk_path_overlay = (map.trail_overlay == "1");
			scene.global.sdk_bike_overlay = (map.bike_overlay == "1");

			if (location.search.indexOf('save') !== -1) {
				scene.import.push('/api/tangram/' + map.slug);
			}

			return scene;
		},

		tangram_sources: function() {

			var tiles = self.config.tiles_url;
			var tiles_mvt = tiles.replace(/\{format\}/g, 'mvt');
			var tiles_topojson = tiles.replace(/\{format\}/g, 'topojson');
			var tiles_terrain = tiles.replace(/\{format\}/g, 'terrain');
			tiles_terrain = tiles_terrain.replace(/\.terrain$/, '.png');

			var sources = {
				"refill-style": {
					"mapzen": {
						"type": "TopoJSON",
						"url": tiles_topojson,
						"max_zoom": 16
					}
				},
				"walkabout-style": {
					"mapzen": {
						"type": "MVT",
						"url": tiles_mvt,
						"rasters": ["normals"],
						"max_zoom": 16
					},
					"normals": {
						"type": "Raster",
						"url": tiles_terrain,
						"max_zoom": 15
					}
				},
				"bubble-wrap": {
					"mapzen": {
						"type": "MVT",
						"url": tiles_mvt,
						"max_zoom": 16
					}
				}
			};

			var map = self.data.map;
			var style = map.style || 'refill-style';
			return sources[style];
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

		create_venue: function(cb, lat, lng, photo) {
			$.get('/api/id').then(function(rsp) {
				var center = self.map.getCenter();
				lat = lat || center.lat;
				lng = lng || center.lng;
				var color = self.config.default_color || '#8442D5';
				var icon = self.config.default_icon || 'marker-stroked';
				var venue = {
					id: rsp.id,
					map_id: self.data.map.id,
					active: 1,
					latitude: lat,
					longitude: lng,
					color: color,
					icon: icon
				};

				var onsuccess = function() {
					self.data.venues.push(venue);
					var marker = self.add_marker(venue, photo);
					if (typeof cb == 'function') {
						cb(marker);
					}
				};

				var onerror = function() {
					alert('Error: Could not create a new venue.');
				};

				$.post('/api/venue', venue).then(onsuccess, onerror);
			}, function() {
				alert('Error: Could not load a new ID.')
			});
		},

		add_marker: function(venue, pending_photo) {

			var coords = [venue.latitude, venue.longitude];
			var marker = new L.marker(coords, {
				icon: self.map_marker_icon,
				draggable: true,
				riseOnHover: true
			});

			self.markers[venue.id] = marker;

			marker.addTo(self.map);
			self.update_marker(venue, pending_photo);
			smol.sidebar.add_venue(venue);

			marker.on('popupopen', function() {
				this.unbindTooltip();
			});

			marker.on('popupclose', function() {
				if (this.venue.name) {
					var esc_name = smol.esc_html(this.venue.name);
					this.bindTooltip(esc_name);
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
					self.update_marker(venue, pending_photo);
					smol.sidebar.update_venue(venue);
				}

				var onsuccess = function() {};
				var onerror = function() {
					alert('Error: Could not save updated marker position.');
				};

				$.post('/api/venue', venue).then(onsuccess, onerror);

				if (this.venue.name) {
					var esc_name = smol.esc_html(this.venue.name);
					this.bindTooltip(esc_name);
				}
			});

			return marker;
		},

		update_marker: function(venue, pending_photo) {

			var marker = self.markers[venue.id];
			marker.venue = venue;

			var esc_id = smol.esc_html(venue.id);
			var esc_map_id = smol.esc_html(venue.map_id);
			var esc_color = smol.esc_html(venue.color);
			var esc_icon = smol.esc_html(venue.icon);
			var esc_name = smol.esc_html(venue.name);

			var data_id = venue.id ? ' data-venue-id="' + esc_id + '"' : '';
			var hsl = smol.color.hex2hsl(venue.color);
			var icon_inverted = (hsl.l < 0.66) ? ' inverted' : '';

			if (! venue.name) {
				var lat = parseFloat(venue.latitude).toFixed(6);
				var lng = parseFloat(venue.longitude).toFixed(6);
				esc_name = smol.esc_html(lat + ', ' + lng);
			}
			var html = '<form action="/api/venue" class="venue"' + data_id + ' onsubmit="smol.maps.venue_edit_name_save(); return false;">' +
					'<div class="icon-bg" style="background-color: ' + esc_color + ';">' +
					'<div class="icon' + icon_inverted + '" style="background-image: url(/img/icons/' + esc_icon + '.svg);"></div></div>' +
					'<div class="name single-line" data-name="' + esc_name + '">' +
					'<div class="display">' + esc_name + '</div>' +
					'<input type="text" name="name" value="' + esc_name + '">' +
					'<div class="response hidden"></div>' +
					'<div class="buttons">' +
					'<input type="button" value="Cancel" class="btn btn-cancel">' +
					'<input type="submit" value="Save" class="btn btn-save">' +
					'</div>' +
					'</div>' +
					'<br class="clear">' +
					'</form>';
			if (venue.photo) {
				var esc_photo = smol.esc_html(venue.photo);
				var thumb = esc_photo.replace(/(\.\w+)$/, '-420$1');
				var large = esc_photo.replace(/(\.\w+)$/, '-1240$1');
				var esc_src = '/api/photo/' + esc_map_id + '/' + esc_id + '/' + thumb;
				var esc_href = '/api/photo/' + esc_map_id + '/' + esc_id + '/' + large;
				html += '<figure>' +
						'<a href="' + esc_href + '" target="_blank">' +
						'<img src="' + esc_src + '">' +
						'</a></figure>';
			} else if (pending_photo) {
				var class_name = '';
				if (pending_photo.orientation) {
					class_name = smol.esc_html(pending_photo.orientation);
				}
				html += '<figure class="' + class_name + '">' +
						'<img src="' + pending_photo.data_uri + '">' +
						'<span class="fa fa-hourglass"></span>' +
						'</figure>';
			}
			marker.bindPopup(html);

			var rgb = smol.color.hex2rgb(venue.color);
			if (rgb && marker._icon) {
				var rgba = [rgb.r, rgb.g, rgb.b, 0.7];
				rgba = 'rgba(' + rgba.join(',') + ')';
				marker._icon.style.backgroundColor = rgba;
			}
			if (venue.name) {
				var esc_name = smol.esc_html(venue.name);
				marker.bindTooltip(esc_name);
			} else {
				marker.unbindTooltip();
			}

			marker.on('popupopen', function(e) {

				// This is misguided, and doesn't work 100% of the time.
				// Replace me with a CSS-only approach, please! The sidebar
				// version is close, but it relies on a fixed container height
				// which isn't the case here.
				// (20171117/dphiffer)

				// In the absense of a good CSS-only approach I am adding
				// an ugly awful setTimeout to account for the time it takes for
				// Leaflet popup content to settle. Why 250ms? I dunno, it
				// seemed to work on my laptop. I used 500ms somewhere else,
				// but I suspect it depends on various client-side factors.
				// (20171209/dphiffer)

				setTimeout(function() {
					var h = $('.leaflet-popup .name').height();
					if (h < 30) {
						$('.leaflet-popup .name').addClass('single-line');
					} else {
						$('.leaflet-popup .name').removeClass('single-line');
					}
				}, 250);
			});

			marker.on('popupclose', function(e) {
				$('.leaflet-popup.editing').removeClass('editing');
			});
		},

		venue_edit_name: function($venue) {
			if ($venue.length == 0) {
				return;
			}

			// Since Leaflet is swapping DOM content in the popup window, we
			// need to wait a moment for that to finish. (20171209/dphiffer)
			setTimeout(function() {
				$venue.closest('.leaflet-popup').addClass('editing');
				var name = $venue.find('.name').data('name');
				$venue.find('.name input[type="text"]').val(name);
				$venue.find('.name input[type="text"]')[0].select();

				$venue.find('.btn-cancel').click(function(e) {
					e.preventDefault();
					e.stopPropagation();
					$(e.target).closest('.leaflet-popup').removeClass('editing');
				});
			}, 500);
		},

		venue_edit_name_save: function() {

			var name = $('.leaflet-popup input').val();
			var id = $('.leaflet-popup form').data('venue-id');
			var venue = null;

			var esc_name = smol.esc_html(name);
			$('.leaflet-popup .name').data('name', esc_name);

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
				var esc_name = smol.esc_html(name);
				$('.leaflet-popup .name .display').html(esc_name);
				$('.leaflet-popup').removeClass('editing');
				smol.sidebar.update_venue(venue);
				self.update_marker(venue);

				// See comment above, in the popupopen handler, about doing this
				// CSS-only.

				setTimeout(function() {
					var h = $('.leaflet-popup .name').height();
					if (h < 30) {
						$('.leaflet-popup .name').addClass('single-line');
					} else {
						$('.leaflet-popup .name').removeClass('single-line');
					}
				}, 250);
			}, function() {
				$('.leaflet-popup form .response').removeClass('hidden');
				$('.leaflet-popup form .response').html('Error: Could not save venue name.');
			});
		},

		screengrab: function() {
			self.tangram.scene.screenshot().then(function(sh) {
				var prefix = self.data.map.slug;
				var fname = prefix + '-' + (new Date().getTime()) + '.png';
				saveAs(sh.blob, fname);
			});
		},

		enqueue_photos: function() {
			if (! self.photo_queue) {
				self.photo_queue = [];
			}
			var files = $('#map-upload-input')[0].files;
			for (var i = 0; i < files.length; i++) {
				self.photo_queue.push(files[i]);
			}
			self.photo_reader = new FileReader();
			self.pending_venue_ids = [];
			self.next_photo();
		},

		next_photo: function() {

			if (self.photo_queue.length == 0) {
				smol.maps.map.closePopup();
				return;
			}

			var file = self.photo_queue.shift();

			if (! file.name.match(/\.jpe?g$/i)) {
				alert('Sorry you can only upload JPEG photos.');
				return self.next_photo();
			}

			self.pending_photo = {
				file: file
			};

			self.photo_reader.onload = self.photo_array_buffer;
			self.photo_reader.readAsArrayBuffer(file);
		},

		photo_array_buffer: function(e) {

			if (! e.target ||
			    ! e.target.result) {
				console.error('could not read photo as array buffer');
				return;
			}

			var exif = EXIF.readFromBinaryFile(e.target.result);
			self.pending_photo.exif = exif;

			if (exif.GPSLatitude &&
			    exif.GPSLatitudeRef &&
			    exif.GPSLongitude &&
			    exif.GPSLongitudeRef) {
				self.pending_photo.geotags = self.photo_geotags(exif);
			} else {
				console.error('no GPS coordinates found for ' + self.pending_photo.file.name);
				self.next_photo();
				return;
			}

			if (exif.Orientation) {
				self.pending_photo.orientation = self.photo_orientation(exif);
			}

			self.photo_reader.onload = self.photo_data_uri;
			self.photo_reader.readAsDataURL(self.pending_photo.file);
		},

		photo_data_uri: function(e) {

			if (! e.target ||
			    ! e.target.result) {
				console.error('could not read photo as data URI');
				return;
			}

			self.pending_photo.data_uri = e.target.result;
			self.photo_display();
		},

		photo_display: function() {

			var cb = function(marker) {
				marker.openPopup();
				self.pending_photo.venue_id = marker.venue.id;
				self.upload_photo();
			};

			var lat = self.pending_photo.geotags.latitude;
			var lng = self.pending_photo.geotags.longitude;
			self.create_venue(cb, lat, lng, self.pending_photo);
		},

		upload_photo: function() {

			var data = new FormData();
			var file = self.pending_photo.file;
			data.append('map_id', self.data.map.id);
			data.append('venue_id', self.pending_photo.venue_id);
			data.append('photo', file, file.name);

			var onsuccess = function(rsp) {
				var lookup = {};
				var id;
				for (var i = 0; i < self.data.venues.length; i++) {
					id = parseInt(self.data.venues[i].id);
					if (id == self.pending_photo.venue_id) {
						self.data.venues[i].photo = rsp.data.photo;
						self.update_marker(self.data.venues[i]);
					}
				}
				self.next_photo();
			};

			var onerror = function(rsp) {
				console.error(rsp);
			};

			$.ajax({
				url: '/api/photo',
				data: data,
				type: 'POST',
				contentType: false,
				processData: false
			}).then(onsuccess, onerror);
		},

		// Adapted from https://stackoverflow.com/a/2572991/937170
		photo_geotags: function(exif) {
			var lat = self.photo_exif_geotag(exif.GPSLatitude, exif.GPSLatitudeRef);
			var lng = self.photo_exif_geotag(exif.GPSLongitude, exif.GPSLongitudeRef);
			var geotags = {
				latitude: lat,
				longitude: lng
			};
			if (exif.GPSAltitude && exif.GPSAltitudeRef) {

				// altitude is in meters
				geotags.altitude = parseFloat(exif.GPSAltitude);

				// if ref is 0: altitude is above sea level
				// if ref is 1: altitude is below sea level
				if (exif.GPSAltitudeRef) {
					geotags.altitude = -geotags.altitude;
				}
			}
			return geotags;
		},

		photo_exif_geotag: function(coord, hemi) {
			var degrees = coord.length > 0 ? self.photo_coord(coord[0]) : 0;
			var minutes = coord.length > 1 ? self.photo_coord(coord[1]) : 0;
			var seconds = coord.length > 1 ? self.photo_coord(coord[2]) : 0;

			var flip = (hemi == 'W' || hemi == 'S') ? -1 : 1;

			return flip * (degrees + minutes / 60 + seconds / 3600);
		},

		photo_coord: function(coord) {
			coord = '' + coord;
			var parts = coord.split('/');

			if (parts.length == 0) {
				return 0;
			}

			if (parts.length == 1) {
				return parseFloat(parts[0]);
			}

			return parseFloat(parts[0]) / parseFloat(parts[1]);
		},

		photo_orientation: function(exif) {
			switch (exif.Orientation) {
				case 1:
					return self.exif_orientation_classes.case1;
				case 2:
					return self.exif_orientation_classes.case2;
				case 3:
					return self.exif_orientation_classes.case3;
				case 4:
					return self.exif_orientation_classes.case4;
				case 5:
					return self.exif_orientation_classes.case5;
				case 6:
					return self.exif_orientation_classes.case6;
				case 7:
					return self.exif_orientation_classes.case7;
				case 8:
					return self.exif_orientation_classes.case8;
			}
		}

	};

	$(document).ready(function() {
		self.init();
	});

	return self;
})();
