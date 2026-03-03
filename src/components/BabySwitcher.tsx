import { Baby } from '../types';

interface BabySwitcherProps {
  babies: Baby[];
  activeBabyId: string;
  onSwitch: (babyId: string) => void;
  onManage: () => void;
}

export function BabySwitcher({ babies, activeBabyId, onSwitch, onManage }: BabySwitcherProps) {
  if (babies.length === 0) return null;

  return (
    <div className="baby-switcher">
      <div className="baby-pills">
        {babies.map((baby) => (
          <button
            key={baby.id}
            className={`baby-pill${baby.id === activeBabyId ? ' active' : ''}`}
            onClick={() => onSwitch(baby.id)}
          >
            <span className="baby-pill-emoji">{baby.emoji}</span>
            <span className="baby-pill-name">{baby.name}</span>
          </button>
        ))}
        <button className="baby-pill add-baby" onClick={onManage} title="הוספת תינוק">
          +
        </button>
      </div>
    </div>
  );
}
