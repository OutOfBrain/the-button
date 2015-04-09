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
		if (ws.updateCallback) {
			webSocket.onmessage = ws.updateCallback;
		}
		webSocket.onerror = ws.init()
	}
};
