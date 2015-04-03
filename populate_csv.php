<?php

use Persistence\ButtonStoreCsv;
use Persistence\ButtonStoreDb;

require_once('vendor/autoload.php');

$db = new ButtonStoreDb();
$csv = new ButtonStoreCsv();

$data_db = $db->getAll();
$data_csv = $csv->getAll();

$max_timestamp = $data_csv[1][0];

$merged_data = [];
foreach ($data_db as $db_line) {
	if ($db_line[0] < $max_timestamp) {
		$merged_data[] = $db_line;
	}
}
unset($data_csv[0]);
foreach ($data_csv as $csv_line) {
	$merged_data[] = $csv_line;
}

foreach ($merged_data as &$merged_line) {
	$merged_line = implode(',', $merged_line);
}

$content = 'now_timestamp,participants,seconds_left'.PHP_EOL.implode(PHP_EOL, $merged_data);
file_put_contents('public/button.csv', $content);

