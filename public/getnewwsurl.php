<?php

$cacheFilename = 'wsurl';
$cacheTimeoutSeconds = 60 * 60;

/**
 * Updates the ws url in the cache file
 *
 * @param string $cacheFilename
 * @return bool|string the new ws url or false in case of error
 */
function update($cacheFilename) {
	$content = file_get_contents('http://www.reddit.com/r/thebutton/');
	$matches = [];
	preg_match('/thebutton_websocket": "(.*?)"/', $content, $matches);
	if (isset($matches[1])) {
		file_put_contents($cacheFilename, $matches[1]);
		return $matches[1];
	} else {
		return false;
	}
}

$wsUrl = false;

if (
	!file_exists($cacheFilename) ||
	(time() - filemtime($cacheFilename)) > $cacheTimeoutSeconds
) {
	$wsUrl = update($cacheFilename);
} else {
	// file exists and is within cache time
	$wsUrl = file_get_contents($cacheFilename);
}
print($wsUrl);
