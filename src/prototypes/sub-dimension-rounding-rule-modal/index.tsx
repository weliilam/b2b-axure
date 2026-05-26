/**
 * @name 材积进位规则弹框
 * @mode axure
 *
 * 材积进位规则管理弹框，支持查询、新增、修改、失效、导入、删除操作
 *
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 */

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import './style.css';
import {
  Modal, Table, Button, Input, Select, Tag, Form, DatePicker, message, Tooltip, Upload,
} from 'antd';
import type { TableColumnsType, TableRowSelection } from 'antd';
import {
  PlusOutlined, ClockCircleOutlined, DownloadOutlined,
  UploadOutlined, SearchOutlined, CopyOutlined,
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
  { name: 'onSave', desc: '点击保存按钮时触发', payload: 'JSON string' },
  { name: 'onCancel', desc: '点击关闭按钮时触发', payload: 'JSON string' },
];

const ACTION_LIST: Action[] = [
  { name: 'openModal', desc: '打开材积进位规则弹框', params: 'string' },
  { name: 'closeModal', desc: '关闭材积进位规则弹框', params: 'string' },
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
    initialValue: '材积进位规则'
  },
];

const DATA_LIST: DataDesc[] = [
  {
    name: 'ruleList',
    desc: '进位规则列表数据',
    keys: [
      { name: 'key', desc: '唯一标识（数字）' },
      { name: 'seq', desc: '序号（数字）' },
      { name: 'status', desc: '状态，生效/失效（字符串）' },
      { name: 'country', desc: '国家（字符串），多个国家用逗号分隔，如"英国,德国"。下拉选项展示国家名+二字码（如"英国 GB"）' },
      { name: 'dimensionRule', desc: '长宽高进位规则（字符串），如"向上进位"、"保留整数"等' },
      { name: 'dimensionValue', desc: '长宽高进位值（字符串）' },
      { name: 'weightRule', desc: '实重进位规则（字符串），如"向上进位"、"不进位"等' },
      { name: 'weightValue', desc: '实重进位值（字符串）' },
      { name: 'effectTime', desc: '生效时间（字符串）' },
      { name: 'expireTime', desc: '失效时间（字符串）' },
    ]
  }
];

// ============ 模拟数据 ============

interface RuleRecord {
  key: number;
  seq: number;
  status: string;
  country: string;
  dimensionRule: string;
  dimensionValue: string;
  weightRule: string;
  weightValue: string;
  effectTime: string;
  expireTime: string;
}

// ============ localStorage 持久化 ============
const STORAGE_KEY = 'rounding_rule_data';

function loadData(): RuleRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) { /* ignore */ }
  return [];
}

function saveData(data: RuleRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) { /* ignore */ }
}

const RULE_RULE_OPTIONS = ['向上进位', '保留整数', '不进位'];

// 根据生效时间区间计算状态
function getStatus(effectTime: string, expireTime: string): string {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  return (now >= effectTime && now <= expireTime) ? '生效' : '失效';
}

let nextKey = 100;

const MOCK_RULE_DATA: RuleRecord[] = [
  { key: 1, seq: 1, status: '生效', country: '加拿大,日本', dimensionRule: '向上进位', dimensionValue: '1', weightRule: '不进位', weightValue: '/', effectTime: '2026-05-01 09:00:00', expireTime: '2100-01-01 23:59:59' },
  { key: 2, seq: 2, status: '生效', country: '澳大利亚', dimensionRule: '向上进位', dimensionValue: '1', weightRule: '保留整数', weightValue: '0.5', effectTime: '2026-04-10 09:00:00', expireTime: '2100-01-01 23:59:59' },
  { key: 3, seq: 3, status: '生效', country: '法国,西班牙', dimensionRule: '保留整数', dimensionValue: '0.5', weightRule: '向上进位', weightValue: '1', effectTime: '2026-04-05 09:00:00', expireTime: '2026-06-30 23:59:59' },
  { key: 4, seq: 4, status: '生效', country: '美国,英国', dimensionRule: '向上进位', dimensionValue: '1', weightRule: '向上进位', weightValue: '0.5', effectTime: '2026-04-01 09:00:00', expireTime: '2100-01-01 23:59:59' },
  { key: 5, seq: 5, status: '生效', country: '德国', dimensionRule: '向上进位', dimensionValue: '1', weightRule: '不进位', weightValue: '/', effectTime: '2026-03-15 09:00:00', expireTime: '2100-01-01 23:59:59' },
  { key: 6, seq: 6, status: '生效', country: '英国', dimensionRule: '向上进位', dimensionValue: '1', weightRule: '向上进位', weightValue: '0.5', effectTime: '2026-03-01 09:00:00', expireTime: '2100-01-01 23:59:59' },
  { key: 7, seq: 7, status: '生效', country: '德国', dimensionRule: '向上进位', dimensionValue: '1', weightRule: '不进位', weightValue: '/', effectTime: '2026-03-01 09:00:00', expireTime: '2100-01-01 23:59:59' },
  { key: 8, seq: 8, status: '生效', country: '法国', dimensionRule: '保留整数', dimensionValue: '0.5', weightRule: '向上进位', weightValue: '1', effectTime: '2025-06-01 09:00:00', expireTime: '2026-02-28 23:59:59' },
  { key: 9, seq: 9, status: '生效', country: '意大利', dimensionRule: '向上进位', dimensionValue: '0.5', weightRule: '不进位', weightValue: '/', effectTime: '2026-05-10 09:00:00', expireTime: '2100-01-01 23:59:59' },
  { key: 10, seq: 10, status: '生效', country: '韩国', dimensionRule: '向上进位', dimensionValue: '1', weightRule: '向上进位', weightValue: '0.2', effectTime: '2026-05-15 09:00:00', expireTime: '2100-01-01 23:59:59' },
  { key: 11, seq: 11, status: '生效', country: '西班牙', dimensionRule: '保留整数', dimensionValue: '0.5', weightRule: '不进位', weightValue: '/', effectTime: '2026-05-20 09:00:00', expireTime: '2100-01-01 23:59:59' },
  { key: 12, seq: 12, status: '生效', country: '日本', dimensionRule: '向上进位', dimensionValue: '1', weightRule: '向上进位', weightValue: '0.5', effectTime: '2026-06-01 09:00:00', expireTime: '2100-01-01 23:59:59' },
  { key: 13, seq: 13, status: '生效', country: '美国', dimensionRule: '向上进位', dimensionValue: '1', weightRule: '保留整数', weightValue: '1', effectTime: '2025-01-01 09:00:00', expireTime: '2025-12-31 23:59:59' },
  { key: 14, seq: 14, status: '生效', country: '加拿大,美国', dimensionRule: '向上进位', dimensionValue: '0.2', weightRule: '向上进位', weightValue: '0.5', effectTime: '2026-06-10 09:00:00', expireTime: '2100-01-01 23:59:59' },
  { key: 15, seq: 15, status: '生效', country: '澳大利亚,新西兰', dimensionRule: '向上进位', dimensionValue: '1', weightRule: '不进位', weightValue: '/', effectTime: '2026-06-15 09:00:00', expireTime: '2100-01-01 23:59:59' },
];

// ============ 常量 ============

const COUNTRY_OPTIONS = [
  { value: '英国', label: '英国 [GB]' },
  { value: '德国', label: '德国 [DE]' },
  { value: '法国', label: '法国 [FR]' },
  { value: '美国', label: '美国 [US]' },
  { value: '澳大利亚', label: '澳大利亚 [AU]' },
  { value: '日本', label: '日本 [JP]' },
  { value: '加拿大', label: '加拿大 [CA]' },
  { value: '意大利', label: '意大利 [IT]' },
  { value: '韩国', label: '韩国 [KR]' },
  { value: '西班牙', label: '西班牙 [ES]' },
  { value: '新西兰', label: '新西兰 [NZ]' },
];

const STATUS_OPTIONS = [
  { value: '生效', label: '生效' },
  { value: '失效', label: '失效' },
];

// ============ 表格列定义 ============

const RULE_COLUMNS = (onView: (r: RuleRecord) => void, onDisable: (r: RuleRecord) => void, onCopy: (r: RuleRecord) => void): TableColumnsType<RuleRecord> => [
  { title: '序号', dataIndex: 'seq', key: 'seq', width: 56 },
  {
    title: '状态', key: 'status', width: 70,
    render: (_: unknown, record: RuleRecord) => {
      const status = getStatus(record.effectTime, record.expireTime);
      return (
        <Tag color={status === '生效' ? 'green' : 'default'} style={{ fontSize: 12, borderRadius: 2 }}>
          {status}
        </Tag>
      );
    },
  },
  {
    title: '国家', dataIndex: 'country', key: 'country', width: 160,
    render: (text: string) => {
      const countries = text ? text.split(',') : [];
      const display = countries.join('、');
      return (
        <Tooltip title={countries.join('、')}>
          <span className="rule-country-text">{display}</span>
        </Tooltip>
      );
    },
  },
  { title: '长宽高进位规则', dataIndex: 'dimensionRule', key: 'dimensionRule', width: 160 },
  { title: '长宽高进位值', dataIndex: 'dimensionValue', key: 'dimensionValue', width: 140 },
  { title: '实重进位规则', dataIndex: 'weightRule', key: 'weightRule', width: 150 },
  { title: '实重进位值', dataIndex: 'weightValue', key: 'weightValue', width: 130 },
  { title: '生效时间', dataIndex: 'effectTime', key: 'effectTime', width: 175 },
  { title: '失效时间', dataIndex: 'expireTime', key: 'expireTime', width: 175 },
  {
    title: '操作', key: 'action', width: 160, fixed: 'right',
    render: (_: unknown, record: RuleRecord) => (
      <div className="rule-action-cell">
        <Button type="link" size="small" className="action-link-btn" onClick={() => onView(record)}>查看</Button>
        <Button type="link" size="small" className="action-link-btn" onClick={() => onCopy(record)}>复制</Button>
        {getStatus(record.effectTime, record.expireTime) !== '失效' && (
          <Button type="link" size="small" className="action-link-btn action-link-disable" onClick={() => onDisable(record)}>失效</Button>
        )}
      </div>
    ),
  },
];

// ============ 新增/修改弹框组件 ============

interface RuleFormModalProps {
  open: boolean;
  editRecord: RuleRecord | null;
  readonly?: boolean;
  isCopy?: boolean;
  onCancel: () => void;
  onOk?: (values: any) => void;
}

const VALUE_OPTIONS = [1, 0.5, 0.2, 0.1].map(v => ({ value: String(v), label: String(v) }));

// 长宽高进位值：仅当规则为"向上进位"时显示
function DimensionValueField({ readonly }: { readonly?: boolean }) {
  const dimensionRule = Form.useWatch('dimensionRule');
  if (dimensionRule !== '向上进位') return null;
  return (
    <Form.Item
      name="dimensionValue"
      label="长宽高进位值"
      rules={readonly ? [] : [{ required: true, message: '请选择进位值' }]}
    >
      <Select placeholder="请选择" options={VALUE_OPTIONS} disabled={readonly} />
    </Form.Item>
  );
}

// 实重进位值：仅当规则为"向上进位"时显示
function WeightValueField({ readonly }: { readonly?: boolean }) {
  const weightRule = Form.useWatch('weightRule');
  if (weightRule !== '向上进位') return null;
  return (
    <Form.Item
      name="weightValue"
      label="实重进位值"
      rules={readonly ? [] : [{ required: true, message: '请选择进位值' }]}
    >
      <Select placeholder="请选择" options={VALUE_OPTIONS} disabled={readonly} />
    </Form.Item>
  );
}

function RuleFormModal({ open, editRecord, readonly, isCopy, onCancel, onOk }: RuleFormModalProps) {
  const [form] = Form.useForm();

  // 打开时设置初始值
  React.useEffect(() => {
    if (open) {
      if (editRecord) {
        form.setFieldsValue({
          country: editRecord.country ? editRecord.country.split(',') : [],
          dimensionRule: editRecord.dimensionRule,
          dimensionValue: editRecord.dimensionValue,
          weightRule: editRecord.weightRule,
          weightValue: editRecord.weightValue,
          dateRange: editRecord.effectTime && editRecord.expireTime
            ? [dayjs(editRecord.effectTime), dayjs(editRecord.expireTime)]
            : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editRecord, form]);

  const handleOk = useCallback(() => {
    form.validateFields().then((values) => {
      onOk(values);
    }).catch(() => {});
  }, [form, onOk]);

  const modalTitle = readonly ? '查看规则' : (isCopy ? '复制规则' : (editRecord ? '修改规则' : '新增规则'));

  return (
    <Modal
      title={<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 600, color: '#333' }}><span style={{ width: 3, height: 16, backgroundColor: '#1D4CD2', borderRadius: 2, flexShrink: 0 }} />{modalTitle}</div>}
      open={open}
      onCancel={onCancel}
      width={720}
      className="b2b-rule-form-modal"
      footer={readonly ? (
        <div className="rule-form-modal-footer">
          <Button type="primary" onClick={onCancel}>关闭</Button>
        </div>
      ) : (
        <div className="rule-form-modal-footer">
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handleOk}>确定</Button>
        </div>
      )}
    >
      <Form
        form={form}
        layout="vertical"
        size="middle"
        className="rule-form"
      >
        <div className="rule-form-grid">
          <Form.Item
            name="country"
            label="国家"
            rules={[{ required: true, message: '请选择国家' }]}
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="请选择国家（可多选）"
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={COUNTRY_OPTIONS}
              disabled={readonly}
            />
          </Form.Item>

          <Form.Item
            name="dimensionRule"
            label="长宽高进位规则"
            rules={[{ required: true, message: '请选择进位规则' }]}
          >
            <Select
              placeholder="请选择"
              options={RULE_RULE_OPTIONS.map(v => ({ value: v, label: v }))}
              disabled={readonly}
            />
          </Form.Item>

          <DimensionValueField readonly={readonly} />

          <Form.Item
            name="weightRule"
            label="实重进位规则"
            rules={[{ required: true, message: '请选择进位规则' }]}
          >
            <Select
              placeholder="请选择"
              options={RULE_RULE_OPTIONS.map(v => ({ value: v, label: v }))}
              disabled={readonly}
            />
          </Form.Item>

          <WeightValueField readonly={readonly} />
        </div>

        {/* 生效时间（时间区间） */}
        <div className="rule-form-date-range">
          <div className="rule-form-date-range-label">生效时间</div>
          <Form.Item
            name="dateRange"
            rules={[{ required: true, message: '请选择生效时间区间' }]}
          >
            <DatePicker.RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              placeholder={['开始时间', '结束时间']}
              style={{ width: '100%' }}
              disabled={readonly}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

// ============ 失效时间选择弹框 ============

interface ExpireTimeModalProps {
  open: boolean;
  isBatch?: boolean;
  onCancel: () => void;
  onOk: (time: string) => void;
}

function ExpireTimeModal({ open, isBatch, onCancel, onOk }: ExpireTimeModalProps) {
  const [time, setTime] = useState<dayjs.Dayjs | null>(dayjs());

  const handleOk = useCallback(() => {
    if (time) {
      onOk(time.format('YYYY-MM-DD HH:mm:ss'));
    }
  }, [time, onOk]);

  return (
    <Modal
      title={<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 600, color: '#333' }}><span style={{ width: 3, height: 16, backgroundColor: '#1D4CD2', borderRadius: 2, flexShrink: 0 }} />设置失效时间</div>}
      open={open}
      onCancel={onCancel}
      width={420}
      footer={(
        <div className="rule-form-modal-footer">
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handleOk}>确定</Button>
        </div>
      )}
    >
      <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#606266' }}>
          {isBatch ? '请选择这批规则的失效时间' : '请选择规则的失效时间'}
        </span>
        <DatePicker
          showTime
          value={time}
          onChange={(v) => setTime(v)}
          format="YYYY-MM-DD HH:mm:ss"
          style={{ width: '100%' }}
        />
      </div>
    </Modal>
  );
}

// ============ 主组件 ============

const Component = forwardRef(function RoundingRuleModal(
  innerProps: AxureProps,
  ref: React.ForwardedRef<AxureHandle>,
) {
  const [modalOpen, setModalOpen] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formReadonly, setFormReadonly] = useState(false);
  const [editRecord, setEditRecord] = useState<RuleRecord | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [expireModalOpen, setExpireModalOpen] = useState(false);
  const [disableMode, setDisableMode] = useState<'single' | 'batch'>('single');
  const [disableTarget, setDisableTarget] = useState<RuleRecord | null>(null);

  const configSource = innerProps && innerProps.config ? innerProps.config : {};
  const dataSource = innerProps && innerProps.data ? innerProps.data : {};
  const onEventHandler = typeof innerProps.onEvent === 'function'
    ? innerProps.onEvent
    : function () { return undefined; };

  const title = typeof configSource.title === 'string' && configSource.title
    ? configSource.title
    : '材积进位规则';

  // 默认排序：生效排前，再按生效时间降序（越近排前）
  const sortRules = useCallback(function (list: RuleRecord[]) {
    return [...list].sort((a, b) => {
      const sa = getStatus(a.effectTime, a.expireTime);
      const sb = getStatus(b.effectTime, b.expireTime);
      if (sa !== sb) return sa === '生效' ? -1 : 1;
      return b.effectTime.localeCompare(a.effectTime);
    });
  }, []);

  const [ruleData, setRuleData] = useState<RuleRecord[]>(() => {
    const saved = loadData();
    if (saved.length > 0) return sortRules(saved);
    const raw = dataSource && typeof dataSource === 'object' && Array.isArray((dataSource as any).ruleList)
      ? (dataSource as any).ruleList
      : MOCK_RULE_DATA;
    const initData = sortRules(raw);
    saveData(initData);
    return initData;
  });

  // 每次 ruleData 变更时自动持久化
  React.useEffect(() => { saveData(ruleData); }, [ruleData]);

  const emitEvent = useCallback(function (eventName: string, payload?: string) {
    try {
      onEventHandler(eventName, payload);
    } catch (error) {
      console.warn('事件触发失败:', error);
    }
  }, [onEventHandler]);

  const handleSave = useCallback(function () {
    emitEvent('onSave', JSON.stringify({ rows: selectedRowKeys }));
    setModalOpen(false);
  }, [emitEvent, selectedRowKeys]);

  const handleCancel = useCallback(function () {
    emitEvent('onCancel', JSON.stringify({}));
    setModalOpen(false);
  }, [emitEvent]);

  // 查看
  const handleViewRow = useCallback(function (record: RuleRecord) {
    setEditRecord(record);
    setFormReadonly(true);
    setFormModalOpen(true);
  }, []);

  // 新增
  const handleAdd = useCallback(function () {
    setEditRecord(null);
    setFormReadonly(false);
    setFormModalOpen(true);
  }, []);

  // 行操作：失效（弹出失效时间选择）
  const handleDisableRow = useCallback(function (record: RuleRecord) {
    setDisableMode('single');
    setDisableTarget(record);
    setExpireModalOpen(true);
  }, []);

  // 批量失效（弹出失效时间选择）
  const handleBatchDisable = useCallback(function () {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要失效的规则');
      return;
    }
    setDisableMode('batch');
    setDisableTarget(null);
    setExpireModalOpen(true);
  }, [selectedRowKeys]);

  // 确认失效（单条/批量共用）
  const handleDisableConfirm = useCallback(function (expireTime: string) {
    if (disableMode === 'single' && disableTarget) {
      setRuleData(prev => sortRules(prev.map(r =>
        r.key === disableTarget.key ? { ...r, status: '失效', expireTime } : r
      )));
      setSelectedRowKeys(prev => prev.filter(k => k !== disableTarget.key));
      message.success(`记录 "${disableTarget.country}" 已失效`);
    } else if (disableMode === 'batch') {
      setRuleData(prev => sortRules(prev.map(r =>
        selectedRowKeys.includes(r.key) && r.status === '生效'
          ? { ...r, status: '失效', expireTime }
          : r
      )));
      message.success(`已批量失效 ${selectedRowKeys.length} 条规则`);
      setSelectedRowKeys([]);
    }
    setExpireModalOpen(false);
    setDisableTarget(null);
  }, [disableMode, disableTarget, selectedRowKeys, sortRules]);

  // 复制（预填数据，清空生效时间，保存时作为新增处理）
  const handleCopyRow = useCallback(function (record: RuleRecord) {
    setEditRecord({ ...record, effectTime: '', expireTime: '' });
    setIsNewRecord(true);
    setFormReadonly(false);
    setFormModalOpen(true);
  }, []);

  // 批量失效（已迁移到 expire modal，保留占位）

  // 表单弹框确定（新增/复制）
  const handleFormOk = useCallback(function (values: any) {
    const countries: string[] = values.country || [];
    const countryStr = countries.join(',');
    const [effectTime, expireTime] = values.dateRange
      ? [values.dateRange[0].format('YYYY-MM-DD HH:mm:ss'), values.dateRange[1].format('YYYY-MM-DD HH:mm:ss')]
      : ['', ''];
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // 校验1：生效时间不能大于当前时间
    if (effectTime > now) {
      message.warning('生效时间不能大于当前时间，请检查！');
      return;
    }

    // 校验2：相同国家 + 时间区间重叠
    const conflictCountries: string[] = [];
    for (const country of countries) {
      const hasConflict = ruleData.some(r =>
        r.country.split(',').includes(country) &&
        effectTime < r.expireTime &&
        expireTime > r.effectTime
      );
      if (hasConflict) conflictCountries.push(country);
    }
    if (conflictCountries.length > 0) {
      message.warning(`${conflictCountries.join('、')} 在该时间段内存在相同的数据，请检查！`);
      return;
    }

    setRuleData(prev => sortRules([...prev, {
      key: nextKey++,
      seq: prev.length + 1,
      status: '生效',
      country: countryStr,
      dimensionRule: values.dimensionRule,
      dimensionValue: values.dimensionValue || '/',
      weightRule: values.weightRule,
      weightValue: values.weightValue || '/',
      effectTime,
      expireTime,
    }]));
    message.success(isNewRecord ? `复制成功：${countryStr}` : `新增成功：${countryStr}`);
    setFormModalOpen(false);
    setEditRecord(null);
    setFormReadonly(false);
    setIsNewRecord(false);
  }, [isNewRecord, ruleData, sortRules]);

  // 表单弹框取消/关闭
  const handleFormCancel = useCallback(function () {
    setFormModalOpen(false);
    setEditRecord(null);
    setFormReadonly(false);
    setIsNewRecord(false);
  }, []);

  // 失效时间弹框取消
  const handleExpireCancel = useCallback(function () {
    setExpireModalOpen(false);
    setDisableTarget(null);
  }, []);

  // 批量失效（旧逻辑替换）

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

  const rowSelection: TableRowSelection<RuleRecord> = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div className="rounding-rule-page">
      <Modal
        open={modalOpen}
        onCancel={handleCancel}
        width={1200}
        className="b2b-rounding-rule-modal"
        footer={null}
      >
        {/* 搜索区 */}
        <div className="query-bar">
          <div className="filter-row">
            <div className="filter-group">
              <span className="fl-label">国家</span>
              <Input
                placeholder="搜索国家"
                prefix={<SearchOutlined style={{ color: '#999' }} />}
                allowClear
              />
            </div>
            <div className="filter-group">
              <span className="fl-label">状态</span>
              <Select
                placeholder="全部"
                allowClear
                options={STATUS_OPTIONS}
              />
            </div>
            <div className="filter-group" style={{ flex: 'none', alignSelf: 'flex-end' }}>
              <Button type="primary" icon={<SearchOutlined />} className="query-primary-btn">查询</Button>
            </div>
          </div>
        </div>

        {/* 操作按钮区 */}
        <div className="rule-action-bar">
          <Button icon={<PlusOutlined />} size="small" className="rule-action-btn" onClick={handleAdd}>新增</Button>
          <Button icon={<ClockCircleOutlined />} size="small" className="rule-action-btn" onClick={handleBatchDisable}>批量失效</Button>
          <Button icon={<DownloadOutlined />} size="small" className="rule-action-btn" onClick={() => {
            const a = document.createElement('a');
            a.href = './导入模板.xlsx';
            a.download = '进位规则导入模板.xlsx';
            a.click();
          }}>模板下载</Button>
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={(file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                try {
                  const data = new Uint8Array(e.target?.result as ArrayBuffer);
                  const workbook = XLSX.read(data, { type: 'array' });
                  const sheet = workbook.Sheets[workbook.SheetNames[0]];
                  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                  const errors: string[] = [];
                  let successCount = 0;
                  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

                  for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const rowNum = i + 2; // 表头占1行
                    const country = (row['国家'] || '').trim();
                    const dimRule = (row['长宽高进位规则'] || '').trim();
                    const dimVal = (row['长宽高进位值'] || '').trim();
                    const wtRule = (row['实重进位规则'] || '').trim();
                    const wtVal = (row['实重进位值'] || '').trim();
                    const effTime = (row['生效时间'] || '').trim();
                    const expTime = (row['失效时间'] || '').trim();
                    const lineErr: string[] = [];

                    // 1. 必填字段
                    if (!country) lineErr.push('国家不能为空');
                    if (!dimRule) lineErr.push('长宽高进位规则不能为空');
                    if (!wtRule) lineErr.push('实重进位规则不能为空');
                    if (!effTime) lineErr.push('生效时间不能为空');
                    if (!expTime) lineErr.push('失效时间不能为空');

                    // 2. 进位规则合法性
                    const validRules = ['向上进位', '保留整数', '不进位'];
                    if (dimRule && !validRules.includes(dimRule)) lineErr.push(`长宽高进位规则"${dimRule}"无效，可选：${validRules.join('、')}`);
                    if (wtRule && !validRules.includes(wtRule)) lineErr.push(`实重进位规则"${wtRule}"无效，可选：${validRules.join('、')}`);

                    // 3. 进位值：仅向上进位时必填且校验
                    const validValues = ['1', '0.5', '0.2', '0.1'];
                    if (dimRule === '向上进位') {
                      if (!dimVal) lineErr.push('长宽高进位值（向上进位时）不能为空');
                      else if (!validValues.includes(dimVal)) lineErr.push(`长宽高进位值"${dimVal}"无效，可选：${validValues.join('、')}`);
                    }
                    if (wtRule === '向上进位') {
                      if (!wtVal) lineErr.push('实重进位值（向上进位时）不能为空');
                      else if (!validValues.includes(wtVal)) lineErr.push(`实重进位值"${wtVal}"无效，可选：${validValues.join('、')}`);
                    }

                    // 4. 时间格式校验
                    const timeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
                    if (effTime && !timeRegex.test(effTime)) lineErr.push(`生效时间"${effTime}"格式无效，应为 yyyy-MM-dd HH:mm:ss`);
                    if (expTime && !timeRegex.test(expTime)) lineErr.push(`失效时间"${expTime}"格式无效，应为 yyyy-MM-dd HH:mm:ss`);

                    // 5. 生效时间不能大于当前时间
                    if (effTime && timeRegex.test(effTime) && effTime > now) lineErr.push('生效时间不能大于当前时间');

                    // 6. 生效时间 < 失效时间
                    if (effTime && expTime && timeRegex.test(effTime) && timeRegex.test(expTime) && effTime >= expTime) lineErr.push('生效时间必须小于失效时间');

                    if (lineErr.length > 0) {
                      errors.push(`第${rowNum}行：${lineErr.join('；')}`);
                    } else {
                      successCount++;
                    }
                  }

                  if (errors.length > 0) {
                    message.error(`导入完成，成功 ${successCount} 条，失败 ${errors.length} 条\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n...还有${errors.length - 3}条错误` : ''}`, 8);
                  } else {
                    message.success(`导入验证通过！共 ${successCount} 条数据`);
                  }
                } catch (err) {
                  message.error('文件解析失败，请检查文件格式是否正确');
                }
              };
              reader.readAsArrayBuffer(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} size="small" className="rule-action-btn">导入</Button>
          </Upload>

        </div>

        {/* 数据表格 */}
        <div className="rule-table-wrap">
          <Table
            columns={RULE_COLUMNS(handleViewRow, handleDisableRow, handleCopyRow)}
            dataSource={ruleData}
            rowKey="key"
            size="small"
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total: number) => `共 ${total} 条` }}
            rowSelection={rowSelection}
            className="rule-table"
          />
        </div>

      </Modal>

      {/* 新增/修改/查看表单弹框 */}
      <RuleFormModal
        open={formModalOpen}
        editRecord={editRecord}
        readonly={formReadonly}
        isCopy={isNewRecord}
        onCancel={handleFormCancel}
        onOk={handleFormOk}
      />

      {/* 失效时间选择弹框 */}
      <ExpireTimeModal
        open={expireModalOpen}
        isBatch={disableMode === 'batch'}
        onCancel={handleExpireCancel}
        onOk={handleDisableConfirm}
      />
    </div>
  );
});

export default Component;
