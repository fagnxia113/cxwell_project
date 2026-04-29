import { API_URL } from '../config/api'
import i18n from '../i18n'

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  params?: Record<string, any>
  timeout?: number
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 全局错误与成功处理回调
let onUnauthorized: (() => void) | null = null
let onGlobalError: ((error: ApiError) => void) | null = null
let onGlobalSuccess: ((message: string) => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export function setGlobalApiHandlers(handlers: { 
  onError?: (error: ApiError) => void, 
  onSuccess?: (message: string) => void 
}) {
  if (handlers.onError) onGlobalError = handlers.onError
  if (handlers.onSuccess) onGlobalSuccess = handlers.onSuccess
}

class ApiClient {
  private baseURL: string
  private defaultTimeout: number = 30000

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
  }

  private getAuthHeader(): Record<string, string> | undefined {
    const token = localStorage.getItem('token')
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
    return undefined
  }

  private buildURL(url: string, params?: Record<string, any>): string {
    let finalURL = url.startsWith('http') ? url : `${this.baseURL}${url}`
    
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        finalURL += `?${queryString}`
      }
    }
    
    return finalURL
  }

  private async request<T = any>(url: string, config: RequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      timeout = this.defaultTimeout
    } = config

    const fullURL = this.buildURL(url, params)
    const authHeader = this.getAuthHeader()

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
      ...authHeader
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(fullURL, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const text = await response.text()
      let bodyData: any = null
      
      if (text) {
        try {
          bodyData = JSON.parse(text)
        } catch (e) {
          // 响应不是JSON格式，保持 bodyData 为 null
        }
      }
      
      if (response.status === 401) {
        // 401错误，非登录接口调用登出回调
        if (!url.includes('/api/auth/login') && onUnauthorized) {
          onUnauthorized()
        }
        
        const message = bodyData?.error || bodyData?.message || i18n.t('api.unauthorized')
        const error = new ApiError(message, 401, 'UNAUTHORIZED')
        if (onGlobalError) onGlobalError(error)
        throw error
      }
      
      if (!response.ok) {
        const error = new ApiError(
          bodyData?.error || bodyData?.message || text || i18n.t('api.request_failed'),
          response.status,
          bodyData?.error
        )
        // 触发全局错误处理
        if (onGlobalError) onGlobalError(error)
        throw error
      }

      // 如果响应为空
      if (!text) {
        return null as any
      }

      // 兼容两种响应格式:
      // 1. 标准格式 { success: true, data: T, message: string }
      // 2. 直接数据格式 T
      if (bodyData && typeof bodyData === 'object' && 'success' in bodyData) {
        const data = bodyData as ApiResponse<T>
        
        if (!data.success) {
          const error = new ApiError(
            data.error || data.message || i18n.t('api.operation_failed'),
            response.status,
            data.error
          )
          if (onGlobalError) onGlobalError(error)
          throw error
        }

        // 触发全局成功消息处理
        if (data.message && onGlobalSuccess) {
          onGlobalSuccess(data.message)
        }

        // 返回整个响应对象，这样调用者可以访问 data, total, totalPages 等
        return data as T
      }

      return bodyData as T
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        const apiError = new ApiError(i18n.t('api.request_timeout'), 408, 'TIMEOUT')
        if (onGlobalError) onGlobalError(apiError)
        throw apiError
      }

      if (error instanceof ApiError) {
        throw error
      }

      const networkError = new ApiError(
        error.message || i18n.t('api.network_error'),
        0,
        'NETWORK_ERROR'
      )
      if (onGlobalError) onGlobalError(networkError)
      throw networkError
    }
  }

  async get<T = any>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' })
  }

  async post<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'POST', body: data })
  }

  async put<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PUT', body: data })
  }

  async patch<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PATCH', body: data })
  }

  async delete<T = any>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' })
  }

  async upload<T = any>(url: string, formData: FormData, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    const authHeader = this.getAuthHeader()
    const fullURL = this.buildURL(url, config?.params)

    const requestHeaders: Record<string, string> = {
      ...config?.headers,
      ...authHeader
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.defaultTimeout)

    try {
      const response = await fetch(fullURL, {
        method: 'POST',
        headers: requestHeaders,
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const text = await response.text()
      let bodyData: any = null
      
      if (text) {
        try {
          bodyData = JSON.parse(text)
        } catch (e) {
          // 响应不是JSON格式
        }
      }

      if (!response.ok) {
        const error = new ApiError(
          bodyData?.message || bodyData?.error || i18n.t('api.upload_failed'),
          response.status,
          bodyData?.error
        )
        if (onGlobalError) onGlobalError(error)
        throw error
      }

      // 兼容两种响应格式:
      // 1. 标准格式 { success: true, data: T, message: string }
      // 2. 直接数据格式 T
      if (bodyData && typeof bodyData === 'object' && 'success' in bodyData) {
        const data = bodyData as ApiResponse<T>
        
        if (!data.success) {
          const error = new ApiError(
            data.error || data.message || i18n.t('api.upload_failed'),
            response.status,
            data.error
          )
          if (onGlobalError) onGlobalError(error)
          throw error
        }

        if (data.message && onGlobalSuccess) {
          onGlobalSuccess(data.message)
        }

        return data.data as T
      }

      return bodyData as T
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        const apiError = new ApiError(i18n.t('api.upload_timeout'), 408, 'TIMEOUT')
        if (onGlobalError) onGlobalError(apiError)
        throw apiError
      }

      if (error instanceof ApiError) {
        throw error
      }

      const networkError = new ApiError(
        error.message || i18n.t('api.network_error'),
        0,
        'NETWORK_ERROR'
      )
      if (onGlobalError) onGlobalError(networkError)
      throw networkError
    }
  }
}

export const apiClient = new ApiClient(API_URL.BASE)
export { ApiError }
export type { ApiResponse, RequestConfig }
