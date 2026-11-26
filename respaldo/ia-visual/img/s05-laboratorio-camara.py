import bpy, math, sys
from mathutils import Vector
out=sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=40; sc.cycles.use_denoising=True
sc.render.resolution_x=480; sc.render.resolution_y=600
sc.view_settings.view_transform='AgX'
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True
w.node_tree.nodes['Background'].inputs[0].default_value=(0.02,0.022,0.03,1); w.node_tree.nodes['Background'].inputs[1].default_value=1
def mat(n,c,r=0.5,m=0.0):
    M=bpy.data.materials.new(n); M.use_nodes=True; b=M.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*c,1); b.inputs['Roughness'].default_value=r; b.inputs['Metallic'].default_value=m; return M
skin=mat('skin',(0.72,0.62,0.52),0.55); grey=mat('g',(0.18,0.18,0.2),0.8); acc=mat('a',(0.9,0.6,0.1),0.4); cool=mat('c',(0.25,0.35,0.5),0.6)
def add(o,M,name=None):
    o.data.materials.append(M)
    for p in o.data.polygons: p.use_smooth=True
    return o
# floor
bpy.ops.mesh.primitive_plane_add(size=60); add(bpy.context.object,grey)
# mannequin: torso, neck, head with features
bpy.ops.mesh.primitive_cylinder_add(radius=0.32,depth=0.7,location=(0,0,1.15)); t=bpy.context.object; t.scale=(1,0.6,1); add(t,cool)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.33,location=(0,0,1.5)); s=bpy.context.object; s.scale=(1.25,0.7,0.35); add(s,cool)
bpy.ops.mesh.primitive_cylinder_add(radius=0.07,depth=0.25,location=(0,0,1.62)); add(bpy.context.object,skin)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13,location=(0,0,1.86),segments=48,ring_count=32); h=bpy.context.object; h.scale=(0.85,0.95,1.15); add(h,skin)
# brow ridge
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1,location=(0,-0.085,1.92)); b=bpy.context.object; b.scale=(0.95,0.35,0.22); add(b,skin)
# cheekbones
for x in (-0.06,0.06):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04,location=(x,-0.095,1.84)); add(bpy.context.object,skin)
# eye sockets: dark small spheres recessed
for x in (-0.042,0.042):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.018,location=(x,-0.112,1.885)); add(bpy.context.object,mat('e',(0.05,0.05,0.05),0.3))
# nose
bpy.ops.mesh.primitive_cone_add(radius1=0.022,radius2=0.008,depth=0.07,location=(0,-0.135,1.855)); n=bpy.context.object; n.rotation_euler=(math.radians(-75),0,0); add(n,skin)
# chin
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045,location=(0,-0.09,1.75)); c=bpy.context.object; c.scale=(1,0.8,0.8); add(c,skin)
# background pillars at increasing distance (to show compression)
for i,(x,y) in enumerate([(-1.2,3),(1.3,5),(-1.6,8),(1.8,12),(-2.2,17),(2.4,23)]):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,1.5)); p=bpy.context.object; p.scale=(0.35,0.35,1.5); add(p,acc if i%2==0 else grey)
# OTS foreground shoulder (second figure)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.35,location=(0.75,-1.55,1.5)); o=bpy.context.object; o.scale=(1.1,0.7,0.45); add(o,mat('d',(0.08,0.08,0.09),0.7)); o.name='ots'
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12,location=(0.72,-1.57,1.82)); o2=bpy.context.object; add(o2,mat('d2',(0.1,0.08,0.07),0.7)); o2.name='ots2'
# lights: key 45 upper left, rim back right
def light(name,loc,energy,size,col):
    L=bpy.data.lights.new(name,'AREA'); L.energy=energy; L.size=size; L.color=col
    ob=bpy.data.objects.new(name,L); sc.collection.objects.link(ob); ob.location=loc
    d=Vector((0,0,1.85))-Vector(loc); ob.rotation_euler=d.to_track_quat('-Z','Y').to_euler()
light('key',(-1.6,-1.6,2.6),420,0.6,(1,0.85,0.7))
light('rim',(1.3,1.6,2.4),180,0.3,(0.6,0.75,1))
light('fill',(1.5,-2,1.6),10,2,(1,1,1))
cam=bpy.data.cameras.new('cam'); co=bpy.data.objects.new('cam',cam); sc.collection.objects.link(co); sc.camera=co
target=Vector((0,0,1.8))
shots={
 'gran24':dict(f=24,loc=(0.1,-0.42,1.88),tgt=(0,0,1.85)),
 'normal50':dict(f=50,loc=(0.2,-0.9,1.88),tgt=(0,0,1.85)),
 'tele135':dict(f=135,loc=(0.55,-2.45,1.88),tgt=(0,0,1.85)),
 'contrapicado':dict(f=24,loc=(0.15,-0.75,1.3),tgt=(0,0,1.86)),
 'picado':dict(f=28,loc=(0.1,-0.65,2.5),tgt=(0,0,1.8)),
 'hombro':dict(f=85,loc=(1.0,-2.6,1.95),tgt=(0,0,1.86)),
 'holandes':dict(f=35,loc=(0.15,-0.95,1.86),tgt=(0,0,1.84),roll=-20),
}
s=shots[out]
cam.lens=s['f']; co.location=s['loc']
d=Vector(s['tgt'])-Vector(s['loc']); co.rotation_euler=d.to_track_quat('-Z','Y').to_euler()
if 'roll' in s: co.rotation_euler.rotate_axis('Z',math.radians(s['roll']))
cam.dof.use_dof = out in ('tele135','normal50','hombro')
cam.dof.focus_distance=d.length; cam.dof.aperture_fstop=2.0 if out!='tele135' else 2.8
if out!='hombro':
    for n in ('ots','ots2'): bpy.data.objects[n].hide_render=True
sc.render.filepath=f'//{out}.png'
bpy.ops.render.render(write_still=True)
