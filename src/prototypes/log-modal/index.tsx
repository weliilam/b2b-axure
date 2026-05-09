/**
 * @name B2B日志记录弹框
 * @mode axure
 *
 * B2B订单 - 日志记录弹框，展示订单操作日志历史记录
 *
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 */

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import './style.css';
import {
  Modal, Breadcrumb, Table,
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
  { name: 'onCancel', desc: '点击取消按钮时触发', payload: 'JSON string' },
];

const ACTION_LIST: Action[] = [
  { name: 'openModal', desc: '打开日志记录弹框', params: 'string' },
  { name: 'closeModal', desc: '关闭日志记录弹框', params: 'string' },
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
    initialValue: '日志记录'
  },
];

const DATA_LIST: DataDesc[] = [
  {
    name: 'logList',
    desc: '日志列表数据',
    keys: [
      { name: 'seq', desc: '序号（数字）' },
      { name: 'os', desc: '操作系统（字符串），可选值：CCOS、OMS、OFP、NUC' },
      { name: 'innerOperator', desc: '内部操作人（字符串），格式：工号(姓名)，如 zt27979(卓运康)；每条记录有且只有一个操作人（内部或外部，二选一），有内部操作人时外部操作人为空' },
      { name: 'outerOperator', desc: '外部操作人（字符串），客户代码，如 BN0001；每条记录有且只有一个操作人（内部或外部，二选一），有外部操作人时内部操作人为空；仅NUC系统可能有值' },
      { name: 'content', desc: '操作内容（字符串）' },
      { name: 'operationTime', desc: '操作时间（字符串），格式 yyyy-MM-dd HH:mm:ss' },
    ]
  }
];

// ============ 模拟数据 ============

interface LogRecord {
  key: number;
  seq: number;
  os: string;
  innerOperator: string;
  outerOperator: string;
  content: string;
  operationTime: string;
}

const MOCK_LOG_DATA: LogRecord[] = [
  { key: 1, seq: 1, os: 'NUC', innerOperator: 'zt27979(卓运康)', outerOperator: '', content: '整单状态同步完成', operationTime: '2026-05-07 09:00:00' },
  { key: 2, seq: 2, os: 'CCOS', innerOperator: 'zt27979(卓运康)', outerOperator: '', content: '添加客户备注: 请优先处理', operationTime: '2026-05-06 17:00:00' },
  { key: 3, seq: 3, os: 'OFP', innerOperator: 'zt27979(卓运康)', outerOperator: '', content: '导出订单报表', operationTime: '2026-05-06 11:30:00' },
  { key: 4, seq: 4, os: 'OMS', innerOperator: 'zt67123(陈丽)', outerOperator: '', content: '处理客户备注请求', operationTime: '2026-05-06 08:10:00' },
  { key: 5, seq: 5, os: 'CCOS', innerOperator: 'zt27979(卓运康)', outerOperator: '', content: '更新客户备注信息', operationTime: '2026-05-05 14:20:00' },
  { key: 6, seq: 6, os: 'OFP', innerOperator: 'zt34479(李四)', outerOperator: '', content: '订单已出库', operationTime: '2026-05-05 09:30:00' },
  { key: 7, seq: 7, os: 'OFP', innerOperator: 'zt11632(王五)', outerOperator: '', content: '排柜配载完成，集装箱号MSKU1234567', operationTime: '2026-05-04 16:00:00' },
  { key: 8, seq: 8, os: 'OMS', innerOperator: 'zt45821(赵六)', outerOperator: '', content: '修改申报价值', operationTime: '2026-05-02 15:45:30' },
  { key: 9, seq: 9, os: 'CCOS', innerOperator: 'zt27979(卓运康)', outerOperator: '', content: '订单入账完成', operationTime: '2026-05-01 11:00:00' },
  { key: 10, seq: 10, os: 'NUC', innerOperator: 'zt27979(卓运康)', outerOperator: '', content: '订单状态变更为"待客户确认"', operationTime: '2026-05-01 11:00:01' },
  { key: 11, seq: 11, os: 'OFP', innerOperator: 'zt11632(王五)', outerOperator: '', content: '修改运费为1360 RMB', operationTime: '2026-04-30 10:30:15' },
  { key: 12, seq: 12, os: 'OFP', innerOperator: 'zt11632(王五)', outerOperator: '', content: '订单审核通过', operationTime: '2026-04-30 09:00:00' },
  { key: 13, seq: 13, os: 'OMS', innerOperator: 'zt27979(卓运康)', outerOperator: '', content: '提交订单审核申请', operationTime: '2026-04-29 14:20:05' },
  { key: 14, seq: 14, os: 'NUC', innerOperator: '', outerOperator: 'BN0001', content: '打印订单标签成功', operationTime: '2026-04-29 10:15:22' },
  { key: 15, seq: 15, os: 'NUC', innerOperator: '', outerOperator: 'BN0001', content: '创建B2B订单成功，运单号YT2611924300300033', operationTime: '2026-04-29 09:31:18' },
];

// ============ 组件实现 ============

const renderCell = (text: string) => text || '-';

const LOG_COLUMNS = [
  { title: '序号', dataIndex: 'seq', key: 'seq', width: 60, render: renderCell },
  { title: '操作系统', dataIndex: 'os', key: 'os', width: 90, render: renderCell },
  { title: '内部操作人', dataIndex: 'innerOperator', key: 'innerOperator', width: 140, render: renderCell },
  { title: '外部操作人', dataIndex: 'outerOperator', key: 'outerOperator', width: 90, render: renderCell },
  { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true, render: renderCell },
  { title: '操作时间', dataIndex: 'operationTime', key: 'operationTime', width: 180, render: renderCell },
];

const Component = forwardRef(function LogModal(
  innerProps: AxureProps,
  ref: React.ForwardedRef<AxureHandle>,
) {
  const [modalOpen, setModalOpen] = useState(true);

  const configSource = innerProps && innerProps.config ? innerProps.config : {};
  const dataSource = innerProps && innerProps.data ? innerProps.data : {};
  const onEventHandler = typeof innerProps.onEvent === 'function'
    ? innerProps.onEvent
    : function () { return undefined; };

  const title = typeof configSource.title === 'string' && configSource.title
    ? configSource.title
    : '日志记录';

  const logData = dataSource && typeof dataSource === 'object' && Array.isArray((dataSource as any).logList)
    ? (dataSource as any).logList
    : MOCK_LOG_DATA;

  const emitEvent = useCallback(function (eventName: string, payload?: string) {
    try {
      onEventHandler(eventName, payload);
    } catch (error) {
      console.warn('事件触发失败:', error);
    }
  }, [onEventHandler]);

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
    <div className="log-modal-page">
      <div className="page-header">
        <Breadcrumb items={[
          { title: '首页' },
          { title: '财务管理' },
          { title: '日志记录' },
        ]} />
      </div>

      <div className="page-body">
        <Modal
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 600, color: '#333', justifyContent: 'flex-start', width: '100%' }}><span style={{ width: 3, height: 16, backgroundColor: '#1D4CD2', borderRadius: 2, flexShrink: 0 }} />{title}</div>}
          open={modalOpen}
          onCancel={handleCancel}
          width={960}
          className="b2b-log-modal"
          footer={null}
        >
          <div className="log-table-wrap">
            <Table
              columns={LOG_COLUMNS}
              dataSource={logData}
              rowKey="key"
              size="small"
              scroll={{ y: 380 }}
              pagination={false}
              className="log-table"
            />
          </div>
        </Modal>
      </div>
    </div>
  );
});

export default Component;
