debug:
	# Serve app and auto reload
	sudo ./node_modules/reload/bin/reload -p 80

push:
	# push to production
	aws s3 sync --exclude .git --delete . s3://treehouse-ucsc-edu/receiving
