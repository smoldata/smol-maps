var smol = smol || {};

smol.esc_html = function(html) {

	// & comes first, to avoid double-encoding
	var esc_html = html.replace(/&/g, '&amp;');

	// angle brackets next
	esc_html = esc_html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

	// and now quotes
	esc_html = esc_html.replace(/'/g, '&#039;').replace(/"/g, '&quot;');

	return esc_html;
};
