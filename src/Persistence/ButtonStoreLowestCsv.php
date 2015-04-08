<?php

namespace Persistence;

/**
 * Find and maintain the lowest value and timestamp
 */
class ButtonStoreLowestCsv {
	private $lowestName = 'public/lowest';
	private $lowestValue = 60;
	private $lowestTime = 0;

	public function __construct(ButtonStoreInterface $buttonStore) {
		foreach ($buttonStore->getAll() as list($nowTimestamp, $participants, $secondsLeft)) {
			$this->checkLowest($nowTimestamp, $secondsLeft);
		}

		$this->write();
	}

	public function insertButton($nowTimestamp, $participants, $secondsLeft) {
		if ($this->checkLowest($nowTimestamp, $secondsLeft)) {
			$this->write();
		}
	}

	private function checkLowest($time, $secondsLeft) {
		if ($secondsLeft < $this->lowestValue) {
			$this->lowestValue = $secondsLeft;
			$this->lowestTime = $time;
			return true;
		}
		return false;
	}


	private function write() {
		file_put_contents($this->lowestName, $this->lowestTime . ',' . $this->lowestValue);
	}
}
