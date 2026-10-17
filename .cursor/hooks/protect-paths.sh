#!/bin/bash
input=$(cat)
mkdir -p .cursor/hooks
printf '%s\n' "$input" >> .cursor/hooks/last-input.log

file_path=$(printf '%s' "$input" | /usr/bin/python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    data = {}
tool_input = data.get("tool_input") if isinstance(data, dict) else None
path = ""
if isinstance(tool_input, dict):
    value = tool_input.get("file_path")
    if isinstance(value, str):
        path = value
sys.stdout.write(path)
')
extract_status=$?

deny='{"permission":"deny","user_message":"Blocked: src/credit and src/collections are protected.","agent_message":"This path is protected. Do not modify it; explain the needed change instead."}'

if [[ $extract_status -ne 0 || -z "$file_path" || "$file_path" == *"/src/credit/"* || "$file_path" == *"/src/collections/"* || "$file_path" == *"/.cursor/"* ]]; then
  printf '%s\n' "$deny"
  exit 0
fi

printf '%s\n' '{"permission":"allow"}'
exit 0
