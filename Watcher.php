<?php
/*
 * Watches the ButtonDaemon.php
 * Daemon gets watched in case it crashes or oom.
 *
 * In case the daemon is down:
 *  - this watcher notifies the mail given in 'watcher_notify_mail.txt'
 *  - tries to get a new ws url and tries to restart the daemon
 */

function mlog($msg) {
	echo($msg.PHP_EOL);
}
mlog('start watching');

function noButton() {
	$mail = file_get_contents('watcher_notify_mail.txt');
	if ($mail) {
		mlog('no button =( - sending mail');
		mail($mail, 'Button is down', 'again');
	}

	// try to restart the button
	$content = file_get_contents('http://www.reddit.com/r/thebutton/');
	$matches = [];
	preg_match('/thebutton_websocket": "(.*?)"/', $content, $matches);
	if (isset($matches[1])) {
		mlog('found new button url ' . $matches[1]);
		$param = escapeshellarg($matches[1]);
		var_dump(`nohup php ButtonDaemon.php $param > /dev/null &`);
	} else {
		mlog('found no new button url');
	}
}

$button_was_down = false;
while (true) {
	$button_there = `ps aux | grep -v grep | grep ButtonDaemon.php`;
	if (!$button_there && !$button_was_down) {
		noButton();
		$button_was_down = true;
	} elseif ($button_there && $button_was_down) {
		// was down and is not anymore
		mlog('button there again =)');
		$button_was_down = false;
	}
	sleep(1);
}
