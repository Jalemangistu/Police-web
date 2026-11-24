import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { txt } from '../context/SiteContext';
import { Fields, Hero } from '../components/PageBlocks';
import { api } from '../utils/api';

/**
 * Shared form page used for:
 *  - Service requests:  <Form />          (route /services/:id)
 *  - Recruitment:       <Form recruit />  (route /recruitment)
 */
export default function Form({ recruit = false }) {
    const { id } = useParams();
    const { t } = useTranslation();
    const [form, setForm] = useState({});
    const [service, setService] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(!recruit);

    useEffect(() => {
        if (!recruit) {
            api(`/services/${id}`)
                .then(setService)
                .catch((e) => setMessage(e.message))
                .finally(() => setLoading(false));
        }
    }, [id, recruit]);

    const baseFields = recruit
        ? [
            ['fullName', t('form.fullName', 'Full name')],
            ['phone', t('form.phone', 'Phone')],
            ['email', t('form.email', 'Email (optional)')],
            ['educationLevel', t('form.education', 'Education level')],
            ['address', t('form.address', 'Address')],
            ['statement', t('form.statement', 'Why would you like to join?')],
        ]
        : [
            ['fullName', t('form.fullName', 'Full name')],
            ['phone', t('form.phone', 'Phone')],
            ['email', t('form.email', 'Email (optional)')],
            ['nationalId', t('form.nationalId', 'National ID (optional)')],
            ['description', t('form.description', 'Describe your request')],
        ];

    const customFields = service?.formSchema?.map((field) => ({
        name: field.name,
        label: txt(field.label) || field.name,
        type: field.type,
        required: field.required,
        options: field.options,
    })) || [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = recruit
                ? form
                : {
                    ...form,
                    formData: Object.fromEntries(
                        (service?.formSchema || []).map((field) => [field.name, form[field.name]])
                    ),
                };
            const result = await api(recruit ? '/recruitment/applications' : `/services/${id}/requests`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setMessage(result.message);
            setForm({});
        } catch (err) {
            setMessage(err.message);
        }
    };

    return (
        <>
            <Hero
                tag={recruit ? t('form.recruitmentTag', 'RECRUITMENT') : t('form.serviceTag', 'ONLINE SERVICE REQUEST')}
                title={recruit ? t('form.appForm', 'Application form') : service ? txt(service.name) : t('form.startRequest', 'Start your request')}
            >
                <p>
                    {service ? txt(service.description) : t('form.emergencyWarning', 'Do not include details of an active emergency. Call 991 for immediate assistance.')}
                </p>
            </Hero>

            <section className="container section">
                <form className="card form" onSubmit={handleSubmit} style={{ background: '#ffffff', borderRadius: '8px', padding: '36px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(12,28,52,0.04)' }}>
                    {message && <div className="notice" style={{ marginBottom: '24px' }}>{message}</div>}
                    {loading ? (
                        <p>{t('form.loading', 'Loading service form…')}</p>
                    ) : (
                        <>
                            <Fields items={[...baseFields, ...customFields]} set={setForm} values={form} />
                            <button className="button" style={{ marginTop: '16px' }}>{recruit ? t('form.submitApp', 'Submit application') : t('form.submitReq', 'Submit request')}</button>
                        </>
                    )}
                </form>
            </section>
        </>
    );
}
