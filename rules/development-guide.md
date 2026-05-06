# 开发指南

**开发流程**：阅读 `spec.md` → 编写代码 → 运行验收脚本 → 按错误信息修复

## 项目结构与命名

```text
src/
├── prototypes/<name>/
│   ├── index.tsx  # 必需
│   ├── spec.md    # 必需
│   ├── style.css  # 可选
│   ├── hack.css   # 可选（AI 不应修改）
│   └── components/ # 可选：内部子组件目录
└── components/<name>/
    ├── index.tsx
    ├── spec.md
    └── （同上）

- 入口文件必须是 `index.tsx`
- 目录内必须包含 `spec.md`
- 目录（`name`）使用小写字母、数字、连字符（如 `login-page`）
- 支持可选子目录 `components/` 用于拆分内部子组件

## 核心约束

### 1. 文件头注释（必需）

每个 `index.tsx` 顶部必须包含 `@name`：

```typescript
/**
 * @name 显示名
 *
 */
```

- `@name` 必须存在，且为中文显示名

### 2. 组件库选择策略

项目已安装 **Ant Design 6.x**（`antd@^6`）作为核心 UI 组件库。原型页面应优先使用 antd 组件实现：

| 场景 | 推荐组件 | 说明 |
|------|---------|------|
| 数据表格 | `<Table>` | 支持排序、筛选、分页、行选择 |
| 表单输入 | `<Input>` / `<Select>` / `<DatePicker>` | 成熟的企业级表单控件 |
| 按钮操作 | `<Button>` | 支持 type primary/dashed/danger 等 |
| 分页 | `<Pagination>` | 自带分页逻辑 |
| 布局间距 | `<Space>` | 自动处理子元素间距 |
| 面包屑 | `<Breadcrumb>` | 页面导航 |
| 复选框 | `<Checkbox>` | 选择控件 |
| 状态标签 | `<Tag>` | 状态/标签展示 |

使用规则：
- 复杂度低的纯展示场景可用 Tailwind CSS 辅助
- 交互复杂的企业级页面（表格、表单、列表）**必须优先使用 antd 组件**
- 新增依赖需同步安装

### 3. 依赖与样式

- React 与 Hooks 直接从 `react` 导入
- 第三方库按需导入，新增依赖需同步安装
- 使用 Tailwind 时必须导入 `style.css`，且样式文件需包含：

```css
@import "tailwindcss";
```

## 验收流程

### 1. 运行验收脚本

```bash
node scripts/check-app-ready.mjs /components/[组件目录]
# 或
node scripts/check-app-ready.mjs /prototypes/[原型目录]
```

关键返回字段：
- `status`: `READY` / `ERROR` / `TIMEOUT`
- `targetUrl`: 本次验收目标地址
- `errors`: 构建/运行时/页面加载错误列表

### 2. 错误处理

当状态为 `ERROR`：按 `errors` 修复后重新执行验收脚本，直到通过。

## 验收清单（提交前）

- [ ] `index.tsx` 与 `spec.md` 完整存在
- [ ] 顶部包含 `@name` 注释与参考资料
- [ ] 依赖导入方式符合规范，新增依赖已安装
- [ ] 使用 Tailwind 时已正确引入 `@import "tailwindcss";`
- [ ] `check-app-ready.mjs` 验收通过
