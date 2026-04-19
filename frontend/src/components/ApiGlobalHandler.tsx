import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { setGlobalApiHandlers, ApiError } from '../utils/apiClient';
import { useMessage } from '../hooks/useMessage';

/**
 * 这是一个逻辑组件，用于将 React 的 message 钩子与静态的 apiClient 拦截器连接起来。
 * 它可以捕获所有来自 API 的成功消息和错误，并自动弹出 Toast 提示。
 */
const ApiGlobalHandler: React.FC = () => {
  const message = useMessage();
  const { t } = useTranslation();

  useEffect(() => {
    setGlobalApiHandlers({
      onSuccess: (msg) => {
        // 如果后端返回了 message 字段，自动弹出成功提示
        if (msg) message.success(msg);
      },
      onError: (error: ApiError) => {
        // 自动弹出错误提示
        // 排除 401，因为通常有专门的登出逻辑处理
        if (error.statusCode !== 401) {
          message.error(error.message || t('common.error'));
        }
      }
    });
  }, [message, t]);

  return null; // 此组件不渲染任何 UI
};

export default ApiGlobalHandler;
