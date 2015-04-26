<?php
/**
 * Repair button downtime data. Data in button.csv looks like this:
 * ,,0
 * ,,0
 * ,,0
 *
 * And should really be something along the lines of 0,0,0 at least to keep the data
 * structure consistent.
 *
 * Data in button_clicks.csv has data that looks like this:
 * 1429984547,-824253,0
 *
 * That does not need immediate fixing since it is regenerated with next daemon restart
 * which will fix that.
 */
class FixDowntimeData {
	public function run() {
		$button_file = 'public/button.csv';
		$button_content = file_get_contents($button_file);
		$button_content = str_replace(",,0\n", "0,0,0\n", $button_content);
		file_put_contents($button_file, $button_content);
		unset($button_content);  // just make sure
	}
}
