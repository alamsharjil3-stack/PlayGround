import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3, Bell, BookOpenCheck, CalendarDays, ChevronDown, ClipboardCheck, Feather,
  FileSearch, GraduationCap, Home, Layers3, LayoutDashboard, LibraryBig, LogOut, Menu,
  MessagesSquare, Mic, Moon, Newspaper, NotebookPen, PenLine, Search, Settings, ShieldCheck,
  Sun, X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { SearchModal } from './SearchModal'
import { Avatar, IconButton } from './ui'
import { cn } from '../lib/cn'
import { daysUntil } from '../lib/date'

interface NavItem { to: string; labelKey: string; icon: React.ReactNode; end?: boolean }

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', labelKey: 'dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/mentor', labelKey: 'mentor', icon: <MessagesSquare size={18} /> },
    ],
  },
  {
    label: 'Prepare',
    items: [
      { to: '/learn', labelKey: 'learn', icon: <LibraryBig size={18} />, end: true },
      { to: '/pyq', labelKey: 'pyqs', icon: <FileSearch size={18} /> },
      { to: '/prelims', labelKey: 'prelims', icon: <ClipboardCheck size={18} />, end: true },
      { to: '/mains', labelKey: 'mains', icon: <PenLine size={18} /> },
      { to: '/essay', labelKey: 'essay', icon: <Feather size={18} /> },
      { to: '/current-affairs', labelKey: 'currentAffairs', icon: <Newspaper size={18} /> },
    ],
  },
  {
    label: 'Organise',
    items: [
      { to: '/study-plan', labelKey: 'studyPlan', icon: <CalendarDays size={18} /> },
      { to: '/notes', labelKey: 'notes', icon: <NotebookPen size={18} /> },
      { to: '/flashcards', labelKey: 'flashcards', icon: <Layers3 size={18} /> },
      { to: '/analytics', labelKey: 'analytics', icon: <BarChart3 size={18} /> },
      { to: '/interview', labelKey: 'interview', icon: <Mic size={18} /> },
    ],
  },
]

const titles: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/mentor': 'mentor',
  '/learn': 'learn',
  '/pyq': 'pyqs',
  '/prelims': 'prelims',
  '/mains': 'mains',
  '/essay': 'essay',
  '/current-affairs': 'currentAffairs',
  '/study-plan': 'studyPlan',
  '/notes': 'notes',
  '/flashcards': 'flashcards',
  '/analytics': 'analytics',
  '/interview': 'interview',
  '/settings': 'settings',
  '/admin': 'admin',
}

export function AppShell() {
  const { user, logout, isAdmin } = useAuth()
  const { t, theme, toggleTheme, lang, setLanguage } = useApp()
  const [searchOpen, setSearchOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const title = useMemo(() => {
    const base = '/' + location.pathname.split('/')[1]
    return t(titles[base] ?? 'dashboard')
  }, [location.pathname, t])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => { setDrawerOpen(false); setUserMenuOpen(false); setNotifyOpen(false) }, [location.pathname])

  const days = daysUntil(user?.profile.examDate ?? '2027-05-23')

  const sidebar = (
    <div className="sidebar__inner">
      <div className="brand">
        <span className="brand__mark"><BookOpenCheck size={21} /></span>
        <span className="brand__text">
          <strong>{t('brand')}</strong>
          <small>{t('brandTag')}</small>
        </span>
        <IconButton label="Close menu" className="sidebar__close" onClick={() => setDrawerOpen(false)}><X size={18} /></IconButton>
      </div>

      <div className="exam-chip">
        <span className="exam-chip__icon"><GraduationCap size={17} /></span>
        <div>
          <strong>CSE {user?.profile.targetYear}</strong>
          <small><span className="mono">{days}</span> {t('daysToExam')}</small>
        </div>
      </div>

      <nav className="nav" aria-label="Primary">
        {groups.map(group => (
          <div className="nav__group" key={group.label}>
            <p className="nav__label">{group.label}</p>
            {group.items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cn('nav__item', isActive && 'nav__item--active')}>
                {item.icon}
                <span>{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </div>
        ))}
        <div className="nav__group">
          <p className="nav__label">Workspace</p>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => cn('nav__item', isActive && 'nav__item--active')}>
              <ShieldCheck size={18} /><span>{t('admin')}</span>
            </NavLink>
          )}
          <NavLink to="/settings" className={({ isActive }) => cn('nav__item', isActive && 'nav__item--active')}>
            <Settings size={18} /><span>{t('settings')}</span>
          </NavLink>
        </div>
      </nav>

      <div className="sidebar__footer">
        <div className="daily-target">
          <div className="daily-target__head">
            <span>Daily target</span>
            <span className="mono">{user?.profile.dailyHours}h</span>
          </div>
          <div className="daily-target__bar"><span style={{ width: '62%' }} /></div>
          <small>Consistency beats intensity.</small>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className={cn('sidebar', drawerOpen && 'sidebar--open')}>{sidebar}</aside>
      {drawerOpen && <div className="sidebar-scrim" onClick={() => setDrawerOpen(false)} />}

      <div className="app-main">
        <header className="topbar">
          <div className="topbar__left">
            <IconButton label="Open menu" className="topbar__menu" onClick={() => setDrawerOpen(true)}><Menu size={20} /></IconButton>
            <h1 className="topbar__title">{title}</h1>
          </div>
          <div className="topbar__right">
            <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label={t('search')}>
              <Search size={17} />
              <span>{t('searchPlaceholder')}</span>
              <span className="kbd"><span>⌘</span>K</span>
            </button>
            <div className="lang-toggle" role="group" aria-label={t('language')}>
              <button className={cn(lang === 'en' && 'active')} onClick={() => setLanguage('en')} aria-pressed={lang === 'en'}>EN</button>
              <button className={cn(lang === 'hi' && 'active')} onClick={() => setLanguage('hi')} aria-pressed={lang === 'hi'}>हि</button>
            </div>
            <IconButton label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </IconButton>
            <div className="popover-wrap">
              <IconButton label={t('notifications')} onClick={() => { setNotifyOpen(v => !v); setUserMenuOpen(false) }}>
                <Bell size={18} /><span className="notif-dot" />
              </IconButton>
              {notifyOpen && (
                <div className="popover notify-popover">
                  <p className="popover__title">{t('notifications')}</p>
                  <div className="notify-item"><span className="notify-item__dot" /><div><strong>Revision queue is ready</strong><small>3 high-priority topics are due today.</small></div></div>
                  <div className="notify-item"><span className="notify-item__dot notify-item__dot--teal" /><div><strong>Weekly test slot</strong><small>Your next mini-test is scheduled this week.</small></div></div>
                  <div className="notify-item"><span className="notify-item__dot notify-item__dot--amber" /><div><strong>Mains evaluation</strong><small>Review the feedback on your last answer.</small></div></div>
                  <button className="popover__link" onClick={() => { setNotifyOpen(false); navigate('/study-plan') }}>Open today’s plan</button>
                </div>
              )}
            </div>
            <div className="popover-wrap">
              <button className="user-chip" onClick={() => { setUserMenuOpen(v => !v); setNotifyOpen(false) }} aria-expanded={userMenuOpen}>
                <Avatar name={user?.profile.name ?? 'Aspirant'} size={34} />
                <span className="user-chip__text"><strong>{user?.profile.name}</strong><small>{isAdmin ? t('adminRole') : `CSE ${user?.profile.targetYear}`}</small></span>
                <ChevronDown size={15} />
              </button>
              {userMenuOpen && (
                <div className="popover user-popover">
                  <div className="user-popover__head">
                    <Avatar name={user?.profile.name ?? 'Aspirant'} size={40} />
                    <div><strong>{user?.profile.name}</strong><small>{user?.email}</small></div>
                  </div>
                  <button onClick={() => navigate('/settings')}><Settings size={16} /> {t('settings')}</button>
                  <button onClick={() => { logout(); navigate('/login') }} className="danger-text"><LogOut size={16} /> {t('signOut')}</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="main-content">
          <Outlet />
        </main>

        <nav className="bottom-nav" aria-label="Mobile navigation">
          <NavLink to="/dashboard" className={({ isActive }) => cn('bottom-nav__item', isActive && 'active')}><Home size={20} /><span>{t('dashboard')}</span></NavLink>
          <NavLink to="/learn" className={({ isActive }) => cn('bottom-nav__item', isActive && 'active')}><LibraryBig size={20} /><span>{t('learn')}</span></NavLink>
          <NavLink to="/mentor" className={({ isActive }) => cn('bottom-nav__item bottom-nav__item--primary', isActive && 'active')}><MessagesSquare size={20} /><span>{t('mentor')}</span></NavLink>
          <NavLink to="/prelims" className={({ isActive }) => cn('bottom-nav__item', isActive && 'active')}><ClipboardCheck size={20} /><span>{t('prelims')}</span></NavLink>
          <button className="bottom-nav__item" onClick={() => setDrawerOpen(true)}><Menu size={20} /><span>More</span></button>
        </nav>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
