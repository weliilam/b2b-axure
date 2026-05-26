# B2B详情编辑弹框

## 📋 业务与功能

### 1.1 核心目标
> 提供B2B订单的详情编辑修改功能，以弹框形式展示表单，支持基本信息（含清关信息）、收件人信息、申报信息、交货信息、额外服务、排柜信息的多区块编辑，以及修改原因录入。

### 1.2 功能清单
- **[基本信息编辑]**：3只读字段（销售产品、目的国家、清关方案），4列网格
- **[清关信息编辑]**：5编辑字段（进口商公司名称、税号/TAX ID、BOND有效期、进口商地址、EORI），4列网格
- **[发件人信息编辑]**：9个编辑字段（公司名称、姓名、国家、州/省、城市、详细地址含门牌号、邮编、电话/手机、邮箱），4列网格
- **[收件人信息编辑]**：2只读字段（地址类型、仓库代码）+ 9编辑字段（收件人姓名*、省/州、城市*、地址1*、地址2、邮编、电话、公司名称、邮箱），4列网格
- **[申报信息查看]**：子单表格（序号、箱号、子单号、子单跟踪号、体积、重量、Reference ID、送达时段）+ 是否带电/带磁复选框
- **[交货信息查看]**：3只读字段（交货方式、交货仓库、入仓时间）
- **[额外服务编辑]**：可编辑表格（序号、附加服务、附加服务值、备注、操作），支持添加/删除行
- **[排柜信息编辑]**：2字段（集装箱号、车头车牌）
- **[修改原因录入]**：TextArea 必填，100字符限制，显示字数统计
- **[表单校验]**：收件人姓名、城市、地址1、修改原因必填

### 1.3 交互要点
- [打开弹框]：通过动作 `openModal` 触发 → 弹框显示
- [关闭弹框]：点击取消按钮或动作 `closeModal` → 弹框关闭
- [提交表单]：点击保存按钮 → 校验表单 → 通过后触发 `onConfirm` 事件并关闭弹框
- [额外服务]：支持添加/删除表格行

---

## 📊 内容规划

### 2.1 信息架构
```
B2B详情编辑弹框（1200px）
├── 弹框标题区
│   └── 标题：修改（蓝色竖线装饰）
├── 基本信息（4列网格）
│   ├── [只读] 销售产品 / 目的国家 / 清关方案
│   └── [编辑] 进口商公司名称 / 税号/TAX ID / BOND有效期 / EORI / 进口商地址
├── 收件人信息（4列网格）
│   ├── [只读] 地址类型 / 仓库代码
│   └── [编辑] 收件人姓名* / 省/州 / 城市* / 地址1* / 地址2 / 邮编 / 电话 / 公司名称 / 邮箱
├── 清关信息（4列网格，全部可编辑）
│   ├── 进口商公司名称 / 税号/TAX ID / BOND有效期 / 进口商地址
│   └── EORI
├── 发件人信息（4列网格，全部可编辑）
│   ├── 公司名称 / 姓名 / 国家 / 州/省
│   ├── 城市 / 详细地址(含门牌号) / 邮编 / 电话/手机
│   └── 邮箱
├── 申报信息
│   ├── 子单表格（序号/箱号/子单号/跟踪号/体积/重量/Reference ID/送达时段）
│   └── 是否带电 / 是否带磁（复选框）
├── 交货信息（3只读字段）
│   ├── 交货方式 / 交货仓库 / 入仓时间
├── 额外服务
│   ├── 可编辑表格（序号/附加服务/附加服务值/备注/操作）
│   └── 添加按钮
├── 排柜信息（2字段）
│   ├── 集装箱号 / 车头车牌
├── 修改原因（必填TextArea，100字限制）
└── 底部操作栏
    ├── 取消按钮
    └── 保存按钮（主色 #1D4CD2）
```

### 2.2 数据来源
- **数据类型**：表单输入数据
- **数据源**：通过 Axure API data 传入，未传入时使用内置模拟数据

### 2.3 关键字段

**基本信息**:
- `销售产品` / `目的国家` / `清关方案`（只读）

**清关信息**:
- `进口商公司名称` / `税号/TAX ID` / `BOND有效期` / `进口商地址` / `EORI`

**发件人信息**:
- `发件人公司名称` / `发件人姓名` / `发件人国家` / `发件人州/省`
- `发件人城市` / `发件人详细地址` / `发件人邮编` / `发件人电话/手机` / `发件人邮箱`

**收件人信息**:
- `地址类型` / `仓库代码`（只读）
- `收件人姓名`* / `省/州` / `城市`* / `地址1`* / `地址2` / `邮编` / `电话` / `公司名称` / `邮箱`

**交货信息**:
- `交货方式` / `交货仓库` / `入仓时间`

**额外服务**: `serviceCode` / `serviceValue` / `remark`

---

## 🎨 布局与结构

### 3.1 整体布局
- **布局模式**：Modal 弹框，4列网格展示
- **容器宽度**：1200px
- **关键尺寸**：
  - 弹框头部：18px 标题，蓝色竖线装饰
  - 表单区域：30px 内边距，最大高度710px，超出滚动
  - 表单网格：4列（1fr 1fr 1fr 1fr），列间距12px
  - Section标题：14px 加粗，底部分隔线
  - 底部按钮：靠右排列

### 3.2 响应式适配
不适用（弹框固定宽度）

---

## 🎨 视觉规范

### 4.1 设计规范来源
**设计规范来源**：`B2B详情弹框（detail-modal）`

### 4.2 自定义设计要点
- 只读字段无背景框，直接展示文本，行高32px对齐输入框
- 可编辑字段使用 Input 输入框
- Section标题底部分隔线 1px solid #e8e8e8
- 底部"取消"为默认按钮，"保存"为蓝色主按钮

### 4.3 组件状态
- **输入框（默认）**：1px solid #d9d9d9 边框，4px 圆角
- **必填标记**：红色星号 `*` 紧随标签文本之后
- **只读文本**：13px 字号，颜色 #333
- **按钮（保存，默认）**：背景 #1D4CD2，白色文字

---

## ⚙️ Axure API 说明

### 5.1 事件列表（eventList）

| 事件名称 | Payload 类型 | 触发时机 | 说明 |
|---------|-------------|---------|------|
| `onConfirm` | `string` | 表单校验通过后点击保存 | 传递表单数据 JSON |
| `onCancel` | `string` | 点击取消按钮 | 传递空对象 JSON |

### 5.2 动作列表（actionList）

| 动作名称 | Params 类型 | 参数说明 | 功能描述 |
|---------|------------|---------|---------|
| `openModal` | `string` | 无（可传任意值） | 打开编辑弹框 |
| `closeModal` | `string` | 无（可传任意值） | 关闭编辑弹框 |

### 5.3 变量列表（varList）

| 变量名称 | 类型 | 默认值 | 说明 |
|---------|-----|-------|------|
| `modal_open` | `boolean` | `true` | 弹框是否打开 |

### 5.4 配置项列表（configList）

| 配置项名称 | 类型 | 默认值 | 说明 |
|----------|-----|-------|------|
| `title` | `string` | `修改` | 弹框顶部显示的标题文字 |

### 5.5 数据项列表（dataList）

**数据结构**：
```typescript
{
  // 基本信息
  销售产品: string;
  目的国家: string;
  清关方案: string;
  // 清关信息
  进口商公司名称: string;
  '税号/TAX ID': string;
  BOND有效期: string;
  EORI: string;
  进口商地址: string;
  // 发件人信息
  发件人公司名称: string;
  发件人姓名: string;
  发件人国家: string;
  发件人州/省: string;
  发件人城市: string;
  发件人详细地址: string;
  发件人邮编: string;
  发件人电话/手机: string;
  发件人邮箱: string;
  // 收件人信息
  地址类型: string;
  仓库代码: string;
  收件人姓名: string;
  省/州: string;
  城市: string;
  地址1: string;
  地址2: string;
  邮编: string;
  电话: string;
  公司名称: string;
  邮箱: string;
  // 交货信息
  交货方式: string;
  交货仓库: string;
  入仓时间: string;
}
```

---

## 六、接口文档

### 6.1 数据说明

编辑弹框的数据主要通过 Axure 数据源 `formData` 注入。数据主要来源于 **NUC 系统（核心系统）的订单数据**，由后端按以下字段结构组装后下发，前端表单修改后通过 `onConfirm` 事件提交。

> **来源系统**：NUC（核心系统）
> **数据用途**：编辑弹框表单回填 + 修改后提交
> **输入方式**：dataSource 注入（优先），无数据时使用内置 MOCK 数据兜底
> **输出方式**：onConfirm 事件（携带完整表单数据 + 修改原因）

### 6.2 输入/输出字段定义（下划线命名）

| 区块 | 字段名 | 类型 | 必填 | 说明 |
|------|--------|------|------|------|
| **基本信息** | product_name | string | N | 销售产品 |
| | destination_country | string | N | 目的国家 |
| | clearance_plan | string | N | 清关方案 |
| | customer_remark | string | N | 客户备注 |
| | loading_remark | string | N | 配载备注 |
| **清关信息** | importer_company_name | string | N | 进口商公司名称 |
| | tax_id | string | N | 税号/TAX ID |
| | bond_expiry_date | string | N | BOND有效期，格式 yyyy-MM-dd |
| | eori | string | N | EORI税号 |
| | importer_city | string | N | 进口商城市 |
| | importer_address | string | N | 进口商地址 |
| | importer_postal_code | string | N | 进口商邮编 |
| **发件人信息** | sender_company_name | string | N | 发件人公司名称 |
| | sender_name | string | N | 发件人姓名 |
| | sender_country | string | N | 发件人国家 |
| | sender_state | string | N | 发件人州/省 |
| | sender_city | string | N | 发件人城市 |
| | sender_address | string | N | 发件人详细地址含门牌号 |
| | sender_postal_code | string | N | 发件人邮编 |
| | sender_phone | string | N | 发件人电话/手机 |
| | sender_email | string | N | 发件人邮箱 |
| **收件人信息** | address_type | string | N | 地址类型 |
| | warehouse_code | string | N | 仓库代码 |
| | recipient_name | string | Y | 收件人姓名 |
| | recipient_state | string | N | 省/州 |
| | recipient_city | string | Y | 城市 |
| | address_line1 | string | Y | 地址1 |
| | address_line2 | string | N | 地址2 |
| | postal_code | string | N | 邮编 |
| | phone | string | N | 电话 |
| | company_name | string | N | 公司名称 |
| | email | string | N | 邮箱 |
| **交货信息** | delivery_method | string | N | 交货方式 |
| | delivery_warehouse | string | N | 交货仓库 |
| | warehouse_in_time | string | N | 入仓时间 |
| **修改原因** | modify_reason | string | Y | 修改原因，最长100字符 |

### 6.3 输出数据结构

确认操作时通过 `onConfirm` 事件输出以下内容：

```json
{
  "product_name": "英国海派（普货）-PVA",
  "destination_country": "英国",
  "clearance_plan": "PVA",
  "customer_remark": "",
  "loading_remark": "",
  "importer_company_name": "",
  "tax_id": "",
  "bond_expiry_date": "",
  "eori": "",
  "importer_city": "",
  "importer_address": "",
  "importer_postal_code": "",
  "sender_company_name": "",
  "sender_name": "",
  "sender_country": "",
  "sender_state": "",
  "sender_city": "",
  "sender_address": "",
  "sender_postal_code": "",
  "sender_phone": "",
  "sender_email": "",
  "recipient_name": "",
  "recipient_state": "",
  "recipient_city": "",
  "address_line1": "",
  "address_line2": "",
  "postal_code": "",
  "phone": "",
  "company_name": "",
  "email": "",
  "delivery_method": "客户自送",
  "delivery_warehouse": "东莞凤岗转运中心",
  "warehouse_in_time": "2026-01-13 08:01:00",
  "modify_reason": ""
}
```

### 6.4 事件列表

| 事件名 | 触发时机 | 输出格式 |
|--------|---------|---------|
| onConfirm | 点击"保存"按钮，表单校验通过后 | JSON.stringify(所有表单字段 + modify_reason) |
| onCancel | 点击"取消"按钮 | JSON.stringify({}) |
```
