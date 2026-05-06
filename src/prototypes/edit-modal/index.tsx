/**
 * @name B2B编辑弹框
 * @mode axure
 *
 * B2B订单管理 - 编辑弹框页面，展示修改表单弹框
 *
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 */

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import './style.css';
import {
  Modal, Form, Input, Select, Button, Upload, Breadcrumb,
} from 'antd';
import {
  UploadOutlined,
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
  { name: 'onConfirm', desc: '点击确定按钮时触发', payload: 'JSON string' },
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
      { name: 'taxId', desc: '税号/TAXID（字符串）' },
      { name: 'eoriTaxId', desc: 'EORI税号（字符串）' },
      { name: 'taxCountry', desc: '税号/TAXID所属国家（字符串）' },
      { name: 'customerCode', desc: '客户代码（字符串）' },
      { name: 'importerName', desc: '进口商名称（字符串）' },
      { name: 'importerPostalCode', desc: '进口商邮编（字符串）' },
      { name: 'importerCity', desc: '进口商城市（字符串）' },
      { name: 'importerAddress', desc: '进口商地址（字符串）' },
      { name: 'legalNameEn', desc: '进口商法人名称英文（字符串）' },
      { name: 'legalPosition', desc: '法人职务（字符串），默认 Director' },
      { name: 'legalPhone', desc: '进口商法人电话（数字字符串）' },
      { name: 'legalEmail', desc: '法人邮箱（字符串）' },
      { name: 'signCityEn', desc: '签署时所在城市英文（字符串）' },
      { name: 'creditCode', desc: '统一社会信用代码/公司登记号（字符串）' },
      { name: 'companyNameCn', desc: '中文公司名离岸vat（字符串）' },
    ]
  }
];

// ============ 组件实现 ============

const Component = forwardRef(function EditModal(
  innerProps: AxureProps,
  ref: React.ForwardedRef<AxureHandle>,
) {
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(true);

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
      emitEvent('onConfirm', JSON.stringify(values));
      setModalOpen(false);
    }).catch(() => {
      // 表单校验未通过，不做关闭
    });
  }, [form, emitEvent]);

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
          { title: '销售产品管理' },
          { title: 'B2B编辑弹框' },
        ]} />
      </div>

      <div className="page-body">
        <Modal
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 600, color: '#333', justifyContent: 'flex-start', width: '100%' }}><span style={{ width: 3, height: 16, backgroundColor: '#1D4CD2', borderRadius: 2, flexShrink: 0 }} />{title}</div>}
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
            {/* 基础信息 - 2列3行 */}
            <div className="form-section-title">基础信息</div>
            <div className="form-grid">
              <Form.Item
                name="taxId"
                label="税号/TAXID"
                rules={[{ required: true, message: '请输入税号' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="eoriTaxId"
                label="EORI税号"
                rules={[{ required: true, message: '请输入EORI税号' }]}
              >
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
                    { value: '韩国', label: '韩国 KR' },
                    { value: '澳大利亚', label: '澳大利亚 AU' },
                    { value: '加拿大', label: '加拿大 CA' },
                    { value: '意大利', label: '意大利 IT' },
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
              <Form.Item
                name="importerName"
                label="进口商名称"
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="importerPostalCode"
                label="进口商邮编"
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="importerCity"
                label="进口商城市"
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="importerAddress"
                label="进口商地址"
              >
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
              <Form.Item
                name="legalNameEn"
                label="进口商法人名称"
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="legalPosition"
                label="法人职务"
                initialValue="Director"
              >
                <Select placeholder="请选择" options={[
                  { value: 'Director', label: 'Director' },
                  { value: 'CEO', label: 'CEO' },
                ]} />
              </Form.Item>
              <Form.Item
                name="legalPhone"
                label="进口商法人电话"
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="legalEmail"
                label="法人邮箱"
                rules={[
                  { type: 'email', message: '请输入正确的邮箱格式' },
                ]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="signCityEn"
                label="签署时所在城市"
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="creditCode"
                label="信用代码/所在国登记号"
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="companyNameCn"
                label="中文公司名"
              >
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
