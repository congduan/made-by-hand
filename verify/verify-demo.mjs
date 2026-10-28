import { withPage, check, delay } from './browser.mjs'
const verified = ['cube','square_pyramid','house_3d','tetrahedron','butterfly','rainbow_ball_octahedron','rainbow_arch']
const expected = {cube:6,square_pyramid:5,house_3d:8,tetrahedron:4,butterfly:22,rainbow_ball_octahedron:8,rainbow_arch:21}
const state = page => page.evaluate(() => window.__dbg())
async function choose(page,id) {await page.select('#model-select',id);await page.waitForFunction(() => window.__model().pieces > 0)}
async function waitDone(page) { await page.waitForFunction(() => { const box=document.querySelector('#tutbox');return box && !document.querySelector('#auto-toggle')?.textContent?.includes('暂停') && document.querySelector('.step-number')?.textContent?.match(/第\s*(\d+)\s*\/\s*(\d+)/)?.[1]===document.querySelector('.step-number')?.textContent?.match(/第\s*(\d+)\s*\/\s*(\d+)/)?.[2] },{timeout:60000,polling:100}) }
const positions = s => s.pieces.filter(p=>p.demo).map(p=>[p.x,p.y,p.z])
function drift(a,b) {return Math.max(...a.map((p,i)=>Math.hypot(...p.map((x,j)=>x-b[i][j]))))}
await withPage(async (page,errors)=>{
  await choose(page,'cube')
  const counts=[]
  counts.push((await state(page)).pieces.filter(p=>p.demo).length)
  for(let i=1;i<4;i++){await page.click('#step-next');counts.push((await state(page)).pieces.filter(p=>p.demo).length)}
  check('立方体分步累计片数',JSON.stringify(counts)===JSON.stringify([1,3,5,6]),JSON.stringify(counts))
  const cube=(await state(page)).pieces.filter(p=>p.demo)
  check('立方体最终六正方',cube.length===6&&cube.every(p=>p.t==='square'),JSON.stringify(cube.map(p=>p.t)))
  for(const id of verified.filter(id=>!process.env.MODELS || process.env.MODELS.split(',').includes(id))){
    await choose(page,id)
    await page.click('#auto-toggle')
    let completed=true
    try {await waitDone(page)} catch {completed=false}
    const a=await state(page), pa=positions(a)
    await delay(8000)
    const b=await state(page), pb=positions(b)
    const d=pa.length===pb.length?drift(pa,pb):Infinity
    if (id==='rainbow_ball_octahedron') console.log('oct states',JSON.stringify({a:a.pieces.filter(p=>p.demo),b:b.pieces.filter(p=>p.demo),constraints:b.constraints}))
    const speed=await page.evaluate(()=>window.__model().stability)
    check(`${id} 连续演示`,completed&&pa.length===expected[id]&&d<0.5,`完成=${completed} 片数=${pa.length}/${expected[id]} 8s位移=${d.toFixed(3)}cm 最大片速=${speed.toFixed(3)}cm/s`)
  }
  check('页面错误 0',errors.length===0,JSON.stringify(errors))
})
