<?php

use Devristo\Phpws\Messaging\WebSocketMessage;
use Persistence\ButtonStoreCsv;
use Persistence\ButtonStoreDb;
use Persistence\ButtonStoreInterface;
use React\EventLoop\Factory;

require_once('vendor/autoload.php');
// composer does not work live
require_once('src/Persistence/ButtonStoreCsv.php');
require_once('src/Persistence/ButtonStoreDb.php');
require_once('src/Persistence/ButtonStoreInterface.php');

class ButtonDaemon {
	private $wsurl = 'wss://wss.redditmedia.com/thebutton?h=23479c7812ed86afdd50549e60eef640ccee380e&e=1428107042';

	/** @var ButtonStoreInterface */
	private $buttonStoreCsv;
	/** @var ButtonStoreInterface */
	private $buttonStoreDb;

	public function run() {
		$this->buttonStoreDb = new ButtonStoreDb();
		$this->buttonStoreCsv = new ButtonStoreCsv();

		$loop = Factory::create();

		$logger = new \Zend\Log\Logger();
		$writer = new \Zend\Log\Writer\Stream('php://output');
		$logger->addWriter($writer);

		$client = new \Devristo\Phpws\Client\WebSocket($this->wsurl, $loop, $logger);

		$client->on('message', function(WebSocketMessage $message) {
			$this->onMessage($message);
		});

		$client->open();
		$loop->run();
	}

	protected function onMessage(WebSocketMessage $message) {
		$data = json_decode($message->getData());
		$data = $data->payload;
		$participants = preg_replace("/[^0-9]/", "", $data->participants_text);
		$seconds_left = (int)$data->seconds_left;
		$now_str = $data->now_str;
		$ts = explode('-', $now_str);
		$year = $ts[0];
		$month = $ts[1];
		$day = $ts[2];
		$hour = $ts[3];
		$minute = $ts[4];
		$second = $ts[5];
		$now_timestamp = strtotime("$year-$month-$day $hour:$minute:$second");

		$this->buttonStoreDb->insertButton($now_timestamp, $participants, $seconds_left);
		$this->buttonStoreCsv->insertButton($now_timestamp, $participants, $seconds_left);
	}
}

(new ButtonDaemon())->run();
