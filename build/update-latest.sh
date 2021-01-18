#!/bin/bash

LATEST="$(echo * | tr ' ' '\n' | sort -rn | head -n 1)"
echo "ln -s -f -T ./$LATEST latest"
ln -s -f -T "./$LATEST" latest
