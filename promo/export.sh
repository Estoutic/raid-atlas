#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
ffmpeg -y -v error -i releases/Raid-Atlas-Promo-1080p.mp4 \
  -filter_complex "[0:v]trim=start=5:end=8,setpts=PTS-STARTPTS[a];[0:v]trim=start=23:end=26,setpts=PTS-STARTPTS[b];[0:v]trim=start=29:end=33,setpts=PTS-STARTPTS[c];[0:v]trim=start=42:end=45,setpts=PTS-STARTPTS[d];[0:v]trim=start=56:end=59,setpts=PTS-STARTPTS[e];[a][b][c][d][e]concat=n=5:v=1:a=0,fps=12,scale=960:-1:flags=lanczos,split[v1][v2];[v1]palettegen=max_colors=128:stats_mode=diff[p];[v2][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" \
  -loop 0 docs/media/demo.gif
