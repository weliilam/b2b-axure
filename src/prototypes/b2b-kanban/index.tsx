/**
 * @name B2B看板
 * @mode axure
 *
 * B2B看板页面 - 展示订单全维度信息
 *
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 */

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import './style.css';
import {
  Table, Button, Input, Select, DatePicker, Modal,
  Breadcrumb, message,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, DownOutlined, UpOutlined,
  SettingOutlined,
  ArrowUpOutlined, ArrowDownOutlined, CloseOutlined, PlusOutlined,
} from '@ant-design/icons';
import type {
  KeyDesc,
  DataDesc,
  ConfigItem,
  Action,
  EventItem,
  AxureProps,
  AxureHandle
} from '../../common/axure-types';

const { RangePicker } = DatePicker;

// ============ 场景类型 ============
interface ScenarioSearchValues {
  waybillNo: string;
  b2bNo: string;
  orderType: string | undefined;
  orderStatus: string | undefined;
  auditStatus: string | undefined;
  product: string | undefined;
  country: string | undefined;
  channel: string;
  salesman: string;
  customerCode: string;
  isCustoms: string | undefined;
  addrType: string | undefined;
  isExtra: string | undefined;
  isValueAddDone: string | undefined;
  isStowable: string | undefined;
  addrAuditStatus: string | undefined;
  isIntercept: string | undefined;
  billingResult: string | undefined;
}

interface Scenario {
  id: string;
  name: string;
  searchValues: ScenarioSearchValues;
  visibleColumnKeys: string[];
  visibleSearchFieldKeys: string[];
}

let scenarioIdCounter = 1;
const DEFAULT_ALL_COLUMN_KEYS = [
  '运单号', 'B2B单号', '客户单号', '创建时间', '订单类型', '订单来源',
  '客户代码', '是否首批', '业务员', '客服员', '销售产品', '服务渠道名称',
  '报关方式', '是否报关件', '报关批次号', '清关方案', '目的国家', '地址类型',
  '地址审核状态', '邮编', '品名', '件数', '客户备注', '配载备注', '交货方式',
  '预计入仓时间', '签入时间', '首次到货时间', '首次到货网点', '计费签入网点',
  '计费签入时间', '到仓时间', '操作仓', '计费重', '订单审核状态', '预计体积(m³)',
  '预计重量(kg)', '材积重', '签入总体积', '签入总重量', '方数', '审核时间',
  '订单状态', '费用确认时间', '换单单号', '计费状态', '计费结果', '是否白名单',
  '是否拦截', '拦截原因', '拦截备注', '拦截人', '是否扣件', '扣件原因', '安检类型',
  '是否需要增值服务', '是否完成增值服务', '是否可配载', '是否加件',
  '可配载时间', '最新可配载时间', '签出时间', '签收时间', '服务商单号', '收件人',
  '仓库代码', '入账状态', '分拣码', 'Reference ID', '是否变价异常中',
];

const SEARCH_FIELD_DEFS = [
  { key: 'waybillNo', label: '单号' },
  { key: 'b2bNo', label: 'B2B单号' },
  { key: 'orderType', label: '订单类型' },
  { key: 'orderStatus', label: '订单状态' },
  { key: 'auditStatus', label: '审核状态' },
  { key: 'product', label: '销售产品' },
  { key: 'country', label: '目的国家' },
  { key: 'channel', label: '渠道代码' },
  { key: 'salesman', label: '业务员' },
  { key: 'customerCode', label: '客户代码' },
  { key: 'isCustoms', label: '是否报关件' },
  { key: 'addrType', label: '地址类型' },
  { key: 'isExtra', label: '是否加件' },
  { key: 'isValueAddDone', label: '是否完成增值服务' },
  { key: 'isStowable', label: '是否可配载' },
  { key: 'addrAuditStatus', label: '地址审核状态' },
  { key: 'isIntercept', label: '是否拦截' },
  { key: 'billingResult', label: '计费结果' },
];
const ALL_SEARCH_FIELD_KEYS = SEARCH_FIELD_DEFS.map(d => d.key);

// ============ Axure API 常量定义 ============

const EVENT_LIST: EventItem[] = [
  { name: 'onSearch', desc: '点击查询或重置时触发', payload: 'JSON string' },
  { name: 'onPageChange', desc: '切换分页时触发', payload: 'JSON string' },
];

const ACTION_LIST: Action[] = [
  { name: 'refresh', desc: '刷新表格数据' },
  { name: 'resetFilters', desc: '重置所有筛选条件' },
];

const VAR_LIST: KeyDesc[] = [
  { name: 'selected_count', desc: '当前选中行数量（数字）' },
  { name: 'current_page', desc: '当前页码（数字）' },
];

const CONFIG_LIST: ConfigItem[] = [
  {
    type: 'input',
    attributeId: 'title',
    displayName: '页面标题',
    info: '页面顶部显示的标题文字',
    initialValue: 'B2B看板'
  },
  {
    type: 'inputNumber',
    attributeId: 'pageSize',
    displayName: '每页条数',
    info: '表格每页显示的记录数',
    initialValue: 20,
    min: 10,
    max: 100
  },
];

const DATA_LIST: DataDesc[] = [
  {
    name: 'orders',
    desc: '订单列表数据',
    keys: [
      { name: '运单号', desc: '物流运单号码（字符串）' },
      { name: 'B2B单号', desc: 'B2B平台订单号（字符串）' },
      { name: '客户单号', desc: '客户系统订单号（字符串）' },
      { name: '创建时间', desc: '订单创建时间（字符串）' },
      { name: '订单类型', desc: '订单类型（字符串）' },
      { name: '订单来源', desc: '订单来源渠道（字符串）' },
      { name: '客户代码', desc: '客户唯一代码（字符串）' },
      { name: '是否首批', desc: '是否为首批订单（字符串）' },
      { name: '业务员', desc: '负责业务员（字符串）' },
      { name: '客服员', desc: '客服姓名（字符串）' },
      { name: '销售产品', desc: '销售产品名称（字符串）' },
      { name: '服务渠道名称', desc: '服务渠道名称（字符串）' },
      { name: '报关方式', desc: '报关方式（字符串）' },
      { name: '是否报关件', desc: '是否报关件（字符串）' },
      { name: '报关批次号', desc: '报关批次号（字符串）' },
      { name: '清关方案', desc: '清关方案（字符串），原名交税模式' },
      { name: '目的国家', desc: '目的国家（字符串）' },
      { name: '地址类型', desc: '地址类型（字符串）' },
      { name: '地址审核状态', desc: '地址审核状态（字符串）' },
      { name: '邮编', desc: '邮编（字符串）' },
      { name: '品名', desc: '品名（字符串）' },
      { name: '件数', desc: '件数（字符串）' },
      { name: '客户备注', desc: '客户备注（字符串）' },
      { name: '配载备注', desc: '配载备注（字符串）' },
      { name: '交货方式', desc: '交货方式（字符串）' },
      { name: '预计入仓时间', desc: '预计入仓时间（字符串）' },
      { name: '签入时间', desc: '签入时间（字符串）' },
      { name: '首次到货时间', desc: '首次到货时间（字符串）' },
      { name: '首次到货网点', desc: '首次到货网点（字符串），原名签入网点' },
      { name: '计费签入网点', desc: '计费签入网点（字符串）' },
      { name: '计费签入时间', desc: '计费签入时间（字符串）' },
      { name: '最后签入时间', desc: '到仓时间，取最后签入时间（字符串）' },
      { name: '最后签入网点', desc: '操作仓，取最后签入网点（字符串）' },
      { name: '计费重', desc: '计费重量（字符串）' },
      { name: '订单审核状态', desc: '订单审核状态（字符串）' },
      { name: '预计体积', desc: '预计体积m³（字符串）' },
      { name: '预计重量', desc: '预计重量kg（字符串）' },
      { name: '材积重', desc: '材积重（字符串）' },
      { name: '签入总体积', desc: '签入总体积（字符串）' },
      { name: '签入总重量', desc: '签入总重量（字符串）' },
      { name: '方数', desc: '方数（字符串）' },
      { name: '审核时间', desc: '审核时间（字符串）' },
      { name: '订单状态', desc: '订单状态（字符串）' },
      { name: '费用确认时间', desc: '费用确认时间（字符串）' },
      { name: '换单单号', desc: '换单单号（字符串）' },
      { name: '计费状态', desc: '计费状态（字符串）' },
      { name: '计费结果', desc: '计费结果（字符串）' },
      { name: '是否白名单', desc: '是否白名单（字符串）' },
      { name: '是否拦截', desc: '是否拦截（字符串）' },
      { name: '拦截原因', desc: '拦截原因（字符串）' },
      { name: '拦截备注', desc: '拦截备注（字符串）' },
      { name: '拦截人', desc: '拦截人（字符串）' },
      { name: '是否扣件', desc: '是否扣件（字符串）' },
      { name: '扣件原因', desc: '扣件原因（字符串）' },
      { name: '安检类型', desc: '安检类型（字符串）' },
      { name: '是否需要增值服务', desc: '是否需要增值服务（字符串）' },
      { name: '是否完成增值服务', desc: '是否完成增值服务（字符串）' },
      { name: '是否可配载', desc: '是否可配载（字符串）' },
      { name: '是否加件', desc: '是否加件（字符串）' },
      { name: '可配载时间', desc: '可配载时间（字符串）' },
      { name: '最新可配载时间', desc: '最新可配载时间（字符串）' },
      { name: '签出时间', desc: '签出时间（字符串）' },
      { name: '签收时间', desc: '签收时间（字符串）' },
      { name: '服务商单号', desc: '服务商单号（字符串）' },
      { name: '收件人', desc: '收件人（字符串）' },
      { name: '仓库代码', desc: '仓库代码（字符串）' },
      { name: '入账状态', desc: '入账状态（字符串）' },
      { name: '分拣码', desc: '分拣码（字符串）' },
      { name: 'Reference ID', desc: 'Reference ID（字符串）' },
      { name: '是否变价异常中', desc: '是否变价异常中（字符串）' },
    ]
  }
];

// ============ 模拟数据 ============

interface OrderRecord {
  key: number;
  运单号: string;
  B2B单号: string;
  客户单号: string;
  创建时间: string;
  订单类型: string;
  订单来源: string;
  客户代码: string;
  是否首批: string;
  业务员: string;
  客服员: string;
  销售产品: string;
  服务渠道名称: string;
  报关方式: string;
  是否报关件: string;
  报关批次号: string;
  清关方案: string;
  目的国家: string;
  地址类型: string;
  地址审核状态: string;
  邮编: string;
  品名: string;
  件数: string;
  客户备注: string;
  配载备注: string;
  交货方式: string;
  预计入仓时间: string;
  签入时间: string;
  首次到货时间: string;
  首次到货网点: string;
  计费签入网点: string;
  计费签入时间: string;
  最后签入时间: string;
  最后签入网点: string;
  计费重: string;
  订单审核状态: string;
  预计体积: string;
  预计重量: string;
  材积重: string;
  签入总体积: string;
  签入总重量: string;
  方数: string;
  审核时间: string;
  订单状态: string;
  费用确认时间: string;
  换单单号: string;
  计费状态: string;
  计费结果: string;
  是否白名单: string;
  是否拦截: string;
  拦截原因: string;
  拦截备注: string;
  拦截人: string;
  是否扣件: string;
  扣件原因: string;
  安检类型: string;
  是否需要增值服务: string;
  是否完成增值服务: string;
  是否加件: string;
  是否可配载: string;
  可配载时间: string;
  最新可配载时间: string;
  签出时间: string;
  签收时间: string;
  服务商单号: string;
  收件人: string;
  仓库代码: string;
  入账状态: string;
  分拣码: string;
  'Reference ID': string;
  是否变价异常中: string;
}

const SALES = ['陈晶晶', '温必龙', '吴住宝', '范文宇', '高马倩', '何诗婷'];
const SERVICE = ['王洲赫', '栾世萍', '李思锦', '张欣怡'];
const SOURCES = ['新用户中心', 'AllintB2B'];
const CODES = ['BCNOC534', 'BCHC589', 'BCDC452', 'BCOC853', 'BCNOC631', 'BCHC983'];
const COUNTRIES = ['美国', '英国', '德国', '法国', '日本'];
const PRODUCTS = ['B2B测试拼柜', '英国海派（普货）-PVA', '美国海派（普货）-DDP'];
const CHANNELS = ['云途标准', '云途经济', '云途特快'];
const STATUS = ['待审核', '审核通过', '待客户确认', '已预报', '已入仓'];
const DELIVERY = ['客户自送', '云途揽收'];

const now = new Date();
const fmtDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
};

const MOCK_DATA: OrderRecord[] = Array.from({ length: 20 }, (_, i) => {
  const d = new Date(now.getTime() - i * 3600000 * (Math.random() * 48 + 1));
  return {
    key: i + 1,
    运单号: `YT${(2309300000000 + i * 1037).toString()}`,
    B2B单号: `2605AA${(842 - i).toString().padStart(4, '0')}`,
    客户单号: `CST${(2611924300300000 + i * 10500).toString()}`,
    创建时间: fmtDate(d),
    订单类型: 'B2B',
    订单来源: SOURCES[i % SOURCES.length],
    客户代码: CODES[i % CODES.length],
    是否首批: i % 4 === 0 ? '是' : '否',
    业务员: SALES[i % SALES.length],
    客服员: SERVICE[i % SERVICE.length],
    销售产品: PRODUCTS[i % PRODUCTS.length],
    服务渠道名称: CHANNELS[i % CHANNELS.length],
    报关方式: i % 2 === 0 ? '0110' : '9610',
    是否报关件: i % 3 === 0 ? '是' : '否',
    报关批次号: i % 3 === 0 ? `BG${(202600000 + i * 123).toString()}` : '',
    清关方案: i % 2 === 0 ? 'DDU' : 'DDP',
    目的国家: COUNTRIES[i % COUNTRIES.length],
    地址类型: i % 2 === 0 ? '亚马逊地址' : '商业地址',
    地址审核状态: ['已通过', '待审核', ''][i % 3],
    邮编: `${[90001, 10001, 'EC1A', 'M1', 75001][i % 5]}`,
    品名: ['脚垫', '麻将牌', '玩具', '服装'][i % 4],
    件数: `${Math.floor(Math.random() * 50) + 1}`,
    客户备注: i % 3 === 0 ? '请优先处理' : '',
    配载备注: '',
    交货方式: DELIVERY[i % DELIVERY.length],
    预计入仓时间: fmtDate(new Date(d.getTime() + 86400000 * 2)),
    签入时间: fmtDate(new Date(d.getTime() + 86400000)),
    首次到货时间: fmtDate(new Date(d.getTime() + 86400000)),
    首次到货网点: i % 2 === 0 ? '东莞凤岗转运中心' : '深圳宝安转运中心',
    计费签入网点: i % 2 === 0 ? '东莞凤岗' : '深圳宝安',
    计费签入时间: fmtDate(new Date(d.getTime() + 86400000 * 1.5)),
    最后签入时间: fmtDate(new Date(d.getTime() + 86400000 * 2)),
    最后签入网点: '东莞凤岗转运中心',
    计费重: `${(Math.random() * 20 + 1).toFixed(2)}`,
    订单审核状态: ['待审核', '审核通过', '审核失败'][i % 3],
    预计体积: `${(Math.random() * 0.5 + 0.01).toFixed(3)}`,
    预计重量: `${(Math.random() * 15 + 0.5).toFixed(1)}`,
    材积重: `${(Math.random() * 20).toFixed(2)}`,
    签入总体积: `${(Math.random() * 0.4 + 0.01).toFixed(3)}`,
    签入总重量: `${(Math.random() * 12 + 0.5).toFixed(1)}`,
    方数: `${(Math.random() * 0.3 + 0.01).toFixed(3)}`,
    审核时间: i % 2 === 0 ? fmtDate(new Date(d.getTime() + 3600000)) : '',
    订单状态: STATUS[i % STATUS.length],
    费用确认时间: '',
    换单单号: '',
    计费状态: ['未计费', '已计费', '计费异常'][i % 3],
    计费结果: ['', '1360 RMB', '2700 RMB'][i % 3],
    是否白名单: i % 5 === 0 ? '是' : '否',
    是否拦截: i % 7 === 0 ? '是' : '否',
    拦截原因: i % 7 === 0 ? '品名异常' : '',
    拦截备注: i % 7 === 0 ? '需补充品名申报' : '',
    拦截人: i % 7 === 0 ? '系统' : '',
    是否扣件: i % 8 === 0 ? '是' : '否',
    扣件原因: i % 8 === 0 ? '安检未通过' : '',
    安检类型: ['普货', '带电', '特货'][i % 3],
    是否需要增值服务: i % 4 === 0 ? '是' : '否',
    是否完成增值服务: i % 5 === 0 ? '是' : '否',
    是否可配载: i % 2 === 0 ? '是' : '否',
    是否加件: i % 6 === 0 ? '是' : '否',
    可配载时间: i % 2 === 0 ? fmtDate(new Date(d.getTime() + 3600000 * 3)) : '',
    最新可配载时间: '',
    签出时间: '',
    签收时间: i % 3 === 0 ? fmtDate(new Date(d.getTime() + 86400000 * 7)) : '',
    服务商单号: i % 2 === 0 ? `SP${(2026000000 + i * 9876).toString()}` : '',
    收件人: i % 2 === 0 ? '******' : 'John Smith',
    仓库代码: ['EWR4', 'MME2', 'LAX9'][i % 3],
    入账状态: ['待入账', '已入账', ''][i % 3],
    分拣码: `${(7000 + i * 7).toString()}`,
    'Reference ID': i % 3 === 0 ? `REF${(1000 + i * 50).toString()}` : '',
    是否变价异常中: i % 6 === 0 ? '是' : '否',
  };
});

// ============ 组件实现 ============

const Component = forwardRef(function KanbanBoard(
  innerProps: AxureProps,
  ref: React.ForwardedRef<AxureHandle>,
) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [current, setCurrent] = useState(1);
  const [expanded, setExpanded] = useState(false);

  // ===== 搜索状态 =====
  const [searchWaybillNo, setSearchWaybillNo] = useState('');
  const [searchB2bNo, setSearchB2bNo] = useState('');
  const [searchCreateTime, setSearchCreateTime] = useState<[any, any] | null>(null);
  const [searchOrderType, setSearchOrderType] = useState<string | undefined>(undefined);
  const [searchOrderStatus, setSearchOrderStatus] = useState<string | undefined>(undefined);
  const [searchAuditStatus, setSearchAuditStatus] = useState<string | undefined>(undefined);
  const [searchProduct, setSearchProduct] = useState<string | undefined>(undefined);
  const [searchCountry, setSearchCountry] = useState<string | undefined>(undefined);
  const [searchChannel, setSearchChannel] = useState('');
  const [searchSalesman, setSearchSalesman] = useState('');
  const [searchCustomerCode, setSearchCustomerCode] = useState('');
  const [searchIsCustoms, setSearchIsCustoms] = useState<string | undefined>(undefined);
  const [searchAddrType, setSearchAddrType] = useState<string | undefined>(undefined);
  const [searchIsExtra, setSearchIsExtra] = useState<string | undefined>(undefined);
  const [searchIsValueAddDone, setSearchIsValueAddDone] = useState<string | undefined>(undefined);
  const [searchIsStowable, setSearchIsStowable] = useState<string | undefined>(undefined);
  const [searchAddrAuditStatus, setSearchAddrAuditStatus] = useState<string | undefined>(undefined);
  const [searchIsIntercept, setSearchIsIntercept] = useState<string | undefined>(undefined);
  const [searchBillingResult, setSearchBillingResult] = useState<string | undefined>(undefined);
  const [searchAuditTime, setSearchAuditTime] = useState<[any, any] | null>(null);
  const [searchFirstStowableTime, setSearchFirstStowableTime] = useState<[any, any] | null>(null);

  // ===== 场景管理 =====
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('__default__');
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(DEFAULT_ALL_COLUMN_KEYS);
  const [visibleSearchFieldKeys, setVisibleSearchFieldKeys] = useState<string[]>(ALL_SEARCH_FIELD_KEYS);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [editName, setEditName] = useState('');
  const [editFieldKeys, setEditFieldKeys] = useState<string[]>([]);
  const [editSearchValues, setEditSearchValues] = useState<ScenarioSearchValues>({
    waybillNo: '', b2bNo: '', orderType: undefined, orderStatus: undefined,
    auditStatus: undefined, product: undefined, country: undefined,
    channel: '', salesman: '', customerCode: '', isCustoms: undefined,
    addrType: undefined, isExtra: undefined, isValueAddDone: undefined,
    isStowable: undefined, addrAuditStatus: undefined, isIntercept: undefined,
    billingResult: undefined,
  });
  const [editColumnKeys, setEditColumnKeys] = useState<string[]>(DEFAULT_ALL_COLUMN_KEYS);

  const getSearchValues = useCallback((): ScenarioSearchValues => ({
    waybillNo: searchWaybillNo,
    b2bNo: searchB2bNo,
    orderType: searchOrderType,
    orderStatus: searchOrderStatus,
    auditStatus: searchAuditStatus,
    product: searchProduct,
    country: searchCountry,
    channel: searchChannel,
    salesman: searchSalesman,
    customerCode: searchCustomerCode,
    isCustoms: searchIsCustoms,
    addrType: searchAddrType,
    isExtra: searchIsExtra,
    isValueAddDone: searchIsValueAddDone,
    isStowable: searchIsStowable,
    addrAuditStatus: searchAddrAuditStatus,
    isIntercept: searchIsIntercept,
    billingResult: searchBillingResult,
  }), [
    searchWaybillNo, searchB2bNo, searchOrderType, searchOrderStatus,
    searchAuditStatus, searchProduct, searchCountry, searchChannel,
    searchSalesman, searchCustomerCode, searchIsCustoms, searchAddrType,
    searchIsExtra, searchIsValueAddDone, searchIsStowable, searchAddrAuditStatus,
    searchIsIntercept, searchBillingResult,
  ]);

  const applyScenario = useCallback((s: Scenario) => {
    const v = s.searchValues;
    setSearchWaybillNo(v.waybillNo);
    setSearchB2bNo(v.b2bNo);
    setSearchOrderType(v.orderType);
    setSearchOrderStatus(v.orderStatus);
    setSearchAuditStatus(v.auditStatus);
    setSearchProduct(v.product);
    setSearchCountry(v.country);
    setSearchChannel(v.channel);
    setSearchSalesman(v.salesman);
    setSearchCustomerCode(v.customerCode);
    setSearchIsCustoms(v.isCustoms);
    setSearchAddrType(v.addrType);
    setSearchIsExtra(v.isExtra);
    setSearchIsValueAddDone(v.isValueAddDone);
    setSearchIsStowable(v.isStowable);
    setSearchAddrAuditStatus(v.addrAuditStatus);
    setSearchIsIntercept(v.isIntercept);
    setSearchBillingResult(v.billingResult);
    setVisibleColumnKeys(s.visibleColumnKeys);
    setVisibleSearchFieldKeys(s.visibleSearchFieldKeys);
    setActiveScenarioId(s.id);
  }, []);

  const openEditScenario = useCallback((scenario: Scenario | null) => {
    setEditingScenario(scenario);
    setEditName(scenario ? scenario.name : '');
    setEditFieldKeys(scenario ? [...scenario.visibleSearchFieldKeys] : [...ALL_SEARCH_FIELD_KEYS]);
    setEditSearchValues(scenario ? { ...scenario.searchValues } : getSearchValues());
    setEditColumnKeys(scenario ? [...scenario.visibleColumnKeys] : [...visibleColumnKeys]);
    setEditModalOpen(true);
  }, [getSearchValues, visibleColumnKeys]);

  const updateEditSearchValue = useCallback((key: string, value: string | undefined) => {
    setEditSearchValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const applySearchValuesToPage = useCallback((vals: ScenarioSearchValues) => {
    setSearchWaybillNo(vals.waybillNo);
    setSearchB2bNo(vals.b2bNo);
    setSearchOrderType(vals.orderType);
    setSearchOrderStatus(vals.orderStatus);
    setSearchAuditStatus(vals.auditStatus);
    setSearchProduct(vals.product);
    setSearchCountry(vals.country);
    setSearchChannel(vals.channel);
    setSearchSalesman(vals.salesman);
    setSearchCustomerCode(vals.customerCode);
    setSearchIsCustoms(vals.isCustoms);
    setSearchAddrType(vals.addrType);
    setSearchIsExtra(vals.isExtra);
    setSearchIsValueAddDone(vals.isValueAddDone);
    setSearchIsStowable(vals.isStowable);
    setSearchAddrAuditStatus(vals.addrAuditStatus);
    setSearchIsIntercept(vals.isIntercept);
    setSearchBillingResult(vals.billingResult);
  }, []);

  const saveScenario = useCallback(() => {
    if (!editName.trim()) {
      message.warning('请输入场景名称');
      return;
    }
    const newSearchValues: ScenarioSearchValues = { ...editSearchValues };
    const newColKeys = editColumnKeys.length > 0 ? [...editColumnKeys] : [...DEFAULT_ALL_COLUMN_KEYS];
    if (editingScenario) {
      setScenarios(prev => prev.map(s =>
        s.id === editingScenario.id
          ? {
              ...s,
              name: editName.trim(),
              visibleSearchFieldKeys: [...editFieldKeys],
              searchValues: newSearchValues,
              visibleColumnKeys: newColKeys,
            }
          : s
      ));
      setActiveScenarioId(editingScenario.id);
      setVisibleColumnKeys(newColKeys);
      setVisibleSearchFieldKeys([...editFieldKeys]);
      applySearchValuesToPage(newSearchValues);
      message.success(`场景"${editName.trim()}"已更新`);
    } else {
      const s: Scenario = {
        id: `scenario_${scenarioIdCounter++}`,
        name: editName.trim(),
        searchValues: newSearchValues,
        visibleColumnKeys: newColKeys,
        visibleSearchFieldKeys: [...editFieldKeys],
      };
      setScenarios(prev => [...prev, s]);
      setActiveScenarioId(s.id);
      setVisibleColumnKeys(newColKeys);
      setVisibleSearchFieldKeys([...editFieldKeys]);
      applySearchValuesToPage(newSearchValues);
      message.success(`场景"${s.name}"已保存`);
    }
    setEditModalOpen(false);
    setEditingScenario(null);
  }, [editName, editFieldKeys, editingScenario, editSearchValues, editColumnKeys, applySearchValuesToPage]);

  const deleteScenario = useCallback((id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
    if (activeScenarioId === id) {
      setActiveScenarioId('__default__');
      setVisibleSearchFieldKeys(ALL_SEARCH_FIELD_KEYS);
    }
  }, [activeScenarioId]);

  const handleTabClick = useCallback((id: string) => {
    if (id === '__default__') {
      setActiveScenarioId('__default__');
      setVisibleColumnKeys(DEFAULT_ALL_COLUMN_KEYS);
      setVisibleSearchFieldKeys(ALL_SEARCH_FIELD_KEYS);
      return;
    }
    const s = scenarios.find(sc => sc.id === id);
    if (s) applyScenario(s);
  }, [scenarios, applyScenario]);

  const toggleEditFieldKey = useCallback((key: string) => {
    setEditFieldKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }, []);

  const moveEditColumn = useCallback((index: number, direction: 'up' | 'down') => {
    setEditColumnKeys(prev => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const removeEditColumn = useCallback((key: string) => {
    setEditColumnKeys(prev => prev.filter(k => k !== key));
  }, []);

  const addEditColumnBack = useCallback((key: string) => {
    setEditColumnKeys(prev => [...prev, key]);
  }, []);

  const hideableEditColumns = DEFAULT_ALL_COLUMN_KEYS.filter(k => !editColumnKeys.includes(k));

  const resetSearch = () => {
    setSearchWaybillNo('');
    setSearchB2bNo('');
    setSearchCreateTime(null);
    setSearchOrderType(undefined);
    setSearchOrderStatus(undefined);
    setSearchAuditStatus(undefined);
    setSearchProduct(undefined);
    setSearchCountry(undefined);
    setSearchChannel('');
    setSearchSalesman('');
    setSearchCustomerCode('');
    setSearchIsCustoms(undefined);
    setSearchAddrType(undefined);
    setSearchIsExtra(undefined);
    setSearchIsValueAddDone(undefined);
    setSearchIsStowable(undefined);
    setSearchAddrAuditStatus(undefined);
    setSearchIsIntercept(undefined);
    setSearchBillingResult(undefined);
    setSearchAuditTime(null);
    setSearchFirstStowableTime(null);
  };

  const activeScenario = activeScenarioId === '__default__'
    ? null
    : scenarios.find(s => s.id === activeScenarioId) ?? null;

  const configSource = innerProps && innerProps.config ? innerProps.config : {};
  const onEventHandler = typeof innerProps.onEvent === 'function'
    ? innerProps.onEvent
    : function () { return undefined; };

  const pageSize = typeof configSource.pageSize === 'number' && configSource.pageSize > 0
    ? configSource.pageSize
    : 20;

  const emitEvent = useCallback(function (eventName: string, payload?: string) {
    try {
      onEventHandler(eventName, payload);
    } catch (error) {
      console.warn('事件触发失败:', error);
    }
  }, [onEventHandler]);

  const fireActionHandler = useCallback(function (name: string, _params?: string) {
    switch (name) {
      case 'refresh':
        setCurrent(1);
        break;
      case 'resetFilters':
        setCurrent(1);
        break;
      default:
        console.warn('未知的动作:', name);
    }
  }, []);

  useImperativeHandle(ref, function () {
    return {
      getVar: function (name: string) {
        const vars: Record<string, any> = {
          selected_count: selectedRowKeys.length,
          current_page: current,
        };
        return vars[name];
      },
      fireAction: fireActionHandler,
      eventList: EVENT_LIST,
      actionList: ACTION_LIST,
      varList: VAR_LIST,
      configList: CONFIG_LIST,
      dataList: DATA_LIST,
    };
  }, [selectedRowKeys, current, fireActionHandler]);

  const ALL_COLUMNS = [
    { title: '运单号', dataIndex: '运单号', key: '运单号', width: 155, fixed: 'left' as const },
    { title: 'B2B单号', dataIndex: 'B2B单号', key: 'B2B单号', width: 120, fixed: 'left' as const },
    { title: '客户单号', dataIndex: '客户单号', key: '客户单号', width: 170 },
    { title: '创建时间', dataIndex: '创建时间', key: '创建时间', width: 160 },
    { title: '订单类型', dataIndex: '订单类型', key: '订单类型', width: 80 },
    { title: '订单来源', dataIndex: '订单来源', key: '订单来源', width: 110 },
    { title: '客户代码', dataIndex: '客户代码', key: '客户代码', width: 100 },
    { title: '是否首批', dataIndex: '是否首批', key: '是否首批', width: 80 },
    { title: '业务员', dataIndex: '业务员', key: '业务员', width: 75 },
    { title: '客服员', dataIndex: '客服员', key: '客服员', width: 75 },
    { title: '销售产品', dataIndex: '销售产品', key: '销售产品', width: 150 },
    { title: '服务渠道名称', dataIndex: '服务渠道名称', key: '服务渠道名称', width: 110 },
    { title: '报关方式', dataIndex: '报关方式', key: '报关方式', width: 80 },
    { title: '是否报关件', dataIndex: '是否报关件', key: '是否报关件', width: 90 },
    { title: '报关批次号', dataIndex: '报关批次号', key: '报关批次号', width: 140 },
    { title: '清关方案', dataIndex: '清关方案', key: '清关方案', width: 85 },
    { title: '目的国家', dataIndex: '目的国家', key: '目的国家', width: 85 },
    { title: '地址类型', dataIndex: '地址类型', key: '地址类型', width: 100 },
    { title: '地址审核状态', dataIndex: '地址审核状态', key: '地址审核状态', width: 100 },
    { title: '邮编', dataIndex: '邮编', key: '邮编', width: 90 },
    { title: '品名', dataIndex: '品名', key: '品名', width: 80 },
    { title: '件数', dataIndex: '件数', key: '件数', width: 60 },
    { title: '客户备注', dataIndex: '客户备注', key: '客户备注', width: 110, ellipsis: true },
    { title: '配载备注', dataIndex: '配载备注', key: '配载备注', width: 110, ellipsis: true },
    { title: '交货方式', dataIndex: '交货方式', key: '交货方式', width: 90 },
    { title: '预计入仓时间', dataIndex: '预计入仓时间', key: '预计入仓时间', width: 160 },
    { title: '签入时间', dataIndex: '签入时间', key: '签入时间', width: 160 },
    { title: '首次到货时间', dataIndex: '首次到货时间', key: '首次到货时间', width: 160 },
    { title: '首次到货网点', dataIndex: '首次到货网点', key: '首次到货网点', width: 140 },
    { title: '计费签入网点', dataIndex: '计费签入网点', key: '计费签入网点', width: 120 },
    { title: '计费签入时间', dataIndex: '计费签入时间', key: '计费签入时间', width: 160 },
    { title: '到仓时间', dataIndex: '最后签入时间', key: '最后签入时间', width: 160 },
    { title: '操作仓', dataIndex: '最后签入网点', key: '最后签入网点', width: 140 },
    { title: '计费重', dataIndex: '计费重', key: '计费重', width: 70 },
    { title: '订单审核状态', dataIndex: '订单审核状态', key: '订单审核状态', width: 100 },
    { title: '预计体积(m³)', dataIndex: '预计体积', key: '预计体积', width: 90 },
    { title: '预计重量(kg)', dataIndex: '预计重量', key: '预计重量', width: 90 },
    { title: '材积重', dataIndex: '材积重', key: '材积重', width: 70 },
    { title: '签入总体积', dataIndex: '签入总体积', key: '签入总体积', width: 90 },
    { title: '签入总重量', dataIndex: '签入总重量', key: '签入总重量', width: 90 },
    { title: '方数', dataIndex: '方数', key: '方数', width: 60 },
    { title: '审核时间', dataIndex: '审核时间', key: '审核时间', width: 160 },
    { title: '订单状态', dataIndex: '订单状态', key: '订单状态', width: 100 },
    { title: '费用确认时间', dataIndex: '费用确认时间', key: '费用确认时间', width: 160 },
    { title: '换单单号', dataIndex: '换单单号', key: '换单单号', width: 130 },
    { title: '计费状态', dataIndex: '计费状态', key: '计费状态', width: 85 },
    { title: '计费结果', dataIndex: '计费结果', key: '计费结果', width: 100 },
    { title: '是否白名单', dataIndex: '是否白名单', key: '是否白名单', width: 85 },
    { title: '是否拦截', dataIndex: '是否拦截', key: '是否拦截', width: 80 },
    { title: '拦截原因', dataIndex: '拦截原因', key: '拦截原因', width: 100, ellipsis: true },
    { title: '拦截备注', dataIndex: '拦截备注', key: '拦截备注', width: 140, ellipsis: true },
    { title: '拦截人', dataIndex: '拦截人', key: '拦截人', width: 70 },
    { title: '是否扣件', dataIndex: '是否扣件', key: '是否扣件', width: 80 },
    { title: '扣件原因', dataIndex: '扣件原因', key: '扣件原因', width: 100, ellipsis: true },
    { title: '安检类型', dataIndex: '安检类型', key: '安检类型', width: 70 },
    { title: '是否需要增值服务', dataIndex: '是否需要增值服务', key: '是否需要增值服务', width: 120 },
    { title: '是否完成增值服务', dataIndex: '是否完成增值服务', key: '是否完成增值服务', width: 120 },
    { title: '是否可配载', dataIndex: '是否可配载', key: '是否可配载', width: 85 },
    { title: '是否加件', dataIndex: '是否加件', key: '是否加件', width: 80 },
    { title: '可配载时间', dataIndex: '可配载时间', key: '可配载时间', width: 160 },
    { title: '最新可配载时间', dataIndex: '最新可配载时间', key: '最新可配载时间', width: 160 },
    { title: '签出时间', dataIndex: '签出时间', key: '签出时间', width: 160 },
    { title: '签收时间', dataIndex: '签收时间', key: '签收时间', width: 160 },
    { title: '服务商单号', dataIndex: '服务商单号', key: '服务商单号', width: 155 },
    { title: '收件人', dataIndex: '收件人', key: '收件人', width: 100 },
    { title: '仓库代码', dataIndex: '仓库代码', key: '仓库代码', width: 80 },
    { title: '入账状态', dataIndex: '入账状态', key: '入账状态', width: 80 },
    { title: '分拣码', dataIndex: '分拣码', key: '分拣码', width: 70 },
    { title: 'Reference ID', dataIndex: 'Reference ID', key: 'Reference ID', width: 120 },
    { title: '是否变价异常中', dataIndex: '是否变价异常中', key: '是否变价异常中', width: 110 },
    {
      title: '操作', key: '操作', width: 80, fixed: 'right' as const, align: 'center' as const,
      render: (_: any, record: OrderRecord) => (
        <span>
          <a className="table-action-link" onClick={() => emitEvent('onSearch', JSON.stringify({ action: 'detail', key: record.key }))}>详情</a>
          <span className="table-action-divider">|</span>
          <a className="table-action-link" onClick={() => emitEvent('onSearch', JSON.stringify({ action: 'log', key: record.key }))}>日志</a>
        </span>
      ),
    },
  ];

  const columns = ALL_COLUMNS.filter(col => {
    if (col.key === '操作') return true;
    return visibleColumnKeys.includes(col.key as string);
  });

  const scrollX = columns.reduce((sum, col) => sum + (typeof col.width === 'number' ? col.width : 100), 0) + 60;

  const sfVisible = useCallback((key: string) =>
    visibleSearchFieldKeys.includes(key) ? undefined : 'none' as React.CSSProperties['display']
  , [visibleSearchFieldKeys]);

  return (
    <div className="b2b-order-list-page">
      <div className="page-header">
        <Breadcrumb items={[
          { title: '首页' },
          { title: '看板管理' },
          { title: 'B2B看板' },
        ]} />
      </div>

      <div className="page-body">
        {/* 场景 Tab 栏 */}
        <div className="scenario-tab-bar">
          <div className="scenario-tabs">
            <span
              className={`scenario-tab ${activeScenarioId === '__default__' ? 'active' : ''}`}
              onClick={() => handleTabClick('__default__')}
            >
              全部订单
            </span>
            {scenarios.map(s => (
              <span
                key={s.id}
                className={`scenario-tab ${activeScenarioId === s.id ? 'active' : ''}`}
                onClick={() => handleTabClick(s.id)}
              >
                {s.name}
              </span>
            ))}
            <span className="scenario-tab-btn" onClick={() => openEditScenario(null)}>
              + 新建场景
            </span>
          </div>
          <div className="scenario-actions">
            {activeScenarioId !== '__default__' && (
              <Button
                type="link"
                className="edit-scenario-btn"
                icon={<SettingOutlined />}
                onClick={() => openEditScenario(activeScenario)}
              >
                编辑当前场景
              </Button>
            )}
          </div>
        </div>

        {/* 搜索区域 */}
        <div className="query-bar">
          {/* 基础查询 - 第1行 */}
          <div className="filter-row">
            <div className="filter-group" style={{ display: sfVisible('waybillNo') }}>
              <span className="fl-label">单号</span>
              <Input
                placeholder="请输入"
                value={searchWaybillNo}
                onChange={(e) => setSearchWaybillNo(e.target.value)}
                allowClear
              />
            </div>
            <div className="filter-group" style={{ display: sfVisible('b2bNo') }}>
              <span className="fl-label">B2B单号</span>
              <Input
                placeholder="请输入"
                value={searchB2bNo}
                onChange={(e) => setSearchB2bNo(e.target.value)}
                allowClear
              />
            </div>
            <div className="filter-group">
              <span className="fl-label">创建时间</span>
              <RangePicker
                value={searchCreateTime as any}
                onChange={(dates) => setSearchCreateTime(dates as any)}
              />
            </div>
            <div className="filter-group" style={{ display: sfVisible('orderType') }}>
              <span className="fl-label">订单类型</span>
              <Select
                placeholder="全部"
                value={searchOrderType}
                onChange={setSearchOrderType}
                allowClear
                options={[
                  { value: 'B2B', label: 'B2B' },
                  { value: 'B2C', label: 'B2C' },
                ]}
              />
            </div>
            <div className="filter-group" style={{ display: sfVisible('orderStatus') }}>
              <span className="fl-label">订单状态</span>
              <Select
                placeholder="全部"
                value={searchOrderStatus}
                onChange={setSearchOrderStatus}
                allowClear
                options={[
                  { value: '待审核', label: '待审核' },
                  { value: '审核通过', label: '审核通过' },
                  { value: '待客户确认', label: '待客户确认' },
                  { value: '已预报', label: '已预报' },
                  { value: '已入仓', label: '已入仓' },
                ]}
              />
            </div>
            <div className="filter-group" style={{ display: sfVisible('auditStatus') }}>
              <span className="fl-label">审核状态</span>
              <Select
                placeholder="全部"
                value={searchAuditStatus}
                onChange={setSearchAuditStatus}
                allowClear
                options={[
                  { value: '待审核', label: '待审核' },
                  { value: '审核通过', label: '审核通过' },
                  { value: '审核失败', label: '审核失败' },
                ]}
              />
            </div>
          </div>

          {/* 高级查询 - 第2行 */}
          {expanded && (
            <div className="filter-row" style={{ marginTop: 8 }}>
              <div className="filter-group" style={{ display: sfVisible('product') }}>
                <span className="fl-label">销售产品</span>
                <Select
                  placeholder="全部"
                  value={searchProduct}
                  onChange={setSearchProduct}
                  allowClear
                  options={PRODUCTS.map((p) => ({ value: p, label: p }))}
                />
              </div>
              <div className="filter-group" style={{ display: sfVisible('country') }}>
                <span className="fl-label">目的国家</span>
                <Select
                  placeholder="全部"
                  value={searchCountry}
                  onChange={setSearchCountry}
                  allowClear
                  options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                />
              </div>
              <div className="filter-group" style={{ display: sfVisible('channel') }}>
                <span className="fl-label">渠道代码</span>
                <Input
                  placeholder="请输入"
                  value={searchChannel}
                  onChange={(e) => setSearchChannel(e.target.value)}
                  allowClear
                />
              </div>
              <div className="filter-group" style={{ display: sfVisible('salesman') }}>
                <span className="fl-label">业务员</span>
                <Input
                  placeholder="请输入"
                  value={searchSalesman}
                  onChange={(e) => setSearchSalesman(e.target.value)}
                  allowClear
                />
              </div>
              <div className="filter-group" style={{ display: sfVisible('customerCode') }}>
                <span className="fl-label">客户代码</span>
                <Input
                  placeholder="请输入"
                  value={searchCustomerCode}
                  onChange={(e) => setSearchCustomerCode(e.target.value)}
                  allowClear
                />
              </div>
            </div>
          )}

          {/* 高级查询 - 第3行 */}
          {expanded && (
            <div className="filter-row" style={{ marginTop: 8 }}>
              <div className="filter-group" style={{ display: sfVisible('isCustoms') }}>
                <span className="fl-label">是否报关件</span>
                <Select
                  placeholder="全部"
                  value={searchIsCustoms}
                  onChange={setSearchIsCustoms}
                  allowClear
                  options={[
                    { value: '是', label: '是' },
                    { value: '否', label: '否' },
                  ]}
                />
              </div>
              <div className="filter-group" style={{ display: sfVisible('addrType') }}>
                <span className="fl-label">地址类型</span>
                <Select
                  placeholder="全部"
                  value={searchAddrType}
                  onChange={setSearchAddrType}
                  allowClear
                  options={[
                    { value: '亚马逊地址', label: '亚马逊地址' },
                    { value: '商业地址', label: '商业地址' },
                  ]}
                />
              </div>
              <div className="filter-group" style={{ display: sfVisible('isExtra') }}>
                <span className="fl-label">是否加件</span>
                <Select
                  placeholder="全部"
                  value={searchIsExtra}
                  onChange={setSearchIsExtra}
                  allowClear
                  options={[
                    { value: '是', label: '是' },
                    { value: '否', label: '否' },
                  ]}
                />
              </div>
              <div className="filter-group" style={{ display: sfVisible('isValueAddDone') }}>
                <span className="fl-label">是否完成增值服务</span>
                <Select
                  placeholder="全部"
                  value={searchIsValueAddDone}
                  onChange={setSearchIsValueAddDone}
                  allowClear
                  options={[
                    { value: '是', label: '是' },
                    { value: '否', label: '否' },
                  ]}
                />
              </div>
              <div className="filter-group" style={{ display: sfVisible('isStowable') }}>
                <span className="fl-label">是否可配载</span>
                <Select
                  placeholder="全部"
                  value={searchIsStowable}
                  onChange={setSearchIsStowable}
                  allowClear
                  options={[
                    { value: '是', label: '是' },
                    { value: '否', label: '否' },
                  ]}
                />
              </div>
              <div className="filter-group" style={{ display: sfVisible('addrAuditStatus') }}>
                <span className="fl-label">地址审核状态</span>
                <Select
                  placeholder="全部"
                  value={searchAddrAuditStatus}
                  onChange={setSearchAddrAuditStatus}
                  allowClear
                  options={[
                    { value: '已通过', label: '已通过' },
                    { value: '待审核', label: '待审核' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* 高级查询 - 第4行 */}
          {expanded && (
            <div className="filter-row" style={{ marginTop: 8 }}>
              <div className="filter-group" style={{ display: sfVisible('isIntercept') }}>
                <span className="fl-label">是否拦截</span>
                <Select
                  placeholder="全部"
                  value={searchIsIntercept}
                  onChange={setSearchIsIntercept}
                  allowClear
                  options={[
                    { value: '是', label: '是' },
                    { value: '否', label: '否' },
                  ]}
                />
              </div>
              <div className="filter-group" style={{ display: sfVisible('billingResult') }}>
                <span className="fl-label">计费结果</span>
                <Select
                  placeholder="全部"
                  value={searchBillingResult}
                  onChange={setSearchBillingResult}
                  allowClear
                  options={[
                    { value: '1360 RMB', label: '1360 RMB' },
                    { value: '2700 RMB', label: '2700 RMB' },
                  ]}
                />
              </div>
              <div className="filter-group">
                <span className="fl-label">审核时间</span>
                <RangePicker
                  value={searchAuditTime as any}
                  onChange={(dates) => setSearchAuditTime(dates as any)}
                />
              </div>
              <div className="filter-group">
                <span className="fl-label">首次可配载时间</span>
                <RangePicker
                  value={searchFirstStowableTime as any}
                  onChange={(dates) => setSearchFirstStowableTime(dates as any)}
                />
              </div>
            </div>
          )}

          {/* 查询底部 */}
          <div className="query-footer">
            <Button type="link" style={{ fontSize: 12, color: '#1890ff', padding: 0 }} onClick={() => setExpanded(!expanded)}>
              {expanded ? '收起' : '展开'}高级查询 {expanded ? <UpOutlined /> : <DownOutlined />}
            </Button>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="toolbar">
          <div className="toolbar-left">
            <Button type="primary" icon={<ReloadOutlined />}>刷新</Button>
            {activeScenario && (
              <span className="active-scenario-label">当前场景: {activeScenario.name}</span>
            )}
          </div>
          <div className="toolbar-right">
            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
            <Button onClick={resetSearch}>重置</Button>
            <span className="total-text">共 48 条</span>
          </div>
        </div>

        {/* 表格 */}
        <div className="table-wrapper-custom">
          <Table
            columns={columns}
            dataSource={MOCK_DATA}
            rowKey="key"
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => {
                setSelectedRowKeys(keys);
                emitEvent('onSearch', JSON.stringify({ selectedCount: keys.length }));
              },
            }}
            pagination={{
              current, pageSize, total: 48,
              onChange: (page) => {
                setCurrent(page);
                emitEvent('onPageChange', JSON.stringify({ page }));
              },
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`,
              size: 'small',
            }}
            size="small"
            scroll={{ x: scrollX }}
            bordered
          />
        </div>
      </div>

      {/* 编辑场景弹框 */}
      <Modal
        title={editingScenario ? '编辑场景' : '新建场景'}
        open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setEditingScenario(null); }}
        onOk={saveScenario}
        okText={editingScenario ? '保存场景' : '创建场景'}
        cancelText="取消"
        width={700}
      >
        <div className="edit-scenario-form">
          <div className="edit-scenario-section">
            <div className="edit-scenario-section-title">场景名称</div>
            <Input
              placeholder="请输入场景名称"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onPressEnter={saveScenario}
            />
          </div>

          <div className="edit-scenario-section">
            <div className="edit-scenario-section-title">
              搜索字段
              <span className="select-all-actions">
                <a onClick={() => setEditFieldKeys([...ALL_SEARCH_FIELD_KEYS])}>全选</a>
                <span className="select-all-divider">|</span>
                <a onClick={() => setEditFieldKeys(prev => ALL_SEARCH_FIELD_KEYS.filter(k => !prev.includes(k)))}>反选</a>
              </span>
            </div>
            <div className="edit-search-fields-tags">
              {SEARCH_FIELD_DEFS.map(f => (
                <span
                  key={f.key}
                  className={`search-field-tag ${editFieldKeys.includes(f.key) ? 'checked' : ''}`}
                  onClick={() => toggleEditFieldKey(f.key)}
                >
                  {editFieldKeys.includes(f.key) ? '✓' : '○'} {f.label}
                </span>
              ))}
            </div>
          </div>

          <div className="edit-scenario-section">
            <div className="edit-scenario-section-title">筛选条件默认值</div>
            <div className="edit-default-values-form">
              {SEARCH_FIELD_DEFS.filter(f => editFieldKeys.includes(f.key)).map(f => {
                const val = editSearchValues[f.key as keyof ScenarioSearchValues];
                const selectYesNo = ['isCustoms', 'isExtra', 'isValueAddDone', 'isStowable', 'isIntercept'].includes(f.key);
                const selectOptions: Record<string, { value: string; label: string }[]> = {
                  orderType: [{ value: '', label: '全部' }, { value: 'B2B', label: 'B2B' }, { value: 'B2C', label: 'B2C' }],
                  orderStatus: [{ value: '', label: '全部' }, { value: '待审核', label: '待审核' }, { value: '审核通过', label: '审核通过' }, { value: '待客户确认', label: '待客户确认' }, { value: '已预报', label: '已预报' }, { value: '已入仓', label: '已入仓' }],
                  auditStatus: [{ value: '', label: '全部' }, { value: '待审核', label: '待审核' }, { value: '审核通过', label: '审核通过' }, { value: '审核失败', label: '审核失败' }],
                  product: [{ value: '', label: '全部' }, ...PRODUCTS.map(p => ({ value: p, label: p }))],
                  country: [{ value: '', label: '全部' }, ...COUNTRIES.map(c => ({ value: c, label: c }))],
                  addrType: [{ value: '', label: '全部' }, { value: '亚马逊地址', label: '亚马逊地址' }, { value: '商业地址', label: '商业地址' }],
                  addrAuditStatus: [{ value: '', label: '全部' }, { value: '已通过', label: '已通过' }, { value: '待审核', label: '待审核' }],
                  billingResult: [{ value: '', label: '全部' }, { value: '1360 RMB', label: '1360 RMB' }, { value: '2700 RMB', label: '2700 RMB' }],
                };
                const isSelect = selectYesNo || selectOptions[f.key];
                return (
                  <div key={f.key} className="dv-form-item">
                    <span className="dv-form-label">{f.label}</span>
                    {isSelect ? (
                      <Select
                        size="small"
                        style={{ width: '100%' }}
                        value={val || ''}
                        onChange={(v) => updateEditSearchValue(f.key, v || undefined)}
                        options={selectYesNo
                          ? [{ value: '', label: '全部' }, { value: '是', label: '是' }, { value: '否', label: '否' }]
                          : selectOptions[f.key]
                        }
                      />
                    ) : (
                      <Input
                        size="small"
                        placeholder="请输入"
                        value={val || ''}
                        onChange={(e) => updateEditSearchValue(f.key, e.target.value || undefined)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="edit-scenario-section">
            <div className="edit-scenario-section-title">
              显示字段
              <span className="select-all-actions">
                <a onClick={() => setEditColumnKeys([...DEFAULT_ALL_COLUMN_KEYS])}>全选</a>
                <span className="select-all-divider">|</span>
                <a onClick={() => setEditColumnKeys(prev => DEFAULT_ALL_COLUMN_KEYS.filter(k => !prev.includes(k)))}>反选</a>
              </span>
            </div>
            <div className="column-grid-tags">
              {editColumnKeys.map((key, index) => {
                const colDef = ALL_COLUMNS.find(c => c.key === key);
                if (!colDef) return null;
                return (
                  <span key={key} className="column-grid-tag">
                    <span className="cgt-index">{index + 1}</span>
                    <span className="cgt-name">{colDef.title}</span>
                    <span className="cgt-actions">
                      <ArrowUpOutlined className={`cgt-btn ${index === 0 ? 'disabled' : ''}`} onClick={() => moveEditColumn(index, 'up')} />
                      <ArrowDownOutlined className={`cgt-btn ${index === editColumnKeys.length - 1 ? 'disabled' : ''}`} onClick={() => moveEditColumn(index, 'down')} />
                      <CloseOutlined className="cgt-btn cgt-del" onClick={() => removeEditColumn(key)} />
                    </span>
                  </span>
                );
              })}
            </div>
            {hideableEditColumns.length > 0 && (
              <div className="column-addable-list" style={{ marginTop: 8 }}>
                {hideableEditColumns.map(key => {
                  const colDef = ALL_COLUMNS.find(c => c.key === key);
                  if (!colDef) return null;
                  return (
                    <span key={key} className="column-addable-tag" onClick={() => addEditColumnBack(key)}>
                      <PlusOutlined /> {colDef.title}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default Component;
