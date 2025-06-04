#!/usr/bin/env bash
set -e
rm -rf dist
mkdir dist
cp index.html dist/
cp -r js dist/
cp -r data dist/
cp styles.css dist/
