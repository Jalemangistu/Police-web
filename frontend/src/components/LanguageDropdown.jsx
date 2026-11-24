import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', short: 'En' },
  { code: 'am', label: 'Amharic', native: 'አማርኛ', short: 'አም' },
  { code: 'om', label: 'Afaan Oromoo', native: 'Oromoo', short: 'Or' },
];

export default function LanguageDropdown() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentCode = (i18n.language || 'en').split('-')[0];
  const currentLang = LANGUAGES.find((l) => l.code === currentCode) || LANGUAGES[0];

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectLanguage = (code) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem('i18nextLng', code);
    } catch { /* ignore storage error */ }
    setOpen(false);
  };

  return (
    <div className="langDropdownWrap" ref={dropdownRef}>
      <button
        type="button"
        className={`langDropdownBtn ${open ? 'open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        title="Change language / ቋንቋ ይቀይሩ / Afaan jijjiiraa"
      >
        <span className="langGlobeIcon" aria-hidden="true">🌐</span>
        <span className="langCurrentText">{currentLang.native}</span>
        <span className="langCurrentShort">{currentLang.short}</span>
        <svg
          className={`langChevron ${open ? 'rotated' : ''}`}
          viewBox="0 0 20 20"
          width="14"
          height="14"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="langDropdownMenu" role="menu">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLang.code;
            return (
              <button
                key={lang.code}
                type="button"
                className={`langMenuItem ${isSelected ? 'active' : ''}`}
                onClick={() => selectLanguage(lang.code)}
                role="menuitem"
              >
                <div className="langMenuInfo">
                  <span className="langMenuNative">{lang.native}</span>
                  <span className="langMenuLabel">{lang.label}</span>
                </div>
                <div className="langMenuRight">
                  <span className="langBadge">{lang.short}</span>
                  {isSelected && <span className="langCheck">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
