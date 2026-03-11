#!/bin/bash
# StainedGlass Flow — stop the dev server

PORT=5173

PID=$(lsof -ti tcp:$PORT 2>/dev/null)

if [[ -z "$PID" ]]; then
  echo "Nothing running on port $PORT."
else
  kill "$PID"
  echo "Stopped StainedGlass Flow (port $PORT, pid $PID)."
fi
