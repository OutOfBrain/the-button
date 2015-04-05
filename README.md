
# The Button Graph

History and live view of the minimum time left on /r/thebutton

View at http://tcial.org/the-button


## Running
Requires PHP >= 5.4

Get the code

	git clone https://github.com/OutOfBrain/the-button.git

Install Composer and dependencies https://getcomposer.org/download/

	php -r "readfile('https://getcomposer.org/installer');" | php
	php composer.phar install

Start the Daemon. Use nohup and `&` to start in the background and not tied to the current ssh session or a user.

	nohup php ButtonDaemon.php &

Start the Watcher. In the same way as the daemon.
The watcher restarts the Daemon in case it can't find it and reports to a given mail if set in `watcher_notify_mail.txt`

	nohup php Watcher.php &

The Daemon generates the button.csv into the `public/` folder. Make that folder available to your webserver with:

	ln -s /home/<youruser>/the-button/public/ /var/www/the-button

