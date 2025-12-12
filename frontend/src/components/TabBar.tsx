import { useTabs } from '../state/tabs';

export default function TabBar() {
  const { tabs, activeTabId, setActive, closeTab } = useTabs();
  if (!tabs.length) return null;
  return (
    <div className="flex gap-2 px-3 py-2 bg-surfaceAlt border-b border-gray-800">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`px-3 py-1 rounded-lg cursor-pointer flex items-center gap-2 ${
            activeTabId === tab.id ? 'bg-primary text-black' : 'bg-gray-800 text-gray-200'
          }`}
          onClick={() => setActive(tab.id)}
        >
          <span>{tab.title}</span>
          <button
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
