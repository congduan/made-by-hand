import * as THREE from 'three'
import source from './models.json'
import { SIZE, THICK } from '../engine/magnets/pieces'

export type ModelPieceType = 'square' | 'triangle_eq' | 'triangle_right'
export interface StepPiece { type: ModelPieceType; pos: [number, number, number]; rot: [number, number, number] }
export interface BuildStep { hint: string; pieces: StepPiece[] }
export interface ModelRecipe {
  id: string; nameZh: string; nameEn: string; difficulty: 1 | 2 | 3; age: string
  verified: boolean; source: string; note?: string; unstable?: boolean; steps: BuildStep[]
}
const S = SIZE, H = SIZE / 2, T = THICK / 2
const flat: [number, number, number] = [-Math.PI / 2, 0, 0]
const piece = (type: ModelPieceType, x: number, y: number, z: number, rot: [number, number, number] = flat): StepPiece => ({ type, pos: [x,y,z], rot })
const square = (x: number, z: number) => piece('square',x,T,z)
const tri = (x: number, z: number) => piece('triangle_eq',x,T,z)
const wall = (i: number, height = H): StepPiece => { const a = i*Math.PI/2; return piece('square', Math.sin(a)*H,height,Math.cos(a)*H,[0,a,0]) }
const roof = (i: number, baseHeight = S): StepPiece => { const a=i*Math.PI/2; return piece('triangle_eq',Math.sin(a)*S/3,baseHeight+S*0.236,Math.cos(a)*S/3,[-Math.atan(1/Math.SQRT2),a,0]) }
// Match the local upright equilateral triangle to three world-space vertices.
function face(top: THREE.Vector3, left: THREE.Vector3, right: THREE.Vector3): StepPiece {
  const center = top.clone().add(left).add(right).divideScalar(3)
  const x = right.clone().sub(left).normalize()
  const y = top.clone().sub(left.clone().add(right).multiplyScalar(0.5)).normalize()
  const z = x.clone().cross(y).normalize()
  const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z)),'XYZ')
  return piece('triangle_eq',center.x,center.y,center.z,[e.x,e.y,e.z])
}
const v = (x:number,y:number,z:number) => new THREE.Vector3(x,y,z)
function pyramidFaces(baseY = 0): StepPiece[] {
  const apex = v(0,baseY+S*Math.sqrt(2/3),0)
  const base = [v(0,baseY,S/Math.sqrt(3)),v(-H,baseY,-S/(2*Math.sqrt(3))),v(H,baseY,-S/(2*Math.sqrt(3)))]
  return [face(base[0],base[1],base[2]),...base.map((p,i)=>face(apex,p,base[(i+1)%3]))]
}
const specs: Record<string, StepPiece[][]> = {
 cube: [[square(0,0)],[wall(0),wall(1)],[wall(2),wall(3)],[piece('square',0,S+T,0)]],
 square_pyramid: [[square(0,0)],[roof(0,0)],[roof(2,0)],[roof(1,0)],[roof(3,0)]],
 house_3d: [[wall(0),wall(1)],[wall(2),wall(3)],[roof(0),roof(1)],[roof(2),roof(3)]],
 tetrahedron: [[pyramidFaces()[0]],[pyramidFaces()[1]],[pyramidFaces()[2]],[pyramidFaces()[3]]],
 rocket: [[...Array.from({length:4},(_,i)=>wall(i))],[...Array.from({length:4},(_,i)=>roof(i))],[...Array.from({length:4},(_,i)=>piece('triangle_right',Math.sin(i*Math.PI/2)*S,H/2,Math.cos(i*Math.PI/2)*S,[0,i*Math.PI/2,0]))],[square(0,2*S),square(0,-S)]],
 butterfly: [[square(0,0),square(0,S)],[tri(0,2*S)],[...[-3,-2,-1,1,2,3].map(i=>square(i*S,S))],[...[-4,-3,3,4].map(i=>square(i*S,0)),...[-4,-3,3,4].map(i=>tri(i*S,-S))],[...[-1,1].map(i=>tri(i*S,3*S)),...[-2,2,0].map(i=>tri(i*S,-2*S))]],
 rainbow_ball_octahedron: [],
 fence: [[...Array.from({length:2},(_,i)=>square(i*S,0))],[...Array.from({length:6},(_,i)=>square((i+2)*S,0))],[tri(0,S),tri(7*S,S)],[tri(2*S,S),tri(5*S,S)]],
 pinwheel: [[square(0,0)],[tri(0,S),tri(S,0),tri(0,-S),tri(-S,0)],[square(0,2*S),square(2*S,0),square(0,-2*S),square(-2*S,0)]],
 ferris_wheel: [[...Array.from({length:8},(_,i)=>square(Math.cos(i*Math.PI/4)*S*2,Math.sin(i*Math.PI/4)*S*2))],[...Array.from({length:8},(_,i)=>tri(Math.cos(i*Math.PI/4)*S*3,Math.sin(i*Math.PI/4)*S*3))],[...Array.from({length:4},(_,i)=>square((i-1.5)*S,-3*S))]],
 truck: [[...Array.from({length:4},(_,i)=>wall(i))],[square(0,0),square(0,S)],[piece('triangle_right',-S,T,0),piece('triangle_right',S,T,0)],[tri(-S,-S),tri(S,-S)]],
 rainbow_arch: [[...Array.from({length:3},(_,i)=>square(-4*S,i*S)),...Array.from({length:3},(_,i)=>square(4*S,i*S))],[...[-3,-2,-1,0].map((i,j)=>square(i*S,(j<2?3:4)*S))],[...[1,2,3,4,5].map((i,j)=>square(i*S,(j<3?4:3)*S))],[...[-3,-2,-1,1,2,3].map(i=>tri(i*S,5*S))]],
}
// Octahedron rests on a triangular face. Rotate the ideal octahedron so that face is horizontal.
const oct = [v(H,H,H),v(-H,H,H),v(-H,H,-H),v(H,H,-H)]
const top = v(0,H+S/Math.SQRT2,0), bottom = v(0,H-S/Math.SQRT2,0)
const normal = top.clone().sub(oct[0]).cross(oct[1].clone().sub(oct[0])).normalize()
const turn = new THREE.Quaternion().setFromUnitVectors(normal,new THREE.Vector3(0,-1,0))
const ov = (p:THREE.Vector3) => p.clone().sub(v(0,H,0)).applyQuaternion(turn).add(v(0,S/Math.SQRT2+T,0))
specs.rainbow_ball_octahedron = [
 [...[0,1,2,3].map(i=>face(ov(top),ov(oct[i]),ov(oct[(i+1)%4]))), ...[0,1,2,3].map(i=>face(ov(bottom),ov(oct[(i+1)%4]),ov(oct[i])))]
]
const difficulty = (s:string): 1|2|3 => s==='入门'?1:s==='进阶'?3:2
export const models: ModelRecipe[] = source.recipes.map(raw => {
 const groups = specs[raw.id]
 const hints = raw.steps.filter(s=>!s.startsWith('玩法提示'))
 const PHYSICALLY_HARD = ['tetrahedron','square_pyramid','rainbow_ball_octahedron'] // 斜面合拢型：合拢冲击致物理演示不稳定，降级静力学分步
 return { id:raw.id,nameZh:raw.name_zh,nameEn:raw.name_en,difficulty:difficulty(raw.difficulty),age:raw.age,verified:raw.verified,source:raw.source,note:'note' in raw ? raw.note : undefined,unstable:(!raw.verified && !['fence','pinwheel'].includes(raw.id)) || PHYSICALLY_HARD.includes(raw.id),steps:groups.map((pieces,i)=>({hint:hints[Math.min(i,hints.length-1)],pieces})) }
})
export const getModel = (id:string) => models.find(m=>m.id===id)
