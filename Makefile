debug:
	# Serve app and auto reload
	# sudo ./node_modules/reload/bin/reload -p 80
	php -S localhost:8000

push:
	# push to production
	aws s3 sync --exclude ".git/*" --exclude "node_modules/*" --delete . s3://treehouse-ucsc-edu
