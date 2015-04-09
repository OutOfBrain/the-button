var ws = {
	updateCallback: undefined,

	init: function(updateCallback) {
		if (updateCallback != undefined) {
			this.updateCallback = updateCallback;
		}

		$.get('getnewwsurl.php', function (data) {
			if (data) {
				ws.openWs(data);
			}
		});
	},

	openWs: function(url) {
		// start the websocket connection
		var webSocket = new WebSocket(url);
		webSocket.onmessage = ws.onMessage;
		webSocket.onerror = ws.init;
	},

	onMessage: function(event) {
		if (event == undefined) {
			return;
		}
		// {"type": "ticking", "payload": {"participants_text": "520,984", "tick_mac": "7e010014dd1d86ca7f8b76106b598a90db7429f5", "seconds_left": 59.0, "now_str": "2015-04-03-00-50-07"}}
		var data = JSON.parse(event.data);
		var seconds_left = data.payload.seconds_left;
		var now_str = data.payload.now_str;

		var ts = now_str.split('-');
		var year = ts[0];
		var month = ts[1];
		var day = ts[2];
		var hour = ts[3];
		var minute = ts[4];
		var second = ts[5];
		var now_timestamp = Date.parse(year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + ' UTC');

		if (ws.updateCallback) {
			ws.updateCallback(now_timestamp, seconds_left);
		}
	}
};
