<?php

namespace Persistence;

/**
 * Track clicks of the button.
 */
class ButtonStoreClicksCsv {

	private $csvName = 'public/button_clicks.csv';
	private $header = 'now_timestamp,participants,seconds_left';

	private $currentParticipants = 0;
	private $currentTimestamp = 0;
	private $currentSecondsLeft = 60;

	public function __construct(ButtonStoreInterface $buttonStore) {
		// write header, reset file
		file_put_contents($this->csvName, $this->header.PHP_EOL);
		foreach ($buttonStore->getAll() as $line) {
			list($nowTimestamp, $participants, $secondsLeft) = $line;
			$this->insertButton($nowTimestamp, $participants, $secondsLeft);
		}
	}

	public function insertButton($nowTimestamp, $participants, $secondsLeft) {
		if ($participants != $this->currentParticipants) {
			// there was a click
			$peopleClicking = $participants - $this->currentParticipants;
			$this->write($this->currentTimestamp, $peopleClicking, $this->currentSecondsLeft);
			$this->currentParticipants = $participants;
		}

		$this->currentTimestamp = $nowTimestamp;
		$this->currentSecondsLeft = $secondsLeft;
	}

	private function write($timestamp, $peopleClicking, $secondsLeft) {
		if ($timestamp) {
			// not default 0 timestamp - happens with first entry
			file_put_contents($this->csvName, "$timestamp,$peopleClicking,$secondsLeft".PHP_EOL, FILE_APPEND);
		}
	}
}
