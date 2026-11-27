import bpy, math, sys
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=96; sc.cycles.use_denoising=True
sc.render.resolution_x=1600; sc.render.resolution_y=900
sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Punchy'
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True
w.node_tree.nodes['Background'].inputs[0].default_value=(0.004,0.003,0.008,1)
# text
bpy.ops.object.text_add(location=(0,0,0)); t=bpy.context.object
t.data.body='NL'; t.data.align_x='CENTER'; t.data.align_y='CENTER'
t.data.extrude=0.18; t.data.bevel_depth=0.025; t.data.bevel_resolution=3; t.data.size=2.2
t.rotation_euler=(math.radians(90),0,0); t.location=(0,0,1.15)
m=bpy.data.materials.new('violeta'); m.use_nodes=True; b=m.node_tree.nodes['Principled BSDF']
b.inputs['Base Color'].default_value=(0.12,0.03,0.35,1); b.inputs['Metallic'].default_value=0.85; b.inputs['Roughness'].default_value=0.22
t.data.materials.append(m)
# neon ring
bpy.ops.mesh.primitive_torus_add(major_radius=1.85,minor_radius=0.03,major_segments=128,minor_segments=16,location=(0,0.25,1.15),rotation=(math.radians(90),0,0))
r=bpy.context.object; me=bpy.data.materials.new('neon'); me.use_nodes=True
nt=me.node_tree; nt.nodes.clear(); e=nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value=(0.42,0.12,1.0,1); e.inputs[1].default_value=4
o=nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs[0],o.inputs[0]); r.data.materials.append(me)
# wet floor
bpy.ops.mesh.primitive_plane_add(size=40,location=(0,0,-0.02)); f=bpy.context.object
fm=bpy.data.materials.new('asfalto'); fm.use_nodes=True; fb=fm.node_tree.nodes['Principled BSDF']
fb.inputs['Base Color'].default_value=(0.01,0.01,0.015,1); fb.inputs['Roughness'].default_value=0.3
n=fm.node_tree.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value=6
mr=fm.node_tree.nodes.new('ShaderNodeMapRange'); mr.inputs[3].default_value=0.18; mr.inputs[4].default_value=0.7
fm.node_tree.links.new(n.outputs[0],mr.inputs[0]); fm.node_tree.links.new(mr.outputs[0],fb.inputs['Roughness'])
f.data.materials.append(fm)
# lights
def area(loc,col,en,size):
    bpy.ops.object.light_add(type='AREA',location=loc); l=bpy.context.object; l.data.energy=en; l.data.color=col; l.data.size=size
    d=Vector((0,0,1.1))-l.location; l.rotation_euler=d.to_track_quat('-Z','Y').to_euler(); return l
area((-4,-1,5),(0.75,0.6,1),250,2); area((4.5,2,2.5),(0.55,0.25,1),900,2); area((0,4,3),(0.6,0.4,1),120,4)
cam=bpy.data.cameras.new('c'); co=bpy.data.objects.new('c',cam); sc.collection.objects.link(co); sc.camera=co
co.location=(1.2,-9.0,1.6); d=Vector((0,0,1.05))-co.location; co.rotation_euler=d.to_track_quat('-Z','Y').to_euler(); cam.lens=50; cam.shift_x=-0.2
cam.dof.use_dof=True; cam.dof.focus_distance=9.1; cam.dof.aperture_fstop=2.8
sc.render.filepath=sys.argv[-1]; bpy.ops.render.render(write_still=True)
