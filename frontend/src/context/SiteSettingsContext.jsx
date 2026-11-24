import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const adminApi = async (path, options = {}) => {
  const r = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionStorage.adminToken}`
    },
    ...options
  });
  const d = r.status === 204 ? null : await r.json();
  if (r.status === 401) {
    sessionStorage.removeItem('adminToken');
    window.location.assign('/admin/login');
  }
  if (!r.ok) throw new Error(d?.message || 'Request failed');
  return d;
};

const SiteSettingsContext = createContext(null);

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Load site settings once on mount
  useEffect(() => {
    let active = true;
    adminApi('/settings/admin')
      .then(s => {
        if (!active) return;
        setSettings(s);
        setForm(s || {});
        setLoading(false);
      })
      .catch(e => {
        if (!active) return;
        setToast({ message: e.message, type: 'error' });
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Compute dirty state (unsaved changes)
  const isDirty = useMemo(() => {
    if (!settings) return false;
    try {
      return JSON.stringify(form) !== JSON.stringify(settings);
    } catch {
      return false;
    }
  }, [form, settings]);

  // Warn on browser unload / reload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Update field helpers
  const set = useCallback((key, val) => {
    setForm(f => ({ ...f, [key]: val }));
  }, []);

  const setSlide = useCallback((i, key, val) => {
    setForm(f => {
      const slides = [...(f.heroSlides || [])];
      slides[i] = { ...slides[i], [key]: val };
      return { ...f, heroSlides: slides };
    });
  }, []);

  const updateList = useCallback((key, i, field, value) => {
    setForm(f => {
      const items = [...(f[key] || [])];
      items[i] = { ...items[i], [field]: value };
      return { ...f, [key]: items };
    });
  }, []);

  const addListItem = useCallback((key, item) => {
    setForm(f => ({ ...f, [key]: [...(f[key] || []), item] }));
  }, []);

  const removeListItem = useCallback((key, i, label) => {
    if (!window.confirm(`Delete this ${label}? This cannot be undone until you save changes.`)) return;
    setForm(f => ({ ...f, [key]: (f[key] || []).filter((_, index) => index !== i) }));
  }, []);

  const dominantColors = useCallback((context, width, height) => {
    const counts = new Map();
    const pixels = context.getImageData(0, 0, width, height).data;
    for (let i = 0; i < pixels.length; i += 32) {
      const [r, g, b, a] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
      const brightness = (r + g + b) / 3;
      if (a < 160 || brightness > 242 || brightness < 18) continue;
      const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const colors = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([color]) => color.split(',').map(Number));
    const chosen = [];
    for (const color of colors) {
      if (chosen.every(existing => Math.hypot(color[0] - existing[0], color[1] - existing[1], color[2] - existing[2]) > 85)) {
        chosen.push(color);
      }
      if (chosen.length === 2) break;
    }
    return chosen.map(color => `#${color.map(v => v.toString(16).padStart(2, '0')).join('')}`);
  }, []);

  const uploadLogo = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setToast({ message: 'Please choose an image file for the logo.', type: 'error' });
    if (file.size > 15 * 1024 * 1024) return setToast({ message: 'Choose an image smaller than 15 MB.', type: 'error' });
    setToast({ message: 'Preparing logo preview…' });
    const source = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const maxSide = 900;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const [logoPrimary, logoSecondary] = dominantColors(context, canvas.width, canvas.height);
      URL.revokeObjectURL(source);
      canvas.toBlob(blob => {
        if (!blob) return setToast({ message: 'The selected logo could not be processed.', type: 'error' });
        const reader = new FileReader();
        reader.onload = () => {
          setForm(f => ({
            ...f,
            logo: reader.result,
            ...(logoPrimary ? { themeColor: logoPrimary, themePrimary: logoPrimary } : {}),
            ...(logoSecondary ? { themeSecondary: logoSecondary } : {})
          }));
          setToast({ message: logoPrimary ? 'Logo preview ready and brand colors applied.' : 'Logo preview ready. Choose Save all changes to save it.' });
        };
        reader.onerror = () => setToast({ message: 'The selected logo could not be read.', type: 'error' });
        reader.readAsDataURL(blob);
      }, 'image/webp', 0.86);
    };
    image.onerror = () => {
      URL.revokeObjectURL(source);
      setToast({ message: 'The selected logo could not be opened.', type: 'error' });
    };
    image.src = source;
  }, [dominantColors]);

  const uploadSlideImage = useCallback((i, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setToast({ message: 'Please choose an image file.', type: 'error' });
    const reader = new FileReader();
    reader.onload = () => setSlide(i, 'image', reader.result);
    reader.readAsDataURL(file);
  }, [setSlide]);

  const addSlide = useCallback(() => {
    addListItem('heroSlides', { tag: '', headline: '', body: '', image: '', link: '', linkText: '' });
  }, [addListItem]);

  const removeSlide = useCallback((i) => {
    removeListItem('heroSlides', i, 'slide');
  }, [removeListItem]);

  const addOrgUnit = useCallback(() => {
    addListItem('organizationChart', { id: `unit-${Date.now()}`, name: '', title: '', parentId: '' });
  }, [addListItem]);

  const uploadCommissionerPhoto = useCallback((file) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return setToast({ message: 'Choose an image smaller than 15 MB.', type: 'error' });
    setToast({ message: 'Preparing photo preview…' });

    const directRead = () => {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(f => ({ ...f, commissionerPhoto: reader.result }));
        setToast({ message: 'Photo preview loaded. Click "Save all changes" at the bottom to save.' });
      };
      reader.onerror = () => setToast({ message: 'The selected photo could not be read.', type: 'error' });
      reader.readAsDataURL(file);
    };

    try {
      const source = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        try {
          const maxSide = 800;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(source);
          canvas.toBlob(blob => {
            if (!blob) { directRead(); return; }
            const reader = new FileReader();
            reader.onload = () => {
              setForm(f => ({ ...f, commissionerPhoto: reader.result }));
              setToast({ message: 'Photo preview loaded. Click "Save all changes" at the bottom to save.' });
            };
            reader.onerror = directRead;
            reader.readAsDataURL(blob);
          }, 'image/webp', 0.88);
        } catch {
          directRead();
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(source);
        directRead();
      };
      image.src = source;
    } catch {
      directRead();
    }
  }, []);

  const deleteSection = useCallback((section) => {
    const clears = {
      branding: { siteName: '', logo: '', themeColor: '', themePrimary: '', themeSecondary: '', tagline: '', footerCopy: '', socialLinks: [] },
      emergency: { emergencyPolice: '', emergencyAmbulance: '', emergencyFire: '', emergencyContacts: [] },
      hero: { heroSlides: [] },
      about: { aboutHeroTitle: '', aboutHeroLead: '', aboutMission: '', aboutVision: '', aboutValues: '', commissionerMessage: '', commissionerPhoto: '', commissionerName: '', commissionerTitle: '', organizationChart: [], organizationalStructure: '' }
    };
    if (!window.confirm(`Clear all ${section} content? This will be permanently saved when you click Save all changes.`)) return;
    setForm(f => ({ ...f, ...(clears[section] || {}) }));
    setToast({ message: `${section[0].toUpperCase()}${section.slice(1)} content cleared. Click Save all changes to save.` });
  }, []);

  const save = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setSaving(true);
    try {
      const updated = await adminApi('/settings/admin', {
        method: 'PUT',
        body: JSON.stringify(form)
      });
      setSettings(updated);
      setForm(updated);
      window.dispatchEvent(new CustomEvent('site-settings-saved', { detail: updated }));
      setToast({ message: 'Site settings saved successfully.', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [form]);

  const value = {
    settings,
    form,
    setForm,
    loading,
    saving,
    toast,
    setToast,
    isDirty,
    save,
    set,
    setSlide,
    updateList,
    addListItem,
    removeListItem,
    uploadLogo,
    uploadSlideImage,
    addSlide,
    removeSlide,
    addOrgUnit,
    uploadCommissionerPhoto,
    deleteSection
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
