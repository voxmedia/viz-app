#!/bin/bash

set -e

rm -f 1024x1024.png
rm -f 512x512.png
rm -f 256x256.png
rm -f 128x128.png
rm -f 64x64.png
rm -f 32x32.png
rm -f 16x16.png

cp IconLarge.png 1024x1024.png

convert IconSmall.png -resize 16x16   16x16.png
convert IconSmall.png -resize 32x32   32x32.png
convert IconLarge.png -resize 64x64   64x64.png
convert IconLarge.png -resize 128x128 128x128.png
convert IconLarge.png -resize 256x256 256x256.png
convert IconLarge.png -resize 512x512 512x512.png

rm -f icon.icns
rm -Rf icon.iconset
mkdir icon.iconset

cp 16x16.png icon.iconset/icon_16x16.png
cp 32x32.png icon.iconset/icon_16x16@2x.png
cp 32x32.png icon.iconset/icon_32x32.png
cp 64x64.png icon.iconset/icon_32x32@2x.png
cp 128x128.png icon.iconset/icon_128x128.png
cp 256x256.png icon.iconset/icon_128x128@2x.png
cp 256x256.png icon.iconset/icon_256x256.png
cp 512x512.png icon.iconset/icon_256x256@2x.png
cp 512x512.png icon.iconset/icon_512x512.png
cp 1024x1024.png icon.iconset/icon_512x512@2x.png

iconutil -c icns icon.iconset
rm -R icon.iconset

rm icon.ico
convert 16x16.png 32x32.png 64x64.png 128x128.png 256x256.png icon.ico
