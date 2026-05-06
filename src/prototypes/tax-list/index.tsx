/**
 * @name B2B税号管理列表
 * @mode axure
 *
 * B2B税号管理列表页面，包含筛选、新增、修改、删除等操作
 *
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 */

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import './style.css';
import {
  Table, Button, Input, Select, DatePicker, Modal, Form, Upload,
  Breadcrumb, Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SearchOutlined, PlusOutlined, ReloadOutlined, DownOutlined,
  UpOutlined, UploadOutlined, MoreOutlined,
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

// ============ Axure API 常量定义 ============

const EVENT_LIST: EventItem[] = [
  { name: 'onSearch', desc: '点击查询时触发', payload: 'JSON string' },
  { name: 'onAdd', desc: '点击新增时触发', payload: 'JSON string' },
  { name: 'onEdit', desc: '点击修改时触发', payload: 'JSON string' },
  { name: 'onDelete', desc: '点击删除时触发', payload: 'JSON string' },
  { name: 'onApprove', desc: '点击审核通过时触发', payload: 'JSON string' },
  { name: 'onReject', desc: '点击审核不通过时触发', payload: 'JSON string' },
  { name: 'onView', desc: '点击查看时触发', payload: 'JSON string' },
  { name: 'onPoaProtocol', desc: '点击POA协议时触发', payload: 'JSON string' },
  { name: 'onDownload', desc: '点击下载时触发', payload: 'JSON string' },
  { name: 'onVoid', desc: '点击作废时触发', payload: 'JSON string' },
  { name: 'onLog', desc: '点击日志时触发', payload: 'JSON string' },
  { name: 'onPageChange', desc: '切换分页时触发', payload: 'JSON string' },
];

const ACTION_LIST: Action[] = [
  { name: 'refresh', desc: '刷新列表数据', params: 'string' },
  { name: 'resetFilters', desc: '重置筛选条件', params: 'string' },
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
    initialValue: '税号管理'
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
    name: 'taxList',
    desc: '税号列表数据',
    keys: [
      { name: '状态', desc: '启用/停用状态（字符串）' },
      { name: '客服员', desc: '客服员姓名（字符串）' },
      { name: '业务员', desc: '业务员姓名（字符串）' },
      { name: '税号/TAXID', desc: '税号/TAXID（字符串）' },
      { name: 'EORI税号', desc: 'EORI税号（字符串）' },
      { name: '税号/TAXID所属国家', desc: '所属国家（字符串）' },
      { name: '客户代码', desc: '客户唯一代码（字符串）' },
      { name: '进口商名称', desc: '进口商名称（字符串）' },
      { name: '进口商邮编', desc: '进口商邮编（字符串）' },
      { name: '进口商城市', desc: '进口商城市（字符串）' },
      { name: '进口商地址', desc: '进口商地址（字符串）' },
    ]
  }
];

// ============ 模拟数据 ============

interface TaxRecord {
  key: number;
  状态: string;
  客服员: string;
  业务员: string;
  '税号/TAXID': string;
  'EORI税号': string;
  '税号/TAXID所属国家': string;
  客户代码: string;
  进口商名称: string;
  进口商邮编: string;
  进口商城市: string;
  进口商地址: string;
}

const SALES = ['陈晶晶', '温必龙', '吴住宝', '范文宇', '高马倩', '何诗婷'];
const SERVICE = ['王洲赫', '栾世萍', '李思锦', '张欣怡'];
const COUNTRIES = ['中国 CN', '美国 US', '英国 GB', '德国 DE', '法国 FR', '日本 JP'];
const CODES = ['BCNOC534', 'BCHC589', 'BCDC452', 'BCOC853'];

const STATUS_LIST = ['待审核', '审核通过', '审核失败', '已作废'];

const MOCK_DATA: TaxRecord[] = Array.from({ length: 20 }, (_, i) => ({
  key: i + 1,
  状态: STATUS_LIST[i % STATUS_LIST.length],
  客服员: SERVICE[i % SERVICE.length],
  业务员: SALES[i % SALES.length],
  '税号/TAXID': `TAX${100000 + i * 1234}`,
  'EORI税号': `GB${200000 + i * 567}EORI`,
  '税号/TAXID所属国家': COUNTRIES[i % COUNTRIES.length],
  客户代码: CODES[i % CODES.length],
  进口商名称: `进口商${String.fromCharCode(65 + i % 4)}有限公司`,
  进口商邮编: `${100000 + i * 100}`,
  进口商城市: ['深圳', '广州', '上海', '北京'][i % 4],
  进口商地址: `广东省深圳市南山区科技园${i + 1}号`,
}));

// ============ 组件实现 ============

const Component = forwardRef(function TaxList(
  innerProps: AxureProps,
  ref: React.ForwardedRef<AxureHandle>,
) {
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [current, setCurrent] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TaxRecord | null>(null);

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

  const handleEdit = useCallback(function (record: TaxRecord) {
    setEditingRecord(record);
    form.setFieldsValue({
      taxId: record['税号/TAXID'],
      eoriTaxId: record['EORI税号'],
      taxCountry: record['税号/TAXID所属国家'],
      customerCode: record['客户代码'],
      importerName: record['进口商名称'],
      importerPostalCode: record['进口商邮编'],
      importerCity: record['进口商城市'],
      importerAddress: record['进口商地址'],
    });
    setModalOpen(true);
    emitEvent('onEdit', JSON.stringify(record));
  }, [emitEvent, form]);

  const handleOk = useCallback(function () {
    form.validateFields().then((values) => {
      emitEvent('onConfirm', JSON.stringify(values));
      setModalOpen(false);
      setEditingRecord(null);
    }).catch(() => {});
  }, [form, emitEvent]);

  const handleCancel = useCallback(function () {
    setModalOpen(false);
    setEditingRecord(null);
  }, []);

  const handleAddModal = useCallback(function () {
    form.resetFields();
    setEditingRecord(null);
    setModalOpen(true);
    emitEvent('onAdd', JSON.stringify({}));
  }, [emitEvent, form]);

  const handleApprove = useCallback(function (record: TaxRecord) {
    emitEvent('onApprove', JSON.stringify(record));
  }, [emitEvent]);

  const handleReject = useCallback(function (record: TaxRecord) {
    emitEvent('onReject', JSON.stringify(record));
  }, [emitEvent]);

  const handleView = useCallback(function (record: TaxRecord) {
    emitEvent('onView', JSON.stringify(record));
  }, [emitEvent]);

  const handlePoaProtocol = useCallback(function (record: TaxRecord) {
    emitEvent('onPoaProtocol', JSON.stringify(record));
  }, [emitEvent]);

  const handleDownload = useCallback(function (record: TaxRecord) {
    emitEvent('onDownload', JSON.stringify(record));
  }, [emitEvent]);

  const handleVoid = useCallback(function (record: TaxRecord) {
    emitEvent('onVoid', JSON.stringify(record));
  }, [emitEvent]);

  const handleLog = useCallback(function (record: TaxRecord) {
    emitEvent('onLog', JSON.stringify(record));
  }, [emitEvent]);

  const STATUS_COLORS: Record<string, string> = {
    '待审核': '#e6a23c',
    '审核通过': '#67c23a',
    '审核失败': '#f56c6c',
    '已作废': '#909399',
  };

  const renderMoreMenu = useCallback(function (record: TaxRecord): MenuProps['items'] {
    const items: MenuProps['items'] = [
      { key: 'download', label: '下载', onClick: () => handleDownload(record) },
    ];
    if (record['状态'] !== '已作废') {
      items.push({ key: 'void', label: '作废', onClick: () => handleVoid(record) });
    }
    items.push({ key: 'log', label: '日志', onClick: () => handleLog(record) });
    return items;
  }, [handleDownload, handleVoid, handleLog]);

  const columns = [
    {
      title: '状态', dataIndex: '状态', key: '状态', width: 85, align: 'center' as const,
      render: (text: string) => (
        <span style={{ color: STATUS_COLORS[text] || '#606266', fontWeight: 500 }}>{text}</span>
      ),
    },
    { title: '客服员', dataIndex: '客服员', key: '客服员', width: 80 },
    { title: '业务员', dataIndex: '业务员', key: '业务员', width: 80 },
    { title: '税号/TAXID', dataIndex: '税号/TAXID', key: '税号/TAXID', width: 140 },
    { title: 'EORI税号', dataIndex: 'EORI税号', key: 'EORI税号', width: 140 },
    { title: '税号/TAXID所属国家', dataIndex: '税号/TAXID所属国家', key: '税号/TAXID所属国家', width: 120 },
    { title: '客户代码', dataIndex: '客户代码', key: '客户代码', width: 110 },
    { title: '进口商名称', dataIndex: '进口商名称', key: '进口商名称', width: 130 },
    { title: '进口商邮编', dataIndex: '进口商邮编', key: '进口商邮编', width: 100 },
    { title: '进口商城市', dataIndex: '进口商城市', key: '进口商城市', width: 90 },
    { title: '进口商地址', dataIndex: '进口商地址', key: '进口商地址', width: 180 },
    {
      title: '操作', key: '操作', width: 250, align: 'center' as const,
      render: (_: any, record: TaxRecord) => {
        const status = record['状态'];
        const links: React.ReactNode[] = [];

        if (status === '待审核') {
          links.push(<a key="approve" className="action-link" onClick={() => handleApprove(record)}>审核通过</a>);
          links.push(<a key="reject" className="action-link" onClick={() => handleReject(record)}>审核不通过</a>);
          links.push(<a key="edit" className="action-link" onClick={() => handleEdit(record)}>修改</a>);
        } else if (status === '审核通过') {
          links.push(<a key="view" className="action-link" onClick={() => handleView(record)}>查看</a>);
          links.push(<a key="poa" className="action-link" onClick={() => handlePoaProtocol(record)}>POA协议</a>);
        } else if (status === '审核失败') {
          links.push(<a key="approve" className="action-link" onClick={() => handleApprove(record)}>审核通过</a>);
          links.push(<a key="edit" className="action-link" onClick={() => handleEdit(record)}>修改</a>);
        } else if (status === '已作废') {
          links.push(<a key="view" className="action-link" onClick={() => handleView(record)}>查看</a>);
          links.push(<a key="poa" className="action-link" onClick={() => handlePoaProtocol(record)}>POA协议</a>);
        }

        return (
          <span className="action-links">
            {links.map((link, i) => (
              <span key={`link-${i}`}>
                {i > 0 && <span className="action-divider">|</span>}
                {link}
              </span>
            ))}
            <span className="action-divider action-divider-more">|</span>
            <Dropdown menu={{ items: renderMoreMenu(record) }} placement="bottomRight" trigger={['click']}>
              <span className="more-actions-trigger" onClick={e => e.stopPropagation()}>
                <MoreOutlined style={{ fontSize: 18, verticalAlign: 'middle' }} />
              </span>
            </Dropdown>
          </span>
        );
      },
    },
  ];

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

  return (
    <div className="tax-list-page">
      {/* 面包屑 */}
      <div className="page-header">
        <Breadcrumb items={[
          { title: '首页' },
          { title: '财务管理' },
          { title: 'B2B税号管理' },
        ]} />
      </div>

      <div className="page-body">
        {/* 标题栏 */}
        <div className="page-title-bar">
          <h2 className="page-title">B2B税号管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddModal}>批量新增</Button>
        </div>

        {/* 筛选区 */}
        <div className="query-bar">
          <div className="filter-row">
            <div className="filter-group">
              <span className="fl-label">客户代码</span>
              <Input placeholder="请输入" />
            </div>
            <div className="filter-group">
              <span className="fl-label">税号/TAXID</span>
              <Input placeholder="请输入" />
            </div>
            <div className="filter-group">
              <span className="fl-label">创建时间</span>
              <span className="filter-date-wrap">
                <DatePicker placeholder="开始时间" />
                <span className="date-sep">-</span>
                <DatePicker placeholder="结束时间" />
              </span>
            </div>
            <div className="filter-group">
              <span className="fl-label">国家</span>
              <Select placeholder="请选择" options={[
                { value: '', label: '全部' },
                { value: '中国', label: '中国' },
                { value: '美国', label: '美国' },
                { value: '英国', label: '英国' },
              ]} />
            </div>
            <div className="filter-group">
              <span className="fl-label">状态</span>
              <Select placeholder="请选择" options={[
                { value: '', label: '全部' },
                { value: '启用', label: '启用' },
                { value: '停用', label: '停用' },
              ]} />
            </div>
          </div>

          {expanded && (
            <div className="filter-row" style={{ marginTop: 8 }}>
              <div className="filter-group">
                <span className="fl-label">客户等级</span>
                <Select placeholder="请选择" options={[
                  { value: '', label: '全部' },
                  { value: 'A级', label: 'A级' },
                  { value: 'B级', label: 'B级' },
                  { value: 'C级', label: 'C级' },
                  { value: 'D级', label: 'D级' },
                ]} />
              </div>
              <div className="filter-group">
                <span className="fl-label">EORI税号</span>
                <Input placeholder="请输入" />
              </div>
            </div>
          )}

          <div className="query-actions">
            <Button type="link" className="expand-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? '收起' : '展开'}高级查询 {expanded ? <UpOutlined /> : <DownOutlined />}
            </Button>
            <div className="query-buttons">
              <Button type="primary" icon={<SearchOutlined />}>查询</Button>
              <Button>重置</Button>
            </div>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="toolbar">
          <div className="toolbar-left">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddModal}>批量新增</Button>
            <Button type="primary" icon={<ReloadOutlined />}>刷新</Button>
          </div>
          <div className="toolbar-right">
            <span className="total-text">共 48 条</span>
          </div>
        </div>

        {/* 表格 */}
        <div className="table-wrapper">
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
            scroll={{ x: 1400 }}
          />
        </div>

        {/* 编辑弹框 */}
        <Modal
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 600, color: '#333', justifyContent: 'flex-start', width: '100%' }}><span style={{ width: 3, height: 16, backgroundColor: '#1D4CD2', borderRadius: 2, flexShrink: 0 }} />修改</div>}
          open={modalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          width={640}
          className="b2b-edit-modal"
          footer={
            <div className="modal-footer">
              <Button onClick={handleCancel}>取消</Button>
              <Button type="primary" onClick={handleOk}>保存</Button>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            size="middle"
            className="edit-form"
            requiredMark={(label, info) => (
              <span>
                {info.required ? <span style={{ color: '#ff4d4f', marginRight: 2 }}>*</span> : null}
                {label}
              </span>
            )}
          >
            {/* 基础信息 */}
            <div className="form-section-title">基础信息</div>
            <div className="form-grid">
              <Form.Item
                name="taxId"
                label="税号/TAXID"
                rules={[{ required: true, message: '请输入税号' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="eoriTaxId" label="EORI税号" rules={[{ required: true, message: '请输入EORI税号' }]}>
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="taxCountry"
                label="税号/TAXID所属国家"
                rules={[{ required: true, message: '请选择所属国家' }]}
              >
                <Select
                  showSearch
                  placeholder="请选择"
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  options={[
                    { value: '中国', label: '中国 CN' },
                    { value: '美国', label: '美国 US' },
                    { value: '英国', label: '英国 GB' },
                    { value: '德国', label: '德国 DE' },
                    { value: '法国', label: '法国 FR' },
                    { value: '日本', label: '日本 JP' },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="customerCode"
                label="客户代码"
                rules={[{ required: true, message: '请输入客户代码' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="importerName" label="进口商名称">
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="importerPostalCode" label="进口商邮编">
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="importerCity" label="进口商城市">
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="importerAddress" label="进口商地址">
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 备案附件 */}
            <div className="form-section-title">备案附件</div>
            <div className="attachment-area">
              <Upload>
                <Button icon={<UploadOutlined />}>导入</Button>
              </Upload>
              <div className="attachment-tip">
                建议导入文件的格式为PDF、JPG、PNG，文件大小不超过10M
              </div>
            </div>

            {/* 协议信息 */}
            <div className="form-section-title" style={{ marginTop: 20 }}>协议信息</div>
            <div className="form-grid">
              <Form.Item name="legalNameEn" label="进口商法人名称">
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="legalPosition" label="法人职务" initialValue="Director">
                <Select placeholder="请选择" options={[
                  { value: 'Director', label: 'Director' },
                  { value: 'CEO', label: 'CEO' },
                ]} />
              </Form.Item>
              <Form.Item name="legalPhone" label="进口商法人电话">
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="legalEmail" label="法人邮箱"
                rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="signCityEn" label="签署时所在城市">
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="creditCode" label="信用代码/所在国登记号">
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="companyNameCn" label="中文公司名">
                <Input placeholder="请输入" />
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
});

export default Component;
