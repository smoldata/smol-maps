(function (factory, window) {
	// see https://github.com/Leaflet/Leaflet/blob/master/PLUGIN-GUIDE.md#module-loaders
	// for details on how to structure a leaflet plugin.

	// define an AMD module that relies on 'leaflet'
	if (typeof define === 'function' && define.amd) {
		define(['leaflet'], factory);

	// define a Common JS module that relies on 'leaflet'
	} else if (typeof exports === 'object') {
		if (typeof window !== 'undefined' && window.L) {
			module.exports = factory(L);
		} else {
			module.exports = factory(require('leaflet'));
		}
	}

	// attach your plugin to the global 'L' variable
	if (typeof window !== 'undefined' && window.L){
		window.L.Control.AddVenue = factory(L);
	}

} (function (L) {

	var long_click = false;

	var AddVenue = L.Control.extend({

		options: {
			position: 'bottomright',
			layer: undefined,
			iconAttrs: {
				'style': 'background-image: url(/img/icons/marker-stroked.svg);',
				'class': 'icon inverted'
			},
			iconElementTag: 'span',
			strings: {
				title: 'Add a venue'
			},
			createButtonCallback: function (container, options) {
				var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single icon-bg', container);
				link.title = options.strings.title;
				var icon = L.DomUtil.create(options.iconElementTag, '', link);
				for (var attr in options.iconAttrs) {
					icon.setAttribute(attr, options.iconAttrs[attr]);
				}
				return { link: link, icon: icon };
			}
		},

		initialize: function (options) {
			for (var i in options) {
				if (typeof this.options[i] === 'object') {
					L.extend(this.options[i], options[i]);
				} else {
					this.options[i] = options[i];
				}
			}
		},

		onAdd: function (map) {
			var container = L.DomUtil.create('div', 'leaflet-control-add-venue leaflet-bar leaflet-control');

			this._layer = this.options.layer || new L.LayerGroup();
			this._layer.addTo(map);
			this._event = undefined;
			this._prevBounds = null;

			var linkAndIcon = this.options.createButtonCallback(container, this.options);
			this._link = linkAndIcon.link;
			this._icon = linkAndIcon.icon;

			L.DomEvent
				.on(this._link, 'click', L.DomEvent.stopPropagation)
				.on(this._link, 'click', L.DomEvent.preventDefault)
				.on(this._link, 'click', this._onClick, this)
				.on(this._link, 'dblclick', L.DomEvent.stopPropagation);

			var press_hold_timeout;
			var self = this;
			L.DomEvent
				.on(this._link, 'mousedown', function(e) {
					press_hold_timeout = setTimeout(function() {
						press_hold_timeout = null;
						if (self.options.longHold) {
							self.options.longHold(e);
						}
					}, 1000);
				})
				.on(this._link, 'mouseup', function(e) {
					if (press_hold_timeout) {
						clearTimeout(press_hold_timeout);
						press_hold_timeout = null;
					} else {
						long_click = true;
					}
				});

			this._map.on('unload', this._unload, this);

			return container;
		},

		_onClick: function() {
			if (long_click) {
				long_click = false;
				if (this.options.longClick) {
					this.options.longClick();
				}
			} else if (this.options.click) {
				this.options.click();
			}
		},

		_unload: function() {
			//this.stop();
			this._map.off('unload', this._unload, this);
		}
	});

	L.control.addVenue = function (options) {
		return new L.Control.AddVenue(options);
	};

	return AddVenue;

}, window));
