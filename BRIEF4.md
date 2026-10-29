# 任务4：修复演示系统两个致命问题（用户实测反馈）

仓库 /home/ubuntu/made-by-hand。用户线上实测反馈：①「演示没法正常进行，都塌掉了，没法吸在一起」②「还是没有从磁力珠改成磁力条」。

## 主控诊断结论（先读，别重复诊断）

### 问题A：磁条模型其实已经是条形的，但用户在 UI 上看不出 + 力学上仍像珠子
- engine/magnets/magnetics.ts 已是 barSamples()：每边 1 条 70% 长磁条、9 采样点（SOURCE 证据：BAR_LENGTH_RATIO=0.7, SAMPLE_COUNT=9）
- 但存在三个"珠子化"缺陷：
  1. magnetics.ts:100-101 先用 edgeA[4]/edgeB[4]（单点=条中心）做粗筛距离，超 SNAP_RANGE+5.5 就 continue——条长 5.25cm，端点相距可达 5.25cm，粗筛丢真实吸附
  2. magnetics.ts:113 力上限 Math.min(300, F0*(D0/d)**2)，F0=10 太小：9 点合计才 10*(0.6/d)^2*9，d=1cm 时约 32；对比重力（mass~0.12*981≈118）吸力太弱 → 这就是"吸不住、塌掉"的主因
  3. 边缘的法向判据 normalA.dot(normalB) > -0.5 continue：法线相反才吸（<−0.5），但同面共面拼接（法线相同 dot=+1）的真实玩法也被禁掉——磁力片实物同面并排也能吸（磁条极性设计）

### 修复要求（物理红线不变：SIZE=7.5/THICK=0.55/重力-981/条形磁条）
1. F0 标定：单边条对条贴合(d≈0.55)时合力 ≥ 3×片重（片重=0.12*981≈118），即 near 目标 ≈350+；保持 d<1e-8 跳过；每点力上限提到 600
2. 粗筛改为条段中心距 < SNAP_RANGE + 条长（BAR_LEN=SIZE*0.7），不再用单点筛
3. 法向判据放宽：|dot|>0.5 即吸（共面同向拼接 + 对贴都允许），垂直(dn≈0)不吸
4. 锁定门槛 LOCK_K 相应调为 near > 2.5*单边条额定合力
5. 修完后跑 node verify/verify.mjs + verify-house.mjs + verify-demo.mjs 全绿（cube/pyramid/house/tetra/butterfly/arch 连续演示 8s 位移<0.5cm；rainbow_ball 若仍>0.5 在 models.ts 标 unstable:true 并在 REPORT 说明）
6. UI 加磁条可视化：SceneCanvas 里每条边渲染一根细长圆柱/盒（70%边长，半径0.18cm，灰色金属材质），随片刚体变换——让用户直接看到"磁力条不是珠子"（放 engine/craftScene.ts 或 pieces.ts，节流：只在 piece 创建时建 mesh 挂到 piece.mesh 下）

### 问题B：连续演示卡死在第1步（线上复现：25s 后仍 2 片、进度第1/4步）
- 复现路径：选小房子 → 点「连续演示」→ stepIndex 不涨
- 根因候选（按嫌疑排序，逐个最小复现验证）：
  1. CraftView.vue:21 读 store.mode，但 TutorialPanel.play() 设 store.mode='auto' 后 CraftView 的 watch 只监听 [currentRecipe?.id, stepIndex]，而 started 在 watch 里刷新——若 loadModel 因 world.ts:137 `target===this.loadedStep` 提前 return，started 不更新，interval 判断 performance.now()-started>=3000 永真/永假错乱
  2. play() 切 mode='auto' 但 store.stepIndex 仍 0，watch 不触发（id 未变、index 未变）→ loadModel(0) 已加载过，后续 stepIndex++ 会触发；真正卡点在 getStability() 恒 >=5（磁力弱导致片一直微动，速度阈值 5cm/s 在 swiftshader 低帧率下抖动超标）
- 修复：连续模式推进逻辑改为「时间预算制」：每步最少停留 1.2s 且 getStability()<8 或超时 3.5s 强制推进；play() 时强制 store.stepIndex 不变但调 scene.loadModel 一次同步 started
- 验收：verify-demo.mjs 增加「连续演示 25s 内必须完成小房子全 4 步且最终结构完整」断言

## 流程
- 先最小复现每个根因再修；REPORT.md 追加「任务4」节贴完整验证输出
- 完成后 commit 不推送
