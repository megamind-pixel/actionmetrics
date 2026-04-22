import React from 'react'

interface PageHeaderProps {
  title: string
  meta?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, meta, action }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-sm font-semibold">{title}</h1>
        {meta && <p className="text-xs text-gray-400 mt-0.5">{meta}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}
