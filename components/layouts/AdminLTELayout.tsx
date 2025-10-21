'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { colors } from '@/lib/theme';
import { NotificationBell } from '../NotificationBell';

interface MenuItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  children?: MenuItem[];
}

interface AdminLTELayoutProps {
  children: ReactNode;
  menuItems: MenuItem[];
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  title: string;
  logoText: string;
  logoHref: string;
}

export default function AdminLTELayout({
  children,
  menuItems,
  userName = 'User',
  userRole = 'Member',
  userAvatar,
  title,
  logoText,
  logoHref,
}: AdminLTELayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      }
    };

    // Check on initial load
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="wrapper" style={{ minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarCollapsed ? '60px' : '250px',
          backgroundColor: '#343a40',
          color: '#c2c7d0',
          transition: 'width 0.3s ease',
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 1000,
          top: 0,
          left: 0,
        }}
      >
        {/* Brand */}
        <Link
          href={logoHref}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: '#343a40',
            borderBottom: '1px solid #4b545c',
            textDecoration: 'none',
            color: colors.white,
            fontSize: '20px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '24px', marginRight: sidebarCollapsed ? 0 : '8px' }}>🔧</span>
          {!sidebarCollapsed && <span>{logoText}</span>}
        </Link>

        {/* Navigation */}
        <nav style={{ padding: '8px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            {menuItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#c2c7d0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#495057';
                        e.currentTarget.style.color = colors.white;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#c2c7d0';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '18px' }}>{item.icon}</span>
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </div>
                      {!sidebarCollapsed && (
                        <span
                          style={{
                            transform: expandedMenus.includes(item.label) ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s',
                          }}
                        >
                          ▶
                        </span>
                      )}
                    </button>
                    {!sidebarCollapsed && expandedMenus.includes(item.label) && (
                      <div style={{ backgroundColor: '#2c3338' }}>
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 16px 10px 50px',
                              color: isActive(child.href) ? colors.white : '#c2c7d0',
                              backgroundColor: isActive(child.href) ? colors.primary : 'transparent',
                              textDecoration: 'none',
                              transition: 'all 0.3s',
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive(child.href)) {
                                e.currentTarget.style.backgroundColor = '#495057';
                                e.currentTarget.style.color = colors.white;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive(child.href)) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#c2c7d0';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '4px' }}>⬤</span>
                              <span>{child.label}</span>
                            </div>
                            {child.badge && (
                              <span
                                style={{
                                  backgroundColor: child.badgeColor || colors.error,
                                  color: colors.white,
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                }}
                              >
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      color: isActive(item.href) ? colors.white : '#c2c7d0',
                      backgroundColor: isActive(item.href) ? colors.primary : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.href)) {
                        e.currentTarget.style.backgroundColor = '#495057';
                        e.currentTarget.style.color = colors.white;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.href)) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#c2c7d0';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px' }}>{item.icon}</span>
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </div>
                    {!sidebarCollapsed && item.badge && (
                      <span
                        style={{
                          backgroundColor: item.badgeColor || colors.error,
                          color: colors.white,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Logout Button at Bottom */}
          <div style={{ borderTop: '1px solid #4b545c', padding: '8px' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#c2c7d0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#495057';
                e.currentTarget.style.color = colors.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#c2c7d0';
              }}
            >
              <span style={{ fontSize: '18px' }}>🚪</span>
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div
        style={{
          marginLeft: sidebarCollapsed ? '60px' : '250px',
          width: `calc(100% - ${sidebarCollapsed ? '60px' : '250px'})`,
          transition: 'margin-left 0.3s ease, width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Header */}
        <header
          style={{
            backgroundColor: colors.white,
            borderBottom: `1px solid ${colors.border}`,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 999,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={toggleSidebar}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: colors.textPrimary,
                padding: '4px 8px',
              }}
            >
              ☰
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>{title}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NotificationBell />
          </div>
        </header>

        {/* Content Area */}
        <main style={{ flex: 1, padding: '20px', paddingBottom: '60px' }}>{children}</main>
      </div>

      {/* Footer - Outside content wrapper, at wrapper level */}
      <footer
        style={{
          backgroundColor: colors.white,
          borderTop: `1px solid ${colors.border}`,
          padding: '16px 20px',
          color: colors.textLight,
          fontSize: '14px',
          marginLeft: sidebarCollapsed ? '60px' : '250px',
          transition: 'margin-left 0.3s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Copyright © 2025</span>
            <strong style={{ color: colors.primary }}>Fixers</strong>
            <span>All rights reserved.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>
              <strong>Version</strong> 1.0.0
            </span>
            <span>|</span>
            <a
              href="/help"
              style={{
                color: colors.textLight,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = colors.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = colors.textLight)}
            >
              Help
            </a>
            <span>|</span>
            <a
              href="/support"
              style={{
                color: colors.textLight,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = colors.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = colors.textLight)}
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
