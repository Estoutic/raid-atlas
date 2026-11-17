#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
ffmpeg -y -v error -i releases/Raid-Atlas-Promo-v2-1080p.mp4 \
  -filter_complex "[0:v]trim=start=3:end=4.5,setpts=PTS-STARTPTS[a];[0:v]trim=start=8:end=9.5,setpts=PTS-STARTPTS[b];[0:v]trim=start=16:end=18.5,setpts=PTS-STARTPTS[c];[0:v]trim=start=22.5:end=25,setpts=PTS-STARTPTS[d];[0:v]trim=start=28:end=30.5,setpts=PTS-STARTPTS[e];[0:v]trim=start=32.5:end=34.5,setpts=PTS-STARTPTS[f];[a][b][c][d][e][f]concat=n=6:v=1:a=0,fps=10,scale=800:-1:flags=lanczos,split[v1][v2];[v1]palettegen=max_colors=96:stats_mode=diff[p];[v2][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  -loop 0 docs/media/demo.gif
