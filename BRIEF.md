# 任务：CraftPlay（做手工）Vue 3 重构 + 条形磁条物理升级

## 仓库
/home/ubuntu/made-by-hand（新目录，从零搭，不碰旧仓库 /home/ubuntu/mideer-magnets）
git 已 init。gh 账号 congduan，email congduan@yeah.net。

## 目标
把 legacy 原型（/home/ubuntu/mideer-magnets/legacy/ 下 index.html + src/main.js 可参考）重构为业界主流工程化项目，同时升级物理模型。

## 技术栈（必须，业界主流最佳实践）
- **Vue 3** `<script setup>` + **TypeScript** 严格模式
- **Vite** 构建；**Pinia** 状态管理；**Vue Router**（/ 即磁力片页，预留 /origami /papercraft 路由占位）
- **Three.js** + **cannon-es**（封装到独立 engine 层，不混入组件）
- 组件化：SceneCanvas（three 挂载）、Toolbar、PiecePalette、TutorialPanel、HelpPanel
- composables：usePhysics（物理世界生命周期）、useCamera（轨道控制）
- 目录：
  ```
  src/
    engine/        three+ cannon 封装（magnets/ 子模块：pieces.ts magnetics.ts world.ts）
    stores/        Pinia（game: 片数/教程状态/模式）
    composables/
    components/
    views/         CraftView.vue（磁力片）+ PlaceholderView（折纸/剪纸占位）
    router/
    types/
  ```

## 物理红线（不许改口径，只许按此实现）
1. 真实规格：边长 7.5cm、厚 0.55cm、重力 -981 cm/s²
2. **条形磁条模型（本次核心升级，替换旧磁珠点模型）**：
   - 每条边内嵌 1 条沿边分布的磁条（长≈边长×0.7，居中，截面视为线段）
   - 磁条离散成 N=9 个采样点，条对条吸力 = 各采样点对求和，F=F0·(D0/d)²
   - **力施加在各采样点对位置（applyForce 带 worldPoint），不是合力过质心**——条间错位产生的对齐力矩必须自然涌现（这是真磁力片自动吸正的力学根源）
   - 咬合仍用 LockConstraint；锁定条件：near>F0·K + 面平行/垂直(±20°) + 相对速度阈值
3. 吸力方向 d<1e-8 时跳过（防 NaN）
4. 演示小房子（4 正方墙 + 4 等边三角金字塔顶）必须物理稳定站立

## 验收（全部通过才算完成）
- `npm run build` 无错误；`vue-tsc --noEmit` 类型检查通过
- 移植 legacy/verify.js 与 verify-house.js 为 verify/verify.mjs + verify/verify-house.mjs（puppeteer 起 vite preview 验证）：
  - 页面零 console/page 错误
  - 演示 8 片：墙 y≈3.75±0.5、环半径 3.75±0.5、方位互差 90°±8°、屋顶 y≈9.3±0.6、倾角 -35.3°±8°
  - 8s 观察窗最大位移 <0.5cm（结构稳定）
  - **新增条形磁条专项**：单悬空片从斜 45° 姿态落到已贴地平片旁，5s 内被吸成正对贴合（错位 <0.5cm、角度差 <5°）——证明对齐力矩真实生效
- 验收脚本贴完整 stdout 到 REPORT.md

## 流程要求
- 逐步写战报 REPORT.md（做了什么/结果/原始输出）
- 假设可能错，先最小复现再修；不编造数字
- 沙箱 --sandbox danger-full-access；node_modules 可自由 npm i
- puppeteer 已在旧仓库装过，新仓库需自行 npm i -D puppeteer（无头参数：--no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader）
- 完成后 git commit（不推送，主控审后推）
