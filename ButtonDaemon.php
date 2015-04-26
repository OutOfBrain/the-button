<?php
ini_set('memory_limit', '2G');

use Devristo\Phpws\Messaging\WebSocketMessage;
use Persistence\ButtonStoreClicksCsv;
use Persistence\ButtonStoreCsv;
use Persistence\ButtonStoreDb;
use Persistence\ButtonStoreInterface;
use Persistence\ButtonStoreLowestCsv;
use React\EventLoop\Factory;

require_once('vendor/autoload.php');

class ButtonDaemon {
	private $wsurl = 'wss://wss.redditmedia.com/thebutton?h=5c5639919df374a7ebd30b9b6f568a99ea5e9765&e=1430150352';


	public function __construct($wsurl) {
		if ($wsurl) {
			$this->wsurl = $wsurl;
		}
	}

	/** @var ButtonStoreInterface */
	private $buttonStoreCsv;
	/** @var ButtonStoreInterface */
	private $buttonStoreDb;

	/** @var ButtonStoreLowestCsv */
	private $buttonStoreLowestCsv;
	/** @var ButtonStoreClicksCsv */
	private $buttonStoreClicksCsv;

	public function run() {
		$this->buttonStoreDb = new ButtonStoreDb();
		$this->buttonStoreCsv = new ButtonStoreCsv();
		$this->buttonStoreLowestCsv = new ButtonStoreLowestCsv($this->buttonStoreCsv);
		$this->buttonStoreClicksCsv = new ButtonStoreClicksCsv($this->buttonStoreCsv);
		echo('init done' . PHP_EOL);

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
		$now_timestamp = strtotime("$year-$month-$day $hour:$minute:$second UTC");

		// fix case of button downtime / end
		if (!$now_timestamp) {
			$now_timestamp = 0;
		}
		if (!$participants) {
			$participants = 0;
		}
		if (!$seconds_left) {
			$seconds_left = 0;
		}

		$this->buttonStoreDb->insertButton($now_timestamp, $participants, $seconds_left);
		$this->buttonStoreCsv->insertButton($now_timestamp, $participants, $seconds_left);
		$this->buttonStoreLowestCsv->insertButton($now_timestamp, $participants, $seconds_left);
		$this->buttonStoreClicksCsv->insertButton($now_timestamp, $participants, $seconds_left);
	}
}

// can be started with a ws url as parameter
$wsurl = null;
if (isset($argv[1])) {
	$wsurl = $argv[1];
}

(new ButtonDaemon($wsurl))->run();
