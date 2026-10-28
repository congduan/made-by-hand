# 追加任务：玩法库 + 分步/连续演示系统

在已完成的重构基础上（Vue3+TS+Pinia，engine/magnets/ 条形磁条物理已实现）追加：

## 1. 玩法库（数据驱动）
新建 src/data/models.ts：每个造型一条记录：
```ts
interface BuildStep { pieces: { type: PieceType; pos: [x,y,z]; rot: [rx,ry,rz] }[]; hint: string }
interface ModelRecipe {
  id: string; name: string; nameEn: string; difficulty: 1|2|3; age: string;
  steps: BuildStep[];  // 每步一批片，位置为精确摆放坐标（同 buildCubeDemo 的摆放法）
}
```
造型清单（主控另发玩法定义 JSON，照抄其 pos/rot；若与物理红线冲突以红线为准微调并记录）。

## 2. 演示系统（TutorialPanel 改造）
- **分步模式**：显示第 k/n 步文案 + 场景里只放当前步的片；「上一步/下一步」按钮；当前步的片高亮描边（emissive 脉冲）；最后一步显示"完成 ✓"
- **连续演示模式**：自动逐步播放，每步等物理稳定（片速度均 <5cm/s 或超时 3s）后进下一步；「暂停/继续/重播」；可拖进度条跳步
- 状态入 Pinia（game store）：mode: 'free'|'step'|'auto', stepIndex, playing
- engine 暴露 API：loadModel(recipe, uptoStep?) / clearModel() / getStability()（返回最大片速度）
- 摆放的片入世界后靠真实磁条吸附咬合（不预锁 LockConstraint；允许微调出生位置±0.3cm 让磁力自然拉正——这本身就是演示亮点）
- 若某造型物理立不住：先调步间摆放（分步时每步都是稳定中间态），仍不行则把该造型标注 unstable 并降级为"仅分步查看（静力学摆放）"，在 REPORT.md 说明

## 3. UI
- Toolbar 加「玩法库」下拉（造型名+难度星）；选后进分步模式
- TutorialPanel：步骤进度点、上一步/下一步/播放/暂停按钮、当前步 hint 文案
- 中文 UI 文案

## 4. 验收（verify/verify-demo.mjs，puppeteer）
- 选「立方体」分步模式：逐步点下一步，每步后 scene 片数=该步累计数，最后一步 6 片正方构成立方（顶面 4 片 y≈7.5±0.5）
- 连续模式：点播放，60s 内自动完成全部步骤且最终结构 8s 位移 <0.5cm
- 页面零错误；全部 stdout 贴 REPORT.md
