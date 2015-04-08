<?php
namespace Persistence;

interface ButtonStoreInterface
{
	public function insertButton($nowTimestamp, $participants, $secondsLeft);

	/**
	 * @return [now_timestamp,participants,seconds_left]
	 */
	public function getAll();
}
