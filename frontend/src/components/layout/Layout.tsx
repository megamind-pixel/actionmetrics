import React, { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { clsn } from '../../lib/utils'

const navItems = [
  { to: '/', label: 'Overview', group: 'Main', icon: <GridIcon /> },
  { to: '/institutions', label: 'Institutions', group: 'Data', icon: <BuildingIcon /> },
  { to: '/students', label: 'Students', group: 'Data', icon: <UserIcon /> },
  { to: '/results', label: 'Results', group: 'Data', icon: <DocIcon /> },
  { to: '/individual', label: 'Individual', group: 'Insights', icon: <ProfileIcon /> },
  { to: '/analytics', label: 'Analytics', group: 'Insights', icon: <ChartIcon /> },
  { to: '/reports', label: 'Reports', group: 'Insights', icon: <ReportIcon /> },
  { to: '/settings', label: 'Settings', group: 'Admin', icon: <SettingsIcon /> },
]

export default function Layout() {
  const { admin, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  let currentGroup = ''

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-48 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen overflow-y-auto">
        {/* Brand */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-accent tracking-tight">ActionMetrics</div>
          <div className="text-xs text-gray-400 mt-0.5">Kenya Education Platform</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2">
          {navItems.map(item => {
            const showGroup = item.group !== currentGroup
            currentGroup = item.group
            return (
              <React.Fragment key={item.to}>
                {showGroup && (
                  <div className="px-3 pt-3 pb-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                    {item.group}
                  </div>
                )}
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    clsn('flex items-center gap-2 px-3 py-1.5 mx-1.5 my-0.5 rounded-lg text-xs font-medium transition-colors',
                      isActive ? 'bg-accent-light text-accent' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                  }
                >
                  <span className="w-3.5 h-3.5 flex-shrink-0 opacity-75">{item.icon}</span>
                  {item.label}
                </NavLink>
              </React.Fragment>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-bold text-accent font-mono flex-shrink-0">
              {admin?.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">{admin?.name}</div>
              <div className="text-[10px] text-gray-400">{admin?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn w-full text-xs justify-center text-red-600 border-red-200 hover:bg-red-50">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </div>
    </div>
  )
}

// ── Icon components ────────────────────────────────────────────────────────
function GridIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg> }
function BuildingIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="12" height="9" rx="1"/><path d="M5 6V4a3 3 0 016 0v2"/></svg> }
function UserIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg> }
function DocIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h10v12H3z"/><path d="M6 6h4M6 9h4M6 12h2"/></svg> }
function ProfileIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="4" r="2.5"/><path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5"/><path d="M12 7l1.5 1.5M13.5 7L12 8.5"/></svg> }
function ChartIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="2,12 5,8 8,10 11,5 14,7"/><line x1="2" y1="14" x2="14" y2="14"/></svg> }
function ReportIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2h5l3 3v9H4z"/><path d="M9 2v3h3"/><line x1="6" y1="8" x2="10" y2="8"/><line x1="6" y1="11" x2="10" y2="11"/></svg> }
function SettingsIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg> }
