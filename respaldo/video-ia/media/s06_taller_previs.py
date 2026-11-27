# Previs «La factura» — Laboratorio de Vídeo IA, sesión 6 (prompt de Kling, multiplano y personajes)
import bpy, math, sys
from mathutils import Vector
OUT=sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True); sc=bpy.context.scene
def mat(n,c,em=0,r=.6,met=0,tr=0):
    m=bpy.data.materials.new(n); m.use_nodes=True; b=m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*c,1); b.inputs['Roughness'].default_value=r; b.inputs['Metallic'].default_value=met
    if tr: b.inputs['Transmission Weight'].default_value=tr
    if em: b.inputs['Emission Color'].default_value=(*c,1); b.inputs['Emission Strength'].default_value=em
    return m
def box(n,l,d,m,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=l,rotation=rot); o=bpy.context.object; o.name=n; o.dimensions=d; o.data.materials.append(m); return o
def cyl(n,l,r,dp,m,rot=(0,0,0),v=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=r,depth=dp,location=l,rotation=rot,vertices=v); o=bpy.context.object; o.name=n; o.data.materials.append(m); return o
def sph(n,l,r,m,s=(1,1,1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r,location=l); o=bpy.context.object; o.name=n; o.scale=s; o.data.materials.append(m); return o
wall=mat('pared',(.30,.31,.33),r=.9); floor=mat('suelo',(.16,.15,.14),r=.5); steel=mat('acero',(.55,.56,.58),r=.35,met=1)
door=mat('persiana',(.25,.3,.38),r=.5,met=.6); skin=mat('piel',(.55,.38,.28),r=.5)
navy=mat('mono',(.03,.05,.13),r=.7); red=mat('panuelo',(.6,.04,.03),r=.6); brown=mat('pana',(.22,.13,.07),r=.9)
cap=mat('gorra',(.18,.16,.13),r=.9); env=mat('sobre',(.85,.8,.68),r=.9); relay=mat('rele',(.03,.03,.03),r=.4)
syrup=mat('almibar',(1,.55,.12),em=2.2,r=.1); glass=mat('vidrio',(.9,.95,1),r=.02,tr=1); rag=mat('trapo',(.5,.06,.05),r=.95)
car=mat('coche',(.78,.72,.58),r=.3,met=.2)
# Espacio: suelo, fondo, pared izquierda con persiana a medio abrir (luz de mañana)
box('suelo',(0,0,-.05),(9,8,.1),floor); box('fondo',(0,1.3,1.8),(9,.1,3.6),wall)
box('izq_baja',(-3.2,-.8,0.0),(.1,4.2,.01),wall)
box('izq_alta',(-3.2,-.8,2.6),(.1,4.2,2.0),door)   # persiana: mitad superior bajada
box('izq_fondo',(-3.2,1.0,1.8),(.1,.6,3.6),wall)
bpy.ops.object.light_add(type='SUN',rotation=(math.radians(68),0,math.radians(-62))); S=bpy.context.object; S.data.energy=6.5; S.data.color=(1,.82,.6); S.data.angle=math.radians(1.5)
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs['Color'].default_value=(.05,.08,.14,1); w.node_tree.nodes['Background'].inputs['Strength'].default_value=.6
# Coche crema (el del episodio anterior) al fondo a la derecha
box('coche',(2.6,-.2,.55),(1.7,3.6,.9),car); box('cabina',(2.6,0.2,1.2),(1.5,1.8,.5),car)
# Banco de trabajo contra el fondo
box('banco',(0,.85,.47),(2.6,.75,.94),steel); box('tablero',(0,.85,.955),(2.7,.8,.03),steel)
box('lampara',(0.9,1.0,1.9),(.25,.25,.1),mat('foco',(1,.9,.7),em=6))
rl=box('rele',(.32,.72,1.0),(.06,.05,.07),relay); box('trapo',(.55,.85,.98),(.25,.18,.02),rag)
cyl('tarro',(0.08,.72,1.06),.065,.17,glass); cyl('melocotones',(0.08,.72,1.05),.058,.14,syrup); cyl('tapa',(0.08,.72,1.15),.068,.02,mat('tapa',(.7,.6,.3),met=1,r=.3))
envo=box('sobre',(-.25,.7,.975),(.22,.12,.006),env)
# Personajes: A (mecánica) a la derecha mira a la izquierda; B (anciano) a la izquierda mira a la derecha. Eje de acción en y=0.25
def persona(x,body,h,head_extra,face):
    cyl('cuerpo',(x,.25,h/2),.2,h,body,v=20); sph('cabeza',(x,.25,h+.15),.12,skin,(1,1,1.15)); head_extra(x,h)
    sph('nariz',(x+face*.12,.25,h+.15),.025,skin)
    cyl('brazo_f',(x+face*.12,.12,h-.35),.045,.55,body if body!=navy else skin)
persona(.55,navy,1.5,lambda x,h:(cyl('panuelo',(x,.25,h+.24),.125,.06,red),sph('pelo',(x+.09,.25,h+.13),.1,mat('pelo',(.04,.03,.03),r=.8))),-1)
persona(-.55,brown,1.45,lambda x,h:(cyl('gorra',(x,.25,h+.25),.14,.05,cap),box('visera',(x+.13,.25,h+.24),(.12,.2,.015),cap)),1)
for x in (.55,-.55):
    pass
brazoA=cyl('brazo_A',(.3,.66,1.07),.04,.42,skin,rot=(math.radians(90),0,math.radians(70))); brazoA.hide_render=True
sc.render.engine='CYCLES'; sc.cycles.samples=24; sc.cycles.use_denoising=True; sc.cycles.device='CPU'
sc.render.resolution_x,sc.render.resolution_y=960,540; sc.view_settings.look='AgX - Medium High Contrast'
def shot(name,loc,tgt,lens,ortho=0):
    bpy.ops.object.camera_add(location=loc); c=bpy.context.object; c.data.lens=lens
    if ortho: c.data.type='ORTHO'; c.data.ortho_scale=ortho
    c.rotation_euler=(Vector(tgt)-Vector(loc)).to_track_quat('-Z','Y').to_euler(); sc.camera=c
    sc.render.filepath=OUT+name+'.png'; bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT+'s06_taller.blend')
shot('P1_general',(0.0,-4.4,1.6),(-.2,.5,1.1),24)
envo.location=(-.05,.62,.975)
shot('P2_ots',(1.25,-.25,1.72),(-.55,.25,1.6),35)
envo.location=(.2,.62,.975)
shot('P3a_ella',(-0.75,-.75,1.66),(.55,.25,1.64),50)
shot('P3b_ella',(-0.35,-.45,1.66),(.55,.25,1.64),50)
brazoA.hide_render=False
shot('P4_tarro',(-.15,.22,1.22),(.15,.74,1.03),45)
