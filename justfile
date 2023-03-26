# This is a justfile (https://github.com/casey/just)

# install/update miniserve
install-miniserve:
  cargo install miniserve

# serve project (requires miniserve)
serve:
	miniserve \
		--header "Cache-Control: no-cache; max-age=1" \
		--header "Cross-Origin-Embedder-Policy: require-corp" \
		--header "Cross-Origin-Opener-Policy: same-origin" \
		--header "Cross-Origin-Resource-Policy: cross-origin" \
		--index index.html \
		.

# sync to host
rsync:
	rsync --exclude .git \
		--exclude .gitignore \
		--exclude favicon.ico \
		--exclude README.md \
		--exclude .DS_Store \
		--exclude justfile -avp ../lit-webr/ rud.is:~/rud.is/w/lit-webr/

# publish to GH
github:
	git add -A
	git commit -m "chore: lazy justfile commit" 
	git push
