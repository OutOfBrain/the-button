var plot = {
	plot: undefined,

	init: function(withFlair) {
		$("#placeholder").bind("plothover", function (event, pos, item) {
			var str = "(" + pos.x.toFixed(2) + ", " + pos.y.toFixed(2) + ")";
			$("#hoverdata").text(str);

			if (item) {
				var x = item.datapoint[0];
				var y = item.datapoint[1];
				var date = new Date(x);

				$("#tooltip").html(y + '<br>' + date.toLocaleString())
					.css({top: item.pageY + 5, left: item.pageX - 23})
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


		// setup plot
		var options = {
			series: {
				bars: {
					show: false,
					barWidth: 1000
				},
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

		this.plot = $.plot("#placeholder", [ [] ], options);
	},

	updateOptions: function(withFlair) {
		var options = this.plot.getOptions();
		if (withFlair) {
			options.series.threshold = [
				{below: 61.5, color: "#820080"},
				{below: 51.5, color: "#0083C7"},
				{below: 41.5, color: "#02BE01"},
				{below: 31.5, color: "#E5D900"},
				{below: 21.5, color: "#E59500"},
				{below: 11.5, color: "#E50000"}
			]
		} else {
			options.series.threshold = [];
		}
	},

	toggleBars: function(on) {
		var options = this.plot.getOptions();
		options.series.bars.show = on;
	},

	/**
	 * Redraw the graph.
	 */
	refreshPlot: function(plotData) {
		this.plot.setData([plotData]);
		this.plot.setupGrid();
		this.plot.draw();
	}
};
