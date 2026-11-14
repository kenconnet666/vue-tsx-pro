#!/bin/sh
# 文档站视频示例用的片段（apps/docs/public/media/clip.*）：十秒，小球沿正弦线移动，左上角是时间——拖进度、换倍速时看得出来。
# 没有声音。两种格式：webm（VP9）在前，mp4（H.264）给不认 webm 的浏览器；封面是第一帧。
# 用法（要有 ffmpeg；Windows 上在 WSL 里跑）：sh scripts/docs/make-clip.sh
set -eu
out="$(dirname "$0")/../../apps/docs/public/media"
mkdir -p "$out"
font=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
ball="color=c=0x6366f1:s=72x72:r=30:d=10,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*clip(36-hypot(X-35.5,Y-35.5),0,1)'"
graph="color=c=0x0f172a:s=640x360:r=30:d=10[bg];${ball}[ball];\
[bg][ball]overlay=x='44+t*48':y='144+sin(t*PI*0.8)*60',\
drawtext=fontfile=${font}:fontsize=22:fontcolor=0xe2e8f0:x=24:y=22:text='%{eif\:t\:d} s',format=yuv420p"

ffmpeg -y -loglevel error -filter_complex "$graph" -an -c:v libvpx-vp9 -b:v 0 -crf 40 -g 30 -row-mt 1 "$out/clip.webm"
ffmpeg -y -loglevel error -filter_complex "$graph" -an -c:v libx264 -preset veryslow -crf 28 -g 30 \
  -profile:v main -movflags +faststart "$out/clip.mp4"
ffmpeg -y -loglevel error -i "$out/clip.mp4" -frames:v 1 -q:v 4 "$out/clip.jpg"
ls -l "$out"
