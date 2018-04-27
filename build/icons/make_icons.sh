#!/bin/bash

rm 1024x1024.png
rm 512x512.png
rm 256x256.png
rm 128x128.png
rm 64x64.png
rm 32x32.png
rm 16x16.png

cp Icon1024.png 1024x1024.png

convert Icon1024.png -resize 16x16   16x16.png
convert Icon1024.png -resize 32x32   32x32.png
convert Icon1024.png -resize 64x64   64x64.png
convert Icon1024.png -resize 128x128 128x128.png
convert Icon1024.png -resize 256x256 256x256.png
convert Icon1024.png -resize 512x512 512x512.png

rm icon.icns
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
