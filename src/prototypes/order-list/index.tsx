/**
 * @name B2B订单列表
 * @mode axure
 *
 * B2B订单管理系统列表页面 - 使用 Ant Design
 *
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 */

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import './style.css';
import {
  Table, Button, Input, Select, DatePicker,
  Breadcrumb,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined,
  CopyOutlined, DownOutlined, UpOutlined,
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

interface Order {
  key: number;
  序号: number;
  业务员: string;
  客服: string;
  订单类型: string;
  订单状态: string;
  是否首批: string;
  订单审核状态: string;
  订单来源: string;
  客户代码: string;
  运单号: string;
  客户单号: string;
  服务商单号: string;
  B2B单号: string;
}

const MOCK_ORDERS: Order[] = Array.from({ length: 14 }, (_, i) => ({
  key: i + 1,
  序号: i + 1,
  业务员: ['陈晶晶', '温必龙', '吴住宝', '范文宇', '高马倩', '何诗婷'][i % 6],
  客服: ['王洲赫', '栾世萍', '李思锦', ''][i % 4],
  订单类型: 'B2B',
  订单状态: '已预报',
  是否首批: '否',
  订单审核状态: '待审核',
  订单来源: i % 2 === 0 ? 'AllintB2B' : '新用户中心',
  客户代码: `BCN${['OC534', 'HC589', 'DC452', 'OC853', 'OC631', 'HC983'][i % 6]}...`,
  运单号: `YT${2309300000000 + i * 1000}`,
  客户单号: `ALSO${1592000000 + i * 10000}`,
  服务商单号: '',
  B2B单号: `2605AA${(842 - i).toString().padStart(4, '0')}`,
}));

// ============ Axure API 常量定义 ============

const EVENT_LIST: EventItem[] = [
  { name: 'onSearch', desc: '点击查询或重置时触发，传递筛选条件（JSON 字符串格式）', payload: 'JSON string' },
  { name: 'onBatchAction', desc: '执行批量操作时触发，传递操作名称和选中行数（JSON 字符串格式）', payload: 'JSON string' },
  { name: 'onRowAction', desc: '点击行内操作时触发，传递操作名称和行序号（JSON 字符串格式）', payload: 'JSON string' },
  { name: 'onSelectionChange', desc: '表格行选择发生变化时触发，传递选中行 key 数组（JSON 字符串格式）', payload: 'JSON string' },
];

const ACTION_LIST: Action[] = [
  { name: 'refresh', desc: '刷新表格数据，重新加载列表' },
  { name: 'resetFilters', desc: '重置所有筛选条件到初始状态' },
  { name: 'expandAdvanced', desc: '展开或收起高级查询，参数格式："true" 展开 / "false" 收起', params: 'string' },
  { name: 'setPage', desc: '跳转到指定页码，参数格式：页码数字字符串如 "2"', params: 'string' },
];

const VAR_LIST: KeyDesc[] = [
  { name: 'selected_count', desc: '当前选中行数量（数字）' },
  { name: 'current_page', desc: '当前页码（数字）' },
  { name: 'expanded', desc: '高级查询是否展开（布尔值）' },
];

const CONFIG_LIST: ConfigItem[] = [
  {
    type: 'input',
    attributeId: 'title',
    displayName: '页面标题',
    info: '页面顶部显示的标题文字',
    initialValue: 'B2B订单列表'
  },
  {
    type: 'inputNumber',
    attributeId: 'pageSize',
    displayName: '每页条数',
    info: '表格每页显示的记录数',
    initialValue: 50,
    min: 10,
    max: 100
  },
];

const DATA_LIST: DataDesc[] = [
  {
    name: 'orders',
    desc: '订单列表数据',
    keys: [
      { name: '序号', desc: '行序号（数字）' },
      { name: '业务员', desc: '负责业务员姓名（字符串）' },
      { name: '客服', desc: '客服姓名（字符串）' },
      { name: '订单类型', desc: '订单类型（字符串）' },
      { name: '订单状态', desc: '订单处理状态（字符串）' },
      { name: '是否首批', desc: '是否为首批订单（字符串）' },
      { name: '订单审核状态', desc: '订单审核状态（字符串）' },
      { name: '订单来源', desc: '订单来源渠道（字符串）' },
      { name: '客户代码', desc: '客户唯一代码（字符串）' },
      { name: '运单号', desc: '物流运单号码（字符串）' },
      { name: '客户单号', desc: '客户系统订单号（字符串）' },
      { name: '服务商单号', desc: '物流服务商单号（字符串）' },
      { name: 'B2B单号', desc: 'B2B平台订单号（字符串）' },
    ]
  }
];

// ============ 组件实现 ============

const Component = forwardRef(function OrderList(
  innerProps: AxureProps,
  ref: React.ForwardedRef<AxureHandle>,
) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [current, setCurrent] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const configSource = innerProps && innerProps.config ? innerProps.config : {};
  const onEventHandler = typeof innerProps.onEvent === 'function'
    ? innerProps.onEvent
    : function () { return undefined; };

  const pageSize = typeof configSource.pageSize === 'number' && configSource.pageSize > 0
    ? configSource.pageSize
    : 50;

  const emitEvent = useCallback(function (eventName: string, payload?: string) {
    try {
      onEventHandler(eventName, payload);
    } catch (error) {
      console.warn('事件触发失败:', error);
    }
  }, [onEventHandler]);

  const renderActions = useCallback(function () {
    return (
      <span>
        <a className="table-action-link">审核</a>
        <span className="table-action-divider">|</span>
        <a className="table-action-link">修改</a>
        <span className="table-action-divider">|</span>
        <a className="table-action-link">详情</a>
        <span className="table-action-divider">|</span>
        <a className="table-action-link">日志</a>
      </span>
    );
  }, []);

  const columns = [
    { title: '序号', dataIndex: '序号', key: '序号', width: 50, align: 'center' as const },
    { title: '业务员', dataIndex: '业务员', key: '业务员', width: 80 },
    { title: '客服', dataIndex: '客服', key: '客服', width: 80 },
    { title: '订单类型', dataIndex: '订单类型', key: '订单类型', width: 80, align: 'center' as const },
    { title: '订单状态', dataIndex: '订单状态', key: '订单状态', width: 80, align: 'center' as const },
    { title: '是否首批', dataIndex: '是否首批', key: '是否首批', width: 70, align: 'center' as const },
    { title: '订单审核状态', dataIndex: '订单审核状态', key: '订单审核状态', width: 90, align: 'center' as const },
    { title: '订单来源', dataIndex: '订单来源', key: '订单来源', width: 100 },
    { title: '客户代码', dataIndex: '客户代码', key: '客户代码', width: 110 },
    { title: '运单号', dataIndex: '运单号', key: '运单号', width: 150 },
    { title: '客户单号', dataIndex: '客户单号', key: '客户单号', width: 140 },
    { title: '服务商单号', dataIndex: '服务商单号', key: '服务商单号', width: 90, align: 'center' as const },
    { title: 'B2B单号', dataIndex: 'B2B单号', key: 'B2B单号', width: 100, align: 'center' as const },
    {
      title: '操作', key: '操作', width: 150, align: 'center' as const,
      render: renderActions,
    },
  ];

  const fireActionHandler = useCallback(function (name: string, params?: string) {
    switch (name) {
      case 'refresh':
        setCurrent(1);
        break;
      case 'resetFilters':
        setExpanded(false);
        setCurrent(1);
        break;
      case 'expandAdvanced':
        setExpanded(params === 'true');
        break;
      case 'setPage':
        if (params) {
          const page = parseInt(params, 10);
          if (!isNaN(page) && page >= 1) {
            setCurrent(page);
          }
        }
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
          expanded: expanded,
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
  }, [selectedRowKeys, current, expanded, fireActionHandler]);

  return (
    <div className="b2b-order-list-page">
      <div className="page-header">
        <Breadcrumb items={[
          { title: '首页' },
          { title: '销售产品管理' },
          { title: 'B2B订单列表' },
        ]} />
      </div>

      <div className="page-body">
        {/* 查询区 */}
        <div className="query-bar">
          <div className="filter-row">
            <div className="filter-group">
              <span className="fl-label">单号</span>
              <div className="input-addon-group">
                <input className="native-input" placeholder="请输入单号，多单号以空..." />
                <button className="addon-btn">+</button>
              </div>
            </div>
            <div className="filter-group">
              <span className="fl-label">B2B单号</span>
              <div className="input-addon-group">
                <input className="native-input" placeholder="请输入单号，多单号以空..." />
                <button className="addon-btn">+</button>
              </div>
            </div>
            <div className="filter-group">
              <span className="fl-label">创建时间</span>
              <span className="date-wrap">
                <DatePicker placeholder="开始时间" />
                <span className="date-sep">-</span>
                <DatePicker placeholder="结束时间" />
              </span>
            </div>
            <div className="filter-group">
              <span className="fl-label">订单类型</span>
              <Select defaultValue="请选择" options={[
                { value: '请选择', label: '请选择' },
                { value: 'B2B', label: 'B2B' }, { value: 'B2C', label: 'B2C' },
              ]} />
            </div>
            <div className="filter-group">
              <span className="fl-label">订单状态</span>
              <Select defaultValue="请选择" options={[
                { value: '请选择', label: '请选择' },
                { value: '已预报', label: '已预报' },
              ]} />
            </div>
            <div className="filter-group">
              <span className="fl-label">审核状态</span>
              <Select defaultValue="请选择" options={[
                { value: '请选择', label: '请选择' },
                { value: '待审核', label: '待审核' },
              ]} />
            </div>
          </div>

          {expanded && (
            <div className="filter-row" style={{ marginTop: 8 }}>
              <div className="filter-group">
                <span className="fl-label">客户代码</span>
                <Input placeholder="请输入" />
              </div>
              <div className="filter-group">
                <span className="fl-label">运单号</span>
                <Input placeholder="请输入" />
              </div>
              <div className="filter-group">
                <span className="fl-label">是否首批</span>
                <Select defaultValue="请选择" options={[
                  { value: '请选择', label: '请选择' },
                  { value: '是', label: '是' }, { value: '否', label: '否' },
                ]} />
              </div>
              <div className="filter-group">
                <span className="fl-label">业务员</span>
                <Input placeholder="请输入" />
              </div>
              <div className="filter-group">
                <span className="fl-label">客服</span>
                <Input placeholder="请输入" />
              </div>
            </div>
          )}

          <div className="query-footer">
            <Button type="link" style={{ fontSize: 12, color: '#1890ff', padding: 0 }} onClick={() => setExpanded(!expanded)}>
              {expanded ? '收起' : '展开'}高级查询 {expanded ? <UpOutlined /> : <DownOutlined />}
            </Button>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="toolbar">
          <div className="toolbar-left">
            <Button type="primary">批量审核</Button>
            <Button type="primary">撤销审核</Button>
            <Button type="primary">批量修改额外服务</Button>
            <Button type="primary">批量修改费用</Button>
            <Button type="primary">确认费用</Button>
            <Button type="primary">栏截</Button>
            <Button type="primary">取消栏截</Button>
            <Button type="primary" icon={<ReloadOutlined />}>刷新</Button>
            <Button type="primary" icon={<CopyOutlined />}>复制显示列</Button>
            <Button type="primary">导入跟踪号</Button>
            <Button type="primary">更多<DownOutlined /></Button>
          </div>
          <div className="toolbar-right">
            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
            <Button type="primary">重置</Button>
          </div>
        </div>

        {/* 表格 */}
        <div className="table-wrapper-custom">
          <Table
            columns={columns}
            dataSource={MOCK_ORDERS}
            rowKey="key"
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => {
                setSelectedRowKeys(keys);
                emitEvent('onSelectionChange', JSON.stringify({ keys }));
              },
            }}
            pagination={{
              current, pageSize, total: 248,
              onChange: (page) => {
                setCurrent(page);
                emitEvent('onSearch', JSON.stringify({ page }));
              },
              showSizeChanger: false,
              showTotal: (total) => `共${total}条`, size: 'small',
            }}
            size="small"
            scroll={{ x: 1500 }}
          />
        </div>
      </div>
    </div>
  );
});

export default Component;
