<?php


namespace Persistence;


class ButtonStoreCsv implements ButtonStoreInterface {
	private $csvName = 'public/button.csv';
	private $header = 'now_timestamp,participants,seconds_left';

	public function __construct() {
		if (!file_exists($this->csvName)) {
			// init headers
			file_put_contents($this->csvName, $this->header . PHP_EOL);
		}
	}

	public function insertButton($nowTimestamp, $participants, $secondsLeft) {
		file_put_contents($this->csvName, "$nowTimestamp,$participants,$secondsLeft".PHP_EOL, FILE_APPEND);
	}

	public function getAll() {
		$lines = explode("\n", file_get_contents($this->csvName));
		foreach ($lines as &$line) {
			$line = explode(',', $line);
		}
		array_shift($lines);  // remove header
		array_pop($lines);  // remove last line
		return $lines;
	}
}
