MD=$(wildcard */index.md)
HTML=${MD:%.md=%.html}

.PHONY: all
all: ${HTML} latest

latest: ${HTML}
	build/update-latest.sh

%/index.html: build/mkpage.sh %/index.md %/info.json
	build/mkpage.sh $* > $@
