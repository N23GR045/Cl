# Blockout «La llave» — Laboratorio de Vídeo IA, sesión 2 (dramaturgia de 8 s)
import bpy, math
from mathutils import Vector
OUT='/tmp/claude-0/-home-claude-cl/b6af7194-c703-51b6-91ef-993a8595a1a5/scratchpad/s2/'
bpy.ops.wm.read_factory_settings(use_empty=True); sc=bpy.context.scene
def mat(n,c,em=0,r=.6,met=0):
    m=bpy.data.materials.new(n); m.use_nodes=True; b=m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*c,1); b.inputs['Roughness'].default_value=r; b.inputs['Metallic'].default_value=met
    if em: b.inputs['Emission Color'].default_value=(*c,1); b.inputs['Emission Strength'].default_value=em
    return m
def box(n,l,d,m):
    bpy.ops.mesh.primitive_cube_add(location=l); o=bpy.context.object; o.name=n; o.dimensions=d; o.data.materials.append(m); return o
def person(x,y,col,h=1.25,face=0):
    bpy.ops.mesh.primitive_cylinder_add(radius=.23,depth=h,location=(x,y,h/2+.05)); b=bpy.context.object; b.data.materials.append(col)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=.14,location=(x,y,h+.22)); bpy.context.object.data.materials.append(skin); return b
wall=mat('pared',(.42,.38,.32),r=.9); floor=mat('suelo',(.25,.2,.17),r=.7); steel=mat('acero',(.6,.6,.62),r=.3,met=1)
skin=mat('piel',(.42,.28,.2)); apron=mat('delantal',(.08,.22,.14)); parka=mat('parka',(.05,.08,.2),r=.4)
gold=mat('llave',(.9,.65,.25),r=.25,met=1); dough=mat('masa',(.85,.78,.62),r=.9)
win=mat('ventana',(.35,.5,.9),em=2.5); bulbm=mat('bombilla',(1,.8,.5),em=30)
box('suelo',(0,0,-.05),(8,6,.1),floor); box('fondo',(0,2.5,1.6),(8,.1,3.2),wall); box('izq',(-4,0,1.6),(.1,6,3.2),wall)
box('ventana',(-3.95,-0.3,1.6),(.05,1.4,1.1),win)
bpy.ops.object.light_add(type='AREA',location=(-3.7,-0.3,1.6),rotation=(0,math.radians(-90),0)); W=bpy.context.object; W.data.energy=260; W.data.size=1.4; W.data.color=(.45,.6,1)
box('mostrador',(0,0,.47),(.9,2.6,.94),steel)
for i,y in enumerate((-.9,-.3,.3)): box(f'bandeja{i}',(0.1,y,.97),(.5,.45,.04),steel); box(f'masa{i}',(0.1,y,1.03),(.35,.3,.08),dough)
madre=person(.85,.55,apron,1.15); hijo=person(-.9,-.35,parka,1.3)
key=box('llave',(.62,.55,1.0),(.04,.03,.12),gold)
bpy.ops.mesh.primitive_uv_sphere_add(radius=.06,location=(0,0.1,2.35)); bpy.context.object.data.materials.append(bulbm)
bpy.ops.object.light_add(type='POINT',location=(0,0.1,2.3)); B=bpy.context.object; B.data.energy=180; B.data.color=(1,.78,.5); B.data.shadow_soft_size=.04
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs['Color'].default_value=(0,0,0,1)
sc.render.engine='CYCLES'; sc.cycles.samples=20; sc.cycles.use_denoising=True
sc.render.resolution_x,sc.render.resolution_y=640,360; sc.view_settings.look='AgX - Medium High Contrast'
def shot(name,loc,tgt,lens):
    bpy.ops.object.camera_add(location=loc); c=bpy.context.object; c.data.lens=lens
    c.rotation_euler=(Vector(tgt)-Vector(loc)).to_track_quat('-Z','Y').to_euler(); sc.camera=c
    sc.render.filepath=OUT+name+'.png'; bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT+'obrador.blend')
shot('P1_dos',(0.9,-4.6,1.9),(0,0.1,1.25),35)
shot('P2_llave',(0.15,0.0,1.2),(.62,.55,1.0),55)
shot('P3_hijo',(0.6,0.45,1.6),(-.9,-.35,1.5),50)
key.hide_render=True
k2=box('llave_mostrador',(0.3,0.75,0.965),(.12,.04,.012),gold); dedo=box('dedo',(0.38,0.75,0.975),(.09,.025,.025),skin)
shot('P4_mostrador',(-0.35,0.15,1.3),(0.3,0.75,0.96),50)
