
var app = {
	plot: plot,
	elements: {
		lowestValue: $('#lowest'),
		groupByRange: $("#groupByRange"),
		loading: $('#loading'),
		counter: $('#counter'),
		history: $('#history'),
		flairColor: $('#flairColor'),
		contact: $('#contact')
	},
	plotData: [],  // the drawn plot data - combines historyCompleteData + liveData
	liveData: [],  // data loaded from websocket since opening page
	historyCompleteData: [],  // historic data from server
	historyFilteredData: [],  // history data from server
	constFilterGroupTime: 60,  // only render the lowest data point every this many seconds
	constLimitLiveViewDataPoints: 600,  // limit the live view to this many data points

	lowestTime: 60,  // lowest found value
	lowestDate: new Date(),  // lowest found date

	flagShowHistory: true,  // flag to display history or not

	/**
	 * Recalculate the plotData which consists of the history and the live data.
	 * The prepended history is optional and en-/disabled with this function.
	 */
	toggleHistory: function(historyOn) {
		this.flagShowHistory = historyOn;  // just used to track history toggle state
		if (historyOn) {
			this.plotData = [].concat(this.historyFilteredData, this.liveData);
		} else {
			this.plotData = this.liveData;
		}
		this.plot.refreshPlot(this.plotData);
	},

	updateLowest: function(value, date) {
		if (value < this.lowestTime) {
			this.lowestTime = value;
			this.lowestDate = date;
			this.elements.lowestValue.html(this.lowestTime + " seconds");
			this.elements.lowestValue.prop('title', new Date(date).toLocaleString());
		}
	},

	/**
	 * Called on websocket receive live data.
	 */
	update: function(event) {
		var that = app;
		if (event == undefined) {
			return;
		}
		// {"type": "ticking", "payload": {"participants_text": "520,984", "tick_mac": "7e010014dd1d86ca7f8b76106b598a90db7429f5", "seconds_left": 59.0, "now_str": "2015-04-03-00-50-07"}}
		var data = JSON.parse(event.data);
		var seconds_left = data.payload.seconds_left;
		var now_str = data.payload.now_str;

		that.elements.counter.html(seconds_left);

		var ts = now_str.split('-');
		var year = ts[0];
		var month = ts[1];
		var day = ts[2];
		var hour = ts[3];
		var minute = ts[4];
		var second = ts[5];
		var now_timestamp = Date.parse(year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + ' UTC');

		that.liveData.push([now_timestamp, seconds_left]);
		if (!that.flagShowHistory) {
			// special case that we are just looking at the live view - limit the data points in that case
			if (that.plotData.length > that.constLimitLiveViewDataPoints) {
				that.plotData.shift();
			}
		}
		that.plotData.push([now_timestamp, seconds_left]);
		that.updateLowest(seconds_left, now_timestamp);
		that.plot.refreshPlot(that.plotData);
	},


	/**
	 * Prepares the filtered data for plotting.
	 * Uses the full history as base.
	 * Can be called from console to change the grouping
	 * - just call toggleHistory(true) after to force setting data and redraw.
	 */
	recalculateFilter: function(groupBySeconds) {
		this.historyFilteredData = [];
		var len = this.historyCompleteData.length;
		var min_now_timestamp = this.historyCompleteData[0][0];
		var min_seconds_left = this.historyCompleteData[0][1];
		for (var i = 0; i < len; ++i) {
			if (i % groupBySeconds == 0) {
				// timeframe over - found our minimum. reset min seconds to 60
				this.historyFilteredData.push([min_now_timestamp, min_seconds_left]);
				min_seconds_left = 60;
			} else if (this.historyCompleteData[i][1] < min_seconds_left) {
				// found lover second value in time frame - store plus timestamp
				min_seconds_left = this.historyCompleteData[i][1];
				min_now_timestamp = this.historyCompleteData[i][0];
			}
		}
	},

	initWebSocket: function(url) {
		var that = this;
		// start the websocket connection
		var webSocket = new WebSocket(url);
		webSocket.onmessage = this.update;
		webSocket.onerror = that.getNewUrl;
	},

	getNewUrl: function() {
		var that = app;
		// try to refetch with backend provided ws url
		$.get('getnewwsurl.php', function (data) {
			if (data) {
				that.initWebSocket(data);
			}
		});
	},

	setupUi: function() {
		var that = this;
		// slider code
		this.elements.groupByRange.on("change mousemove", function () {
			$("#sliderValue").html($(this).val());
		});
		this.elements.groupByRange.on("mouseup", function () {
			that.recalculateFilter($("#groupByRange").val());
			that.toggleHistory(true);
		});

		// listen to history toggle change
		this.elements.history.change(function () {
			if ($(this).is(":checked")) {
				// with history - load if not present yet
				if (that.historyCompleteData.length === 0) {
					that.loadHistory();
				} else {
					that.toggleHistory(true);
				}
				$("#range").show();
			} else {
				// without history
				that.toggleHistory(false);
				$("#range").hide();
			}
		});

		// flair color toggle
		this.elements.flairColor.change(function () {
			var showFlair = $(this).is(":checked");
			that.plot.updateOptions(showFlair);
			that.plot.refreshPlot(that.plotData);
		});

		// contact information
		this.elements.contact.click(function(){
			$(this).css('textDecoration', 'none');
			$(this).html('OutOfBrain@gmail.com /u/OutOfBrain');
		});
	},

	loadLowestValue: function() {
		var that = this;
		$.ajax({
			type: "GET",
			url: "lowest",
			dataType: "text",
			success: function(data) {
				// timestamp,value
				var splitData = data.trim().split(/,/);
				that.updateLowest(splitData[1], splitData[0]);
			}
		});
	},

	loadHistory: function() {
		this.elements.loading.show();

		var that = this;
		// prepend csv data to the plot
		$.ajax({
			type: "GET",
			url: "button.csv",
			dataType: "text",
			success: function (data) {
				var lines = data.split(/\n/);
				lines.shift();  // remove header
				lines.pop();  // remove last line - is empty

				var len = lines.length;
				var elements = [];
				for (var i = 0; i < len; ++i) {
					elements = lines[i].split(/,/);

					// * 1000 since milliseconds are used
					var now_timestamp = parseInt(elements[0]) * 1000;
					var seconds_left = parseInt(elements[2]);
					that.historyCompleteData.push([now_timestamp, seconds_left]);
					that.updateLowest(seconds_left, now_timestamp);
				}
				that.recalculateFilter(that.constFilterGroupTime);
				that.toggleHistory(true);
				that.elements.loading.hide();
			}
		});
	},

	start: function() {
		this.plot.init(false);
		this.setupUi();
		this.loadLowestValue();
		this.getNewUrl();
	}
};

app.start();
