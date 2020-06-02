rsync:
	rsync -r -a -v -e ssh --delete ./ raitis@ng.hslayers.org:/data/www/app.hslayers.org/htdocs/project-rostenice