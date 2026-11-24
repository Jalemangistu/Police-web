const fs = require('fs');
let code = fs.readFileSync('./src/AdminPanel.jsx', 'utf-8');

const helper = `
const L10nInput = ({ label, value, onChange, placeholder, isQuill = false }) => {
    const [lang, setLang] = React.useState('en');
    const safeVal = typeof value === 'object' && value !== null ? value : { en: typeof value === 'string' && value !== '[object Object]' ? value : '', am: '', om: '' };
    const update = (newVal) => onChange({ ...safeVal, [lang]: newVal });
    return (
        <div className="adL10nField" style={{ marginBottom: '16px' }}>
            <div className="adL10nHead" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ margin: 0 }}>{label}</label>
                <div className="adL10nTabs" style={{ display: 'flex', gap: '4px' }}>
                    {['en', 'am', 'om'].map(l => (
                        <button key={l} type="button" onClick={() => setLang(l)} style={{ padding: '2px 8px', fontSize: '12px', background: lang === l ? 'var(--aap-primary)' : '#eee', color: lang === l ? '#fff' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            {l.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
            {isQuill ? (
                <ReactQuill theme="snow" value={safeVal[lang] || ''} onChange={update} placeholder={placeholder} />
            ) : (
                <input type="text" value={safeVal[lang] || ''} onChange={e => update(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            )}
        </div>
    );
};
`;

code = code.replace('function AdminPanel() {', helper + '\nfunction AdminPanel() {');

const fieldNames = ['siteName', 'tagline', 'footerCopy', 'cityBandTitle', 'cityBandText', 'cityBandLinkText', 'cityBandTrafficTitle', 'cityBandTrafficText', 'cityBandTrafficLinkText', 'aboutHeroTitle', 'aboutHeroLead', 'aboutMission', 'aboutVision', 'aboutValues', 'commissionerMessage', 'organizationalStructure', 'servicesHeroTitle', 'servicesHeroLead', 'safetyHeroTitle', 'safetyHeroLead', 'communityHeroTitle', 'communityHeroLead', 'contactHeroTitle', 'contactHeroLead', 'contactAddress', 'newsHeroTitle', 'newsHeroLead'];

fieldNames.forEach(f => {
    let re = new RegExp(`<label>([^<]+)<input type='text' value=\\{form\\.${f} \\|\\| ''\\} onChange=\\{e => set\\('${f}', e\\.target\\.value\\)\\} /></label>`, 'g');
    code = code.replace(re, (m, label) => `<L10nInput label="${label}" value={form.${f}} onChange={val => set('${f}', val)} />`);
    
    let reQ = new RegExp(`<label>([^<]+)<ReactQuill theme="snow" value=\\{form\\.${f} \\|\\| ''\\} onChange=\\{val => set\\('${f}', val\\)\\} /></label>`, 'g');
    code = code.replace(reQ, (m, label) => `<L10nInput isQuill label="${label}" value={form.${f}} onChange={val => set('${f}', val)} />`);
});

code = code.replace(
  /<label>Headline<input type='text' value=\{slide\.headline \|\| ''\} onChange=\{e => setSlide\(i, 'headline', e\.target\.value\)\} placeholder="([^"]+)" \/><\/label>/g,
  '<L10nInput label="Headline" value={slide.headline} onChange={val => setSlide(i, \'headline\', val)} placeholder="$1" />'
);

code = code.replace(
  /<label>Supporting text<ReactQuill theme="snow" value=\{slide\.body \|\| ''\} onChange=\{val => setSlide\(i, 'body', val\)\} placeholder="([^"]+)" \/><\/label>/g,
  '<L10nInput isQuill label="Supporting text" value={slide.body} onChange={val => setSlide(i, \'body\', val)} placeholder="$1" />'
);

fs.writeFileSync('./src/AdminPanel.jsx', code);
console.log('AdminPanel patched for L10n');
