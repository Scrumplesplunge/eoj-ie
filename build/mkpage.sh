#!/bin/bash

# Usage: build/mkpage.sh <id>
#
# This script builds a numbered page based on the markdown file and
# corresponding metadata json file.

INDEX="$1"
MD="$1/index.md"
JSON="$1/info.json"

# Parse the metadata.
TITLE="$(jq -r '.title' "$JSON")"
DATE="$(jq -r '.created' "$JSON")"
KEYWORDS="$(jq -r '.keywords | join(", ")' "$JSON")"

# Optionally generate "previous" and "next" links.
if [[ $INDEX -gt 1 ]]; then
  LINK_TITLE="$(jq -r '.title' "$((INDEX - 1))/info.json")"
  PREVIOUS="<a class=previous href=\"/$((INDEX - 1))\">← $LINK_TITLE</a>"
fi

if [[ -d $((INDEX + 1)) ]]; then
  LINK_TITLE="$(jq -r '.title' "$((INDEX + 1))/info.json")"
  NEXT="<a class=next href=\"/$((INDEX + 1))\">$LINK_TITLE →</a>"
fi

pretty_date() {
  DAY="$(date -d "$1" +"%-d")"
  case $DAY in
    1|11|21|31) DAY="${DAY}st";;
    2|12|22) DAY="${DAY}nd";;
    3|13|23) DAY="${DAY}rd";;
    *) DAY="${DAY}th";;
  esac
  date -d "$1" +"%A $DAY %B %Y at %H:%M %Z"
}

# Generate the page.
cat <<EOF
<!doctype html>
<meta charset=utf-8>
<meta name=viewport content="width=device-width, initial-scale=1">
<meta name=created content="$DATE">
<meta name=keywords content="$KEYWORDS">
<link id=theme rel=stylesheet href=/themes/default.css>
<script>
// Take a look in /themes if you want to pick a different one.
document.getElementById("theme").href =
    localStorage.theme || "/themes/default.css";
</script>
<title>$TITLE</title>
<header id=header>
<h1>$TITLE</h1>
<time datetime="$DATE">$(pretty_date "$DATE")</time>
<p>
$PREVIOUS
$NEXT
<br style="clear: both">
</p>
</header>
$(markdown -S "$MD")
EOF
