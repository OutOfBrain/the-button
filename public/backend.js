var backend = {
	loadAll: function(callback) {
		$.ajax({
			type: "GET",
			url: "button_clicks.csv",
			dataType: "text",
			success: function (data) {
				var lines = data.split(/\n/);
				lines.shift();  // remove header
				lines.pop();  // remove last line - is empty

				callback(lines);
			}
		});
	},

	loadLowestValue: function(callback) {
		$.ajax({
			type: "GET",
			url: "lowest",
			dataType: "text",
			success: function(data) {
				// timestamp,value
				var splitData = data.trim().split(/,/);
				callback(splitData);
			}
		});
	}
};
