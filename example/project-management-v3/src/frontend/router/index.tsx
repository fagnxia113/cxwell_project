import { lazy } from 'react'
import { RouteObject, Navigate } from 'react-router-dom'
import { AdminRoute, ManagerRoute } from '../components/ProtectedRoute'

// 项目
const ProjectListPage = lazy(() => import('../pages/projects/ProjectListPage'))
const ProjectDetailPage = lazy(() => import('../pages/projects/ProjectDetailPage'))
const ProjectCompletionPage = lazy(() => import('../pages/projects/ProjectCompletionPage'))

// 任务
const TaskBoardPage = lazy(() => import('../pages/tasks/TaskBoardPage'))

// 设备
const EquipmentListPage = lazy(() => import('../pages/equipment/EquipmentListPage'))
const EquipmentDetailPage = lazy(() => import('../pages/equipment/EquipmentDetailPage'))
const EquipmentStatisticsPage = lazy(() => import('../pages/equipment/EquipmentStatisticsPage'))
const ScrapSaleListPage = lazy(() => import('../pages/equipment/ScrapSaleListPage'))
const TransferListPage = lazy(() => import('../pages/equipment/TransferListPage'))
const TransferDetailPage = lazy(() => import('../pages/equipment/TransferDetailPage'))
const AccessoryManagementPage = lazy(() => import('../pages/equipment/AccessoryManagementPage'))
const AccessoryDetailPage = lazy(() => import('../pages/equipment/AccessoryDetailPage'))
const EquipmentHistoryPage = lazy(() => import('../pages/equipment/EquipmentHistoryPage'))

// 人员
const PersonnelListPage = lazy(() => import('../pages/personnel/PersonnelListPage'))
const EmployeeDetailPage = lazy(() => import('../pages/personnel/EmployeeDetailPage'))
const PersonnelTransferPage = lazy(() => import('../pages/personnel/PersonnelTransferPage'))
const AttendanceBoardPage = lazy(() => import('../pages/personnel/AttendanceBoardPage'))
const EmployeeMonthlyReportPage = lazy(() => import('../pages/personnel/EmployeeMonthlyReportPage'))
const ProjectAttendanceOverview = lazy(() => import('../pages/projects/ProjectAttendanceOverview'))

// 客户与地点
const CustomerListPage = lazy(() => import('../pages/customers/CustomerListPage'))
const WarehouseListPage = lazy(() => import('../pages/warehouses/WarehouseListPage'))
const WarehouseDetailPage = lazy(() => import('../pages/warehouses/WarehouseDetailPage'))

// 审批处理
const ApprovalPendingPage = lazy(() => import('../pages/approvals/ApprovalPendingPage'))
const ApprovalMinePage = lazy(() => import('../pages/approvals/ApprovalMinePage'))
const ApprovalCompletedPage = lazy(() => import('../pages/approvals/ApprovalCompletedPage'))
const ApprovalDraftPage = lazy(() => import('../pages/approvals/ApprovalDraftPage'))
const NewProcessPage = lazy(() => import('../pages/approvals/NewProcessPage'))
const WorkflowFormPage = lazy(() => import('../pages/approvals/WorkflowFormPage'))

// 工作流管理
const WorkflowVisualizationPage = lazy(() => import('../pages/workflow/WorkflowVisualizationPage'))
const WorkflowDetailPage = lazy(() => import('../pages/workflow/WorkflowDetailPage'))
const WorkflowDesignerNewPage = lazy(() => import('../pages/workflow/WorkflowDesignerNewPage'))
const WorkflowDefinitionListPage = lazy(() => import('../pages/workflow/WorkflowDefinitionListPage'))
const ProcessInstanceDetailPage = lazy(() => import('../pages/workflow/ProcessInstanceDetailPage'))

// 其他功能
const PurchaseRequestPage = lazy(() => import('../pages/purchase/PurchaseRequestPage'))
const DailyReportDashboard = lazy(() => import('../pages/reports/DailyReportDashboard'))
const NotificationCenterPage = lazy(() => import('../pages/notifications/NotificationCenterPage'))
const AlertManagementPage = lazy(() => import('../pages/notifications/AlertManagementPage'))
const DepartmentPage = lazy(() => import('../pages/organization/DepartmentPage'))
const PositionPage = lazy(() => import('../pages/organization/PositionPage'))
const FormDesignerPage = lazy(() => import('../pages/forms/FormDesignerPage'))
const FormTemplatesPage = lazy(() => import('../pages/forms/FormTemplatesPage'))

// 系统设置与管理
const SystemSettingsPage = lazy(() => import('../pages/settings/SystemSettingsPage'))
const MetadataConfigPage = lazy(() => import('../pages/settings/MetadataConfigPage'))
const DataLinkagePage = lazy(() => import('../pages/settings/DataLinkagePage'))
const ChangePasswordPage = lazy(() => import('../pages/settings/ChangePasswordPage'))
const UserManagementPage = lazy(() => import('../pages/admin/UserManagementPage'))
const AdminDataPage = lazy(() => import('../pages/admin/AdminDataPage'))
const WorkflowMonitorPage = lazy(() => import('../pages/admin/WorkflowMonitorPage'))
const RoleManagementPage = lazy(() => import('../pages/admin/RoleManagementPage'))
const KnowledgePage = lazy(() => import('../pages/knowledge/KnowledgePage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))

export const routes: RouteObject[] = [
    { path: '/', element: <Navigate to="/dashboard" replace /> },
    { path: '/dashboard', element: <DashboardPage /> },

    {
        path: '/projects',
        children: [
            { path: '', element: <ProjectListPage /> },
            { path: 'completion', element: <ProjectCompletionPage /> },
            { path: ':id', element: <ProjectDetailPage /> },
        ]
    },
    { path: '/tasks/board', element: <TaskBoardPage /> },

    {
        path: '/equipment',
        children: [
            { path: '', element: <EquipmentListPage /> },
            { path: 'statistics', element: <EquipmentStatisticsPage /> },
            { path: 'accessories', element: <AccessoryManagementPage /> },
            { path: 'accessories/:id', element: <AccessoryDetailPage /> },
            { path: 'history', element: <EquipmentHistoryPage /> },
            { path: 'scrap-sales', element: <ScrapSaleListPage /> },
            { path: 'transfers', element: <Navigate to="/equipment/transfers/list" replace /> },
            { path: 'transfers/list', element: <TransferListPage /> },
            { path: 'transfers/:id', element: <TransferDetailPage /> },
            { path: ':id', element: <EquipmentDetailPage /> }
        ]
    },

    {
        path: '/personnel',
        children: [
            { path: '', element: <PersonnelListPage /> },
            { path: 'transfer', element: <PersonnelTransferPage /> },
            { path: 'attendance', element: <AttendanceBoardPage /> },
            { path: 'rotation-report', element: <EmployeeMonthlyReportPage /> },
            { path: 'attendance-overview', element: <ProjectAttendanceOverview /> },
            { path: ':id', element: <EmployeeDetailPage /> },
        ]
    },

    { path: '/customers', element: <CustomerListPage /> },
    {
        path: '/warehouses',
        children: [
            { path: '', element: <WarehouseListPage /> },
            { path: ':id', element: <WarehouseDetailPage /> },
        ]
    },

    {
        path: '/approvals',
        children: [
            { path: 'pending', element: <ApprovalPendingPage /> },
            { path: 'completed', element: <ApprovalCompletedPage /> },
            { path: 'mine', element: <ApprovalMinePage /> },
            { path: 'draft', element: <ApprovalDraftPage /> },
            { path: 'new', element: <NewProcessPage /> },
            { path: 'workflow/:definitionKey', element: <WorkflowFormPage /> },
        ]
    },

    {
        path: '/workflow',
        children: [
            { path: 'definitions', element: <ManagerRoute><WorkflowDefinitionListPage /></ManagerRoute> },
            { path: 'designer/new', element: <ManagerRoute><WorkflowDesignerNewPage /></ManagerRoute> },
            { path: 'designer/:id', element: <ManagerRoute><WorkflowDesignerNewPage /></ManagerRoute> },
            { path: 'visualization/:instanceId', element: <WorkflowVisualizationPage /> },
            { path: 'detail/:instanceId', element: <WorkflowDetailPage /> },
            { path: 'instance/:instanceId', element: <ProcessInstanceDetailPage /> },
        ]
    },

    { path: '/purchase/request', element: <PurchaseRequestPage /> },
    { path: '/knowledge', element: <KnowledgePage /> },
    { path: '/reports/dashboard', element: <DailyReportDashboard /> },

    {
        path: '/notifications',
        children: [
            { path: '', element: <NotificationCenterPage /> },
            { path: 'alerts', element: <AlertManagementPage /> }
        ]
    },

    {
        path: '/organization',
        children: [
            { path: 'departments', element: <DepartmentPage /> },
            { path: 'positions', element: <PositionPage /> },
        ]
    },

    {
        path: '/forms',
        children: [
            { path: 'templates', element: <FormTemplatesPage /> },
            { path: 'designer/new', element: <FormDesignerPage /> },
            { path: 'designer/:id', element: <FormDesignerPage /> },
        ]
    },

    {
        path: '/settings',
        children: [
            { path: '', element: <SystemSettingsPage /> },
            { path: 'metadata', element: <MetadataConfigPage /> },
            { path: 'linkage', element: <DataLinkagePage /> },
            { path: 'password', element: <ChangePasswordPage /> },
        ]
    },

    { path: '/admin',
        children: [
            { path: 'data', element: <AdminRoute><AdminDataPage /></AdminRoute> },
            { path: 'users', element: <AdminRoute><UserManagementPage /></AdminRoute> },
            { path: 'roles', element: <AdminRoute><RoleManagementPage /></AdminRoute> },
            { path: 'workflow-monitor', element: <AdminRoute><WorkflowMonitorPage /></AdminRoute> },
        ]
    },

    { path: '*', element: <Navigate to="/" replace /> }
]
