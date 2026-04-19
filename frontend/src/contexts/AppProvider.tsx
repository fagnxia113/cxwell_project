import React, { ReactNode } from 'react'
import { UserProvider } from './UserContext'
import { PermissionProvider } from './PermissionContext'
import { NotificationProvider } from './NotificationContext'
import { TaskProvider } from './TaskContext'
import { MessageProvider } from './MessageContext'
import { ConfirmProvider } from './ConfirmContext'
import ApiGlobalHandler from '../components/ApiGlobalHandler'

interface AppProviderProps {
  children: ReactNode
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <UserProvider>
      <PermissionProvider>
        <NotificationProvider>
          <MessageProvider>
            <ConfirmProvider>
              <ApiGlobalHandler />
              <TaskProvider>
                {children}
              </TaskProvider>
            </ConfirmProvider>
          </MessageProvider>
        </NotificationProvider>
      </PermissionProvider>
    </UserProvider>
  )
}

