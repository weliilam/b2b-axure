# B2B 原型开发经验沉淀

> 记录自 B2B详情弹框、B2B日志记录弹框、B2B税号管理列表 三个原型的开发实践，供后续原型复用。

## 一、组件架构模式

### 1.1 Axure 组件标准结构

所有 B2B 原型采用统一结构，后续新建原型建议遵循：

```tsx
// 1. JSDoc 头部声明
/** @name 组件名称 @mode axure */
// 2. 导入样式 + Antd 组件
// 3. Axure API 常量定义（6个列表常量）
// 4. 模拟数据（MockData / MockDetail）
// 5. forwardRef 组件实现
// 6. 事件处理、动作处理、useImperativeHandle
// 7. export default Component
```

**6 个必备 Axure API 列表**：

| 列表 | 变量名 | 说明 |
|------|--------|------|
| 事件列表 | `EVENT_LIST` | 可触发的交互事件 |
| 动作列表 | `ACTION_LIST` | 外部可调用的方法 |
| 变量列表 | `VAR_LIST` | 对外暴露的状态变量 |
| 配置项列表 | `CONFIG_LIST` | 可配置的属性（标题、分页等） |
| 数据项列表 | `DATA_LIST` | 数据结构定义 |

### 1.2 数据获取模式

```tsx
// 优先取 innerProps 传入的数据，其次使用模拟数据 fallback
const configSource = innerProps && innerProps.config ? innerProps.config : {};
const dataSource = innerProps && innerProps.data ? innerProps.data : {};
const onEventHandler = typeof innerProps.onEvent === 'function'
  ? innerProps.onEvent
  : function () { return undefined; };
```

**关键要点**：
- `innerProps`、`configSource`、`onEventHandler` 三段式获取
- 模拟数据仅开发/预览使用，生产环境通过 Axure `data` 属性传入
- 配置项（如 `title`、`pageSize`）通过 Axure `config` 属性传入

### 1.3 事件发射模式

```tsx
const emitEvent = useCallback(function (eventName: string, payload?: string) {
  try {
    onEventHandler(eventName, payload);
  } catch (error) {
    console.warn('事件触发失败:', error);
  }
}, [onEventHandler]);
```

**关键要点**：
- 所有用户操作（查询、修改、删除、提交表单）都通过 emitEvent 触发
- payload 统一使用 `JSON.stringify` 序列化
- 外层包裹 try-catch 防止事件处理异常影响界面

### 1.4 动作处理模式

```tsx
const fireActionHandler = useCallback(function (name: string, _params?: string) {
  switch (name) {
    case 'openModal': setModalOpen(true); break;
    case 'closeModal': setModalOpen(false); break;
    default: console.warn('未知的动作:', name);
  }
}, []);
```

**关键要点**：
- 使用 switch-case 处理外部动作调用
- 每次操作独立 break
- default 分支打印警告

---

## 二、弹框（Modal）组件模式

### 2.1 弹框标题格式

所有 B2B 弹框标题均使用蓝色竖线装饰符：

```tsx
title={
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 18, fontWeight: 600, color: '#333',
  }}>
    <span style={{
      width: 3, height: 16, backgroundColor: '#1D4CD2',
      borderRadius: 2, flexShrink: 0,
    }} />
    {title}
  </div>
}
```

### 2.2 弹框分类

| 弹框类型 | 代表原型 | 宽度 | 底部按钮 | 特点 |
|---------|---------|------|---------|------|
| **详情弹框** | B2B详情弹框 | 800px | 取消 + 确认 | 含有表单/输入/表格，多个section |
| **日志弹框** | B2B日志记录弹框 | 960px | 无（`footer={null}`） | 仅展示表格，右上角X关闭 |
| **编辑弹框** | B2B税号管理编辑 | 640px | 取消 + 保存 | 含表单验证，2列grid布局 |

### 2.3 区块（Section）标题格式

所有弹框内的 Section 标题（基本信息、发件人信息、收件人信息等）也使用蓝色竖线装饰符，与弹框标题保持一致：

```css
/* shared: modal-shared.css */
.form-section-title::before,
.detail-section-title::before {
  content: '';
  width: 3px;
  height: 14px;
  background-color: #1D4CD2;
  border-radius: 2px;
}
```

**要点**：
- 使用 CSS `::before` 伪元素实现，避免重复 JSX
- 竖线宽度 3px，高度 14px，蓝色 `#1D4CD2`
- Section 标题字号 14px，加粗，颜色 `#333`
- 在 `modal-shared.css` 中统一定义，所有弹框自动继承
- 如果自定 section 类名（如 edit-modal 的 `.edit-section-title`），需手动添加相同的 `::before` 样式

### 2.4 共享样式

- `src/styles/modal-shared.css` 中定义了弹框通用样式
- 所有弹框原型通过 `@import "../../styles/modal-shared.css"` 引用
- 注意：弹框类名需按约定命名（如 `b2b-detail-modal`、`b2b-edit-modal`），与共享 CSS 选择器匹配

---

## 三、表格（Table）样式模式

### 3.1 通用表格样式

```css
/* 表头 */
.ant-table-thead > tr > th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
  font-size: 13px;
  border-bottom: 1px solid #e8eaec;
  padding: 10px 8px;
  white-space: nowrap;
}

/* 表体 */
.ant-table-tbody > tr > td {
  padding: 9px 8px;
  font-size: 13px;
  color: #606266;
  border-bottom: 1px solid #e8eaec;
}

/* 悬停 */
.ant-table-tbody > tr:hover > td {
  background: #f5f7fa;
}

/* 斑马纹 */
.ant-table-tbody > tr:nth-child(even) > td {
  background: #fafafa;
}
```

### 3.2 关键配置

```tsx
<Table
  size="small"              // 紧凑模式
  pagination={false}        // 日志弹框不翻页
  scroll={{ x: 1400 }}     // 水平滚动
  rowKey="key"              // 行key
/>
```

### 3.3 操作列模式

```tsx
// 操作链接：蓝色文字 + 竖线分隔符
render: (_: any, record: TaxRecord) => (
  <span className="action-links">
    <a className="action-link" onClick={() => handleAction(record)}>操作名</a>
    <span className="action-divider">|</span>
    <Dropdown menu={{ items: renderMoreMenu(record) }}>
      <MoreOutlined />
    </Dropdown>
  </span>
)
```

**样式要点**：
- 链接色：`#1D4CD2`
- 分隔符：`|` 颜色 `#dcdfe6`，边距 `0 6px`
- 更多操作：`MoreOutlined` 图标 + Dropdown

---

## 四、筛选区域（Query Bar）模式

### 4.1 布局结构

```
查询区
├── 筛选行（水平排列）
│   ├── 标签 + 输入框
│   ├── 标签 + 下拉选择
│   ├── 标签 + 日期范围
│   └── ...（按需组合）
├── 高级查询展开区域（可选）
└── 操作行
    ├── 展开/收起高级查询按钮（左侧）
    └── 查询 + 重置按钮（右侧）
```

### 4.2 样式要点

```css
/* 筛选区容器 */
.query-bar {
  background: #fff;
  border-radius: 4px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 筛选组：纵向标签+输入框 */
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 0;
}

.fl-label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}
```

---

## 五、表单（Form）模式

### 5.1 编辑/新增表单

```tsx
<Form
  form={form}
  layout="vertical"
  size="middle"
  requiredMark={customRenderer}
>
  <div className="form-section-title">基础信息</div>
  <div className="form-grid">
    <Form.Item name="fieldName" label="字段名" rules={[...required]}>
      <Input placeholder="请输入" />
    </Form.Item>
    {/* ... 2列排列 */}
  </div>
</Form>
```

### 5.2 表单的网格布局

```css
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 46px;
  margin-bottom: 20px;
}
```

### 5.3 Section 标题

```css
.form-section-title {
  font-size: 14px;
  font-weight: 700;
  color: rgb(59, 59, 59);
  padding-bottom: 6px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
/* 蓝色竖线 */
.form-section-title::before {
  content: '';
  width: 3px;
  height: 14px;
  background-color: #1D4CD2;
  border-radius: 2px;
}
```

---

## 六、详情展示模式

### 6.1 详情项渲染函数

```tsx
const renderDetailItem = (label: string, value: string | undefined) => (
  <div className="detail-item">
    <span className="detail-label">{label}</span>
    <span className="detail-value">{value || value === '0' ? value : '-'}</span>
  </div>
);
```

### 6.2 详情网格

```css
/* 4列详情网格 */
.detail-grid-4col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 0 46px;
  margin-bottom: 20px;
}

.detail-label {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.detail-value {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
}
```

### 6.3 备注输入行

```tsx
<div className="detail-remark-row">
  <div className="detail-remark-item">
    <span className="detail-label">客户备注</span>
    <Input value={customerRemark} onChange={...} />
  </div>
  <div className="detail-remark-item">
    <span className="detail-label">配载备注</span>
    <Input value={loadingRemark} onChange={...} />
  </div>
</div>
```

---

## 七、颜色体系规范

| 用途 | 色值 | 示例 |
|------|------|------|
| 主色/品牌色 | `#1D4CD2` | 按钮、链接、标题蓝色竖线 |
| 主按钮悬停 | `#1640B0` | 主按钮 hover |
| 标题文字 | `#303133` / `#333` | 页面标题、弹框标题 |
| 正文文字 | `#606266` | 表格内容、描述文本 |
| 辅助文字 | `#909399` | 标签、占位符、次要信息 |
| 禁用文字 | `#909399` | 已作废状态 |
| 页面背景 | `#f2f3f5` | 页面容器 |
| 卡片背景 | `#fff` | 筛选区、表格、弹框 |
| 表头背景 | `#f5f7fa` | 表格表头 |
| 斑马纹背景 | `#fafafa` | 表格偶行 |
| 悬停背景 | `#f5f7fa` | 表格/下拉悬停 |
| 边框 | `#e8eaec` / `#e8e8e8` | 表格分割线、弹框头尾 |
| 控件边框 | `#d9d9d9` | 输入框、选择器 |
| 输入框悬停边框 | `#1D4CD2` | Input hover/focus |
| 红色/错误 | `#ff4d4f` | 必填标记 *、错误状态 |
| 黄色/待审核 | `#e6a23c` | 状态标签 |
| 绿色/通过 | `#67c23a` | 状态标签 |
| 红色/失败 | `#f56c6c` | 状态标签 |
| 灰色/已作废 | `#909399` | 状态标签 |

---

## 八、代码约定

### 8.1 文件结构

```
prototypes/<name>/
├── PRD.md              # 产品需求文档（可选，复杂原型需要）
├── spec.md             # 规格文档（必选）
├── index.html           # HTML 入口（必选）
├── index.tsx            # 组件实现（必选）
└── style.css            # 页面样式（必选）
```

### 8.2 CSS 引用链

```css
/* 在原型 style.css 的顶部 */
@import "tailwindcss";
@import "../../styles/modal-shared.css";  /* 如果是弹框原型 */
```

### 8.3 导入规范

```tsx
// 1. React hooks
import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';

// 2. 样式
import './style.css';

// 3. Antd 组件（按需导入，不全部）
import { Table, Button, Input, Select, Modal, Form, Breadcrumb, Dropdown } from 'antd';

// 4. Antd Icons
import { SearchOutlined, PlusOutlined, ReloadOutlined, MoreOutlined } from '@ant-design/icons';

// 5. Axure 类型
import type { KeyDesc, DataDesc, ConfigItem, Action, EventItem, AxureProps, AxureHandle } from '../../common/axure-types';
```

### 8.4 状态文字着色

```tsx
const STATUS_COLORS: Record<string, string> = {
  '待审核': '#e6a23c',
  '审核通过': '#67c23a',
  '审核失败': '#f56c6c',
  '已作废': '#909399',
};

// 渲染
render: (text: string) => (
  <span style={{ color: STATUS_COLORS[text] || '#606266', fontWeight: 500 }}>{text}</span>
)
```

---

## 九、注意事项

### 9.1 常见陷阱

1. **`detail-grid-4col` gap 值**：使用 `46px`（对应 antd Row/Col 默认 `padding: 23px × 2`）
2. **`detail-value` 使用 `word-break: break-all`**：防止超长文本撑破网格
3. **弹框 `top` 值**：根据内容高度设置 `top: 50px` 或 `top: 60px`
4. **日志弹框 `footer={null}`**：不需要底部按钮时记得设置
5. **表格 `scroll.y`**：固定高度滚动如 `scroll={{ y: 380 }}`，配合 `pagination={false}`
6. **`Breadcrumb` 面包屑**：列表页顶部显示，弹框内不显示
7. **`DatePicker` 双日期范围**：使用两个独立的 DatePicker + 中间的 `-` 分隔符，不要用 `RangePicker`

### 9.2 样式优先级

引用顺序决定优先级：`style.css` 中 `@import` 在顶部的文件优先级低于下方直接编写的样式。如需覆盖共享样式，在 `@import` 之后编写。

---

## 十、原型清单（已实现）

| 原型 | 目录 | 类型 | 关键模式 |
|------|------|------|---------|
| B2B详情弹框 | `src/prototypes/detail-modal/` | 详情弹框 | 4列详情网格、备注输入、嵌套表格展开 |
| B2B日志记录弹框 | `src/prototypes/log-modal/` | 日志弹框 | 纯表格弹框、固定高度滚动、无底部分页 |
| B2B税号管理列表 | `src/prototypes/tax-list/` | 列表页 | 筛选区、表格+操作列、编辑弹框、分页 |

---

> **引用说明**：本文档通过分析 `detail-modal`、`log-modal`、`tax-list` 三个原型的 `spec.md`、`index.tsx`、`style.css` 及 `modal-shared.css` 提取共性模式总结而成。
