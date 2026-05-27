/**
 * @name B2B详情编辑弹框
 * @mode axure
 *
 * B2B订单管理 - 编辑弹框页面，展示订单修改表单弹框
 *
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 */

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import './style.css';
import {
  Modal, Form, Input, Select, Button, DatePicker, Table, Breadcrumb, Checkbox,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined, DeleteOutlined,
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
  { name: 'onConfirm', desc: '点击保存按钮时触发', payload: 'JSON string' },
  { name: 'onCancel', desc: '点击取消按钮时触发', payload: 'JSON string' },
];

const ACTION_LIST: Action[] = [
  { name: 'openModal', desc: '打开编辑弹框', params: 'string' },
  { name: 'closeModal', desc: '关闭编辑弹框', params: 'string' },
];

const VAR_LIST: KeyDesc[] = [
  { name: 'modal_open', desc: '弹框是否打开（布尔值）' },
];

const CONFIG_LIST: ConfigItem[] = [
  {
    type: 'input',
    attributeId: 'title',
    displayName: '弹框标题',
    info: '弹框顶部显示的标题文字',
    initialValue: '修改'
  },
];

const DATA_LIST: DataDesc[] = [
  {
    name: 'formData',
    desc: '表单数据',
    keys: [
      // 基本信息
      { name: '销售产品', desc: '销售产品名称（字符串）' },
      { name: '目的国家', desc: '目的国家（字符串）' },
      { name: '清关方案', desc: '清关方案（字符串）' },
      { name: '客户备注', desc: '客户备注（字符串）' },
      { name: '配载备注', desc: '配载备注（字符串）' },
      // 清关信息
      { name: '税号/TAX ID', desc: '税号/TAX ID（字符串）' },
      { name: 'EORI', desc: 'EORI（字符串）' },
      { name: 'BOND有效期', desc: 'BOND有效期（字符串）' },
      { name: '进口商公司名称', desc: '进口商公司名称（字符串）' },
      { name: '进口商城市', desc: '进口商城市（字符串）' },
      { name: '进口商地址', desc: '进口商地址（字符串）' },
      { name: '进口商邮编', desc: '进口商邮编（字符串）' },
      // 发件人信息
      { name: '发件人公司名称', desc: '发件人公司名称（字符串）' },
      { name: '发件人姓名', desc: '发件人姓名（字符串）' },
      { name: '发件人国家', desc: '发件人国家（字符串）' },
      { name: '发件人州/省', desc: '发件人州/省（字符串）' },
      { name: '发件人城市', desc: '发件人城市（字符串）' },
      { name: '发件人详细地址', desc: '发件人详细地址含门牌号（字符串）' },
      { name: '发件人邮编', desc: '发件人邮编（字符串）' },
      { name: '发件人电话/手机', desc: '发件人电话/手机（字符串）' },
      { name: '发件人邮箱', desc: '发件人邮箱（字符串）' },
      // 收件人信息
      { name: '地址类型', desc: '地址类型（字符串）' },
      { name: '仓库代码', desc: '仓库代码（字符串）' },
      { name: '收件人姓名', desc: '收件人姓名（字符串）' },
      { name: '省/州', desc: '省/州（字符串）' },
      { name: '城市', desc: '城市（字符串）' },
      { name: '地址1', desc: '地址1（字符串）' },
      { name: '地址2', desc: '地址2（字符串）' },
      { name: '邮编', desc: '邮编（字符串）' },
      { name: '电话', desc: '电话（字符串）' },
      { name: '公司名称', desc: '公司名称（字符串）' },
      { name: '邮箱', desc: '邮箱（字符串）' },
      { name: '预约链接', desc: '预约链接（字符串）' },
      { name: '预约码', desc: '预约码（字符串）' },
      // 交货信息
      { name: '交货方式', desc: '交货方式（字符串）' },
      { name: '交货仓库', desc: '交货仓库（字符串）' },
      { name: '入仓时间', desc: '入仓时间（字符串）' },
    ]
  }
];

// ============ 模拟数据 ============

const MOCK_SUB_ORDERS = [
  {
    key: 1, seq: 1, boxNo: 'FBA12234393A...',
    subOrderNo: 'YT2612409300...',
    trackNo: 'YT261240930030117ZU001',
    volume: '长75cm,宽60c...', weight: '6',
    status: '', refId: '', deliveryTime: '',
  },
];

const MOCK_EXTRA_SERVICES = [
  { key: 1, seq: 1, serviceCode: 'G0', serviceValue: '', remark: '' },
];

// ============ 组件实现 ============

// 可编辑单元格渲染器
const EditableCell = (text: string) => (
  <Input
    size="small"
    defaultValue={text}
    className="edit-inline-input"
    onClick={(e) => e.stopPropagation()}
  />
);

// 商品明细列（onPreview 用于图片预览）
const createProductColumns = (onPreview: (url: string) => void) => [
  { title: '序号', dataIndex: 'seq', key: 'seq', width: 50 },
  { title: '中文品名', dataIndex: 'cnName', key: 'cnName', width: 120, render: (text: string) => EditableCell(text) },
  { title: '英文品名', dataIndex: 'enName', key: 'enName', width: 140, render: (text: string) => EditableCell(text) },
  { title: '数量', dataIndex: 'qty', key: 'qty', width: 70, render: (text: string) => EditableCell(text) },
  { title: '数量单位', dataIndex: 'unit', key: 'unit', width: 80, render: (text: string) => EditableCell(text) },
  { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 70, render: (text: string) => EditableCell(text) },
  { title: '毛重', dataIndex: 'grossWeight', key: 'grossWeight', width: 70, render: (text: string) => EditableCell(text) },
  { title: '净重', dataIndex: 'netWeight', key: 'netWeight', width: 70, render: (text: string) => EditableCell(text) },
  { title: '总价', dataIndex: 'totalPrice', key: 'totalPrice', width: 70 },
  { title: '总重', dataIndex: 'totalWeight', key: 'totalWeight', width: 70 },
  { title: '品牌', dataIndex: 'brand', key: 'brand', width: 80, render: (text: string) => EditableCell(text) },
  { title: '型号', dataIndex: 'model', key: 'model', width: 150, render: (text: string) => EditableCell(text) },
  { title: '用途', dataIndex: 'purpose', key: 'purpose', width: 80, render: (text: string) => EditableCell(text) },
  { title: '材质', dataIndex: 'material', key: 'material', width: 70, render: (text: string) => EditableCell(text) },
  { title: '海关编码', dataIndex: 'customsCode', key: 'customsCode', width: 120, render: (text: string) => EditableCell(text) },
  { title: '商品图片', dataIndex: 'productImage', key: 'productImage', width: 60, render: (text: string) => text ? <a onClick={(e) => { e.stopPropagation(); onPreview(text); }} style={{ color: '#1D4CD2', cursor: 'pointer' }}>查看</a> : '-' },
  { title: '销售链接', dataIndex: 'salesLink', key: 'salesLink', width: 120, render: (text: string) => EditableCell(text) },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 100, render: (text: string) => EditableCell(text) },
];

const SUB_ORDER_COLUMNS = [
  { title: '序号', dataIndex: 'seq', key: 'seq', width: 50 },
  { title: '箱号', dataIndex: 'boxNo', key: 'boxNo', width: 120 },
  { title: '子单号', dataIndex: 'subOrderNo', key: 'subOrderNo', width: 140 },
  { title: '子单跟踪号', dataIndex: 'trackNo', key: 'trackNo', width: 200 },
  { title: '体积', dataIndex: 'volume', key: 'volume', width: 120 },
  { title: '重量(kg)', dataIndex: 'weight', key: 'weight', width: 80 },
  { title: '子单状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: 'Reference ID', dataIndex: 'refId', key: 'refId', width: 120 },
  { title: '送达时段', dataIndex: 'deliveryTime', key: 'deliveryTime', width: 100 },
];

const EXTRA_SERVICE_COLUMNS = [
  { title: '序号', dataIndex: 'seq', key: 'seq', width: 50 },
  { title: '附加服务', dataIndex: 'serviceCode', key: 'serviceCode', width: 200 },
  { title: '附加服务值', dataIndex: 'serviceValue', key: 'serviceValue', width: 200 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 200 },
  {
    title: '操作', key: 'action', width: 80, align: 'center' as const,
    render: () => <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>,
  },
];

const Component = forwardRef(function EditModal(
  innerProps: AxureProps,
  ref: React.ForwardedRef<AxureHandle>,
) {
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(true);
  const [修改原因, set修改原因] = useState('');
  const [editingProductKey, setEditingProductKey] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const configSource = innerProps && innerProps.config ? innerProps.config : {};
  const onEventHandler = typeof innerProps.onEvent === 'function'
    ? innerProps.onEvent
    : function () { return undefined; };

  const title = typeof configSource.title === 'string' && configSource.title
    ? configSource.title
    : '修改';

  const emitEvent = useCallback(function (eventName: string, payload?: string) {
    try {
      onEventHandler(eventName, payload);
    } catch (error) {
      console.warn('事件触发失败:', error);
    }
  }, [onEventHandler]);

  const handleOk = useCallback(function () {
    form.validateFields().then((values) => {
      emitEvent('onConfirm', JSON.stringify({ ...values, 修改原因 }));
      setModalOpen(false);
    }).catch(() => {});
  }, [form, emitEvent, 修改原因]);

  const handleCancel = useCallback(function () {
    emitEvent('onCancel', JSON.stringify({}));
    setModalOpen(false);
  }, [emitEvent]);

  const fireActionHandler = useCallback(function (name: string, _params?: string) {
    switch (name) {
      case 'openModal':
        setModalOpen(true);
        break;
      case 'closeModal':
        setModalOpen(false);
        break;
      default:
        console.warn('未知的动作:', name);
    }
  }, []);

  useImperativeHandle(ref, function () {
    return {
      getVar: function (name: string) {
        const vars: Record<string, any> = {
          modal_open: modalOpen,
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
  }, [modalOpen, fireActionHandler]);

  return (
    <div className="edit-modal-page">
      <div className="page-header">
        <Breadcrumb items={[
          { title: '首页' },
          { title: '财务管理' },
          { title: 'B2B详情编辑' },
        ]} />
      </div>

      <div className="page-body">
        {!modalOpen && (
          <div className="edit-reopen-area">
            <Button type="primary" size="large" onClick={() => setModalOpen(true)}>
              打开编辑弹框
            </Button>
          </div>
        )}
        <Modal
          title={<div className="edit-modal-title"><span className="edit-modal-title-bar" />{title}</div>}
          open={modalOpen}
          onCancel={handleCancel}
          width={1200}
          className="b2b-detail-edit-modal"
          footer={
            <div className="edit-modal-footer">
              <Button onClick={handleCancel}>取 消</Button>
              <Button type="primary" onClick={handleOk}>保 存</Button>
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
                {info.required ? <span className="form-required-star">*</span> : null}
                {label}
              </span>
            )}
          >
            {/* 基本信息 */}
            <div className="edit-section">
              <div className="edit-section-header">
                <span className="edit-section-title">基本信息</span>
              </div>
              <div className="edit-section-content">
                <div className="edit-form-grid-4col">
                  <Form.Item name="销售产品" label="销售产品">
                    <span className="edit-readonly-field">英国海派（普货）-PVA</span>
                  </Form.Item>
                  <Form.Item name="目的国家" label="目的国家">
                    <span className="edit-readonly-field">英国</span>
                  </Form.Item>
                  <Form.Item name="清关方案" label="清关方案">
                    <span className="edit-readonly-field">PVA</span>
                  </Form.Item>
                </div>
                <div className="edit-remark-row">
                  <Form.Item name="客户备注" label="客户备注" style={{ flex: 1 }}>
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="配载备注" label="配载备注" style={{ flex: 1 }}>
                    <Input placeholder="请输入" />
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* 清关信息 */}
            <div className="edit-section">
              <div className="edit-section-header">
                <span className="edit-section-title">清关信息</span>
              </div>
              <div className="edit-section-content">
                <div className="edit-form-grid-4col">
                  <Form.Item name="税号/TAX ID" label="税号/TAX ID">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="EORI" label="EORI">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="BOND有效期" label="BOND有效期">
                    <DatePicker placeholder="请选择日期" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="进口商公司名称" label="进口商公司名称">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="进口商城市" label="进口商城市">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="进口商地址" label="进口商地址">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="进口商邮编" label="进口商邮编">
                    <Input placeholder="请输入" />
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* 发件人信息 */}
            <div className="edit-section">
              <div className="edit-section-header">
                <span className="edit-section-title">发件人信息</span>
              </div>
              <div className="edit-section-content">
                <div className="edit-form-grid-4col">
                  <Form.Item name="发件人公司名称" label="公司名称">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="发件人姓名" label="姓名">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="发件人国家" label="国家">
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
                        { value: '韩国', label: '韩国 KR' },
                        { value: '澳大利亚', label: '澳大利亚 AU' },
                        { value: '加拿大', label: '加拿大 CA' },
                        { value: '意大利', label: '意大利 IT' },
                        { value: '西班牙', label: '西班牙 ES' },
                        { value: '荷兰', label: '荷兰 NL' },
                        { value: '新加坡', label: '新加坡 SG' },
                        { value: '马来西亚', label: '马来西亚 MY' },
                        { value: '泰国', label: '泰国 TH' },
                        { value: '越南', label: '越南 VN' },
                        { value: '印度', label: '印度 IN' },
                        { value: '阿联酋', label: '阿联酋 AE' },
                        { value: '沙特阿拉伯', label: '沙特阿拉伯 SA' },
                        { value: '巴西', label: '巴西 BR' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="发件人州/省" label="州/省">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="发件人城市" label="城市">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="发件人详细地址" label="详细地址(含门牌号)">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="发件人邮编" label="邮编">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="发件人电话/手机" label="电话/手机">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="发件人邮箱" label="邮箱">
                    <Input placeholder="请输入" />
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* 收件人信息 */}
            <div className="edit-section">
              <div className="edit-section-header">
                <span className="edit-section-title">收件人信息</span>
              </div>
              <div className="edit-section-content">
                <div className="edit-form-grid-4col">
                  <Form.Item name="地址类型" label="地址类型">
                    <span className="edit-readonly-field">亚马逊地址</span>
                  </Form.Item>
                  <Form.Item name="仓库代码" label="仓库代码">
                    <span className="edit-readonly-field">MME2</span>
                  </Form.Item>
                  <Form.Item name="收件人姓名" label="收件人姓名" rules={[{ required: true, message: '请输入收件人姓名' }]}>
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="省/州" label="省/州">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="城市" label="城市" rules={[{ required: true, message: '请输入城市' }]}>
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="地址1" label="地址1" rules={[{ required: true, message: '请输入地址1' }]}>
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="地址2" label="地址2">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="邮编" label="邮编">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="电话" label="电话">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="公司名称" label="公司名称">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="邮箱" label="邮箱">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="预约链接" label="预约链接">
                    <Input placeholder="请输入链接" />
                  </Form.Item>
                  <Form.Item name="预约码" label="预约码">
                    <Input placeholder="请输入" />
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* 申报信息 */}
            <div className="edit-section">
              <div className="edit-section-header">
                <span className="edit-section-title">申报信息</span>
              </div>
              <div className="edit-section-content">
                <div className="edit-table-wrap">
                  <Table
                    columns={SUB_ORDER_COLUMNS}
                    dataSource={MOCK_SUB_ORDERS}
                    pagination={false}
                    size="small"
                    scroll={{ x: 1100 }}
                    rowKey="key"
                    className="edit-sub-table"
                    expandable={{
                      expandedRowRender: () => (
                        <div className="expanded-product-wrap">
                          <Table
                            columns={createProductColumns(setPreviewImage)}
                            dataSource={[
                              {
                                key: 'p1',
                                seq: 1,
                                cnName: '脚垫', enName: 'floor mats',
                                qty: '1', unit: '套', unitPrice: '70',
                                unitWeight: '5', grossWeight: '5.8', netWeight: '5.2',
                                totalPrice: '70', totalWeight: '5',
                                productImage: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Crect fill=%22%23e8eaec%22 width=%2240%22 height=%2240%22/%3E%3Ctext fill=%22%23909399%22 font-size=%2212%22 x=%225%22 y=%2224%22%3E图片%3C/text%3E%3C/svg%3E',
                                brand: '无', model: 'Shuang-HeiHei-He装饰',
                                purpose: 'PVC', material: 'PVC',
                                customsCode: '3918109000', salesLink: 'shopwrta',
                                remark: '',
                              },
                            ]}
                            pagination={false}
                            size="small"
                            scroll={{ x: 1800 }}
                            rowKey="key"
                            className="edit-sub-table edit-sub-table-inner"
                          />
                        </div>
                      ),
                    }}
                  />
                </div>
                <div className="declaration-footer-grid">
                  <span className="declaration-footer-item">
                    <span className="declaration-footer-label">是否带电</span>
                    <Checkbox checked={false}>带电</Checkbox>
                  </span>
                  <span className="declaration-footer-item">
                    <span className="declaration-footer-label">是否带磁</span>
                    <Checkbox checked={false}>带磁</Checkbox>
                  </span>
                  <span className="declaration-footer-item">
                    <span className="declaration-footer-label">预报总重量(kg)</span>
                    <span className="edit-readonly-field">6</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 交货信息 */}
            <div className="edit-section">
              <div className="edit-section-header">
                <span className="edit-section-title">交货信息</span>
              </div>
              <div className="edit-section-content">
                <div className="edit-form-grid-4col">
                  <Form.Item name="交货方式" label="交货方式">
                    <span className="edit-readonly-field">客户自送</span>
                  </Form.Item>
                  <Form.Item name="交货仓库" label="交货仓库">
                    <span className="edit-readonly-field">东莞凤岗转运中心</span>
                  </Form.Item>
                  <Form.Item name="入仓时间" label="入仓时间">
                    <span className="edit-readonly-field">2026-01-13 08:01:00</span>
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* 额外服务 */}
            <div className="edit-section">
              <div className="edit-section-header">
                <span className="edit-section-title">额外服务</span>
                <span className="edit-section-extra">
                  <Button type="link" icon={<PlusOutlined />}>添加</Button>
                </span>
              </div>
              <div className="edit-section-content">
                <div className="edit-table-wrap">
                  <Table
                    columns={EXTRA_SERVICE_COLUMNS}
                    dataSource={MOCK_EXTRA_SERVICES}
                    pagination={false}
                    size="small"
                    scroll={{ x: 800 }}
                    rowKey="key"
                    className="edit-sub-table"
                  />
                </div>
              </div>
            </div>

            {/* 排柜信息 */}
            <div className="edit-section" style={{ marginTop: 16 }}>
              <div className="edit-section-header">
                <span className="edit-section-title">排柜信息</span>
              </div>
              <div className="edit-section-content">
                <div className="edit-form-grid-4col">
                  <Form.Item name="集装箱号" label="集装箱号">
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item name="车头车牌" label="车头车牌">
                    <Input placeholder="请输入" />
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* 修改原因 */}
            <Form.Item
              name="修改原因"
              label="修改原因"
              rules={[{ required: true, message: '请输入修改原因' }]}
              style={{ marginTop: 20 }}
            >
              <Input.TextArea
                placeholder="请输入"
                rows={3}
                maxLength={100}
                showCount
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 图片预览弹框 */}
        <Modal
          title="商品图片"
          open={!!previewImage}
          onCancel={() => setPreviewImage(null)}
          footer={null}
          width={520}
          className="b2b-image-preview-modal"
        >
          {previewImage && (
            <div style={{ textAlign: 'center' }}>
              <img src={previewImage} alt="商品图片" style={{ maxWidth: '100%', maxHeight: 480, objectFit: 'contain' }} />
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
});

export default Component;
