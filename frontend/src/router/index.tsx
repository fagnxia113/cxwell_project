import { lazy } from 'react'
import { RouteObject, Navigate } from 'react-router-dom'
import { AdminRoute, ManagerRoute } from '../components/ProtectedRoute'

// 项目
const ProjectListPage = lazy(() => import('../pages/projects/ProjectListPage'))
const ProjectDetailPage = lazy(() => import('../pages/projects/ProjectDetailPage'))
const ProjectCompletionPage = lazy(() => import('../pages/projects/ProjectCompletionPage'))

// 任务
const TaskBoardPage = lazy(() => import('../pages/tasks/TaskBoardPage'))

// 人员
const PersonnelListPage = lazy(() => import('../pages/personnel/PersonnelListPage'))
const EmployeeDetailPage = lazy(() => import('../pages/personnel/EmployeeDetailPage'))
const AttendanceBoardPage = lazy(() => import('../pages/personnel/AttendanceBoardPage'))
const EmployeeMonthlyReportPage = lazy(() => import('../pages/personnel/EmployeeMonthlyReportPage'))
const ReportRelationPage = lazy(() => import('../pages/personnel/ReportRelationPage'))
const ProjectAttendanceOverview = lazy(() => import('../pages/projects/ProjectAttendanceOverview'))

// 客户与地点
const CustomerListPage = lazy(() => import('../pages/customers/CustomerListPage'))

// 审批处理
const ApprovalCenterPage = lazy(() => import('../pages/approvals/ApprovalCenterPage'))
const NewProcessPage = lazy(() => import('../pages/approvals/NewProcessPage'))
const WorkflowFormPage = lazy(() => import('../pages/approvals/WorkflowFormPage'))
const WorkflowDetailPage = lazy(() => import('../pages/workflow/WorkflowDetailPage'))
const ProcessInstanceDetailPage = lazy(() => import('../pages/workflow/ProcessInstanceDetailPage'))

// 工作流管理
const WorkflowVisualizationPage = lazy(() => import('../pages/workflow/WorkflowVisualizationPage'))
const WorkflowDesignerNewPage = lazy(() => import('../pages/workflow/WorkflowDesignerNewPage'))
const WorkflowDefinitionListPage = lazy(() => import('../pages/workflow/WorkflowDefinitionListPage'))

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
const ChangePasswordPage = lazy(() => import('../pages/settings/ChangePasswordPage'))
const UserManagementPage = lazy(() => import('../pages/admin/UserManagementPage'))
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
            { path: 'board', element: <TaskBoardPage /> },
            { path: ':id', element: <ProjectDetailPage /> },
        ]
    },
    {
        path: '/personnel',
        children: [
            { path: '', element: <PersonnelListPage /> },
            { path: 'attendance', element: <AttendanceBoardPage /> },
            { path: 'report-relation', element: <ReportRelationPage /> },
            { path: 'rotation-report', element: <EmployeeMonthlyReportPage /> },
            { path: 'attendance-overview', element: <ProjectAttendanceOverview /> },
            { path: ':id', element: <EmployeeDetailPage /> },
        ]
    },
    { path: '/customers', element: <CustomerListPage /> },
    {
        path: '/approvals',
        children: [
            { path: '', element: <Navigate to="center" replace /> },
            { path: 'center', element: <ApprovalCenterPage /> },
            { path: 'new', element: <NewProcessPage /> },
            { path: 'workflow/:definitionKey', element: <WorkflowFormPage /> },
            { path: 'handle/:taskId', element: <WorkflowDetailPage /> },
            { path: 'detail/:instanceId', element: <WorkflowDetailPage /> },
            { path: 'instance/:instanceId', element: <WorkflowDetailPage /> },
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
            { path: 'password', element: <ChangePasswordPage /> },
        ]
    },

    { path: '/admin',
        children: [
            { path: 'users', element: <AdminRoute><UserManagementPage /></AdminRoute> },
            { path: 'roles', element: <AdminRoute><RoleManagementPage /></AdminRoute> },
            { path: 'workflow-monitor', element: <AdminRoute><WorkflowMonitorPage /></AdminRoute> },
        ]
    },

    { path: '*', element: <Navigate to="/" replace /> }
]
