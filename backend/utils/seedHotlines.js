import Hotline from '../models/Hotline.js';

export const seedInitialHotlines = async () => {
  try {
    const count = await Hotline.countDocuments();
    if (count > 0) return;

    const initialHotlines = [
      {
        title: { en: 'Emergency', am: 'አስቸኳይ ጊዜ', om: 'Balaa Hatattamaa' },
        subtitle: { en: 'Immediate assistance', am: 'አፋጣኝ ድጋፍ', om: 'Gargaarsa hatattamaa' },
        number: '112',
        icon: 'emergency',
        isActive: true,
        sortOrder: 1
      },
      {
        title: { en: 'Traffic Accidents', am: 'የትራፊክ አደጋዎች', om: 'Balaa Tiraafikaa' },
        subtitle: { en: 'Road incident support', am: 'የመንገድ አደጋ ድጋፍ', om: 'Deeggarsa balaa daandii' },
        number: '113',
        icon: 'traffic',
        isActive: true,
        sortOrder: 2
      },
      {
        title: { en: 'Police Misconduct', am: 'የፖሊስ የስነ-ምግባር ጉድለት', om: 'Naamus-dhablummaa Poolisii' },
        subtitle: { en: 'Report abuse by an officer', am: 'የፖሊስ አባላትን ጥሰት ሪፖርት ያድርጉ', om: 'Miseensa poolisii komadhaa' },
        number: '3511',
        icon: 'misconduct',
        isActive: true,
        sortOrder: 3
      },
      {
        title: { en: 'Anti-Corruption', am: 'የፀረ-ሙስና ጥቆማ', om: 'Farra Malaammaltummaa' },
        subtitle: { en: 'Report corruption safely', am: 'ሙስናን በጥንቃቄ ይጠቁሙ', om: 'Malaammaltummaa eeruu kennaa' },
        number: '997',
        icon: 'corruption',
        isActive: true,
        sortOrder: 4
      },
      {
        title: { en: 'Maritime Problems', am: 'የባህር እና የውሃ አደጋዎች', om: 'Rakkina Galaanaa fi Bishaan' },
        subtitle: { en: 'Emergency support on water', am: 'የውሃ አካላት አደጋ ድጋፍ', om: 'Bishaan irratti deeggarsa hatattamaa' },
        number: '110',
        icon: 'maritime',
        isActive: true,
        sortOrder: 5
      },
      {
        title: { en: 'Driving Licence', am: 'የመንጃ ፈቃድ', om: 'Hayyama Konkolaachisummaa' },
        subtitle: { en: 'Licence information & queries', am: 'የፈቃድ መረጃ እና ጥያቄዎች', om: 'Oodeeffannoo fi gaaffii hayyamaa' },
        number: '118',
        icon: 'license',
        isActive: true,
        sortOrder: 6
      },
      {
        title: { en: 'Fire & Rescue', am: 'እሳት እና ድንገተኛ አደጋ', om: 'Balaa Ibiddhaa fi Baraarsa' },
        subtitle: { en: 'Fire and rescue response', am: 'የእሳት አደጋ ፈጣን ምላሽ', om: 'Balaa ibiddaaf deebii hatattamaa' },
        number: '111',
        icon: 'fire',
        isActive: true,
        sortOrder: 7
      }
    ];

    await Hotline.insertMany(initialHotlines);
    console.log('✅ Initial emergency hotlines seeded successfully.');
  } catch (err) {
    console.warn('Notice: Could not seed hotlines:', err.message);
  }
};

