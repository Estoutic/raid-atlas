from pathlib import Path
import json,numpy as np
from scipy.spatial import Delaunay
r=Path(__file__).resolve().parents[2]
# Manually matched published exit locations, in SVG and image pixels. Image coordinates
# refer to virtual viewer dimensions, not the downsampled inspection preview.
raw={
'shoreline':(1,[(718.1,53.17,990,105),(127.6,733.89,335,580),(55.08,160.32,371,228),(1362.68,415.29,1690,340),(1528.63,712.3,1906,579),(839.66,978.66,1164,811),(894.71,29.27,1185,105),(1046.84,36.39,1328,99),(1233.06,159.82,1510,172)]),
'woods':(2048/1920,[(1083.57,969.11,1406,690),(75.38,868.22,277,649),(310.85,1333.21,455,963),(1237.4,1257.97,1585,883),(825.37,1426.45,1078,963),(208.05,1017.74,342,735),(1440.79,1093.02,1885,781),(1259.59,887.3,1614,638),(1184.23,429.47,1512,347),(578.68,73.36,775,111)]),
'reserve':(1,[(352.81,73.11,786,33),(416.77,672.54,1345,824),(207.06,178.09,546,262),(347.71,488.55,894,572),(317.33,116.35,795,178),(582.59,183.2,1310,95)]),
'lighthouse':(2048/1982,[(810.32,1418.56,1560,683),(703.1,933.48,1121,524),(891.76,354.8,766,174),(400.09,8.54,126,294),(878.88,876.57,1174,376),(508.43,128.52,315,282),(582.96,1316.07,1392,743)]),
'interchange':(1,[(134.73,8.74,113,169),(1005.79,773.27,1007,956),(-17.39,560.03,25,746),(985.37,81.03,958,236)]),
'ground-zero':(2048/1760,[(58.35,257.63,964,804),(30.85,85.57,891,540),(269.22,239.16,1438,705),(265.83,459.48,1412,1201),(224.38,44.5,1334,251),(97.63,26.56,1055,225)]),
'streets-of-tarkov':(2048/1960,[(107.29,570.84,945,809),(10.3,704.84,735,983),(570.6,643.36,1720,1030),(369.16,224.08,1499,402),(588.67,340.06,1777,588),(475.33,799.53,1516,1216),(110.3,191.09,1068,283),(247.96,346.92,1255,553),(592.31,517.33,1786,845),(112.09,379.4,949,493),(326.44,760.42,1239,1135),(438.97,361.87,1605,609)])}
out={};audit={}
# Exclude ambiguous/legacy markers whose position differs between source versions.
for key,indices in {'shoreline':[8],'reserve':[3],'streets-of-tarkov':[9,10]}.items():
 scale,rows=raw[key];raw[key]=(scale,[v for i,v in enumerate(rows) if i not in indices])
for key,(scale,rows) in raw.items():
 src=np.array([p[:2] for p in rows]);dst=np.array([p[2:] for p in rows])*scale;tri=Delaunay(src).simplices.tolist()
 signs=[float(np.cross(src[t[1]]-src[t[0]],src[t[2]]-src[t[0]])*np.cross(dst[t[1]]-dst[t[0]],dst[t[2]]-dst[t[0]])) for t in tri]
 audit[key]={'points':len(src),'folded':sum(s<=0 for s in signs)}
 assert all(s>0 for s in signs),(key,'Folded registration')
 out[key]={'source':src.tolist(),'target':dst.tolist(),'triangles':tri,'inverseAffine':np.linalg.lstsq(np.c_[dst,np.ones(len(dst))],src,rcond=None)[0].tolist(),'affine':np.linalg.lstsq(np.c_[src,np.ones(len(src))],dst,rcond=None)[0].tolist()}
(r/'app/web/projection-extra.js').write_text('window.EXTRA_PROJECTIONS='+json.dumps(out,separators=(',',':'))+';\n')
(r/'sources/calibration/extra-points.json').write_text(json.dumps({'coordinates':raw,'audit':audit},ensure_ascii=False,indent=2))
print(audit)
# Separate floor plans on the Interchange atlas occupy their own image panels.
floor_out={}
for layer,tx in [('First_Floor',1509),('Second_Floor',1857)]:
 src=np.array([[544,138],[870,138],[870,705],[544,705]],dtype=float)
 dst=np.array([[tx,302],[tx+318,302],[tx+318,871],[tx,871]],dtype=float)
 floor_out[layer]={'source':src.tolist(),'target':dst.tolist(),'triangles':[[0,1,2],[0,2,3]],'affine':np.linalg.lstsq(np.c_[src,np.ones(4)],dst,rcond=None)[0].tolist(),'inverseAffine':np.linalg.lstsq(np.c_[dst,np.ones(4)],src,rcond=None)[0].tolist()}
with (r/'app/web/projection-extra.js').open('a') as f:f.write('window.EXTRA_FLOOR_PROJECTIONS='+json.dumps({'interchange':floor_out},separators=(',',':'))+';\n')
