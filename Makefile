debug:
	sudo ./node_modules/webpack-dev-server/bin/webpack-dev-server.js \
		--progress --colors

push:
	# push to production
	aws s3 sync --exclude .git --delete . s3://treehouse-ucsc-edu/receiving
