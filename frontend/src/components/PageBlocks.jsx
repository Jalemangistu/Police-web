import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const Typewriter = ({ text }) => {
    const [displayed, setDisplayed] = useState('');
    const [phase, setPhase] = useState('typing'); // typing, pausing, deleting, idle

    useEffect(() => {
        if (!text) { setDisplayed(''); return; }
        
        let i = displayed.length;
        let timer;
        
        if (phase === 'typing') {
            timer = setInterval(() => {
                if (i < text.length) {
                    setDisplayed(text.substring(0, i + 1));
                    i++;
                } else {
                    clearInterval(timer);
                    setPhase('pausing');
                }
            }, 60);
        } else if (phase === 'pausing') {
            timer = setTimeout(() => {
                setPhase('deleting');
            }, 2000); // pause at the end
        } else if (phase === 'deleting') {
            timer = setInterval(() => {
                if (i > 0) {
                    setDisplayed(text.substring(0, i - 1));
                    i--;
                } else {
                    clearInterval(timer);
                    setPhase('idle');
                }
            }, 30);
        } else if (phase === 'idle') {
            timer = setTimeout(() => {
                setPhase('typing');
            }, 500); // pause before re-typing
        }
        
        return () => {
            if (timer) {
                clearInterval(timer);
                clearTimeout(timer);
            }
        };
    }, [text, phase, displayed.length]);

    // Reset when text changes
    useEffect(() => {
        setDisplayed('');
        setPhase('typing');
    }, [text]);

    return <span>{displayed}<span style={{ animation: 'blink 1s step-end infinite' }}>|</span><style>{`@keyframes blink { 50% { opacity: 0; } }`}</style></span>;
};

/** Full-width page hero banner */
export function Hero({ tag, title, children }) {
    return (
        <section className="pagehero">
            <div className="container">
                <p className="tag">{tag}</p>
                <h1>{title}</h1>
                {children}
            </div>
        </section>
    );
}

/** Generic content section with optional tag / lead */
export function Section({ tag, title, lead, children }) {
    const { t } = useTranslation();
    return (
        <section className="container section">
            <p className="tag">{tag || t('common.aap', 'ADDIS ABABA POLICE')}</p>
            <h2>{title}</h2>
            {lead && <p className="lead">{lead}</p>}
            {children}
        </section>
    );
}

/** Inline form field renderer (shared by Form and Contact pages) */
export function Fields({ items, set, values }) {
    return (
        <>
            {items.map((field) => {
                const [n, l] = Array.isArray(field) ? field : [field.name, field.label];
                const type = Array.isArray(field)
                    ? ['address', 'statement', 'description'].includes(n)
                        ? 'textarea'
                        : n === 'email'
                        ? 'email'
                        : n === 'password'
                        ? 'password'
                        : 'text'
                    : field.type || 'text';
                const required = Array.isArray(field) ? !l.includes('optional') : field.required;
                const change = (e) => set((f) => ({ ...f, [n]: e.target.value }));
                const value = values ? values[n] || '' : undefined;

                return (
                    <label key={n}>
                        {l}
                        {type === 'textarea' ? (
                            <textarea required={required} value={value} onChange={change} />
                        ) : type === 'select' ? (
                            <select required={required} value={value} onChange={change}>
                                <option value="">Select an option</option>
                                {(field.options || []).map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={type === 'phone' ? 'tel' : type}
                                required={required}
                                value={value}
                                onChange={change}
                            />
                        )}
                    </label>
                );
            })}
        </>
    );
}
