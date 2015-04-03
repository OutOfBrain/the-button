<?php

use Devristo\Phpws\Messaging\WebSocketMessage;
use Persistence\ButtonStore;
use React\EventLoop\Factory;

require_once('vendor/autoload.php');


class ButtonDaemon {
	private $wsurl = 'wss://wss.redditmedia.com/thebutton?h=23479c7812ed86afdd50549e60eef640ccee380e&e=1428107042';

	/** @var ButtonStore */
	private $buttonStore;

	public function run() {
		$this->buttonStore = new ButtonStore();

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

		$this->buttonStore->insertButton($now_timestamp, $participants, $seconds_left);
	}
}

(new ButtonDaemon())->run();
