/**
 * @name B2B详情弹框
 * @mode axure
 *
 * B2B订单 - 详情弹框页面，展示订单完整信息
 *
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 */

import React, { useState, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import './style.css';
import {
  Modal, Button, Breadcrumb, Input, Table,
} from 'antd';
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
  { name: 'onConfirm', desc: '点击确认按钮时触发', payload: 'JSON string' },
  { name: 'onCancel', desc: '点击取消按钮时触发', payload: 'JSON string' },
];

const ACTION_LIST: Action[] = [
  { name: 'openModal', desc: '打开详情弹框', params: 'string' },
  { name: 'closeModal', desc: '关闭详情弹框', params: 'string' },
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
    initialValue: '详情'
  },
];

const DATA_LIST: DataDesc[] = [
  {
    name: 'detailData',
    desc: '详情数据',
    keys: [
      // 基本信息
      { name: '运单号', desc: '运单号（字符串）' },
      { name: '客户单号', desc: '客户单号（字符串）' },
      { name: '服务商单号', desc: '服务商单号（字符串）' },
      { name: 'B2B单号', desc: 'B2B单号（字符串）' },
      { name: '分拣码', desc: '分拣码（字符串）' },
      { name: '订单来源', desc: '订单来源（字符串）' },
      { name: '订单状态', desc: '订单状态（字符串）' },
      { name: '订单审核状态', desc: '订单审核状态（字符串）' },
      { name: '创建时间', desc: '创建时间（字符串）' },
      { name: '客户代码', desc: '客户代码（字符串）' },
      { name: '业务员', desc: '业务员姓名（字符串）' },
      { name: '客服员', desc: '客服员姓名（字符串）' },
      { name: '销售产品', desc: '销售产品名称（字符串）' },
      { name: '目的国家', desc: '目的国家（字符串）' },
      { name: '是否报关件', desc: '是否报关件（字符串）' },
      { name: '报关方式', desc: '报关方式（字符串）' },
      { name: '入账状态', desc: '入账状态（字符串）' },
      { name: '计费结果', desc: '计费结果（字符串）' },
      { name: '是否白名单', desc: '是否白名单（字符串）' },
      { name: '客户备注', desc: '客户备注（字符串）' },
      { name: '配载备注', desc: '配载备注（字符串）' },
      // 清关信息
      { name: '清关方案', desc: '清关方案（字符串）' },
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
      { name: '发件人详细地址', desc: '发件人详细地址含门牌号（字符串）' },
      { name: '发件人城市', desc: '发件人城市（字符串）' },
      { name: '发件人州/省', desc: '发件人州/省（字符串）' },
      { name: '发件人国家', desc: '发件人国家（字符串）' },
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
    ]
  }
];

// ============ 模拟数据 ============

const MOCK_DETAIL = {
  // 基本信息
  '运单号': 'YT2611924300300033',
  '客户单号': 'CST2611924300300033',
  '服务商单号': '20260429093937543',
  'B2B单号': '2604AA7245',
  '分拣码': '7245',
  '订单来源': '新用户中心',
  '订单状态': '待客户确认',
  '订单审核状态': '审核通过',
  '创建时间': '2026-04-29 09:31:18',
  '客户代码': 'C06901',
  '业务员': '张满玲',
  '客服员': '彭军',
  '销售产品': 'B2B测试拼柜',
  '目的国家': '美国',
  '是否报关件': '是',
  '报关方式': '0110',
  '入账状态': '待入账',
  '计费结果': '未计费',
  '是否白名单': '',
  '客户备注': '',
  '配载备注': '',
  // 清关信息
  '清关方案': 'PVA',
  '税号/TAX ID': 'GB510321164',
  'EORI': 'GB510321164000',
  'BOND有效期': '2026-12-31',
  '进口商公司名称': 'QINGDAOFUZHANSHANGMA',
  '进口商城市': '深圳',
  '进口商地址': 'room 2215 building 1 no. 477',
  '进口商邮编': '518063',
  // 发件人信息
  '发件人公司名称': '深圳云途物流有限公司',
  '发件人姓名': '张三',
  '发件人国家': '中国',
  '发件人州/省': '广东省',
  '发件人城市': '深圳',
  '发件人详细地址': '南山区科技南路18号深圳湾科技生态园12栋B座23楼',
  '发件人邮编': '518063',
  '发件人电话/手机': '138****5678',
  '发件人邮箱': 'zhangsan@yuntoupost.com',
  // 收件人信息
  '地址类型': '亚马逊地址',
  '仓库代码': 'EWR4',
  '收件人姓名': '******',
  '省/州': 'NJ',
  '城市': '******',
  '地址1': '******',
  '地址2': '******',
  '邮编': '0869******',
  '电话': '999********99',
  '公司名称': '',
  '邮箱': '',
  '预约链接': 'https://yuntoupost.com/appointment/20260522',
};

// 交货信息模拟数据
const MOCK_DELIVERY = {
  '交货方式': '云途揽收',
  '揽收地址': '******',
  '揽收时间': '2026-05-06 10:00:00 - 2026-05-06 18:00:00',
};

const EXTRA_SERVICE_COLUMNS = [
  { title: '序号', dataIndex: 'seq', key: 'seq', width: 50 },
  { title: '附加服务', dataIndex: 'service', key: 'service', width: 240 },
  { title: '附加服务值', dataIndex: 'serviceValue', key: 'serviceValue', width: 240 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 240 },
];

const EXTRA_SERVICE_DATA: { key: number; seq: number; service: string; serviceValue: string; remark: string }[] = [];



// ============ 申报信息模拟数据 ============

// 为每个子单生成商品明细
const genProducts = (subKey: number) => [
  {
    key: `${subKey}-0`,
    seq: 1,
    cnName: '脚垫',
    enName: 'floor mats',
    qty: '1',
    unit: '套',
    unitPrice: '70',
    unitWeight: '5',
    totalPrice: '70',
    totalWeight: '5',
    grossWeight: '5.8',
    netWeight: '5.2',
    productImage: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Crect fill=%22%23e8eaec%22 width=%2240%22 height=%2240%22/%3E%3Ctext fill=%22%23909399%22 font-size=%2212%22 x=%225%22 y=%2224%22%3E图片%3C/text%3E%3C/svg%3E',
    currency: 'USD',
    brand: '无',
    model: 'Shuang-HeiHei-He装饰',
    purpose: 'PVC',
    material: 'PVC',
    customsCode: '3918109000',
    salesLink: 'shopwrta',
    remark: '',
  }
];

const createProductColumns = (onPreview: (url: string) => void) => [
  { title: '序号', dataIndex: 'seq', key: 'seq', width: 50 },
  { title: '中文品名', dataIndex: 'cnName', key: 'cnName', width: 100 },
  { title: '英文品名', dataIndex: 'enName', key: 'enName', width: 120 },
  { title: '数量', dataIndex: 'qty', key: 'qty', width: 60 },
  { title: '数量单位', dataIndex: 'unit', key: 'unit', width: 80 },
  { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 60 },
  { title: '毛重', dataIndex: 'grossWeight', key: 'grossWeight', width: 60 },
  { title: '净重', dataIndex: 'netWeight', key: 'netWeight', width: 60 },
  { title: '总价', dataIndex: 'totalPrice', key: 'totalPrice', width: 60 },
  { title: '总重', dataIndex: 'totalWeight', key: 'totalWeight', width: 60 },
  { title: '品牌', dataIndex: 'brand', key: 'brand', width: 80 },
  { title: '型号', dataIndex: 'model', key: 'model', width: 150 },
  { title: '用途', dataIndex: 'purpose', key: 'purpose', width: 80 },
  { title: '材质', dataIndex: 'material', key: 'material', width: 60 },
  { title: '海关编码', dataIndex: 'customsCode', key: 'customsCode', width: 120 },
  { title: '商品图片', dataIndex: 'productImage', key: 'productImage', width: 60, render: (text: string) => text ? <a onClick={() => onPreview(text)} style={{ color: '#1D4CD2', cursor: 'pointer' }}>查看</a> : '-' },
  { title: '销售链接', dataIndex: 'salesLink', key: 'salesLink', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 80 },
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

const SUB_ORDER_DATA = [
  {
    key: 0,
    seq: 1,
    boxNo: 'FBA12234393A...',
    subOrderNo: 'YT2612409300...',
    trackNo: 'YT261240930030117ZU001',
    volume: '长75cm,宽60c...',
    weight: '6',
    status: '',
    refId: '',
    deliveryTime: '',
  }
];

// ============ 组件实现 ============

const Component = forwardRef(function DetailModal(
  innerProps: AxureProps,
  ref: React.ForwardedRef<AxureHandle>,
) {
  const [modalOpen, setModalOpen] = useState(true);
  const [customerRemark, setCustomerRemark] = useState('');
  const [loadingRemark, setLoadingRemark] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // 不控制展开状态，由 antd Table 内部管理

  const configSource = innerProps && innerProps.config ? innerProps.config : {};
  const dataSource = innerProps && innerProps.data ? innerProps.data : {};
  const onEventHandler = typeof innerProps.onEvent === 'function'
    ? innerProps.onEvent
    : function () { return undefined; };

  const title = typeof configSource.title === 'string' && configSource.title
    ? configSource.title
    : '详情';

  const detail = dataSource && typeof dataSource === 'object' && Object.keys(dataSource).length > 0
    ? dataSource
    : MOCK_DETAIL;

  useEffect(function () {
    if (detail['客户备注']) setCustomerRemark(detail['客户备注']);
    if (detail['配载备注']) setLoadingRemark(detail['配载备注']);
  }, [detail['客户备注'], detail['配载备注']]);

  const emitEvent = useCallback(function (eventName: string, payload?: string) {
    try {
      onEventHandler(eventName, payload);
    } catch (error) {
      console.warn('事件触发失败:', error);
    }
  }, [onEventHandler]);

  const handleConfirm = useCallback(function () {
    emitEvent('onConfirm', JSON.stringify({
      customerRemark,
      loadingRemark,
    }));
    setModalOpen(false);
  }, [emitEvent, customerRemark, loadingRemark]);

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

  // 渲染详情项（label + value 纵向）
  const renderDetailItem = (label: string, value: string | undefined) => (
    <div className="detail-item" key={label}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">
        {value || value === '0' ? value : '-'}
      </span>
    </div>
  );

  return (
    <div className="detail-modal-page">
      <div className="page-header">
        <Breadcrumb items={[
          { title: '首页' },
          { title: '财务管理' },
          { title: 'B2B详情' },
        ]} />
      </div>

      <div className="page-body">
        <Modal
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 600, color: '#333', justifyContent: 'flex-start', width: '100%' }}><span style={{ width: 3, height: 16, backgroundColor: '#1D4CD2', borderRadius: 2, flexShrink: 0 }} />{title}</div>}
          open={modalOpen}
          onCancel={handleCancel}
          width={800}
          className="b2b-detail-modal"
          footer={
            <div className="detail-modal-footer">
              <Button className="detail-cancel-btn" onClick={handleCancel}>取消</Button>
              <Button className="detail-confirm-btn" type="primary" onClick={handleConfirm}>确认</Button>
            </div>
          }
        >
          {/* 基本信息 */}
          <div className="detail-section-title">基本信息</div>
          <div className="detail-grid-4col">
            {renderDetailItem('运单号', detail['运单号'])}
            {renderDetailItem('客户单号', detail['客户单号'])}
            {renderDetailItem('服务商单号', detail['服务商单号'])}
            {renderDetailItem('B2B单号', detail['B2B单号'])}
            {renderDetailItem('分拣码', detail['分拣码'])}
            {renderDetailItem('订单来源', detail['订单来源'])}
            {renderDetailItem('订单状态', detail['订单状态'])}
            {renderDetailItem('订单审核状态', detail['订单审核状态'])}
            {renderDetailItem('创建时间', detail['创建时间'])}
            {renderDetailItem('客户代码', detail['客户代码'])}
            {renderDetailItem('业务员', detail['业务员'])}
            {renderDetailItem('客服员', detail['客服员'])}
            {renderDetailItem('销售产品', detail['销售产品'])}
            {renderDetailItem('目的国家', detail['目的国家'])}
            {renderDetailItem('是否报关件', detail['是否报关件'])}
            {renderDetailItem('报关方式', detail['报关方式'])}
            {renderDetailItem('入账状态', detail['入账状态'])}
            {renderDetailItem('计费结果', detail['计费结果'])}
            {renderDetailItem('是否白名单', detail['是否白名单'])}
          </div>

          {/* 备注输入框 */}
          <div className="detail-remark-row">
            <div className="detail-remark-item">
              <span className="detail-label">客户备注</span>
              <Input
                placeholder="请输入"
                value={customerRemark}
                onChange={(e) => setCustomerRemark(e.target.value)}
                className="detail-remark-input"
              />
            </div>
            <div className="detail-remark-item">
              <span className="detail-label">配载备注</span>
              <Input
                placeholder="请输入"
                value={loadingRemark}
                onChange={(e) => setLoadingRemark(e.target.value)}
                className="detail-remark-input"
              />
            </div>
          </div>

          {/* 清关信息 */}
          <div className="detail-section-title">清关信息</div>
          <div className="detail-grid-4col">
            {renderDetailItem('清关方案', detail['清关方案'] || '')}
            {renderDetailItem('税号/TAX ID', detail['税号/TAX ID'] || '')}
            {renderDetailItem('EORI', detail['EORI'] || '')}
            {renderDetailItem('BOND有效期', detail['BOND有效期'] || '')}
            {renderDetailItem('进口商公司名称', detail['进口商公司名称'] || '')}
            {renderDetailItem('进口商城市', detail['进口商城市'] || '')}
            {renderDetailItem('进口商地址', detail['进口商地址'] || '')}
            {renderDetailItem('进口商邮编', detail['进口商邮编'] || '')}
          </div>

          {/* 发件人信息 */}
          <div className="detail-section-title">发件人信息</div>
          <div className="detail-grid-4col">
            {renderDetailItem('公司名称', detail['发件人公司名称'] || '')}
            {renderDetailItem('姓名', detail['发件人姓名'] || '')}
            {renderDetailItem('国家', detail['发件人国家'] || '')}
            {renderDetailItem('州/省', detail['发件人州/省'] || '')}
            {renderDetailItem('城市', detail['发件人城市'] || '')}
            {renderDetailItem('详细地址(含门牌号)', detail['发件人详细地址'] || '')}
            {renderDetailItem('邮编', detail['发件人邮编'] || '')}
            {renderDetailItem('电话/手机', detail['发件人电话/手机'] || '')}
            {renderDetailItem('邮箱', detail['发件人邮箱'] || '')}
          </div>

          {/* 收件人信息 */}
          <div className="detail-section-title">收件人信息</div>
          <div className="detail-grid-4col">
            {renderDetailItem('地址类型', detail['地址类型'])}
            {renderDetailItem('仓库代码', detail['仓库代码'])}
            {renderDetailItem('收件人姓名', detail['收件人姓名'])}
            {renderDetailItem('省/州', detail['省/州'])}
            {renderDetailItem('城市', detail['城市'])}
            {renderDetailItem('地址1', detail['地址1'])}
            {renderDetailItem('地址2', detail['地址2'])}
            {renderDetailItem('邮编', detail['邮编'])}
            {renderDetailItem('电话', detail['电话'])}
            {renderDetailItem('公司名称', detail['公司名称'])}
            {renderDetailItem('邮箱', detail['邮箱'])}
            {renderDetailItem('预约链接', detail['预约链接'])}
            {renderDetailItem('预约码', detail['预约码'])}
          </div>

          {/* 申报信息 */}
          <div className="detail-section-title" style={{ marginTop: '4px' }}>申报信息</div>
          <div className="declaration-section">
            <div className="declaration-table-wrap">
              <Table
                columns={SUB_ORDER_COLUMNS}
                dataSource={SUB_ORDER_DATA}
                pagination={false}
                size="small"
                scroll={{ x: 1100 }}
                rowKey="key"
                className="declaration-table"
                expandable={{
                  expandedRowRender: (record) => (
                    <div className="expanded-product-wrap">
                      <Table
                        columns={createProductColumns(setPreviewImage)}
                        dataSource={genProducts(record.key as number)}
                        pagination={false}
                        size="small"
                        scroll={{ x: 1800 }}
                        rowKey="key"
                        className="declaration-table declaration-table-inner"
                      />
                    </div>
                  ),
                }}
              />
            </div>
            <div className="detail-grid-4col" style={{ marginTop: 12, marginBottom: 0 }}>
              {renderDetailItem('是否带电', detail['是否带电'] || '否')}
              {renderDetailItem('是否带磁', detail['是否带磁'] || '否')}
              {renderDetailItem('预报总重量(kg)', detail['预报总重量(kg)'] || '6')}
            </div>
          </div>

          {/* 交货信息 */}
          <div className="detail-section-title">交货信息</div>
          <div className="detail-grid-4col">
            {renderDetailItem('交货方式', detail['交货方式'] || MOCK_DELIVERY['交货方式'])}
            {renderDetailItem('揽收地址', detail['揽收地址'] || MOCK_DELIVERY['揽收地址'])}
            <div className="detail-item" style={{ gridColumn: 'span 2' }}>
              <span className="detail-label">揽收时间</span>
              <span className="detail-value">{detail['揽收时间'] || MOCK_DELIVERY['揽收时间']}</span>
            </div>
          </div>

          {/* 额外服务 */}
          <div className="detail-section-title">额外服务</div>
          <div className="declaration-table-wrap" style={{ marginBottom: 16 }}>
            <Table
              columns={EXTRA_SERVICE_COLUMNS}
              dataSource={EXTRA_SERVICE_DATA}
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
              rowKey="key"
              className="declaration-table"
            />
          </div>

          {/* 计费信息 */}
          <div className="detail-section-title" style={{ marginTop: 16 }}>计费信息</div>
          <div className="detail-grid-2col">
            {renderDetailItem('速递运费', detail['速递运费'] || '1360 RMB')}
            {renderDetailItem('非亚马逊地址费', detail['非亚马逊地址费'] || '17 RMB')}
            {renderDetailItem('特殊品名附加费', detail['特殊品名附加费'] || '17 RMB')}
            <div className="detail-item" style={{ gridColumn: '1 / -1', borderTop: '1px solid #e8e8e8', paddingTop: 8, marginTop: 4 }}>
              <span className="detail-label" style={{ fontWeight: 600 }}>合计</span>
              <span className="detail-value" style={{ fontWeight: 600 }}>{detail['合计'] || '1394 RMB'}</span>
            </div>
          </div>

          {/* 排柜信息 */}
          <div className="detail-section-title" style={{ marginTop: 16 }}>排柜信息</div>
          <div className="detail-grid-4col">
            {renderDetailItem('集装箱号', detail['集装箱号'] || '')}
            {renderDetailItem('车头车牌', detail['车头车牌'] || '')}
          </div>
        </Modal>

        {/* 图片预览弹框 */}
        <Modal
          title="商品图片"
          open={!!previewImage}
          onCancel={() => setPreviewImage(null)}
          footer={null}
          width={520}
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
