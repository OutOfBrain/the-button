
var app = {
	plot: plot,
	ws: ws,
	ui: ui,

	plotData: [],  // the drawn plot data - combines historyCompleteData + liveData
	liveData: [],  // data loaded from websocket since opening page
	historyCompleteData: [],  // historic data from server
	historyFilteredData: [],  // filtered history data
	constFilterGroupTime: 60,  // only render the lowest data point every this many seconds

	lowestTime: 60,  // lowest found value
	lowestDate: new Date(),  // lowest found date

	/**
	 * Recalculate the plotData which consists of the history and the live data.
	 * The prepended history is optional and en-/disabled with this function.
	 */
	toggleHistory: function(historyOn) {
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
			this.ui.updateLowest(this.lowestTime, this.lowestDate);
		}
	},

	/**
	 * Called on websocket receive live data.
	 */
	callbackUpdate: function(now_timestamp, seconds_left) {
		var that = app;
		that.ui.updateCounter(seconds_left);

		that.liveData.push([now_timestamp, seconds_left]);
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
		app.historyFilteredData = [];
		var len = app.historyCompleteData.length;
		var min_now_timestamp = app.historyCompleteData[0][0];
		var min_seconds_left = app.historyCompleteData[0][1];
		for (var i = 0; i < len; ++i) {
			if (i % groupBySeconds == 0) {
				// timeframe over - found our minimum. reset min seconds to 60
				app.historyFilteredData.push([min_now_timestamp, min_seconds_left]);
				min_seconds_left = 60;
			} else if (app.historyCompleteData[i][1] < min_seconds_left) {
				// found lover second value in time frame - store plus timestamp
				min_seconds_left = app.historyCompleteData[i][1];
				min_now_timestamp = app.historyCompleteData[i][0];
			}
		}

		app.toggleHistory(true);
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
		this.ui.loadingShow();

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
				that.ui.loadingHide();
			}
		});
	},

	callbackHistoryToggle: function(on) {
		if (on && app.historyCompleteData.length === 0) {
			app.loadHistory();
		}
		app.toggleHistory(on);
	},

	callbackFlairToggle: function(on) {
		app.plot.updateOptions(on);
		app.plot.refreshPlot(app.plotData);
	},

	start: function() {
		this.ui.callbackSlider = this.recalculateFilter;
		this.ui.callbackHistoryToggle = this.callbackHistoryToggle;
		this.ui.callbackFlairToggle = this.callbackFlairToggle;
		this.ui.init();
		this.ws.init(this.callbackUpdate);
		this.plot.init(false);
		this.plot.updateOptions(true);
		this.loadLowestValue();
	}
};

app.start();
