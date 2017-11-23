// From https://en.wiktionary.org/wiki/Appendix:Basic_English_word_list

var self = {

	descriptive: ['able', 'acid', 'angry', 'automatic', 'beautiful', 'black', 'boiling', 'bright', 'broken', 'brown', 'cheap', 'chemical', 'chief', 'clean', 'clear', 'common', 'complex', 'conscious', 'cut', 'deep', 'dependent', 'early', 'elastic', 'electric', 'equal', 'fat', 'fertile', 'first', 'fixed', 'flat', 'free', 'frequent', 'full', 'general', 'good', 'great', 'grey', 'hanging', 'happy', 'hard', 'healthy', 'high', 'hollow', 'important', 'kind', 'like', 'living', 'long', 'married', 'material', 'medical', 'military', 'natural', 'necessary', 'new', 'normal', 'open', 'parallel', 'past', 'physical', 'political', 'poor', 'possible', 'present', 'private', 'probable', 'quick', 'quiet', 'ready', 'red', 'regular', 'responsible', 'right', 'round', 'same', 'second', 'separate', 'serious', 'sharp', 'smooth', 'sticky', 'stiff', 'straight', 'strong', 'sudden', 'sweet', 'tall', 'thick', 'tight', 'tired', 'true', 'violent', 'waiting', 'warm', 'wet', 'wide', 'wise', 'yellow', 'young'],

	picturable: ['angle', 'ant', 'apple', 'arch', 'arm', 'army', 'baby', 'bag', 'ball', 'band', 'basin', 'basket', 'bath', 'bed', 'bee', 'bell', 'berry', 'bird', 'blade', 'board', 'boat', 'bone', 'book', 'boot', 'bottle', 'box', 'boy', 'brain', 'brake', 'branch', 'brick', 'bridge', 'brush', 'bucket', 'bulb', 'button', 'cake', 'camera', 'card', 'cart', 'carriage', 'cat', 'chain', 'cheese', 'chest', 'chin', 'church', 'circle', 'clock', 'cloud', 'coat', 'collar', 'comb', 'cord', 'cow', 'cup', 'curtain', 'cushion', 'dog', 'door', 'drain', 'drawer', 'dress', 'drop', 'ear', 'egg', 'engine', 'eye', 'face', 'farm', 'feather', 'finger', 'fish', 'flag', 'floor', 'fly', 'foot', 'fork', 'fowl', 'frame', 'garden', 'girl', 'glove', 'goat', 'gun', 'hair', 'hammer', 'hand', 'hat', 'head', 'heart', 'hook', 'horn', 'horse', 'hospital', 'house', 'island', 'jewel', 'kettle', 'key', 'knee', 'knife', 'knot', 'leaf', 'leg', 'library', 'line', 'lip', 'lock', 'map', 'match', 'monkey', 'moon', 'mouth', 'muscle', 'nail', 'neck', 'needle', 'nerve', 'net', 'nose', 'nut', 'office', 'orange', 'oven', 'parcel', 'pen', 'pencil', 'picture', 'pig', 'pin', 'pipe', 'plane', 'plate', 'plough', 'pocket', 'pot', 'potato', 'prison', 'pump', 'rail', 'rat', 'receipt', 'ring', 'rod', 'roof', 'root', 'sail', 'school', 'scissors', 'screw', 'seed', 'sheep', 'shelf', 'ship', 'shirt', 'shoe', 'skin', 'skirt', 'snake', 'sock', 'spade', 'sponge', 'spoon', 'spring', 'square', 'stamp', 'star', 'station', 'stem', 'stick', 'stocking', 'stomach', 'store', 'street', 'sun', 'table', 'tail', 'thread', 'throat', 'thumb', 'ticket', 'toe', 'tongue', 'tooth', 'town', 'train', 'tray', 'tree', 'trousers', 'umbrella', 'wall', 'watch', 'wheel', 'whip', 'whistle', 'window', 'wing', 'wire', 'worm'],

	random: function() {
		var d_index = Math.floor(Math.random() * self.descriptive.length);
		var p_index = Math.floor(Math.random() * self.picturable.length);
		var descriptive = self.descriptive[d_index];
		var picturable = self.picturable[p_index];
		return descriptive + '-' + picturable;
	}

};

module.exports = self;
