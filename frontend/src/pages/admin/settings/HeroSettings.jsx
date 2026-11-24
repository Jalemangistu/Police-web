import React from 'react';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { L10nInput } from '../../../components/admin/AdminControls';

export default function HeroSettings() {
  const {
    form,
    setSlide,
    uploadSlideImage,
    addSlide,
    removeSlide
  } = useSiteSettings();

  const slides = form.heroSlides || [];

  return (
    <div className="adSettingsSection">
      <p className="adFieldHint" style={{ marginBottom: '18px' }}>
        These rotating hero slides appear on the public homepage hero banner.
      </p>

      {slides.map((slide, i) => (
        <div key={i} className="adSlideItem">
          <div className="adSlideItemHead">
            <b>Slide {i + 1}</b>
            <button
              type="button"
              className="adBtnGhost"
              onClick={() => removeSlide(i)}
            >
              ✕ Remove
            </button>
          </div>

          <L10nInput
            label="Tag / Subtitle"
            value={slide.tag}
            onChange={val => setSlide(i, 'tag', val)}
            placeholder="e.g. PROTECTING OUR CITY, SERVING OUR COMMUNITY"
          />

          <L10nInput
            label="Headline"
            value={slide.headline}
            onChange={val => setSlide(i, 'headline', val)}
            placeholder="Bold headline sentence"
          />

          <L10nInput
            isQuill
            label="Supporting text"
            value={slide.body}
            onChange={val => setSlide(i, 'body', val)}
            placeholder="One or two sentences of supporting copy"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'end' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', margin: '12px 0 6px' }}>
              Destination link
              <input
                type="text"
                value={slide.link || ''}
                onChange={e => setSlide(i, 'link', e.target.value)}
                placeholder="#police-services or /services"
                style={{ display: 'block', marginTop: '5px' }}
              />
            </label>
            <L10nInput
              label="Button label"
              value={slide.linkText}
              onChange={val => setSlide(i, 'linkText', val)}
              placeholder="e.g. POLICE SERVICES"
            />
          </div>

          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', margin: '14px 0 6px' }}>
            Slide image
            <input
              type="file"
              accept="image/*"
              onChange={e => uploadSlideImage(i, e.target.files?.[0])}
              style={{ display: 'block', marginTop: '5px' }}
            />
          </label>

          {slide.image && (
            <div className="adImagePreview">
              <img src={slide.image} alt={`Slide ${i + 1} preview`} />
              <button
                type="button"
                className="adBtnGhost"
                onClick={() => window.confirm('Delete this slide image?') && setSlide(i, 'image', '')}
              >
                Remove image
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        className="adBtnOutline"
        onClick={addSlide}
        style={{ marginTop: '12px' }}
      >
        ＋ Add slide
      </button>
    </div>
  );
}
