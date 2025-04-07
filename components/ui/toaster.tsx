"use client"

import { useToast } from "./use-toast"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  // 安全地移除通知
  const removeToast = (id: string) => {
    // 只使用 React 状态管理系统移除通知，避免直接操作 DOM
    dismiss(id);
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          id={`toast-${toast.id}`}
          className="bg-white rounded-lg shadow-lg p-4 min-w-[300px] transform transition-all duration-300 ease-in-out relative"
        >
          <button 
            onClick={() => removeToast(toast.id)} 
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="关闭通知"
          >
            <X size={16} />
          </button>
          {toast.title && (
            <div className="font-semibold mb-1 pr-6">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm text-gray-600">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  )
}
