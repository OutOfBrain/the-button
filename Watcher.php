<?php

function mlog($msg) {
	echo($msg.PHP_EOL);
}
mlog('start watching');

$button_was_down = false;
while (true) {
	$button_there = `ps aux | grep -v grep | grep ButtonDaemon.php`;
	if (!$button_there && !$button_was_down) {
		mlog('no button =( - sending mail');
		mail('outofbrain@gmail.com', 'Button is down', 'again');
		$button_was_down = true;
	} elseif ($button_there && $button_was_down) {
		// was down and is not anymore
		mlog('button there agai =)');
		$button_was_down = false;
	}
	sleep(1);
}
