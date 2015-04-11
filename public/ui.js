var ui = {
	lowestValue: $('#lowest'),
	counter: $('#counter'),
	loading: $('#loading'),
	history: $('#history'),
	groupByRange: $("#groupByRange"),
	flairColor: $('#flairColor'),
	barsToggle: $('#bars'),
	contact: $('#contact'),

	callbackSlider: undefined,
	callbackHistoryToggle: undefined,
	callbackFlairToggle: undefined,
	callbackBarsToggle: undefined,

	init: function() {
		var that = this;

		// slider code
		this.groupByRange.on("change mousemove", function () {
			$("#sliderValue").html($(this).val());
		});
		this.groupByRange.on("mouseup", function () {
			that.callbackSlider($("#groupByRange").val());
		});

		// listen to history toggle change
		this.history.change(function () {
			that.callbackHistoryToggle($(this).is(":checked"));
			$("#range").toggle();
		});

		// flair color toggle
		this.flairColor.change(function () {
			that.callbackFlairToggle($(this).is(":checked"));
		});

		// bars toggle
		this.barsToggle.change(function() {
			that.callbackBarsToggle($(this).is(":checked"));
		});

		// contact information
		this.contact.click(function() {
			$(this).css('textDecoration', 'none');
			$(this).html('OutOfBrain@gmail.com /u/OutOfBrain');
		});
	},

	updateLowest: function(lowestDate, lowestTime) {
		this.lowestValue.html(lowestTime + " seconds");
		this.lowestValue.prop('title', new Date(lowestDate).toLocaleString());
	},

	updateCounter: function(seconds_left) {
		this.counter.html(seconds_left);
	},

	loadingShow: function() {
		this.loading.show();
	},

	loadingHide: function() {
		this.loading.hide()
	}
};
