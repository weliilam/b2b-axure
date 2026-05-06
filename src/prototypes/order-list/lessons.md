# B2B订单列表 - 经验教训

> 记录本次原型开发中踩过的坑，避免重复犯错。

---

## 1. 组件选型

| 教训 | 说明 |
|------|------|
| ❌ 不要纯手写 CSS | 项目已装 antd，优先用组件，样式更统一 |
| ✅ 先用 antd 再微调 | antd 默认样式已经比较成熟，尽可能复用 |
| ❌ 不要混用多种方案 | 避免同页面内部分用 antd、部分用原生 input、部分用 CSS 覆盖 |

## 2. 样式坑

| 教训 | 说明 |
|------|------|
| ❌ 不要滥用 `!important` | antd 内部样式系统会被 `!important` 破坏，导致布局异常 |
| ✅ 用 `size` 属性控制高度 | Select / DatePicker / Input 统一用 `size="small"` 或全部不用，不要混用 |
| ❌ 不要手动覆盖 Select/Picker 高度 | antd 的 internal DOM 结构复杂，覆盖高度容易引发对齐问题 |
| ✅ 多用 `Space`、`flex` 布局 | 比手写 `gap` / `margin` 更干净 |

## 3. 设计对齐

| 教训 | 说明 |
|------|------|
| ❌ 不要猜参考图的样式 | 一步到位问清楚：标签位置、颜色色值、圆角大小 |
| ✅ 按钮颜色先用 `#1D4CD2` | 这是参考图的蓝色主色调，不是默认的 `#1890ff` |
| ✅ 搜索框用原生 input + button | antd 没有"输入框+追加按钮"的组合，用原生更可控 |
| ❌ 日期范围不要用 RangePicker | 参考图是两独立的 DatePicker + "-"分隔符 |
| ✅ Modal 标题靠左需用 JSX 内联样式 | CSS 覆盖容易失效，直接传 `<div>` JSX 给 `title` prop 最可靠；需同时设置 `display: flex` + `justifyContent: flex-start` + `width: 100%`，且 CSS 层加上 `.ant-modal-title { text-align: left !important; }` 双重保险 |
| ✅ 弹框标题字号 18px，左侧蓝色竖线 | **Modal 标题**用 JSX 内联 `<span style={{ width: 3, height: 16, backgroundColor: '#1D4CD2' }}>` 实现；**section 标题（基础信息等）**用 `.form-section-title::before` 伪元素实现 |
| ❌ 列头内容不要换行 | 给 `.ant-table-thead > tr > th` 添加 `white-space: nowrap` 即可，否则表头文字折行后布局很难看 |

## 4. 弹框样式规范

| 教训 | 说明 |
|------|------|
| ✅ 弹框共享样式抽取到 `src/styles/modal-shared.css` | `.b2b-edit-modal` / `.b2b-detail-modal` 的 header/body/footer、`.form-section-title`、`.form-grid`、`.modal-footer` 均放在共享文件中，各原型通过 `@import "../../styles/modal-shared.css"` 引用 |
| ✅ 弹框列间距统一用 `gap: 0 46px` | 对应 antd Row/Col 的 `padding: 0 23px` 效果，与生产环境一致 |
| ✅ 输入框/选择器高度统一 `32px` | `.ant-input`、`.ant-select-selector`、`.ant-input-affix-wrapper` 均设 `height: 32px`，border-radius `4px` |
| ✅ 弹框标题靠左双层保险 | JSX 内联 `display: flex` + CSS `.ant-modal-title { text-align: left !important }` |
| ✅ 弹框底部按钮区分主次 | primary 用 `#1D4CD2`，default 用 `#e8e8e8` 边框，统一 `height: 32px`、`font-size: 13px` |
| ❌ 不要在每个原型中重复弹框 CSS | 直接 import modal-shared.css，页面特有样式留在各自 CSS 中 |

## 5. Axure 导出规范

| 教训 | 说明 |
|------|------|
| ✅ 文件头必须加 `@mode axure` | 否则 Axure 导出会阻断 |
| ✅ 文件头必须列参考资料 | 至少包含 `/skills/axure-export-workflow/SKILL.md` |
| ✅ 导出名必须用 `Component` | `const Component = ...` + `export default Component` |

## 5. 复盘时间线

| 步骤 | 做了什么 | 结果 |
|------|---------|------|
| 1 | 纯 CSS 实现 | 样式不一致，用户说不像 |
| 2 | 换成 antd 组件但加了很多 `!important` | 样式打架，布局崩 |
| 3 | 切回纯 CSS | 用户说换回组件 |
| 4 | 恢复 antd，只微调 CSS | 接近了 |
| 5 | 反复调整高度、对齐 | 最终统一去掉 `size="small"` 解决 |
