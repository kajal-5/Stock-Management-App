#!/usr/bin/env bash
# Usage: scripts/smoke-test.sh [base-url]   (default http://localhost:3001)
# Exercises the frontend and every API route. Exits non-zero on first failure.
B="${1:-http://localhost:3001}"; J=$(mktemp); EMAIL="smoke$RANDOM$RANDOM@test.com"; FAIL=0
req(){ curl -s -b "$J" -c "$J" -H 'Content-Type: application/json' -w '\n%{http_code}' "$@"; }
check(){ # name, expected status, expected body substring, curl args...
  local name=$1 code=$2 sub=$3; shift 3
  local out; out=$(req "$@"); local status=${out##*$'\n'} body=${out%$'\n'*}
  if [[ "$status" == "$code" && "$body" == *"$sub"* ]]; then echo "PASS  $name"; else echo "FAIL  $name (got $status: $body)"; FAIL=1; fi
}
check "health"                200 '"ok":true'            "$B/api/health"
check "frontend index"        200 'id="root"'            "$B/"
check "SPA fallback route"    200 'id="root"'            "$B/products"
check "unknown api -> 404"    404 'Not found'            "$B/api/nope"
check "products unauth"       401 'Please log in'        "$B/api/products"
check "me unauth"             401 'Not logged in'        "$B/api/me"
check "signup validation"     400 'Fill all fields'      -X POST "$B/api/signup" -d '{"name":"x"}'
check "signup"                200 '"organization":"Org"' -X POST "$B/api/signup" -d "{\"name\":\"Tester\",\"organization\":\"Org\",\"email\":\"$EMAIL\",\"password\":\"secret1\"}"
check "signup duplicate"      400 'already registered'   -X POST "$B/api/signup" -d "{\"name\":\"Tester\",\"organization\":\"Org\",\"email\":\"$EMAIL\",\"password\":\"secret1\"}"
check "me (session cookie)"   200 '"name":"Tester"'      "$B/api/me"
check "add product"           200 '"ok":true'            -X POST "$B/api/products" -d '{"name":"Pen","sku":"P1","quantity":"3","price":"1.5"}'
check "duplicate SKU"         400 'SKU already exists'   -X POST "$B/api/products" -d '{"name":"Pen","sku":"P1","quantity":"3"}'
check "invalid quantity"      400 'non-negative'         -X POST "$B/api/products" -d '{"name":"Pen","sku":"P2","quantity":"-1"}'
check "list products"         200 '"sku":"P1"'           "$B/api/products"
ID=$(curl -s -b "$J" "$B/api/products" | sed -E 's/.*"id":([0-9]+).*/\1/')
check "update product"        200 '"ok":true'            -X PUT "$B/api/products/$ID" -d '{"name":"Pen2","sku":"P1","quantity":"10"}'
check "update persisted"      200 '"name":"Pen2"'        "$B/api/products"
check "settings invalid"      400 'whole number'         -X PUT "$B/api/settings" -d '{"default_threshold":"-2"}'
check "settings update"       200 '"ok":true'            -X PUT "$B/api/settings" -d '{"default_threshold":"20"}'
check "settings read"         200 '"default_threshold":20' "$B/api/settings"
check "threshold applied"     200 '"threshold":20'       "$B/api/products"
check "delete product"        200 '"ok":true'            -X DELETE "$B/api/products/$ID"
check "logout"                200 '"ok":true'            -X POST "$B/api/logout"
check "me after logout"       401 'Not logged in'        "$B/api/me"
check "login wrong password"  401 'incorrect'            -X POST "$B/api/login" -d "{\"email\":\"$EMAIL\",\"password\":\"nope\"}"
check "login"                 200 '"name":"Tester"'      -X POST "$B/api/login" -d "{\"email\":\"$EMAIL\",\"password\":\"secret1\"}"
rm -f "$J"; [[ $FAIL == 0 ]] && echo "ALL PASSED" || { echo "SOME FAILED"; exit 1; }
