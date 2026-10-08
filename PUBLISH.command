#!/bin/bash
# Run me BEFORE every push to GitHub. Double-click.
# Checks the photographs, writes them into the HTML for Google, generates
# robots.txt and the sitemap, and stops you pushing something broken.
cd "$(dirname "$0")"
NODE=""
for c in "$(command -v node 2>/dev/null)" /opt/homebrew/bin/node /usr/local/bin/node \
         "$HOME/.nvm/versions/node/"*/bin/node "$HOME/.volta/bin/node" \
         "$(/bin/zsh -lic 'command -v node' 2>/dev/null | tail -1)"; do
  if [ -n "$c" ] && [ -x "$c" ]; then NODE="$c"; break; fi
done
if [ -z "$NODE" ]; then
  echo ""; echo "  Node is not installed on this Mac."
  echo "  Get it from nodejs.org — take the LTS download and click through."; echo ""
  read -n 1 -s -r -p "  Press any key to close…"; exit 1
fi
# Two gates. checks.js asks whether the CODE still behaves; publish.js asks
# whether THIS data matches THIS disk. Either one failing stops the push.
# The share picture is written from the data FIRST, so the gates below read
# the pages as they will actually be served. A link to a photographer that
# arrives as a blank grey box is the most expensive empty field on a site.
"$NODE" build/sync-share.js
if "$NODE" build/checks.js; then
  "$NODE" build/publish.js
else
  echo ""
  echo "  The code checks failed — publish.js was not run."
fi
echo ""
read -n 1 -s -r -p "  Press any key to close…"
echo ""
