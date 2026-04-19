import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { useMessage } from './useMessage';
import { apiClient } from '../utils/apiClient';
import { API_URL } from '../config/api';

export interface ApprovalOrder {
  id: string;
  order_no: string;
  order_type: string;
  title: string;
  status: string;
  current_node: string;
  current_assignee_name?: string;
  form_data: Record<string, any>;
  audit_logs: any[];
  created_at: string;
  updated_at: string;
  initiator_name?: string;
}

export type ApprovalFilter = 'all' | 'pending' | 'approved' | 'rejected';
export type DateRange = 'all' | 'week' | 'month' | 'quarter';

export function useMyApprovals() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { success, error: showError } = useMessage();

  const [orders, setOrders] = useState<ApprovalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Selection & Details
  const [selectedOrder, setSelectedOrder] = useState<ApprovalOrder | null>(null);
  const [transferOrderDetail, setTransferOrderDetail] = useState<any>(null);

  // Filter & Search States
  const [filter, setFilter] = useState<ApprovalFilter>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 1. Data Loader
  const loadOrders = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await apiClient.get<any>(`${API_URL.BASE}/api/workflow/processes?initiatorId=${user.id}`);
      const ordersData = result?.data || result;
      
      if (ordersData && Array.isArray(ordersData)) {
        const mappedOrders = ordersData.map((item: any) => {
          let displayStatus = item.status;
          if (item.status === 'running') displayStatus = 'pending';
          else if (item.status === 'completed') displayStatus = item.result || 'approved';
          else if (item.status === 'terminated') displayStatus = 'rejected';
          
          return {
            id: item.id,
            order_no: item.id.substring(0, 8).toUpperCase(),
            order_type: item.definition_key,
            title: item.title,
            status: displayStatus,
            current_node: item.current_node_name || t('workflow.nodes.end'),
            current_assignee_name: item.current_assignee_name || '',
            form_data: item.variables?.formData || {},
            audit_logs: [],
            created_at: item.created_at,
            updated_at: item.updated_at,
            initiator_name: item.initiator_name || t('workflow.fields.current_user')
          };
        });
        setOrders(mappedOrders);
      } else {
        setOrders([]);
      }
    } catch (e: any) {
      showError(e.message || t('common.error'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, t, showError]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // 2. Load Extra Business Details (e.g. Transfer manifestation)
  useEffect(() => {
    const loadExtraDetails = async () => {
      if (!selectedOrder) {
        setTransferOrderDetail(null);
        return;
      }

      const businessId = selectedOrder.form_data?.transferOrderId || 
                        selectedOrder.form_data?.businessId || 
                        (selectedOrder as any).business_id;

      if (selectedOrder.order_type === 'equipment-transfer' && businessId) {
        try {
          const result = await apiClient.get<any>(`${API_URL.BASE}/api/equipment/transfers/${businessId}`);
          setTransferOrderDetail(result?.data || result);
        } catch (e) {
          console.warn('Failed to load business details', e);
        }
      } else {
        setTransferOrderDetail(null);
      }
    };
    loadExtraDetails();
  }, [selectedOrder]);

  // 3. Withdraw Action
  const withdrawRequest = async (id: string) => {
    try {
      setActionLoading(true);
      await apiClient.post(`${API_URL.BASE}/api/workflow/processes/${id}/withdraw`);
      success(t('workflow.action.withdrawn_success'));
      await loadOrders();
      return true;
    } catch (e: any) {
      showError(e.message || t('common.error'));
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Derived Filtering & Stats
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filter !== 'all' && order.status !== filter) return false;
      
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchesTitle = order.title.toLowerCase().includes(keyword);
        const matchesNo = order.order_no.toLowerCase().includes(keyword);
        if (!matchesTitle && !matchesNo) return false;
      }
      
      if (dateRange !== 'all') {
        const diffDays = (new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 3600 * 24);
        if (dateRange === 'week' && diffDays > 7) return false;
        if (dateRange === 'month' && diffDays > 30) return false;
        if (dateRange === 'quarter' && diffDays > 90) return false;
      }
      return true;
    });
  }, [orders, filter, searchKeyword, dateRange]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => ['pending', 'running'].includes(o.status)).length,
    approved: orders.filter(o => ['approved', 'completed'].includes(o.status)).length,
    efficiency: orders.length > 0 ? "98.5%" : "---" // Simulated KPI
  }), [orders]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return {
    orders: paginatedOrders,
    totalCount: filteredOrders.length,
    stats,
    loading,
    actionLoading,
    filter,
    searchKeyword,
    dateRange,
    currentPage,
    totalPages,
    selectedOrder,
    transferOrderDetail,
    setFilter,
    setSearchKeyword,
    setDateRange,
    setCurrentPage,
    setSelectedOrder,
    withdrawRequest,
    refresh: loadOrders
  };
}
