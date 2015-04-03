<?php

class ButtonStore {
	/** @var SQLite3 */
	private $db;
	private $dbName = 'button.db';

	public function __construct() {
		$dbPath = $this->dbName;
		$this->db = new SQLite3($dbPath);
		$this->db->exec('
			CREATE TABLE IF NOT EXISTS button (
				now integer,
				participants integer,
				seconds_left integer
			)
		');
	}

	public function insertButton($now_timestamp, $participants, $seconds_left) {
		$statement = $this->db->prepare('
			INSERT INTO button (now, participants, seconds_left) VALUES (?, ?, ?)
		');
		$statement->bindValue(1, $now_timestamp);
		$statement->bindValue(2, $participants);
		$statement->bindValue(3, $seconds_left);
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
