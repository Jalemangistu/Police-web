import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import SiteSettings from './models/SiteSettings.js';

dotenv.config();

const run = async () => {
    await connectDB();
    const settings = await SiteSettings.findOne({ _key: 'singleton' });
    if (settings) {
        let changed = false;
        const paths = SiteSettings.schema.paths;
        
        for (const key of Object.keys(settings.toObject())) {
            if (typeof settings[key] === 'string' && settings[key] === '[object Object]') {
                settings[key] = paths[key]?.defaultValue !== undefined ? paths[key].defaultValue : '';
                changed = true;
            }
        }
        
        if (settings.heroSlides) {
            settings.heroSlides.forEach(slide => {
                for (const key of Object.keys(slide.toObject())) {
                    if (typeof slide[key] === 'string' && slide[key] === '[object Object]') {
                        slide[key] = '';
                        changed = true;
                    }
                }
            });
        }
        
        if (settings.organizationChart) {
            settings.organizationChart.forEach(item => {
                for (const key of Object.keys(item.toObject())) {
                    if (typeof item[key] === 'string' && item[key] === '[object Object]') {
                        item[key] = '';
                        changed = true;
                    }
                }
            });
        }
        
        if (settings.socialLinks) {
            settings.socialLinks.forEach(item => {
                for (const key of Object.keys(item.toObject())) {
                    if (typeof item[key] === 'string' && item[key] === '[object Object]') {
                        item[key] = '';
                        changed = true;
                    }
                }
            });
        }

        settings.set('commissionerPhoto', settings.get('commissionerPhoto') || '/commissioner.jpg');
        settings.set('commissionerName', settings.get('commissionerName') || 'Demelash Gebremichael');
        settings.set('commissionerTitle', settings.get('commissionerTitle') || 'Commissioner General');
        settings.markModified('commissionerPhoto');
        settings.markModified('commissionerName');
        settings.markModified('commissionerTitle');
        await settings.save();
        console.log('Fixed and populated settings.');
    }
    process.exit(0);
};

run().catch(console.error);
