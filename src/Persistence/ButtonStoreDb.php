<?php
namespace Persistence;

use SQLite3;

class ButtonStoreDb implements ButtonStoreInterface {
	/** @var SQLite3 */
	private $db;
	private $dbName = 'button.db';

	public function __construct() {
		$dbPath = $this->dbName;
		$this->db = new SQLite3($dbPath);
		$this->db->busyTimeout(100);
		$this->db->exec('
			CREATE TABLE IF NOT EXISTS button (
				now integer,
				participants integer,
				seconds_left integer
			)
		');
	}

	public function insertButton($nowTimestamp, $participants, $secondsLeft) {
		$statement = $this->db->prepare('
			INSERT INTO button (now, participants, seconds_left) VALUES (?, ?, ?)
		');
		$statement->bindValue(1, $nowTimestamp);
		$statement->bindValue(2, $participants);
		$statement->bindValue(3, $secondsLeft);
		$statement->execute();
	}

	public function getAll() {
		$result = $this->db->query('
			SELECT now, participants, seconds_left FROM button
		');
		$result_array = [];
		while ($line = $result->fetchArray(SQLITE3_NUM)) {
			$result_array[] = $line;
		}

		return $result_array;
	}
}
