
var constFilterGroupTime = 60;  // only render the lowest data point every this many seconds
var constLimitLiveViewDataPoints = 600;  // limit the live view to this many data points

var plotData = [];  // the drawn plot data - combines historyCompleteData + liveData
var liveData = [];  // data loaded from websocket since opening page
var historyCompleteData = [];  // historic data from server
var historyFilteredData = [];  // history data from server

var lowestTime = 60;  // lowest found value
var lowestDate = new Date();  // lowest found date

var flagAllDataPoints = false;  // flag to choose between the complete history and the filtered one
var flagShowHistory = true;  // flag to display history or not

var plot = undefined;
function initPlot(withFlair) {
	// setup plot
	var options = {
		series: {
			shadowSize: 0
		},
		grid: {
			hoverable: true,
			clickable: true
		},
		yaxis: {
			min: 0,
			max: 60
		},
		xaxis: {
			mode: "time",
			timezone: "browser",
			timeformat: "%Y-%m-%d %H:%m:%S"
		},
		zoom: {
			interactive: true
		},
		pan: {
			interactive: true
		}
	};

	if (withFlair) {
		options.series.threshold = [
			{below: 60,color: "#820080"},
			{below: 51,color: "#0083C7"},
			{below: 41,color: "#02BE01"},
			{below: 31,color: "#E5D900"},
			{below: 21,color: "#E59500"},
			{below: 11,color: "#E50000"}
		]
	}

	plot = $.plot("#placeholder", [ plotData ], options);
}
initPlot(false);

$("#placeholder").bind("plothover", function (event, pos, item) {
	var str = "(" + pos.x.toFixed(2) + ", " + pos.y.toFixed(2) + ")";
	$("#hoverdata").text(str);

	if (item) {
		var x = item.datapoint[0];
		var y = item.datapoint[1];
		var date = new Date(x);

		$("#tooltip").html(y + '<br>' + date.toLocaleString())
			.css({top: item.pageY+5, left: item.pageX-23})
			.fadeIn(200);
	} else {
		$("#tooltip").hide();
	}
});
$("<div id='tooltip'></div>").css({
	position: "absolute",
	display: "none",
	border: "1px solid #fdd",
	padding: "2px",
	"background-color": "#FAFAFA",
	opacity: 0.80
}).appendTo("body");

// slider code
$("#groupByRange").on("change mousemove", function() {
	$("#sliderValue").html($(this).val());
});
$("#groupByRange").on("mouseup", function() {
	recalculateFilter($("#groupByRange").val());
	toggleHistory(true);
});

function updateLowest(value, date) {
	if (value < lowestTime) {
		lowestTime = value;
		lowestDate = date;
		var lowestSpan = $('#lowest');
		lowestSpan.html(lowestTime + " seconds");
		lowestSpan.prop('title', new Date(date).toLocaleString());
	}
}

/**
 * Called on websocket receive live data.
 */
function update(event) {
	if (event == undefined) {
		return;
	}
	// {"type": "ticking", "payload": {"participants_text": "520,984", "tick_mac": "7e010014dd1d86ca7f8b76106b598a90db7429f5", "seconds_left": 59.0, "now_str": "2015-04-03-00-50-07"}}
	var data = JSON.parse(event.data);
	var seconds_left = data.payload.seconds_left;
	var now_str = data.payload.now_str;

	$('#counter').html(seconds_left);

	var ts = now_str.split('-');
	var year = ts[0];
	var month = ts[1];
	var day = ts[2];
	var hour = ts[3];
	var minute = ts[4];
	var second = ts[5];
	var now_timestamp = Date.parse(year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second+' UTC');

	liveData.push([now_timestamp, seconds_left]);
	if (!flagShowHistory && !flagAllDataPoints) {
		// special case that we are just looking at the live view - limit the data points in that case
		if (plotData.length > constLimitLiveViewDataPoints) {
			plotData.shift();
		}
	}
	plotData.push([now_timestamp, seconds_left]);
	updateLowest(seconds_left, now_timestamp);
	refreshPlot();
}

/**
 * Redraw the graph.
 */
function refreshPlot() {
	plot.setData([plotData]);
	plot.setupGrid();
	plot.draw();
}

// prepend csv data to the plot
$.ajax({
	type: "GET",
	url: "button.csv",
	dataType: "text",
	success: function(data) {
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
			historyCompleteData.push([now_timestamp, seconds_left]);
			updateLowest(seconds_left, now_timestamp);
		}
		recalculateFilter(constFilterGroupTime);
		toggleHistory(true);

		$('#loading').hide();
	}
});

/**
 * Prepares the filtered data for plotting.
 * Uses the full history as base.
 * Can be called from console to change the grouping
 * - just call toggleHistory(true) after to force setting data and redraw.
 */
function recalculateFilter(groupBySeconds) {
	historyFilteredData = [];
	var len = historyCompleteData.length;
	var min_now_timestamp = historyCompleteData[0][0];
	var min_seconds_left = historyCompleteData[0][1];
	for (var i = 0; i < len; ++i) {
		if (i % groupBySeconds == 0) {
			// timeframe over - found our minimum. reset min seconds to 60
			historyFilteredData.push([min_now_timestamp, min_seconds_left]);
			min_seconds_left = 60;
		} else if (historyCompleteData[i][1] < min_seconds_left) {
			// found lover second value in time frame - store plus timestamp
			min_seconds_left = historyCompleteData[i][1];
			min_now_timestamp = historyCompleteData[i][0];
		}
	}
}

/**
 * Recalculate the plotData which consists of the history and the live data.
 * The prepended history is optional and en-/disabled with this function.
 */
function toggleHistory(historyOn) {
	flagShowHistory = historyOn;  // just used to track history toggle state
	if (historyOn) {
		if (flagAllDataPoints) {
			plotData = [].concat(historyCompleteData, liveData);
		} else {
			plotData = [].concat(historyFilteredData, liveData);
		}
	} else {
		plotData = liveData;
	}
	refreshPlot();
}

// listen to history toggle change
$('#history').change(function() {
	if($(this).is(":checked")) {
		// with history
		toggleHistory(true);
		$("#range").show();
	} else {
		// without history
		toggleHistory(false);
		$("#range").hide();
	}
});

// listen history filter
$('#flagAllDataPoints').change(function() {
	flagAllDataPoints = $(this).is(":checked");
	toggleHistory(true);
});

// flair color toggle
$('#flairColor').change(function() {
	var showFlair = $(this).is(":checked");
	initPlot(showFlair);
});

function initWebSocket(url) {
	// start the websocket connection
	var webSocket = new WebSocket(url);
	webSocket.onmessage = update;
	webSocket.onerror = function() {
		// try to refetch with backend provided ws url
		$.get('getnewwsurl.php', function(data) {
				if (data) {
					initWebSocket(data);
				}
			}
		);
	};
}
initWebSocket('wss://wss.redditmedia.com/thebutton?h=028c31feed150f7e2806cec3435f482e4c0e068c&e=1428514746');
