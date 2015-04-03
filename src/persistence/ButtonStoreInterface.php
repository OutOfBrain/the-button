<?php
namespace Persistence;

interface ButtonStoreInterface
{
	public function insertButton($now_timestamp, $participants, $seconds_left);

	public function getAll();
}
