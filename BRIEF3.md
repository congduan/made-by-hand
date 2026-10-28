# 任务3：玩法库 + 分步/连续演示系统（基于 recipes.json）

仓库 /home/ubuntu/made-by-hand。前置状态：Vue3+TS+Pinia 重构与条形磁条物理已完成（本地已 commit，报告见 REPORT.md）。

## 数据源（已备好，主控已审核）
/home/ubuntu/magnetic-tiles-recipes/recipes.json —— 12 种造型配方（7 种 verified、5 种 unverified）。
- 把它拷贝为 src/data/models.json（保留 verified 字段与来源说明）
- 新建 src/data/models.ts：类型 BuildStep / ModelRecipe + 对 recipes 的加载与坐标化

## 配方坐标化（核心工作）
recipes.json 的 steps 是文字描述。你需要为每个造型写精确摆放数据：
```ts
interface StepPiece { type: 'square'|'triangle_eq'|'triangle_right'; pos: [x,y,z]; rot: [rx,ry,rz] }
interface ModelRecipe {
  id: string; nameZh: string; nameEn: string; difficulty: 1|2|3; age: string;
  verified: boolean; steps: { hint: string; pieces: StepPiece[] }[];
}
```
- 物理红线不变：SIZE=7.5、THICK=0.55、重力-981。SIZE/2=3.75 是半边长，按此换算坐标
- 参考已有 buildCubeDemo 的墙/屋顶摆放写法（engine/magnets/ 或 legacy/）
- 分步原则：每一步完成后的中间态必须自身稳定（片放下去靠磁条吸得住），步序尽量从底向上
- 2D 造型（蝴蝶、彩虹拱门、栅栏）：平贴地面即可，天然稳定
- UNVERIFIED 的 5 种（火箭/栅栏/风车/摩天轮/卡车）：按 recipes.json 的文字步骤做几何合理摆放；**物理立不住就标 unstable:true**，UI 里只允许分步查看（静力学直接摆放，不进物理），诚实展示"该造型演示模式受物理限制"
- verified 7 种必须全部物理稳定（连续演示跑通）

## 演示系统
Pinia game store 扩展：mode:'free'|'step'|'auto'、stepIndex、currentRecipe、playing。
engine API：loadModel(recipe, uptoStep) / clearModel / getStability()（最大片速）。
- 分步模式：TutorialPanel 显示第 k/n 步 + hint + 当前步片高亮（emissive 脉冲）；上一步/下一步
- 连续模式：自动播放，每步等 getStability()<5cm/s 或超时 3s 再进下一步；暂停/继续/重播；进度条可跳步
- 摆放后靠真实磁条咬合（不预锁约束）；出生位允许 ±0.3cm 容差让磁力自然拉正

## UI（中文）
Toolbar 加「玩法库」下拉（名称+难度★+verified 徽标）；unverified 显示"配方未验证"角标。

## 验收 verify/verify-demo.mjs（puppeteer）
1. 选「立方体」分步：逐步下一步，每步 scene 片数=累计数，最终 6 正方立方（3D 闭合）
2. 「四棱锥」连续：60s 内自动完成，最终 8s 位移 <0.5cm
3. 7 个 verified 造型逐个连续演示，记录每个的最终稳定性（PASS/FAIL 单列）
4. 页面零错误；完整 stdout 追加到 REPORT.md「任务3」节

流程同前：先最小复现再修、不编造数字、完成后本地 commit 不推送。
