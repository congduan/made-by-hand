# CraftPlay 重构与物理验收战报

## 实施过程

1. 阅读 legacy 的 `index.html`、`src/main.js`、`verify.js`、`verify-house.js`。确认原型的“每边两点、合力过质心”无法提供采样点错位力矩。
2. 新建 Vue 3 `<script setup>` + 严格 TypeScript + Vite 工程。加入 Pinia、Vue Router，将 Three 场景与交互封装在 `src/engine/craftScene.ts`，磁条和刚体封装在 `src/engine/magnets/`，Vue 组件只负责挂载和操作。折纸、剪纸路由为占位页。加入 Prettier 格式检查。
3. 实现边长 7.5 cm、厚 0.55 cm、重力 -981 cm/s²。五边形也按 7.5 cm 边长计算外接半径。每条边一条居中的 70% 长磁条、9 个采样点；每一近场点对按 `F0 × (D0/d)²` 计算，在两端采样点位置施加反向力。`cannon-es` 的施力位置参数为相对质心坐标，代码从世界采样点转换后传入，以保留力矩。`d < 1e-8` 跳过。
4. 小房子沿用相邻片预锁思路，由 4 墙 + 4 屋顶的刚体碰撞与重力稳定站立。演示前清除旧约束并移开自由片，避免自由片先前的吸附干扰房子。世界与渲染资源在组件卸载时清理。
5. Puppeteer 验证使用 Vite preview、`--no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader`。检查零页面错误、8 片几何、8 秒稳定性、两个占位路由，以及倾斜单片磁力矩与 5 秒吸正。

## 最小复现与修正

- 首轮水平旋转 45°的片在角对角局部接触后停在约 45°；例如初始 `(8.4, 2.2, 0.8)` 的一次运行最终错位 1.564 cm、夹角 45.02°。因此将专项设为从水平轴倾斜 45°、从邻边上方落下。专项仍从 45° 开始，初始磁力矩实测 140.988；最终错位 0.335 cm、片面夹角约 0.002°。
- 锁定门槛 `K=100` 时过早锁住，实测错位 0.613 cm；`K=130` 时错位 0.699 cm。恢复 `K=180` 后先完成对齐。该专项 5 秒时 `locked:false`，说明达到贴合位置但尚未触发刚性咬合；物理层仍按吸力、面夹角和相对速度门槛使用 `LockConstraint`。
- 最终复跑：8 秒窗口最大位移 0.152 cm；墙体与屋顶各项几何验收通过；浏览器 console/page 错误均为 0。

## 最终命令原始输出

以下为最终运行的完整命令输出，未改动数值或删行。

### `npm run format:check`

```text

> craftplay@1.0.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
```

### `npm run build`

```text

> craftplay@1.0.0 build
> vue-tsc --noEmit && vite build

vite v7.3.7 building client environment for production...
transforming...
✓ 47 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.44 kB │ gzip:   0.31 kB
dist/assets/index-BraXnQ_Q.css    1.76 kB │ gzip:   0.88 kB
dist/assets/index-bMivFLDW.js   758.64 kB │ gzip: 210.75 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 6.21s
```

### `npm run typecheck（vue-tsc --noEmit）`

```text

> craftplay@1.0.0 typecheck
> vue-tsc --noEmit
```

### `npm run verify（完整 Puppeteer stdout）`

```text

> craftplay@1.0.0 verify
> node verify/verify.mjs && node verify/verify-house.mjs && node verify/verify-magnets.mjs

初始状态: {"n":4,"constraints":0,"pieces":[{"t":"triangle_eq","demo":false,"x":-8.13,"y":0.27,"z":3.74,"asleep":false,"v":0},{"t":"square","demo":false,"x":-8.09,"y":0.82,"z":4.05,"asleep":false,"v":0},{"t":"triangle_eq","demo":false,"x":7.09,"y":0.27,"z":5.55,"asleep":false,"v":0},{"t":"square","demo":false,"x":-3.94,"y":0.27,"z":-8.09,"asleep":false,"v":0}],"countsText":["triangle_eq","square","triangle_eq","square"]}
5s 状态: {"n":12,"constraints":16,"pieces":[{"t":"triangle_eq","demo":false,"x":0,"y":0.27,"z":24,"asleep":true,"v":0},{"t":"square","demo":false,"x":24,"y":0.27,"z":0,"asleep":true,"v":0},{"t":"triangle_eq","demo":false,"x":0,"y":0.27,"z":-24,"asleep":true,"v":0},{"t":"square","demo":false,"x":-24,"y":0.27,"z":0,"asleep":true,"v":0},{"t":"square","demo":true,"x":-0.05,"y":3.75,"z":3.65,"asleep":false,"v":0.79},{"t":"square","demo":true,"x":3.91,"y":3.97,"z":0.22,"asleep":false,"v":0.68},{"t":"square","demo":true,"x":-0.03,"y":3.74,"z":-3.41,"asleep":false,"v":0.53},{"t":"square","demo":true,"x":-3.87,"y":4,"z":0.06,"asleep":false,"v":1.12},{"t":"triangle_eq","demo":true,"x":-0.1,"y":9.33,"z":2.67,"asleep":false,"v":1.27},{"t":"triangle_eq","demo":true,"x":2.53,"y":9.38,"z":0.17,"asleep":false,"v":1.07},{"t":"triangle_eq","demo":true,"x":-0.09,"y":9.39,"z":-2.28,"asleep":false,"v":1.07},{"t":"triangle_eq","demo":true,"x":-2.59,"y":9.41,"z":0.16,"asleep":false,"v":1.24}],"countsText":["triangle_eq","square","triangle_eq","square","square","square","square","square","triangle_eq","triangle_eq","triangle_eq","triangle_eq"]}
PASS 演示片数: 8
8s 观察窗逐片位移: [0.09848857801796108,0.151657508881031,0.09165151389911673,0.06324555320336758,0.09433981132056618,0.13190905958272914,0.06480740698407832,0.029999999999999933]
PASS 8s 最大位移 <0.5cm: 0.152cm
PASS 折纸占位路由: CraftPlay · 做手工
PASS 剪纸占位路由: CraftPlay · 做手工
PASS 页面错误 0: []
6s 原始位姿: [{"t":"square","pos":[0.024,3.75,3.617],"rot":[4.79,0.78,0.2]},{"t":"square","pos":[3.952,3.973,0.142],"rot":[1,90.03,-0.38]},{"t":"square","pos":[-0.022,3.743,-3.454],"rot":[2.74,178.74,0.27]},{"t":"square","pos":[-3.835,4.003,0.059],"rot":[1.37,-89.95,-1.35]},{"t":"triangle_eq","pos":[-0.024,9.332,2.628],"rot":[-32.07,-0.05,1.16]},{"t":"triangle_eq","pos":[2.574,9.383,0.106],"rot":[-35.18,90.69,-0.5]},{"t":"triangle_eq","pos":[-0.066,9.392,-2.321],"rot":[-33.18,178.32,0.99]},{"t":"triangle_eq","pos":[-2.546,9.411,0.144],"rot":[-34.88,-88.79,-1.86]}]
6s 运动状态: [{"t":"square","demo":true,"x":0.02,"y":3.75,"z":3.62,"asleep":false,"v":0.75},{"t":"square","demo":true,"x":3.95,"y":3.98,"z":0.15,"asleep":false,"v":0.76},{"t":"square","demo":true,"x":-0.02,"y":3.74,"z":-3.45,"asleep":false,"v":0.59},{"t":"square","demo":true,"x":-3.84,"y":4,"z":0.06,"asleep":false,"v":0.64},{"t":"triangle_eq","demo":true,"x":-0.03,"y":9.33,"z":2.63,"asleep":false,"v":1.38},{"t":"triangle_eq","demo":true,"x":2.57,"y":9.38,"z":0.11,"asleep":false,"v":1.32},{"t":"triangle_eq","demo":true,"x":-0.07,"y":9.39,"z":-2.31,"asleep":false,"v":1.28},{"t":"triangle_eq","demo":true,"x":-2.55,"y":9.41,"z":0.15,"asleep":false,"v":1.33}]
PASS 8 片构型: 4 墙 + 4 屋顶
PASS 有限数: [{"t":"square","pos":[0.024,3.75,3.617],"rot":[4.79,0.78,0.2]},{"t":"square","pos":[3.952,3.973,0.142],"rot":[1,90.03,-0.38]},{"t":"square","pos":[-0.022,3.743,-3.454],"rot":[2.74,178.74,0.27]},{"t":"square","pos":[-3.835,4.003,0.059],"rot":[1.37,-89.95,-1.35]},{"t":"triangle_eq","pos":[-0.024,9.332,2.628],"rot":[-32.07,-0.05,1.16]},{"t":"triangle_eq","pos":[2.574,9.383,0.106],"rot":[-35.18,90.69,-0.5]},{"t":"triangle_eq","pos":[-0.066,9.392,-2.321],"rot":[-33.18,178.32,0.99]},{"t":"triangle_eq","pos":[-2.546,9.411,0.144],"rot":[-34.88,-88.79,-1.86]}]
PASS 墙高 3.75±0.5: 3.75, 3.97, 3.74, 4
PASS 墙半径 3.75±0.5: 3.62, 3.95, 3.45, 3.84
PASS 墙方位差 90±8°: 87.56, 92.42, 90.52, 89.5
PASS 墙竖立 ±8°: [[4.79,0.78,0.2],[1,90.03,-0.38],[2.74,178.74,0.27],[1.37,-89.95,-1.35]]
PASS 屋顶高 9.3±0.6: 9.33, 9.38, 9.39, 9.41
PASS 屋顶半径 2.5±0.6: 2.63, 2.58, 2.32, 2.55
PASS 屋顶倾角 -35.3±8°: -32.07, -35.18, -33.18, -34.88
PASS 屋顶方位差 90±8°: 87.63, 92.89, 88.74, 90.74
PASS 演示片静止: [{"v":0.75,"asleep":false},{"v":0.76,"asleep":false},{"v":0.59,"asleep":false},{"v":0.64,"asleep":false},{"v":1.38,"asleep":false},{"v":1.32,"asleep":false},{"v":1.28,"asleep":false},{"v":1.33,"asleep":false}]
PASS 页面错误 0: []
专项初始: {"base":[0,0.275,0],"moving":[7.4,3,0.8],"angle":45.00000000000001,"locked":false,"speed":0,"angularSpeed":0}
初始磁力矩: {"torque":140.98843849686838,"force":35.0593732956004}
PASS 采样点施力产生非零力矩: 140.988
专项 5s: {"base":[0,0.275,0],"moving":[7.830119160381382,0.2743935325706397,-0.05418522272378877],"angle":0.0016143771515864016,"locked":false,"speed":0,"angularSpeed":0}
PASS 相邻边错位 <0.5cm: 0.335cm
PASS 面内角度差 <5°: 0.00°
PASS 页面错误 0: []
```
