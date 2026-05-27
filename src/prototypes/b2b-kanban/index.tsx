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
import { MOCK_FIELDS } from './mock-fields';
import B2B_ORDERS from '../../database/b2b-orders.json';
const MOCK_DATA_ALL = B2B_ORDERS.records;
const PRODUCTS = [...new Set(MOCK_DATA_ALL.map((r: Record<string, string>) => r['销售产品']).filter(Boolean))];
const COUNTRIES = [...new Set(MOCK_DATA_ALL.map((r: Record<string, string>) => r['目的国家']).filter(Boolean))];

const { RangePicker } = DatePicker;

// ============ 场景持久化 ============
const STORAGE_KEY_SCENARIOS = 'b2b_kanban_scenarios';
const STORAGE_KEY_ACTIVE = 'b2b_kanban_active_scenario';

function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCENARIOS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveScenarios(scenarios: Scenario[]) {
  try { localStorage.setItem(STORAGE_KEY_SCENARIOS, JSON.stringify(scenarios)); } catch {}
}

function loadActiveScenarioId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE) || '__default__';
  } catch { return '__default__'; }
}

function saveActiveScenarioId(id: string) {
  try { localStorage.setItem(STORAGE_KEY_ACTIVE, id); } catch {}
}

// ============ 场景类型 ============
interface ScenarioSearchValues {
  waybillNo: string;
  b2bNo: string;
  orderType: string | undefined;
  orderStatus: string[];
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
const DEFAULT_ALL_COLUMN_KEYS = MOCK_FIELDS;

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
    keys: MOCK_FIELDS.map(f => ({ name: f, desc: `${f}（字符串）` })),
  }
];

// ============ 模拟数据 ============

interface OrderRecord {
  key: string;
  [key: string]: string;
}

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
  const [searchOrderStatus, setSearchOrderStatus] = useState<string[]>([]);
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
  const [scenarios, setScenarios] = useState<Scenario[]>(loadScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(loadActiveScenarioId);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(DEFAULT_ALL_COLUMN_KEYS);
  const [visibleSearchFieldKeys, setVisibleSearchFieldKeys] = useState<string[]>(ALL_SEARCH_FIELD_KEYS);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [editName, setEditName] = useState('');
  const [editFieldKeys, setEditFieldKeys] = useState<string[]>([]);
  const [editSearchValues, setEditSearchValues] = useState<ScenarioSearchValues>({
    waybillNo: '', b2bNo: '', orderType: undefined, orderStatus: [],
    auditStatus: undefined, product: undefined, country: undefined,
    channel: '', salesman: '', customerCode: '', isCustoms: undefined,
    addrType: undefined, isExtra: undefined, isValueAddDone: undefined,
    isStowable: undefined, addrAuditStatus: undefined, isIntercept: undefined,
    billingResult: undefined,
  });
  const [editColumnKeys, setEditColumnKeys] = useState<string[]>(DEFAULT_ALL_COLUMN_KEYS);

  // 场景持久化
  React.useEffect(() => { saveScenarios(scenarios); }, [scenarios]);
  React.useEffect(() => { saveActiveScenarioId(activeScenarioId); }, [activeScenarioId]);

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
    setEditFieldKeys(scenario ? [...scenario.visibleSearchFieldKeys] : [...visibleSearchFieldKeys]);
    setEditSearchValues(scenario ? { ...scenario.searchValues } : getSearchValues());
    setEditColumnKeys(scenario ? [...scenario.visibleColumnKeys] : [...visibleColumnKeys]);
    setEditModalOpen(true);
  }, [getSearchValues, visibleColumnKeys, visibleSearchFieldKeys]);

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
    setSearchOrderStatus([]);
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
    ...MOCK_FIELDS.map((field, fi) => {
      const minW = ['运单号', 'B2B单号', '客户单号'].includes(field) ? 140
        : ['创建时间', '审核时间', '签入时间', '签出时间', '签收时间', '可配载时间', '费用确认时间', '到仓时间', '揽收时间'].includes(field) ? 155
        : ['销售产品', '服务渠道名称', '首次到货网点', '操作仓', '计费签入网点', '进口商公司名称', '发件人详细地址', '收件人信息（地址、名称、电话）'].includes(field) ? 130
        : field.includes('备注') || field.includes('地址') ? 120 : 90;
      return { title: field, dataIndex: field, key: field, width: minW, ellipsis: true };
    }),
    {
      title: '操作', key: '操作', width: 80, fixed: 'right' as const, align: 'center' as const,
      render: (_: any, record: OrderRecord) => (
        <span>
          <a className="table-action-link" onClick={() => emitEvent('onSearch', JSON.stringify({ action: 'detail', key: record.id }))}>详情</a>
          <span className="table-action-divider">|</span>
          <a className="table-action-link" onClick={() => emitEvent('onSearch', JSON.stringify({ action: 'log', key: record.id }))}>日志</a>
        </span>
      ),
    },
  ];

  const columns = [
    ...visibleColumnKeys.map(key => ALL_COLUMNS.find(c => c.key === key)).filter(Boolean),
    ALL_COLUMNS.find(c => c.key === '操作'),
  ].filter(Boolean);

  const scrollX = columns.reduce((sum, col) => sum + (typeof col.width === 'number' ? col.width : 100), 0) + 60;

  const sfVisible = useCallback((key: string) =>
    visibleSearchFieldKeys.includes(key) ? undefined : 'none' as React.CSSProperties['display']
  , [visibleSearchFieldKeys]);

  // 搜索过滤
  const filteredData = React.useMemo(() => {
    return MOCK_DATA_ALL.filter((record: Record<string, string>) => {
      if (searchWaybillNo && !record['运单号']?.includes(searchWaybillNo)) return false;
      if (searchB2bNo && !record['B2B单号']?.includes(searchB2bNo)) return false;
      if (searchOrderType && record['订单类型'] !== searchOrderType) return false;
      if (searchOrderStatus.length > 0 && !searchOrderStatus.includes(record['订单状态'])) return false;
      if (searchAuditStatus && record['订单审核状态'] !== searchAuditStatus) return false;
      if (searchProduct && record['销售产品'] !== searchProduct) return false;
      if (searchCountry && record['目的国家'] !== searchCountry) return false;
      if (searchChannel && !record['服务渠道名称']?.includes(searchChannel)) return false;
      if (searchSalesman && !record['业务员']?.includes(searchSalesman)) return false;
      if (searchCustomerCode && !record['客户代码']?.includes(searchCustomerCode)) return false;
      if (searchIsCustoms !== undefined && record['是否报关件'] !== searchIsCustoms) return false;
      if (searchAddrType && record['地址类型'] !== searchAddrType) return false;
      if (searchIsExtra !== undefined && record['是否需要增值服务'] !== searchIsExtra) return false;
      if (searchIsValueAddDone !== undefined && record['是否完成增值服务'] !== searchIsValueAddDone) return false;
      if (searchIsStowable !== undefined && record['是否可配载'] !== searchIsStowable) return false;
      if (searchAddrAuditStatus && record['地址审核状态'] !== searchAddrAuditStatus) return false;
      if (searchIsIntercept !== undefined && record['是否拦截'] !== searchIsIntercept) return false;
      if (searchBillingResult && record['入账结果'] !== searchBillingResult) return false;
      return true;
    });
  }, [
    MOCK_DATA_ALL, searchWaybillNo, searchB2bNo, searchOrderType, searchOrderStatus,
    searchAuditStatus, searchProduct, searchCountry, searchChannel, searchSalesman,
    searchCustomerCode, searchIsCustoms, searchAddrType, searchIsExtra,
    searchIsValueAddDone, searchIsStowable, searchAddrAuditStatus, searchIsIntercept,
    searchBillingResult,
  ]);

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
                  { value: '整柜', label: '整柜' },
                ]}
              />
            </div>
            <div className="filter-group" style={{ display: sfVisible('orderStatus') }}>
              <span className="fl-label">订单状态</span>
              <Select
                mode="multiple"
                placeholder="全部"
                value={searchOrderStatus}
                onChange={setSearchOrderStatus}
                allowClear
                options={[
                  { value: '待客户确认', label: '待客户确认' },
                  { value: '草稿', label: '草稿' },
                  { value: '已预报', label: '已预报' },
                  { value: '已收货', label: '已收货' },
                  { value: '已出仓', label: '已出仓' },
                  { value: '已签收', label: '已签收' },
                  { value: '客户已确认', label: '客户已确认' },
                  { value: '客户已驳回', label: '客户已驳回' },
                  { value: '已退件', label: '已退件' },
                  { value: '已理赔', label: '已理赔' },
                  { value: '已删除', label: '已删除' },
                  { value: '弃件', label: '弃件' },
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
                  { value: '审核通过', label: '审核通过' },
                  { value: '待审核', label: '待审核' },
                  { value: '审核不通过', label: '审核不通过' },
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
                    { value: '已审核', label: '已审核' },
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
            <span className="total-text">共 {filteredData.length} 条</span>
          </div>
        </div>

        {/* 表格 */}
        <div className="table-wrapper-custom">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => {
                setSelectedRowKeys(keys);
                emitEvent('onSearch', JSON.stringify({ selectedCount: keys.length }));
              },
            }}
            pagination={{
              current, pageSize, total: filteredData.length,
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
                  orderType: [{ value: '', label: '全部' }, { value: 'B2B', label: 'B2B' }, { value: '整柜', label: '整柜' }],
                  orderStatus: [{ value: '', label: '全部' }, { value: '待客户确认', label: '待客户确认' }, { value: '草稿', label: '草稿' }, { value: '已预报', label: '已预报' }, { value: '已收货', label: '已收货' }, { value: '已出仓', label: '已出仓' }, { value: '已签收', label: '已签收' }, { value: '客户已确认', label: '客户已确认' }, { value: '客户已驳回', label: '客户已驳回' }, { value: '已退件', label: '已退件' }, { value: '已理赔', label: '已理赔' }, { value: '已删除', label: '已删除' }, { value: '弃件', label: '弃件' }],
                  auditStatus: [{ value: '', label: '全部' }, { value: '审核通过', label: '审核通过' }, { value: '待审核', label: '待审核' }, { value: '审核不通过', label: '审核不通过' }],
                  product: [{ value: '', label: '全部' }, ...PRODUCTS.map(p => ({ value: p, label: p }))],
                  country: [{ value: '', label: '全部' }, ...COUNTRIES.map(c => ({ value: c, label: c }))],
                  addrType: [{ value: '', label: '全部' }, { value: '亚马逊地址', label: '亚马逊地址' }, { value: '私人地址', label: '私人地址' }, { value: '第三方地址', label: '第三方地址' }],
                  addrAuditStatus: [{ value: '', label: '全部' }, { value: '已审核', label: '已审核' }, { value: '待审核', label: '待审核' }],
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
                        mode={f.key === 'orderStatus' ? 'multiple' : undefined}
                        value={f.key === 'orderStatus' ? (val || []) : (val || '')}
                        onChange={(v) => updateEditSearchValue(f.key, f.key === 'orderStatus' ? v : (v || undefined))}
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
