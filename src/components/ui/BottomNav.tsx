export type TabId = 'home' | 'calendar' | 'add' | 'insights' | 'settings';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'בית' },
  { id: 'calendar', icon: '📅', label: 'לוח שנה' },
  { id: 'add', icon: '+', label: 'הוספה' },
  { id: 'insights', icon: '📊', label: 'סיכום' },
  { id: 'settings', icon: '⚙️', label: 'הגדרות' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`bottom-nav-item${activeTab === tab.id ? ' active' : ''}${tab.id === 'add' ? ' add-btn' : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
