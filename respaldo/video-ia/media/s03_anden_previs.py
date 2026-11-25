# Previs «El andén» — Laboratorio de Vídeo IA, sesión 3 (cámara motivada)
import bpy, math, sys
from mathutils import Vector
OUT='/tmp/claude-0/-home-claude-cl/b6af7194-c703-51b6-91ef-993a8595a1a5/scratchpad/s3/'
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene; sc.render.fps=24; sc.frame_start=1; sc.frame_end=192
def mat(name,col,em=0,rough=.6,met=0):
    m=bpy.data.materials.new(name); m.use_nodes=True; b=m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*col,1); b.inputs['Roughness'].default_value=rough; b.inputs['Metallic'].default_value=met
    if em: b.inputs['Emission Color'].default_value=(*col,1); b.inputs['Emission Strength'].default_value=em
    return m
def box(name,loc,dim,m):
    bpy.ops.mesh.primitive_cube_add(location=loc); o=bpy.context.object; o.name=name; o.dimensions=dim; o.data.materials.append(m); return o
concrete=mat('concrete',(.18,.18,.19),rough=.8); wet=mat('wet',(.05,.05,.06),rough=.15)
yellow=mat('linea',(.9,.7,.1),rough=.5); steel=mat('steel',(.3,.32,.35),rough=.35,met=1)
trainm=mat('tren',(.55,.57,.6),rough=.3,met=.6); win=mat('ventana',(.9,.75,.45),em=1.5)
coat=mat('abrigo',(.55,.05,.04),rough=.7); skin=mat('piel',(.35,.22,.16)); phone=mat('pantalla',(.6,.8,1),em=0)
lamp=mat('fluor',(.75,.9,1),em=12)
# andén y vías
box('anden',(0,2,.5),(60,4,1),concrete); box('borde',(0,.15,1.005),(60,.3,.01),yellow)
box('suelo_vias',(0,-3,-.05),(60,6,.1),wet)
for y in (-1.6,-3.0): box('rail',(0,y,.1),(60,.1,.15),steel)
for i,x in enumerate(range(-24,25,6)):
    box(f'pilar{i}',(x,3.6,3),(.4,.4,4),concrete)
    box(f'lampara{i}',(x,2,4.6),(1.6,.12,.06),lamp)
    bpy.ops.object.light_add(type='AREA',location=(x,2,4.5)); L=bpy.context.object; L.data.energy=110; L.data.size=1.6; L.data.color=(.75,.88,1)
box('techo',(0,1.5,5),(60,7,.2),concrete)
# tren (llega por la izquierda)
tren=box('tren',(0,-2.3,2.0),(40,3,3.4),trainm)
for k in range(-6,7):
    w=box(f'v{k}',(k*3,-0.79,2.4),(1.6,.05,1),win); w.parent=tren; w.location=(k*3/40,  .5/3*1.0,  .12)
# simplificar: ventanas como hijos con escala relativa es lioso -> recrear sin parent
for o in [o for o in bpy.data.objects if o.name.startswith('v')]: bpy.data.objects.remove(o)
wins=[]
for k in range(-6,7): wins.append(box(f'v{k}',(k*3,-0.78,2.4),(1.6,.05,1),win))
faro=box('faro',(20.05,-2.3,1.2),(.1,.6,.4),mat('faro',(1,.85,.6),em=40))
bpy.ops.object.light_add(type='SPOT',location=(20.3,-2.3,1.2),rotation=(0,math.radians(90),0)); spot=bpy.context.object; spot.data.energy=4000; spot.data.color=(1,.85,.6); spot.data.spot_size=math.radians(50)
group=[tren,faro,spot]+wins
for o in group: o['x0']=o.location.x
def tren_x(f):  # llega y frena
    if f<40: return -62
    t=min(1,(f-40)/90); e=1-(1-t)**3; return -62+62*e
for f in range(1,193,4):
    sc.frame_set(f)
    for o in group:
        o.location.x=o['x0']+tren_x(f); o.keyframe_insert('location',index=0,frame=f)
# personaje (cápsula)
bpy.ops.mesh.primitive_cylinder_add(radius=.22,depth=1.25,location=(0,1.3,1.68)); body=bpy.context.object; body.data.materials.append(coat)
bpy.ops.mesh.primitive_uv_sphere_add(radius=.13,location=(0,1.3,2.45)); head=bpy.context.object; head.data.materials.append(skin); head.parent=body; head.location=(0,0,.77)
ph=box('movil',(.18,1.05,1.95),(.08,.01,.15),phone); ph.parent=body; ph.location=(.18,-.25,.27)
# luz del móvil se enciende en el frame 80
b=phone.node_tree.nodes['Principled BSDF']; s=b.inputs['Emission Strength']
s.default_value=0; s.keyframe_insert('default_value',frame=78); s.default_value=8; s.keyframe_insert('default_value',frame=82)
# decisión: da un paso atrás en 150-170
body.keyframe_insert('location',frame=150); body.location.y=2.1; body.keyframe_insert('location',frame=172)
# cámaras
def cam(name,loc,tgt,lens):
    bpy.ops.object.camera_add(location=loc); c=bpy.context.object; c.name=name; c.data.lens=lens
    d=Vector(tgt)-Vector(loc); c.rotation_euler=d.to_track_quat('-Z','Y').to_euler(); return c
c1=cam('P1_estatica',(11,2.9,2.0),(-8,0.6,1.7),32)
c2=cam('P2_pushin',(2.2,0.5,2.25),(0,1.3,2.2),50)
c2.keyframe_insert('location',frame=73); c2.location=(1.4,0.75,2.25); c2.keyframe_insert('location',frame=130)
c3=cam('P3_pullback',(-2.2,3.1,1.8),(0.6,1.2,1.7),35)
c3.keyframe_insert('location',frame=165); c3.location=(-4.5,3.3,2.1); c3.keyframe_insert('location',frame=192)
for c,f in ((c1,1),(c2,73),(c3,133)):
    m=sc.timeline_markers.new(c.name,frame=f); m.camera=c
sc.camera=c1
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs['Color'].default_value=(.01,.015,.03,1)
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=8; sc.cycles.use_denoising=True
sc.render.resolution_x,sc.render.resolution_y=480,270
sc.view_settings.look='AgX - Medium High Contrast'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'anden.blend')
mode=sys.argv[-1]
if mode=='stills':
    for f in (40,100,128,180):
        sc.frame_set(f); sc.render.filepath=OUT+f'still_{f:03d}.png'; bpy.ops.render.render(write_still=True)
elif mode=='anim':
    sc.frame_step=2; sc.render.filepath=OUT+'frames/f_'; bpy.ops.render.render(animation=True)
