#!/bin/zsh
# Shows how many times Bilby was downloaded from the website (via /download), per day.
set -euo pipefail
cd "$(dirname "$0")"

HOST=$(sed -n 's/^HOST=//p' deploy.sh)
DEST=$(sed -n 's/^DEST=//p' deploy.sh)
ssh "$HOST" "cd '$DEST' && php artisan bilby:downloads"
