var smol = smol || {};
smol.menu = (function() {

	var self = {

		init: function() {

			$('#menu-close').click(self.hide);
			$('.btn-cancel').click(function(e) {
				e.preventDefault();
				self.hide();
			});

			// Cancel button
			$(window).keypress(function(e) {
				if (e.keyCode == 27 &&
				    $('#menu').hasClass('active')) {
					e.preventDefault();
					app.hide();
				}
			});

			$('#menu form').submit(self.submit);
		},

		show: function(page) {
			$('#menu .visible').removeClass('visible');
			$('#' + page).addClass('visible');
			$('#menu').addClass('active');
			$('#menu').scrollTop(0);
			$('#menu').trigger(page + '-show');
		},

		hide: function() {
			var $visible = $('.menu-page.visible');
			var page = $visible.attr('id');
			$('#menu').removeClass('active');
			$('#menu').trigger(page + '-hide');
		},

		submit: function(e) {
			e.preventDefault();

			var $form = $(e.target);
			var url = $form.attr('action');
			var data = $form.serialize();

			var onsuccess = function() {
				var page = $form.attr('id');
				var args = $form.serializeArray();
				var data = {};
				for (var i = 0; i < args.length; i++) {
					var key = args[i].name;
					data[key] = args[i].value;
				}
				$('#menu').trigger(page + '-submit', [data]);
			};

			var onerror = function(rsp) {
				// Something better than this...
				console.error(rsp);
			};

			$.post(url, data).then(onsuccess, onerror);
		}

	};

	$(document).ready(function() {
		self.init();
	});

	return self;
})();
