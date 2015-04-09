
var app = {
	plot: plot,
	ws: ws,
	ui: ui,
	backend: backend,

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
	 * Called on web socket receive live data.
	 */
	callbackUpdate: function(nowTimestamp, participants, secondsLeft) {
		var that = app;
		that.ui.updateCounter(secondsLeft);

		if (participants != that.currentParticipants) {
			// there was a click
			that.currentParticipants = participants;
			that.lastPointUpdate(that.currentSecondsLeft);
			++that.currentIndex;
			that.plotData.push([that.currentIndex, 60 - secondsLeft]);
		} else {
			that.lastPointUpdate(that.currentSecondsLeft);
		}

		that.currentTimestamp = nowTimestamp;
		that.currentSecondsLeft = secondsLeft;

		//that.liveData.push([now_timestamp, seconds_left]);
		//that.updateLowest(seconds_left, now_timestamp);

		//that.plotData.push([now_timestamp, seconds_left]);
		that.plot.refreshPlot(that.plotData);
	},
	lastPointUpdate: function(value) {
		if (value == undefined) {
			return;
		}
		console.log('at ' + this.currentIndex + ' update ' + value);
		this.plotData.pop();
		this.plotData.push([this.currentIndex, 60 - value]);
	},

	currentIndex: 0,

	currentTime: undefined,
	currentSecondsLeft: undefined,
	currentParticipants: undefined,


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

	callbackLoadedLowestValue: function(line) {
		app.updateLowest(line[1], line[0]);
	},

	callbackHistoryAll: function(lines) {
		var len = lines.length;
		var elements = [];
		for (var i = 0; i < len; ++i) {
			elements = lines[i].split(/,/);

			// * 1000 since milliseconds are used
			var now_timestamp = parseInt(elements[0]) * 1000;
			var seconds_left = parseInt(elements[2]);
			app.historyCompleteData.push([now_timestamp, seconds_left]);
			app.updateLowest(seconds_left, now_timestamp);
		}
		app.recalculateFilter(app.constFilterGroupTime);
		app.toggleHistory(true);
		app.ui.loadingHide();
	},

	loadHistory: function() {
		app.ui.loadingShow();
		app.backend.loadAll(app.callbackHistoryAll);
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
		this.backend.loadLowestValue(this.callbackLoadedLowestValue);
	}
};

app.start();
