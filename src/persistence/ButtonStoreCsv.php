<?php


namespace Persistence;


class ButtonStoreCsv implements ButtonStoreInterface {
	private $csvName = 'public/button.csv';

	public function __construct() {
		if (!file_exists($this->csvName)) {
			// init headers
			file_put_contents($this->csvName, 'now_timestamp,participants,seconds_left' . PHP_EOL);
		}
	}

	public function insertButton($now_timestamp, $participants, $seconds_left) {
		file_put_contents($this->csvName, "$now_timestamp,$participants,$seconds_left".PHP_EOL, FILE_APPEND);
	}

	public function getAll() {
		return explode(',', file_get_contents($this->csvName));
	}
}
