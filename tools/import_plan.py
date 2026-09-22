"""Read the supplied Illustrator SVG; flatten only its actual vector geometry.
No inferred positions: source coordinates and element classes remain auditable.
"""
import xml.etree.ElementTree as ET
import re, math, json
from pathlib import Path

project = Path(__file__).resolve().parents[1]
root = ET.parse(project / 'reference/plattegrond.svg').getroot()
number = r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'

def path_points(d):
    ts = re.findall('[MmLlHhVvCcSsZz]|'+number, d)
    i=0; p=[0.,0.]; start=p[:]; out=[]; control=None; previous=''
    def point(x,y,relative):
        return [x+p[0],y+p[1]] if relative else [x,y]
    while i<len(ts):
        if ts[i].isalpha(): cmd=ts[i]; i+=1
        op=cmd.upper(); rel=cmd.islower()
        if op=='Z':
            if out and out[-1]!=start:out.append(start[:])
            p=start[:]; previous=op; continue
        count={'M':2,'L':2,'H':1,'V':1,'C':6,'S':4}[op]
        a=list(map(float,ts[i:i+count])); i+=count
        if op in ('M','L'):
            p=point(*a,rel); out.append(p[:])
            if op=='M':start=p[:]; cmd='l' if rel else 'L'
        elif op=='H':p=[a[0]+(p[0] if rel else 0),p[1]];out.append(p[:])
        elif op=='V':p=[p[0],a[0]+(p[1] if rel else 0)];out.append(p[:])
        else:
            if op=='C':c1=point(a[0],a[1],rel);c2=point(a[2],a[3],rel);end=point(a[4],a[5],rel)
            else:
                c1=[2*p[k]-control[k] for k in (0,1)] if previous in ('C','S') else p[:]
                c2=point(a[0],a[1],rel);end=point(a[2],a[3],rel)
            steps=max(4,math.ceil((math.dist(p,c1)+math.dist(c1,c2)+math.dist(c2,end))/8))
            for j in range(1,steps+1):
                t=j/steps;q=1-t
                out.append([q**3*p[k]+3*q*q*t*c1[k]+3*q*t*t*c2[k]+t**3*end[k] for k in (0,1)])
            p=end;control=c2
        previous=op
    return out

def transform(points, value):
    # SVG transform lists are applied right to left.
    transforms=re.findall(r'(\w+)\(([^)]+)\)',value)
    for name,args in reversed(transforms):
        a=list(map(float,re.findall(number,args)))
        if name=='translate': points=[[x+a[0],y+(a[1] if len(a)>1 else 0)] for x,y in points]
        elif name=='rotate':
            angle=math.radians(a[0]);c=math.cos(angle);s=math.sin(angle)
            cx,cy=a[1:3] if len(a)==3 else (0,0)
            points=[[cx+c*(x-cx)-s*(y-cy),cy+s*(x-cx)+c*(y-cy)] for x,y in points]
        elif name=='scale':points=[[x*a[0],y*(a[1] if len(a)>1 else a[0])] for x,y in points]
        else:raise ValueError(name)
    return points

elements=[]
layer=next(e for e in root if e.get('id')=='Layer_1')
for e in layer.iter():
    tag=e.tag.split('}')[-1]; a=e.attrib; pts=[]
    n=lambda k:float(a.get(k,0))
    if tag=='path':pts=path_points(a['d'])
    elif tag=='rect':
        x,y,w,h=n('x'),n('y'),n('width'),n('height');pts=[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]
    elif tag=='line':pts=[[n('x1'),n('y1')],[n('x2'),n('y2')]]
    elif tag in ('polygon','polyline'):
        values=list(map(float,re.findall(number,a['points'])));pts=list(map(list,zip(values[::2],values[1::2])))
        if tag=='polygon':pts.append(pts[0][:])
    elif tag=='circle':
        pts=[[n('cx')+n('r')*math.cos(i*math.tau/12),n('cy')+n('r')*math.sin(i*math.tau/12)] for i in range(13)]
    else:continue
    pts=transform(pts,a.get('transform',''))
    if not pts:continue
    pts=[[round(x,4),round(y,4)] for x,y in pts]
    bounds=[min(p[0] for p in pts),min(p[1] for p in pts),max(p[0] for p in pts),max(p[1] for p in pts)]
    elements.append({'class':a.get('class'),'tag':tag,'points':pts,'bounds':bounds})

out=project / 'src/plan-data.json'
out.write_text(json.dumps({'scale':120/883.976,'origin':[1040,1030],'elements':elements},separators=(',',':')))
print(f'{len(elements)} vector objects extracted into {out}')
for i,e in enumerate(elements):
    if e['tag'] not in ('line','circle') and e['class'] not in ['st19','st16','st17','st18']:
        print(i,e['class'],e['tag'],e['bounds'])
