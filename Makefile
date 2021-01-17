MD=$(wildcard */index.md)
HTML=${MD:%.md=%.html}

.PHONY: all
all: ${HTML}

%/index.html: build/mkpage.sh %/index.md %/info.json
	build/mkpage.sh $* > $@
