# Estudio de luz «La lavandería» — Laboratorio de Vídeo IA, sesión 4
import bpy, math, sys
from mathutils import Vector
OUT='/tmp/claude-0/-home-claude-cl/b6af7194-c703-51b6-91ef-993a8595a1a5/scratchpad/s4/'
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene
def mat(name,col,em=0,rough=.6,met=0,emcol=None):
    m=bpy.data.materials.new(name); m.use_nodes=True; b=m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*col,1); b.inputs['Roughness'].default_value=rough; b.inputs['Metallic'].default_value=met
    b.inputs['Emission Color'].default_value=(*(emcol or col),1); b.inputs['Emission Strength'].default_value=em
    return m
def box(name,loc,dim,m,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=loc,rotation=rot); o=bpy.context.object; o.name=name; o.dimensions=dim; o.data.materials.append(m); return o
tile=mat('suelo',(.55,.55,.5),rough=.35); wall=mat('pared',(.32,.34,.31),rough=.8)
white=mat('lavadora',(.8,.8,.78),rough=.3); glass=mat('ojo',(.05,.07,.08),rough=.05,met=.3)
wood=mat('mesa',(.4,.28,.18),rough=.6); coat=mat('ropa',(.15,.2,.35)); skin=mat('piel',(.35,.22,.16))
red=mat('camisa',(.7,.04,.05),rough=.8)
tube=mat('tubo',(.8,1,.85),em=0,emcol=(.75,1,.8)); neon=mat('neon',(1,.25,.55),em=0)
street=mat('calle',(.02,.03,.06),rough=.2)
box('suelo',(0,0,-.05),(10,8,.1),tile); box('pared_fondo',(0,4,1.75),(10,.1,3.5),wall)
box('pared_izq',(-5,0,1.75),(.1,8,3.5),wall); box('techo',(0,0,3.5),(10,8,.1),wall)
# pared derecha con escaparate
box('pared_der_baja',(5,0,.45),(.1,8,.9),wall); box('pared_der_alta',(5,0,3.25),(.1,8,.5),wall)
box('calle_fondo',(9,0,1.5),(.1,14,6),street)
for i,y in enumerate([-3,-1.6,-0.2,1.2,2.6]):
    box(f'lav{i}',(-4.5,y,.45),(.9,1.2,.9),white)
    bpy.ops.mesh.primitive_cylinder_add(radius=.33,depth=.05,location=(-4.03,y,.5),rotation=(0,math.radians(90),0)); bpy.context.object.data.materials.append(glass)
box('mesa',(0,0,.8),(1.0,2.4,.06),wood); box('pata',(0,0,.4),(.8,2.2,.78),wood)
box('camisa',(0.05,0,.84),(.6,.45,.02),red)
bpy.ops.mesh.primitive_cylinder_add(radius=.22,depth=1.25,location=(.75,0,.9)); bpy.context.object.data.materials.append(coat)
bpy.ops.mesh.primitive_uv_sphere_add(radius=.13,location=(.72,0,1.68)); bpy.context.object.data.materials.append(skin)
# fuentes
tubes=[box(f'tubo{i}',(x,0,3.42),(.12,2.2,.05),tube) for i,x in enumerate((-2.5,0,2.5))]
lights={}
for i,x in enumerate((-2.5,0,2.5)):
    bpy.ops.object.light_add(type='AREA',location=(x,0,3.38)); L=bpy.context.object; L.data.shape='RECTANGLE'; L.data.size=.3; L.data.size_y=2.2; L.data.color=(.7,1,.78); lights[f'tubo{i}']=L
neonobj=box('neon_rotulo',(5.3,0,2.3),(.05,1.6,.25),neon)
bpy.ops.object.light_add(type='AREA',location=(4.9,0,2.2),rotation=(0,math.radians(-90),0)); N=bpy.context.object; N.data.size=1.6; N.data.color=(1,.3,.55)
bpy.ops.object.light_add(type='AREA',location=(2.5,0,1.6),rotation=(0,math.radians(-75),0)); F=bpy.context.object; F.data.size=3; F.data.color=(1,1,1)  # relleno plano
bpy.ops.object.light_add(type='POINT',location=(-3.9,-1.6,.55)); P=bpy.context.object; P.data.color=(1,.75,.45); P.data.shadow_soft_size=.05  # lámpara cálida práctica (secadora abierta)
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; bg=w.node_tree.nodes['Background']
bpy.ops.object.camera_add(location=(3.4,-3.0,1.55)); cam=bpy.context.object; cam.data.lens=30
cam.rotation_euler=(Vector((-2.8,0.7,0.95))-cam.location).to_track_quat('-Z','Y').to_euler(); sc.camera=cam
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=24; sc.cycles.use_denoising=True
sc.render.resolution_x,sc.render.resolution_y=640,360
sc.view_settings.look='AgX - Medium High Contrast'
def setup(tubos,neon_e,fill,prac,world):
    for k,L in lights.items(): L.data.energy=tubos
    for t in tubes: t.data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value=6 if tubos else 0
    N.data.energy=neon_e; neon.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value=15 if neon_e else 0
    F.data.energy=fill; P.data.energy=prac; bg.inputs['Color'].default_value=(*world,1); bg.inputs['Strength'].default_value=1
looks={'A_plana':(0,0,900,0,(.5,.5,.5)),
       'B_fria':(170,0,0,0,(.0,.0,.0)),
       'C_mezcla':(70,1400,0,0,(.0,.0,.01)),
       'D_calida':(0,420,0,350,(.0,.0,.01))}
bpy.ops.wm.save_as_mainfile(filepath=OUT+'lavanderia.blend')
for name,v in looks.items():
    setup(*v); sc.render.filepath=OUT+name+'.png'; bpy.ops.render.render(write_still=True)
