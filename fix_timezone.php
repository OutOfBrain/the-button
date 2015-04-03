<?php

use Persistence\ButtonStoreCsv;

require_once('vendor/autoload.php');

// fix csv
$storeCsv = new ButtonStoreCsv();
$data = $storeCsv->getAll();
array_shift($data);
array_pop($data);

foreach ($data as &$line) {
	$line[0] = $line[0] + 2 * 60 * 60;
	$line = implode(',', $line);
}
file_put_contents('public/button.csv', implode(PHP_EOL, $data));


// fix db
$db = new SQLite3('button.db');
$db->busyTimeout(100);
$db->exec('update button set now = now + 2 * 60 * 60');
