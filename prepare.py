import json,pathlib,xml.etree.ElementTree as ET
R=pathlib.Path(__file__).parent; W=R/'app/web';D=W/'data'
def read(n):return json.loads((D/(n+'.json')).read_text())['data']
td=read('tasks');md=read('maps');items=read('items')['items'];trs=read('traders');names={}
for n in ['tasks_ru','maps_ru','items_ru','traders_ru']:names.update(read(n))
def tr(v):return names.get(v,v) if isinstance(v,str) else v
def item(i):
 x=items.get(i,td['questItems'].get(i,{}));return {'id':i,'name':tr(x.get('name',i))}
corrections=json.loads((R/'sources/exit-corrections.json').read_text())
maps=[];wanted=['factory','customs','shoreline','woods','reserve','lighthouse','interchange','ground-zero','streets-of-tarkov','the-labyrinth','icebreaker','terminal'];aliases={x['id']:x['normalizedName'] for x in md['maps'].values()}
config=json.loads((R/'sources/map-config.json').read_text())
for key in wanted:
 m=next(x for x in md['maps'].values() if x['normalizedName']==key);cfg=next(x for x in config if x['normalizedName']==key)['maps'][0]
 filename=cfg.get('svgPath','').split('/')[-1];svgfile=R/'sources'/filename
 has_plan=bool(filename and svgfile.is_file())
 svg=svgfile.read_text() if has_plan else '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><g id="overview"/></svg>'
 root=ET.fromstring(svg);vb=list(map(float,root.attrib['viewBox'].split()))
 if key=='factory':floors=[['Basement','Подземелье',-4],['Ground_Floor','Первый этаж',1],['Second_Floor','Второй этаж',4.5],['Third_Floor','Третий этаж',8]]
 elif key=='customs':floors=[['Underground_Level','Подземелье',-2],['Ground_Level','Земля / первый этаж',1],['Second_Floor','Второй этаж',4.5],['Third_Floor','Третий этаж',8]]
 else:
  ids=[e.get('id') for e in root if e.tag.endswith('g') and not e.get('data-keep-with-group')]
  base=cfg.get('svgLayer','overview');ids=[base]+[i for i in ids if i!=base and any(v in i.lower() for v in ['floor','level','basement','tunnel','bunker'])]
  ids.sort(key=lambda i: -1 if any(v in i.lower() for v in ['underground','basement','bunker','tunnel']) else 0 if i==base else 1)
  floor_names={'Bunkers':'Бункеры','Ground_Level':'Обзор / земля','Ground_Floor':'Первый этаж','First_Floor':'Первый этаж','Second_Floor':'Второй этаж','Third_Floor':'Третий этаж','Fourth_Floor':'Четвёртый этаж','Fifth_Floor':'Пятый этаж','Underground_Level':'Подземелье','Basement':'Подземелье','overview':'Обзор'}
  floors=[[i,floor_names.get(i,i.replace('_',' ')),0] for i in ids]
 if key=='interchange':floors[0][1]='Земля / парковка'
 if key in ['reserve','ground-zero']:floors[1][1]='Поверхность'
 if key=='ground-zero':floors[0][1]='Подземный переход'
 exits=[];seen=set()
 # Preserve saved indices: PMC, shared, then newly included Scav exits.
 for e in sorted(m['extracts'],key=lambda e:{'pmc':0,'shared':1,'scav':2}.get(e['faction'],3)):
  if e['faction'] not in ['pmc','shared','scav'] or e['id'] in seen:continue
  seen.add(e['id']);v=dict(e);v['name']=tr(e['name']);v['items']=[dict(item(e[k]['item']),count=e[k]['count']) for k in ['transferItem','requiredItem'] if isinstance(e.get(k),dict) and 'item' in e[k]];v['factions']=list(dict.fromkeys(x['faction'] for x in m['extracts'] if x['id']==e['id']));exits.append(v)
 # Quarantine known cross-map source records without altering the raw dataset.
 legacy_exit_ids=[e['id'] for e in exits] if key in corrections['excluded'] else []
 exits=[e for e in exits if e['id'] not in corrections['excluded'].get(key,{})]
 for e in exits:
  anchor=corrections['overviewAnchors'].get(key,{}).get(e['id'])
  if anchor:
   e['overviewAnchor']={'file':anchor['file'],'point':anchor['point']}
   e['overviewAnchors']=[{'file':a['file'],'point':a['point']} for a in [anchor]+anchor.get('alternates',[])]
 maps.append({'legacyExitIds':legacy_exit_ids,'id':key,'gameId':m['id'],'name':tr(m['name']),'svg':svg,'viewBox':vb,'hasPlan':has_plan,'routing':has_plan and key!='terminal','manual':key in ['the-labyrinth','icebreaker','terminal'],'floorRules':[l for l in cfg.get('layers',[]) if l.get('svgLayer') in [f[0] for f in floors]],'defaultFloor':1 if key in ['factory','customs'] else next((i for i,f in enumerate(floors) if f[0]==cfg.get('svgLayer')),0),'bounds':cfg.get('svgBounds',cfg.get('bounds',[[0,0],[1000,1000]])),'rotation':cfg.get('coordinateRotation',0),'floors':floors,'duration':m['raidDuration'],'extracts':exits,'locks':[dict(l,keyName=item(l['key'])['name']) for l in m.get('locks',[]) if l.get('key')],'spawns':[s for s in m['spawns'] if 'player' in s.get('categories',[]) and ('pmc' in s.get('sides',[]) or 'all' in s.get('sides',[]))], 'bosses':[dict(name=tr(md['mobs'].get(b.get('mob'),{}).get('name',b.get('mob','Босс'))),chance=b.get('spawnChance'),positions=[p for z in b.get('spawnLocations',[]) for p in z.get('positions',[])]) for b in m.get('bosses',[]) if b.get('mob') not in ['pmcUSEC','pmcBEAR']], 'labels':cfg.get('labels',[]),'reference':key+'-web-render.'+('png' if key in ['factory','customs'] else 'jpg')})
tasks=[]
for t in td['tasks'].values():
 objs=[];tmap=aliases.get(t.get('map'))
 for o in t.get('objectives',[]):
  obj=dict(o);obj['description']=tr(o['description']);obj['maps']=list(dict.fromkeys(aliases.get(k,k).replace('night-factory','factory').replace('infected-factory','factory') for k in o.get('maps',[])))
  obj['zones']=[dict(z,map=aliases.get(z['map'],z['map']).replace('night-factory','factory').replace('infected-factory','factory')) for z in o.get('zones',[])]
  obj['possibleLocations']=[dict(z,map=aliases.get(z['map'],z['map']).replace('night-factory','factory').replace('infected-factory','factory')) for z in o.get('possibleLocations',[])]
  for k in ['items','markerItem','questItem','requiredKeys','usingWeapon','usingWeaponMods','wearing','notWearing','useAny']:
   def conv(v):return [conv(a) for a in v] if isinstance(v,list) else item(v) if isinstance(v,str) else v
   if k in obj:obj[k]=conv(obj[k])
  objs.append(obj)
 tm=list(dict.fromkeys([tmap] + [mm for o in objs for mm in o['maps']]+[z['map'] for o in objs for z in o['zones']+o['possibleLocations']]))
 if not any(k in tm for k in wanted):continue
 tasks.append({'id':t['id'],'name':tr(t['name']),'english':t.get('normalizedName','').replace('-',' '),'trader':tr(trs.get(t.get('trader'),{}).get('name','Торговец')),'map':tmap,'maps':[a for a in tm if a],'wiki':t.get('wikiLink'),'level':t.get('minPlayerLevel',0),'objectives':objs,'failConditions':t.get('failConditions',[]),'neededKeys':[dict(map=aliases.get(x['map']),keys=[item(k) for k in x['keys']]) for x in t.get('neededKeys',[])]})
result={'version':'0.10.1','date':'16.11.2026','mode':'PvE','maps':maps,'tasks':tasks,'sources':{'data':'https://tarkov.dev/api','svg':'https://github.com/the-hideout/tarkov-dev-svg-maps','renders':'https://reemr.se/','license':'https://creativecommons.org/licenses/by-nc-sa/4.0/'}}
(W/'catalog.js').write_text('window.CATALOG = '+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n')
print('Prepared',len(tasks),'tasks and',len(maps),'maps.')
