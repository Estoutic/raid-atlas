from pathlib import Path
import json,numpy as np
from scipy.spatial import Delaunay
r=Path(__file__).resolve().parents[2]
points=json.loads((r/'sources/calibration/customs-points.json').read_text())
src=np.array([p['svg'] for p in points]);tri=Delaunay(src).simplices.tolist()
out={}
for style in ['classic','realistic']:
 dst=np.array([p[style] for p in points]);affine=np.linalg.lstsq(np.c_[src,np.ones(len(src))],dst,rcond=None)[0].tolist()
 # Reject folded calibration cells; no image warp is performed, only annotation projection.
 for t in tri:
  a,b,c=src[t];u,v,w=dst[t]
  assert np.cross(b-a,c-a)*np.cross(v-u,w-u)>0,(style,t)
 out[style]={'source':src.tolist(),'target':dst.tolist(),'triangles':tri,'affine':affine,'inverseAffine':np.linalg.lstsq(np.c_[dst,np.ones(len(dst))],src,rcond=None)[0].tolist()}
(r/'app/web/projection-data.js').write_text('window.PROJECTION_DATA='+json.dumps(out,separators=(',',':'))+';\n')
