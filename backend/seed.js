import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Service from './models/Service.js';
import Alert from './models/Alert.js';
import News from './models/News.js';
import Station from './models/Station.js';
import SafetyDocument from './models/SafetyDocument.js';
import MediaAsset from './models/MediaAsset.js';
import SiteSettings from './models/SiteSettings.js';
import Vacancy from './models/Vacancy.js';

await mongoose.connect(process.env.MONGODB_URI);
await User.updateOne(
  { email: 'admin@aap.local' }, 
  { 
    $setOnInsert: { 
    name: 'Admin User', 
    email: 'admin@aap.local', 
    password: 
await bcrypt.hash('password', 12), role: 'admin', isActive: true } }, { upsert: true });
await Service.bulkWrite([
  { 
    updateOne: { filter: { slug: 'crime-reporting' }, 
    update: { $set: { 
      slug: 'crime-reporting',
      name: { 
        en: 'Non-Emergency Crime Reporting', 
        am: 'ድንገተኛ ያልሆነ የወንጀል ሪፖርት', 
        om: 'Gabaasa Balleessaa Hin Hatatamaa' 
      }, 
      description: { 
        en: 'Official guidance on submitting non-emergency incident reports, property losses, and neighborhood safety concerns.', 
        am: 'ድንገተኛ ያልሆኑ ወንጀሎችን፣ የንብረት ስርቆትን እና የደህንነት ስጋቶችን ለመጠቆም የሚያስችል ይፋዊ መመሪያ።', 
        om: 'Qajeelfama gabaasa yakka hin hatatamne, qabeenya bade fi nageenya naannoo.' 
      }, 
      overview: { 
        en: 'Allows citizens and residents to report non-emergency incidents, property losses, minor accidents, and local concerns without visiting a station immediately.', 
        am: 'ዜጎች እና ነዋሪዎች ድንገተኛ ያልሆኑ ክስተቶችን፣ የንብረት መጥፋትን እና አነስተኛ አደጋዎችን በቀላሉ ለፖሊስ የሚያሳውቁበት ይፋዊ መመሪያ።', 
        om: 'Lammileen taateewwan balaa hin hatatamne, qabeenya bade fi komii nageenyaa poolisiitti akka beeksisan kan dandeessisu.' 
      },
      requirements: { 
        en: 'Valid National ID, Kebele ID, or Passport; precise date, time, and location of the incident; details of involved individuals or property.', 
        am: 'ህጋዊ የታደሰ መታወቂያ ወይም ፓስፖርት፤ የወንጀሉ የተፈጸመበት ቀን፣ ሰዓት እና ትክክለኛ ቦታ፤ የንብረት ወይም የተጠርጣሪዎች መግለጫ።', 
        om: 'Waraqaa eenyummaa seera qabeessa, guyyaa, sa\'aatii fi bakka taatee, ibsa qabeenya badee.' 
      },
      availability: { 
        en: '24/7 at all 11 Sub-City Police Divisions and local District Woreda stations across Addis Ababa.', 
        am: 'በሁሉም 11 ክፍለ ከተሞች እና በየወረዳው በሚገኙ ፖሊስ ጣቢያዎች 24 ሰዓት በሳምንት 7 ቀናት ይሰጣል።', 
        om: 'Kutaalee magaalaa 11 fi waajjiraalee aanaalee hunda keessatti sa\'aatii 24 banaadha.' 
      },
      feeAmount: 0, 
      feeDescription: { 
        en: 'Free of charge (Official Public Service)', 
        am: 'ያለክፍያ የሚሰጥ ይፋዊ የህዝብ አገልግሎት', 
        om: 'Kaffaltii malee kan kennamu' 
      },
      emergencyNotice: {
        en: 'For crimes in progress, violence, or immediate life danger, do NOT use non-emergency guidance — call 991 immediately.',
        am: 'በሂደት ላይ ላሉ ወንጀሎች፣ ለአደጋ ወይም አፋጣኝ እርዳታ ለሚሹ ጉዳዮች በ991 ወዲያውኑ ይደውሉ።',
        om: 'Yeroo balaa hatattamaa ykn balaa lubbuu irratti qaqqabeef, hatattamaan 991 irratti bilbilaa.'
      },
      icon: 'shield',
      isActive: true, 
      sortOrder: 1 
    } }, upsert: true } },
  { 
    updateOne: { filter: { slug: 'police-clearance' },
    update: { $set: { 
      slug: 'police-clearance',
      name: { 
        en: 'Police Clearance Certificate', 
        am: 'የፖሊስ ማጣሪያ ሰነድ', 
        om: 'Waraqaa Qulqullina Poolisii' 
      }, 
      description: { 
        en: 'Requirements, verification procedures, and processing guidance for official criminal record clearance certificates.', 
        am: 'የፖሊስ ማጣሪያ ሰነድ ለማውጣት የሚያስፈልጉ ቅድመ-ሁኔታዎች እና የአሰራር መመሪያዎች።', 
        om: 'Ulaagaalee fi adeemsa waraqaa qulqullina galmee yakkaa baafachuu.' 
      }, 
      overview: { 
        en: 'The Police Clearance Certificate certifies the criminal record history of an individual for employment, immigration, higher education, and international travel.', 
        am: 'የፖሊስ ማጣሪያ ሰነድ ለስራ ቅጥር፣ ለውጭ ሀገር ጉዞ፣ ለትምህርት እና ህጋዊ ጉዳዮች ከማንኛውም የወንጀል ድርጊት ነፃ መሆንን የሚያረጋግጥ ይፋዊ ሰነድ ነው።', 
        om: 'Waraqaan qulqullina poolisii qacarrii hojii, imala biyya alaa, fi barumsaaf galmee yakkaa irraa bilisa ta\'uu mirkaneessa.' 
      },
      requirements: { 
        en: 'Two recent passport-size photographs; original and copy of Kebele ID / Passport; fingerprint biometric capture at the division headquarters.', 
        am: 'ሁለት የፓስፖርት መጠን ያላቸው ፎቶግራፎች፤ ዋናውና ፎቶ ኮፒ የታደሰ መታወቂያ ወይም ፓስፖርት፤ የጣት አሻራ ምርመራ በክፍለ ከተማው መምሪያ።', 
        om: 'Suuraa paaspoortii 2, waraqaa eenyummaa ykn paaspoortii orijinaala fi koppii, ashaaraa qubaa.' 
      },
      availability: { 
        en: 'Monday – Friday: 8:30 AM – 5:00 PM, Saturday: 8:30 AM – 12:30 PM (Forensic Documentation Centers)', 
        am: 'ከሰኞ እስከ አርብ፡ ከጠዋቱ 2:30 - 11:00፣ ቅዳሜ፡ ከጠዋቱ 2:30 - 6:30 (በፎረንሲክ እና ማስረጃ ማዕከላት)', 
        om: 'Wiixata - Jimaata: Sa\'aatii 2:30 - 11:00, Sanbata: 2:30 - 6:30' 
      },
      feeAmount: 150, 
      feeDescription: { 
        en: 'Official administrative fee applies per government directive (150 ETB standard processing)', 
        am: 'በመንግስት መመሪያ መሰረት የተወሰነ ይፋዊ የአገልግሎት ክፍያ (150 የኢትዮጵያ ብር)', 
        om: 'Kaffaltii tajaajilaa mootummaa (Qarshii 150)' 
      },
      emergencyNotice: {
        en: 'Standard processing time is 3 to 5 business days upon biometric fingerprint verification.',
        am: 'የጣት አሻራ ምርመራ ከተጠናቀቀ በኋላ ሰነዱ በ3 እስከ 5 የስራ ቀናት ውስጥ ይደርሳል።',
        om: 'Erga ashaaraan qubaa fudhatamee booda guyyoota hojii 3 hanga 5 keessatti qophaa\'a.'
      },
      icon: 'clearance',
      isActive: true, 
      sortOrder: 2 
    } }, upsert: true } },
  { 
    updateOne: { filter: { slug: 'traffic-services' }, 
    update: { $set: { 
      slug: 'traffic-services',
      name: { 
        en: 'Traffic & Road Safety Guidance', 
        am: 'የትራፊክ ደህንነት እና መመሪያ', 
        om: 'Qajeelfama Tiraafikaa fi Nageenya Daandii' 
      }, 
      description: { 
        en: 'Metropolitan road regulations, accident protocol guidance, and safety compliance across Addis Ababa.', 
        am: 'የከተማው የትራፊክ ደንቦች፣ የአደጋ ሪፖርት አደራረግ እና የመንገድ ደህንነት መረጃ።', 
        om: 'Seerota tiraafikaa magaalaa, haala gabaasa balaa konkolaataa fi eegumsa.' 
      }, 
      overview: { 
        en: 'Guidance on city traffic regulations, corridor speed compliance, pedestrian safety measures, and official collision reporting procedures.', 
        am: 'ስለ ከተማው የትራፊክ ደህንነት መመሪያዎች፣ የእግረኞች መሻገሪያዎች፣ የፍጥነት ገደብ እና የአደጋ ሪፖርት አደራረግ ሂደቶች መረጃ።', 
        om: 'Qajeelfama seerota tiraafikaa magaalaa, eegumsa deemtoota faanaa, fi haala gabaasa balaa konkolaataa.' 
      },
      requirements: { 
        en: 'In case of minor traffic incidents: driver license, vehicle registration booklet (Libre), third-party insurance certificate, and incident location photos.', 
        am: 'በትራፊክ አደጋ ወቅት፡ የመንጃ ፈቃድ፣ የተሸከርካሪ የባለቤትነት ማረጋገጫ (ሊብሬ)፣ የሶስተኛ ወገን ኢንሹራንስ ሰነድ እና የአደጋው ፎቶግራፍ።', 
        om: 'Hayyama konkolaachisummaa, liibre konkolaataa, inshuraansii qaama sadaffaa, fi suuraalee bakka balaa.' 
      },
      availability: { 
        en: 'Traffic Emergency Response: 24/7 Hotline via 991 or 011 552 4433. Division desks open regular business hours.', 
        am: 'የትራፊክ ድንገተኛ አደጋ ምላሽ፡ በ991 ወይም 011 552 4433 24 ሰዓት ክፍት ነው። የቢሮ አገልግሎት በመደበኛ የስራ ሰዓት ይሰጣል።', 
        om: 'Deebii hatattamaa tiraafikaa: Sarara bilisaa 991 ykn 011 552 4433 sa\'aatii 24.' 
      },
      feeAmount: 0, 
      feeDescription: { 
        en: 'Safety guidance is free. Infraction resolution per statutory traffic penalty schedules.', 
        am: 'የደህንነት መረጃና መመሪያ ያለክፍያ የሚሰጥ ሲሆን የቅጣት አፈጻጸም በህጉ መሰረት ይፈጸማል።', 
        om: 'Gorsi nageenyaa kaffaltii malee kennama.' 
      },
      emergencyNotice: {
        en: 'For major collisions involving injury or severe vehicle damage, keep vehicles in position and contact 991 immediately.',
        am: 'አካል ላይ ጉዳት ያደረሰ ከባድ አደጋ ሲያጋጥም ተሸከርካሪውን ሳያንቀሳቅሱ ወዲያውኑ በ991 ለትራፊክ ፖሊስ ያሳውቁ።',
        om: 'Balaa cimaa miidhaa qaamaa qaqqabsiiseef, konkolaataa bakka jiruu osoo hin sochoosin 991 bilbilaa.'
      },
      icon: 'traffic',
      isActive: true, 
      sortOrder: 3 
    } }, upsert: true } },
  { 
    updateOne: { filter: { slug: 'community-policing' }, 
    update: { $set: { 
      slug: 'community-policing',
      name: { 
        en: 'Community Policing Partnership', 
        am: 'የማህበረሰብ ፖሊሲንግ', 
        om: 'Poolisii Hawaasaa' 
      }, 
      description: { 
        en: 'Information on neighborhood partnerships, local safety committees, and joint policing initiatives.', 
        am: 'የአካባቢ ሰላምን በጋራ ለማስከበር ከፖሊስ ጋር ስለሚደረግ አጋርነት እና ውይይቶች መረጃ።', 
        om: 'Nageenya naannoo mirkaneessuuf wal-tumsa ummataa fi poolisii.' 
      }, 
      overview: { 
        en: 'Community policing brings residents, local business owners, youth groups, and district officers together to proactively maintain peace, prevent local crime, and resolve neighborhood issues.', 
        am: 'የማህበረሰብ ፖሊሲንግ ነዋሪዎች፣ የንግድ ማህበረሰብ፣ ወጣቶች እና የአካባቢ ፖሊስ አባላት በጋራ በመተባበር ሰላምን የሚያስከብሩበትና ወንጀልን አስቀድመው የሚከላከሉበት አሰራር ነው።', 
        om: 'Poolisiin hawaasaa jiraattota, daldaltoota, dargaggoota fi poolisii naannoo walitti fiduun nageenya mirkaneessa.' 
      },
      requirements: { 
        en: 'Open to all residents of Addis Ababa. No special credentials required to attend local monthly safety meetings.', 
        am: 'ለማንኛውም የአዲስ አበባ ከተማ ነዋሪ ክፍት ነው። ወርሃዊ የደህንነት ውይይቶችን ለመሳተፍ ምንም አይነት ልዩ ቅድመ-ሁኔታ አይጠይቅም።', 
        om: 'Jiraattota Finfinnee hundaaf banaadha. Walga\'iiwwan ji\'aa irratti hirmaachuun ni danda\'ama.' 
      },
      availability: { 
        en: 'Monthly neighborhood forums at local Woreda police posts; community officers available daily.', 
        am: 'በየወረዳው ፖሊስ ኬላዎች ወርሃዊ የውይይት መድረኮች ይካሄዳሉ፤ የማህበረሰብ ፖሊስ አስተባባሪዎች በየቀኑ ያገለግላሉ።', 
        om: 'Walga\'ii ji\'aa waajjira aanaatti taasifama; qindeessitoonni guyyaa guyyaan tajaajilu.' 
      },
      feeAmount: 0, 
      feeDescription: { 
        en: 'Completely free community engagement program.', 
        am: 'ሙሉ በሙሉ ያለክፍያ የሚካሄድ የህዝብ ተሳትፎ መርሃ-ግብር።', 
        om: 'Sagantaa hirmaannaa hawaasaa kaffaltii malee gaggeeffamu.' 
      },
      emergencyNotice: {
        en: 'Community forums address preventative security. In active emergencies, always contact 991.',
        am: 'የማህበረሰብ መድረኮች የመከላከል ስራ ላይ የሚያተኩሩ ሲሆን ለአስቸኳይ አደጋ ግን ሁልጊዜ በ991 ይደውሉ።',
        om: 'Walga\'iin hawaasaa nageenya ittisuuf; yeroo balaa hatattamaa yeroo hunda 991 bilbilaa.'
      },
      icon: 'community',
      isActive: true, 
      sortOrder: 4 
    } }, upsert: true } }
]);
await Alert.updateOne({ 'title.en': 'Public Safety Notice' }, 
  { $setOnInsert: { 
    title: { en: 'Public Safety Notice', 
             am: 'የሕዝብ ደህንነት ማስታወቂያ', 
             om: 'Beeksisa Nageenya Ummataa' },
    message: { en: 'Stay alert and use official channels for emergency assistance.', am: '', om: '' }, 
    level: 'high', category: 'general', isActive: true } }, { upsert: true });

await Alert.updateOne({ category: 'road_safety' },
  { $setOnInsert: {
    title: {
      en: 'Corridor Traffic Regulation & Road Safety Enforcement',
      am: 'የኮሪደር ትራፊክ ቁጥጥር እና የመንገድ ደህንነት ማስከበር',
      om: "To'annoo Tiraafikaa fi Nageenya Daandii"
    },
    message: {
      en: 'Active traffic safety advisory across Addis Ababa corridors. Strict enforcement of 50 km/h speed limits, mandatory yielding at pedestrian crossings, and vehicle spacing in rainy weather are in effect. Follow lane markings and heed officer directions.',
      am: 'በአዲስ አበባ ከተማ ዋና ዋና ኮሪደሮች ላይ የትራፊክ ደህንነት ማስከበር ስራ እየተከናወነ ይገኛል። የ50 ኪ.ሜ/ሰ ፍጥነት ገደብ ማክበር፣ ለእግረኞች ቅድሚያ መስጠት እና የዝናብ ወቅት ጥንቃቄ ማድረግ ግዴታ ነው።',
      om: "Daandilee Finfinnee irratti to'annoon tiraafikaa cimee itti fufeera. Ariitii 50 km/h eeguu fi deemtoota faanaaf dursa kennuun dirqama."
    },
    level: 'high',
    category: 'road_safety',
    corridors: 'Meskel Square · Bole Road · Ring Road Interchange',
    hotline: '991 / 011 552 4433',
    isActive: true
  } }, { upsert: true });
await News.updateOne({ slug: 'community-policing-update' }, 
  { $setOnInsert: { 
    slug: 'community-policing-update', 
    title: { 
            en: 'Community Policing Update', 
            am: 'የማህበረሰብ ፖሊሲንግ ዝማኔ', 
            om: "Fooyya'iinsa Poolisii Hawaasaa" }, 
    excerpt: { en: 'New community outreach initiatives are now active across the city.', 
               am: '', 
               om: '' 
              },
    content: { en: 'The Addis Ababa Police has launched a new community engagement program to improve trust, accessibility, and rapid response.',
               am: '', 
               om: ''
               }, 
    status: 'published', 
    publishedAt: new Date() } }, { upsert: true });

const initialStations = [
  {
    name: { en: 'Bole Sub-city Police Division', am: 'የቦሌ ክፍለ ከተማ ፖሊስ መምሪያ', om: 'Waajjira Poolisii Kutaa Magaalaa Boolee' },
    subCity: 'Bole',
    district: 'Woreda 03',
    address: { en: 'Near Edna Mall, Cameroon Street, Bole', am: 'ኤድና ሞል አጠገብ፣ ካሜሩን ጎዳና፣ ቦሌ', om: 'Edna Mall cinaa, Daandii Kaameruun, Boolee' },
    phone: ['011 662 0000', '011 661 1111'],
    email: 'bole.police@aap.gov.et',
    operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
    isActive: true
  },
  {
    name: { en: 'Arada Sub-city Police Division', am: 'የአራዳ ክፍለ ከተማ ፖሊስ መምሪያ', om: 'Waajjira Poolisii Kutaa Magaalaa Aradaa' },
    subCity: 'Arada',
    district: 'Woreda 01',
    address: { en: 'Piazza, near Churchill Avenue, Arada', am: 'ፒያሳ፣ ቸርችል ጎዳና አጠገብ፣ አራዳ', om: 'Piyasaa, Daandii Charchil cinaa, Aradaa' },
    phone: ['011 155 1200', '011 156 3211'],
    email: 'arada.police@aap.gov.et',
    operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
    isActive: true
  },
  {
    name: { en: 'Kirkos Sub-city Police Division', am: 'የቂርቆስ ክፍለ ከተማ ፖሊስ መምሪያ', om: 'Waajjira Poolisii Kutaa Magaalaa Qirqoos' },
    subCity: 'Kirkos',
    district: 'Woreda 04',
    address: { en: 'Mexico Square, Kirkos', am: 'ሜክሲኮ አደባባይ፣ ቂርቆስ', om: 'Addababayii Meeksikoo, Qirqoos' },
    phone: ['011 551 2222', '011 552 4433'],
    email: 'kirkos.police@aap.gov.et',
    operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
    isActive: true
  },
  {
    name: { en: 'Yeka Sub-city Police Division', am: 'የየካ ክፍለ ከተማ ፖሊስ መምሪያ', om: 'Waajjira Poolisii Kutaa Magaalaa Yakkii' },
    subCity: 'Yeka',
    district: 'Woreda 06',
    address: { en: 'Near Megenagna Square, Yeka', am: 'መገናኛ አደባባይ አጠገብ፣ የካ', om: 'Magananyaa cinaa, Yakkii' },
    phone: ['011 646 1122', '011 645 8899'],
    email: 'yeka.police@aap.gov.et',
    operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
    isActive: true
  },
  {
    name: { en: 'Lideta Sub-city Police Division', am: 'የልደታ ክፍለ ከተማ ፖሊስ መምሪያ', om: 'Waajjira Poolisii Kutaa Magaalaa Lidataa' },
    subCity: 'Lideta',
    district: 'Woreda 05',
    address: { en: 'Ras Abebe Aregay Street, Lideta', am: 'ራስ አበበ አረጋይ ጎዳና፣ ልደታ', om: 'Daandii Raas Abbabaa Aragay, Lidataa' },
    phone: ['011 553 1000', '011 554 9900'],
    email: 'lideta.police@aap.gov.et',
    operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
    isActive: true
  },
  {
    name: { en: 'Kolfe Keranio Sub-city Police Division', am: 'የኮልፌ ቀራኒዮ ክፍለ ከተማ ፖሊስ መምሪያ', om: 'Waajjira Poolisii Kutaa Magaalaa Kolfee Qaraaniyoo' },
    subCity: 'Kolfe Keranio',
    district: 'Woreda 08',
    address: { en: 'Near Tor Hailoch, Kolfe Keranio', am: 'ጦር ኃይሎች አጠገብ፣ ኮልፌ ቀራኒዮ', om: 'Xoor Haayiloch cinaa, Kolfee Qaraaniyoo' },
    phone: ['011 275 3300', '011 276 4411'],
    email: 'kolfe.police@aap.gov.et',
    operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
    isActive: true
  },
  {
    name: { en: 'Gullele Sub-city Police Division', am: 'የጉለሌ ክፍለ ከተማ ፖሊስ መምሪያ', om: 'Waajjira Poolisii Kutaa Magaalaa Gullellee' },
    subCity: 'Gullele',
    district: 'Woreda 02',
    address: { en: 'Shiro Meda, Gullele', am: 'ሽሮ ሜዳ፣ ጉለሌ', om: 'Shiroo Meedaa, Gullellee' },
    phone: ['011 123 4500', '011 124 6700'],
    email: 'gullele.police@aap.gov.et',
    operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
    isActive: true
  },
  {
    name: { en: 'Nefas Silk-Lafto Sub-city Police Division', am: 'የንፋስ ስልክ ላፍቶ ክፍለ ከተማ ፖሊስ መምሪያ', om: 'Waajjira Poolisii Kutaa Magaalaa Nifaas Silk Laaftoo' },
    subCity: 'Nefas Silk-Lafto',
    district: 'Woreda 03',
    address: { en: 'Gotera Interchange area, Nefas Silk', am: 'ጎተራ ማስተላለፊያ አካባቢ፣ ንፋስ ስልክ', om: 'Gootaraa cinaa, Nifaas Silk' },
    phone: ['011 442 1100', '011 443 2200'],
    email: 'nsl.police@aap.gov.et',
    operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
    isActive: true
  },
  {
    name: { en: 'Addis Ketema Sub-city Police Division', am: 'የአዲስ ከተማ ክፍለ ከተማ ፖሊስ መምሪያ', om: 'Waajjira Poolisii Kutaa Magaalaa Addis Ketema' },
    subCity: 'Addis Ketema',
    district: 'Woreda 01',
    address: { en: 'Autobis Tera / Merkato, Addis Ketema', am: 'አውቶቢስ ተራ / መርካቶ፣ አዲስ ከተማ', om: 'Awtoobis Taraa / Markaatoo, Addis Ketema' },
    phone: ['011 277 8899', '011 278 0011'],
    email: 'addisketema.police@aap.gov.et',
    operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
    isActive: true
  },
  {
    name: { en: 'Akaky Kaliti Sub-city Police Division', am: 'የአቃቂ ቃሊቲ ክፍለ ከተማ ፖሊስ መምሪያ', om: 'Waajjira Poolisii Kutaa Magaalaa Aqaaqii Qaallittii' },
    subCity: 'Akaky Kaliti',
    district: 'Woreda 04',
    address: { en: 'Debre Zeit Road, Kaliti', am: 'ደብረ ዘይት መንገድ፣ ቃሊቲ', om: 'Daandii Bishooftuu, Qaallittii' },
    phone: ['011 434 0012', '011 435 1123'],
    email: 'akaky.police@aap.gov.et',
    operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
    isActive: true
  },
  {
    name: { en: 'Lemi Kura Sub-city Police Division', am: 'የለሚ ኩራ ክፍለ ከተማ ፖሊስ መምሪያ', om: 'Waajjira Poolisii Kutaa Magaalaa Lammii Kuraa' },
    subCity: 'Lemi Kura',
    district: 'Woreda 02',
    address: { en: 'Ayat Roundabout area, Lemi Kura', am: 'አያት አደባባይ አካባቢ፣ ለሚ ኩራ', om: 'Addababayii Ayaat cinaa, Lammii Kuraa' },
    phone: ['011 671 2233', '011 672 3344'],
    email: 'lemikura.police@aap.gov.et',
    operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
    isActive: true
  }
];

for (const st of initialStations) {
  await Station.updateOne(
    { 'name.en': st.name.en },
    { $set: st },
    { upsert: true }
  );
}

const initialDocuments = [
  {
    slug: 'protect-your-home-burglary-prevention',
    category: 'protect_home',
    documentNumber: 'AAP-DOC-2026-001',
    department: 'Crime Prevention & Community Policing Directorate',
    title: {
      en: 'Residential Security & Burglary Prevention Directive',
      am: 'የመኖሪያ ቤት ደህንነት እና የስርቆት መከላከያ አጠቃላይ መመሪያ',
      om: 'Qajeelfama Nageenya Mana Jireenyaa fi Ittisa Hannaa'
    },
    summary: {
      en: 'Official security standards, physical locking protocols, perimeter lighting, and neighborhood coordination steps to secure households against unlawful entry.',
      am: 'የመኖሪያ ቤቶችን ከስርቆትና ካልተፈቀደ ወረራ ለመጠበቅ የሚያስችሉ የደህንነት መስፈርቶች፣ የቁልፍና መብራት አጠቃቀም እና የማህበረሰብ ጥበቃ እርምጃዎች።',
      om: 'Mana jireenyaa seeraan ala cabsanii seenuu irraa ittisuuf ulaagaalee nageenyaa, qajeelfama cufaa fi ifaa, fi tarkaanfii eegumsa hawaasaa.'
    },
    content: {
      en: `### 1. Perimeter Security & Structural Barriers
Ensure all boundary fences, compound gates, and exterior doorways are reinforced. Gates should be secured with heavy-duty mortise deadbolts or commercial grade padlocks. Trim overgrown shrubbery near windows and pathways to maintain clear lines of sight from neighborhood vantage points.

### 2. Illumination and Sensor Lighting
Install motion-sensor LED lighting around compound entry points, carports, and blind spots. A well-illuminated perimeter dramatically reduces covert unauthorized access. During nighttime hours, keep front access gates illuminated.

### 3. Window Security & Grill Specifications
Ground-floor windows and accessible balcony doors must be equipped with firmly anchored interior steel grills with quick-release safety latches in case of fire evacuation. Never leave windows unlatched when leaving residences unattended.

### 4. Community & Neighborhood Watch Engagement
Cooperate closely with your local Woreda police division and neighborhood watch coordinators. Exchange verified emergency contacts with adjacent neighbors. Report suspicious vehicles or persons loitering around residential compounds to your Sub-City police station or call 991 immediately.

### 5. Official Reporting & Verification
In case of suspected breach or attempted burglary, do not disturb physical evidence. Immediately secure the perimeter and contact the Addis Ababa Police Command Centre.`,
      am: `### 1. የቅጥር ግቢ እና የበር ደህንነት
የቅጥር ግቢ አጥሮች፣ የውጭ በሮች እና መስኮቶች ጠንካራ መሆናቸውን ያረጋግጡ። ዋና በሮች ጥራት ባላቸው መቆለፊያዎች መዘጋት አለባቸው። የደህንነት እይታን የሚጋርዱ ዛፎችንና ቁጥቋጦዎችን መቁረጥ ይመረጣል።

### 2. የመብራት እና ሴንሰር አጠቃቀም
በግቢው መግቢያ፣ የመኪና ማቆሚያ እና ጨለማ ቦታዎች ላይ በእንቅስቃሴ የሚሰሩ መብራቶችን ይጠቀሙ። በቂ ብርሃን ያለው ግቢ ሌቦችንና አጥፊዎችን ለመከላከል ከፍተኛ አስተዋጽኦ ያደርጋል።

### 3. የመስኮት እና የበር ግሪሎች
በመሬት ወለል ላይ የሚገኙ መስኮቶች እና በረንዳዎች ጠንካራ የብረት ግሪል ሊኖራቸው ይገባል። ቤቱን ለቀው በሚወጡበት ጊዜ መስኮቶች በሚገባ መዘጋታቸውን ያረጋግጡ።

### 4. ከማህበረሰብ ፖሊስ ጋር ያለው ቅንጅት
ከአካባቢዎ የወረዳ ፖሊስ እና ከጎረቤቶች ጋር ጠንካራ ግንኙነት ይፍጠሩ። አጠራጣሪ እንቅስቃሴዎችን፣ የማያውቋቸውን ተሽከርካሪዎች ሲመለከቱ ወዲያውኑ ለፖሊስ በ 991 ይደውሉ።`,
      om: `### 1. Eegumsa Daawoo fi Balbala
Dallaa, balbala guddaa fi foddaa manneenii cimsuu mirkaneeffadhaa. Balbaloota cufaa amansiisaan cufuu fi ifa gahaa qabaachuu qaba.

### 2. Ifa fi To'annoo
Naannoo seensaa fi iddoo dukkanaa ifa gahaa qabaachuun hanna ittisuuf daran gargaara.

### 3. Qindoomina Poolisii Hawaasaa Wajjin
Odeeffannoo fi lakkoofsa bilbilaa poolisii wardaatiin wal-jijjiiraa. Wanta shakkisiisaa yoo argitan hatattamaan 991 bilbilaa.`
    },
    fileName: 'AAP_Residential_Security_Directive_2026.pdf',
    fileSize: '1.6 MB',
    status: 'published',
    isActive: true,
    publishedAt: new Date()
  },
  {
    slug: 'stay-safe-online-cyber-fraud-prevention',
    category: 'safe_online',
    documentNumber: 'AAP-DOC-2026-002',
    department: 'Cybercrime & Digital Forensics Directorate',
    title: {
      en: 'Digital Safety & Cyber Fraud Prevention Advisory',
      am: 'የዲጂታል ደህንነት እና የኦንላይን ማጭበርበር መከላከያ መመሪያ',
      om: 'Qajeelfama Nageenya Diijitaalaa fi Ittisa Gowwoomsaa Saayibarii'
    },
    summary: {
      en: 'Critical directives for identifying bank transfer fraud, social media impersonation, suspicious OTP requests, and online scam operations in Addis Ababa.',
      am: 'የባንክ ማስተላለፊያ ማጭበርበር፣ የማህበራዊ ሚዲያ አስመስሎ መስራት፣ የይለፍ ቃል (OTP) ስርቆት እና የኦንላይን ወንጀሎችን የመለየትና የመከላከል መመሪያ።',
      om: 'Gowwoomsaa baankii, miidiyaa hawaasaa irratti nama fakkaachuu, fi gowwoomsaalee toora interneetii adda baasuuf qajeelfama barbaachisaa.'
    },
    content: {
      en: `### 1. Electronic Banking & Mobile Money Protection
Never share One-Time Passwords (OTPs), PIN codes, or telebirr/bank verification SMS codes with anyone under any circumstances. Official bank or telecom personnel will never call or message asking for secret credentials.

### 2. Social Media Identity Theft & Impersonation
Fraudulent accounts often impersonate government officials, overseas employment agencies, or charity initiatives. Always verify official badges and do not transfer funds to individual personal bank accounts for alleged official registrations or visas.

### 3. Phishing Links & Malicious Attachments
Avoid clicking shortened links or downloading unfamiliar .apk or .exe files received via Telegram, WhatsApp, or unsolicited SMS. Ensure two-factor authentication (2FA) is activated on all primary messaging and email applications.

### 4. Incident Reporting to Cyber Forensics
If you have fallen victim to financial fraud, immediately request your bank to freeze transaction queues, take complete screenshots of chat histories, transaction reference numbers, and contact numbers, and report to the AAP Cyber Crime Unit.`,
      am: `### 1. የሞባይል ባንኪንግ እና የቴሌብር ጥበቃ
የይለፍ ቃልዎን፣ የኦቲፒ (OTP) ሚስጥር ቁጥርዎን ወይም የባንክ ማረጋገጫ ኮድዎን ለማንም አካል በምንም ሁኔታ አያጋሩ። ህጋዊ የባንክ ሰራተኞች ወይም የቴሌኮም ባለሙያዎች ሚስጥር ቁጥር አይጠይቁም።

### 2. የማህበራዊ ሚዲያ ማጭበርበር
የመንግስት የስራ ኃላፊዎችን፣ የውጭ ሀገር የስራ እድል አቅራቢዎችን አስመስለው የሚሰሩ የውሸት አካውንቶችን ይጠንቀቁ። ለማንኛውም ክፍያ ከመፈፀምዎ በፊት ትክክለኛነታቸውን ያረጋግጡ።

### 3. አጠራጣሪ ማስፈንጠሪያዎች (Links)
በቴሌግራም ወይም በኤስኤምኤስ የሚላኩ አጠራጣሪ ሊንኮችን አይክፈቱ። ለሁሉም የማህበራዊ ሚዲያ መተግበሪያዎች ባለ ሁለት ደረጃ ማረጋገጫ (2FA) ይጠቀሙ።

### 4. ለሳይበር ፖሊስ ሪፖርት ማድረግ
የማጭበርበር ሰለባ ከሆኑ የባንክ ዝውውር መረጃዎችን፣ የስክሪን ሾት ማስረጃዎችን በመያዝ በአስቸኳይ ለአዲስ አበባ ፖሊስ ሳይበር መምሪያ ያሳውቁ።`,
      om: `### 1. Eegumsa Baankii Moobaayilaa fi Telebirr
Koodii iccitii (OTP) yookiin lakkoofsa iccitii baankii keessanii eenyuufiyyuu hin kenninaa. Hojjattoonni baankii koodii iccitii hin gaafatan.

### 2. Gowwoomsaa Miidiyaa Hawaasaa
Herreega sobaa namoota beekamoo fakkaatan irraa of eeggadhaa. Kaffaltii dura mirkaneeffadhaa.

### 3. Gabaasa Yakka Saayibarii
Yoo gowwoomfamtan ragaa qabattanii hatattamaan Poolisii Finfinneetti gabaasaa.`
    },
    fileName: 'AAP_Cyber_Safety_Standards_2026.pdf',
    fileSize: '2.1 MB',
    status: 'published',
    isActive: true,
    publishedAt: new Date()
  },
  {
    slug: 'urban-road-safety-traffic-regulations',
    category: 'road_safety',
    documentNumber: 'AAP-DOC-2026-003',
    department: 'Traffic Management & Enforcement Division',
    title: {
      en: 'Addis Ababa Urban Road Safety & Traffic Regulations Handbook',
      am: 'የከተማ መንገድ ደህንነት፣ የፍጥነት ገደብ እና የእግረኞች ጥበቃ መመሪያ',
      om: 'Qajeelfama Nageenya Daandii Magaalaa fi Eegumsa Deemtota Faanaa'
    },
    summary: {
      en: 'Comprehensive traffic safety manual covering pedestrian zebra crossings, junction rules, heavy truck routing hours, and accident emergency response procedures.',
      am: 'የእግረኞች ማቋረጫ ህጎች፣ የመገናኛ አደባባዮች ደንቦች፣ የከባድ መኪኖች የሰዓት ገደብ እና የአደጋ ጊዜ ምላሽ አሰጣጥ የትራፊክ ደህንነት መመሪያ።',
      om: 'Qajeelfama nageenya tiraafiikaa guutuu: seera daandii qaxxaamura faanaa, sa\'aatii konkolaattota gurguddoo fi tarkaanfii hatattamaa balaa.'
    },
    content: {
      en: `### 1. Urban Speed Limits & Speed Enforcement
Within Addis Ababa municipal boundaries, general urban roads carry a maximum 50 km/h limit, with 30 km/h strictly enforced in school corridors, commercial plazas, and hospital proximity zones. Ring road corridors operate under posted 60-80 km/h ceilings.

### 2. Pedestrian Priority at Designated Crossings
Vehicles must yield unconditionally to pedestrians stepping onto marked zebra crossings. Pedestrians must use overhead footbridges and designated crossing points rather than climbing highway guardrails.

### 3. Commercial Transport & Peak-Hour Freight Restrictions
Freight transport vehicles exceeding 3.5 tonnes are restricted from operating in central arterials between 07:00-09:30 and 16:30-19:30 on weekdays to mitigate gridlock and pedestrian hazards.

### 4. Road Traffic Collisions Emergency Response
In the event of an accident:
- Immediately stop and activate vehicle hazard lights.
- Check for bodily injuries and dial 939 (Ambulance) and 991 (Police Traffic Division).
- Keep vehicles in place until traffic investigators arrive, unless ordered by an officer to clear an obstructed arterial.`,
      am: `### 1. የከተማ ፍጥነት ገደቦች
በአዲስ አበባ ከተማ ውስጥ አጠቃላይ የፍጥነት ገደብ 50 ኪ.ሜ/ሰዓት ሲሆን፣ በትምህርት ቤቶች እና በሆስፒታሎች አካባቢ 30 ኪ.ሜ/ሰዓት ነው። በዋና ዋና የክፍለ ከተማ ማስተላለፊያ መንገዶች በተለጠፉ ምልክቶች መሰረት ይሰራል።

### 2. የእግረኞች ቅድሚያ መብት
አሽከርካሪዎች በእግረኛ ማቋረጫ (Zebra crossing) ላይ ለሚሻገሩ እግረኞች ቅድሚያ የመስጠት ግዴታ አለባቸው። እግረኞችም የእግረኛ ድልድዮችንና ምልክት የተደረገባቸውን ቦታዎች ብቻ መጠቀም አለባቸው።

### 3. የከባድ መኪኖች የሰዓት ገደብ
ከ3.5 ቶን በላይ የሆኑ የጭነት ተሽከርካሪዎች በስራ መግቢያ እና መውጫ ሰዓት (ጠዋት 1:00 - 3:30 እና ከሰዓት 10:30 - 1:30) በዋና መንገዶች ላይ እንዳይንቀሳቀሱ የተከለከለ ነው።

### 4. የትራፊክ አደጋ ሲያጋጥም
አደጋ በሚደርስበት ወቅት ተሽከርካሪን ሳያንቀሳቅሱ የአደጋ ጊዜ መብራት በማብራት ለትራፊክ ፖሊስ እና ለአንቡላንስ በ939 እና 991 ይደውሉ።`,
      om: `### 1. Dangeeffama Saffisa Konkolaataa
Magaalaa Finfinnee keessatti saffisni olaanaan 50 km/h yoo ta'u, manneen barnootaa naannoo 30 km/h dha.

### 2. Mirga Deemtota Faanaa
Konkolaachistonni qaxxaamura faanaatiif dursa kennuun dirqama. Deemtonni faanaas riqicha faanaatti fayyadamuu qabu.

### 3. Balaan Tiraafiikaa Yoo Gahe
Bakka balaan gahetti konkolaataa hin sochoosinaa; hatattamaan 991 fi 939 bilbilaa.`
    },
    fileName: 'AAP_Urban_Traffic_Manual_2026.pdf',
    fileSize: '3.4 MB',
    status: 'published',
    isActive: true,
    publishedAt: new Date()
  },
  {
    slug: 'missing-persons-search-protocol-guidelines',
    category: 'missing_persons',
    documentNumber: 'AAP-DOC-2026-004',
    department: 'Special Investigations & Missing Persons Bureau',
    title: {
      en: 'Missing Persons Search Protocol & Reporting Guidelines',
      am: 'የጠፉ ሰዎች ፍለጋ ስርዓት እና የሪፖርት አቀራረብ መመሪያ',
      om: 'Qajeelfama Gabaasa fi Qorannoo Namoota Dhabamanii'
    },
    summary: {
      en: 'Official procedure for filing an immediate missing person notice, required identification documents, search coordination with sub-city divisions, and public broadcast notices.',
      am: 'አስቸኳይ የጠፋ ሰው ሪፖርት አቀራረብ፣ የሚያስፈልጉ መረጃዎች፣ ከክፍለ ከተማ መምሪያዎች ጋር ያለው ቅንጅት እና የህዝብ ማስታወቂያ ስርጭት መመሪያ።',
      om: 'Adeemsa beeksisa nama dhabamee hatattamaan dhiyeessuu, waraqaalee barbaachisan, fi qindoomina qorannoo kutaa magaalaa.'
    },
    content: {
      en: `### 1. No Waiting Period Requirement
There is strictly NO mandated 24-hour or 48-hour waiting period to report a missing child, vulnerable senior, or person facing imminent peril. If circumstances appear anomalous, report immediately.

### 2. Information to Provide Upon Filing
When visiting your nearest sub-city police station:
- Clear, recent high-resolution photograph.
- Full biological data: full legal name, age, height, identifiable marks (tattoos, birthmarks, scars).
- Clothing and footwear description last observed.
- Mobile device identifiers, last known GPS coordinates, and banking/financial card activity.
- Known associates, recent transit routes, or medical conditions requiring regular medication.

### 3. Dispatch & Broadcast Channels
Upon verification, the AAP Operations Room broadcasts immediate alerts to all patrol units across the 11 sub-cities, bus terminals, airport checkpoints, and regional border entry posts.`,
      am: `### 1. የሰዓት ገደብ አለመኖር
ህፃናት፣ አረጋውያን ወይም አስጊ ሁኔታ ላይ ያሉ ሰዎች ሲጠፉ 24 ወይም 48 ሰዓት መጠበቅ አያስፈልግም። ሁኔታው አጠራጣሪ እንደሆነ ወዲያውኑ ሪፖርት ማድረግ ይቻላል።

### 2. ሪፖርት በሚደረግበት ወቅት የሚያስፈልጉ መረጃዎች
በአቅራቢያዎ ወደሚገኝ ፖሊስ ጣቢያ ሲመጡ፡
- የጠፋው ሰው የቅርብ ጊዜ ግልጽ ፎቶግራፍ
- ሙሉ ስም፣ ዕድሜ፣ ቁመት፣ የሰውነት መለያ ምልክቶች
- በወቅቱ የለበሱት አልባሳትና ጫማ ዝርዝር
- የመጨረሻ የታዩበት ቦታ፣ የስልክ ቁጥር እና የባንክ እንቅስቃሴ
- አስፈላጊ የጤና ሁኔታዎችና መድሃኒት የሚወስዱ ከሆነ

### 3. የፖሊስ ቅንጅት እና ፍለጋ
ሪፖርቱ እንደደረሰ በአዲስ አበባ በሚገኙ 11ዱም ክፍለ ከተሞች፣ በአውቶቡስ ተርሚናሎች እና በመውጫ ኬላዎች ላይ የፍለጋ መረጃ ወዲያውኑ ይሰራጫል።`,
      om: `### 1. Yeroo Eeguun Hin Barbaachisu
Daa'imman yookiin maanguddoon yoo dhabaman sa'aatii 24 eeguun hin barbaachisu; hatattamaan gabaasaa.

### 2. Ragaalee Barbaachisan
Suuraa dhiyoo, maqaa guutuu, umrii, hojjaa, uffata uffatanii fi iddoo dhuma irratti argaman dhiyeessaa.

### 3. Qorannoo Poolisii
Gabaasni dhiyaate kutaalee magaalaa 11 keessatti poolisoota daandii irra jiraniif hatattamaan dabarfama.`
    },
    fileName: 'AAP_Missing_Persons_Protocol_2026.pdf',
    fileSize: '1.1 MB',
    status: 'published',
    isActive: true,
    publishedAt: new Date()
  },
  {
    slug: 'wanted-persons-public-investigation-protocol',
    category: 'most_wanted',
    documentNumber: 'AAP-DOC-2026-005',
    department: 'Major Crimes & Criminal Investigation Division',
    title: {
      en: 'Active Investigation Notices & Wanted Fugitive Reporting Protocol',
      am: 'የሚፈለጉ ወንጀለኞች ማስታወቂያ እና የህዝብ ጥቆማ አሰጣጥ መመሪያ',
      om: 'Beeksisa Shakkamtoota Barbaadaman fi Qajeelfama Odeeffannoo Kennuu'
    },
    summary: {
      en: 'Official protocol regarding fugitive public appeals, citizen safety directives, verified reporting hotlines, and anonymous witness protection safeguards.',
      am: 'በወንጀል የሚፈለጉ ተጠርጣሪዎች ይፋዊ ጥሪ፣ የዜጎች ጥንቃቄ መመሪያዎች፣ ሚስጥራዊ የጥቆማ መስመሮች እና የደህንነት ጥበቃ ስርዓት።',
      om: 'Qajeelfama waa\'ee beeksisa shakkamtoota barbaadamanii, nageenya lammilee, sarara bilbila iccitii, fi eegumsa ragaa baatootaa.'
    },
    content: {
      en: `### 1. Citizen Caution & Non-Confrontation Policy
Individuals published on the Wanted Notices list are subjects of active judicial arrest warrants issued by the Federal High Court or City Courts. Members of the public are strictly advised NEVER to approach, confront, or attempt citizen apprehension of these subjects, as they may be armed or dangerous.

### 2. Confidential Tip-Off Channels
Citizens with credible information on the whereabouts of wanted suspects may relay intel through:
- Toll-Free Emergency Hotline: 991
- Confidential Criminal Intelligence Line: +251 11 551 2222
- Secure Online Crime Submission Portal (supports anonymous witness disclosures).

### 3. Witness Protection & Identity Safeguards
Under Ethiopian criminal justice guidelines, identities of informants assisting in the location of major felony fugitives remain completely confidential and protected under police operational protocols.`,
      am: `### 1. የዜጎች ጥንቃቄ - ራስን ለአደጋ አለማጋለጥ
በሚፈለጉ ተጠርጣሪዎች ዝርዝር ውስጥ የተካተቱ ግለሰቦች በፍርድ ቤት የእስር ማዘዣ የወጣባቸው ናቸው። ህብረተሰቡ እነዚህን ግለሰቦች በራሱ ለመያዝ መሞከር በጥብቅ የተከለከለ ሲሆን፣ ለደህንነትዎ ጥንቃቄ ያድርጉ።

### 2. ሚስጥራዊ የጥቆማ መስመሮች
ስለ ተጠርጣሪዎች መረጃ ያለው ማንኛውም ዜጋ በሚከተሉት መንገዶች ጥቆማ መስጠት ይችላል፡
- ነፃ የስልክ መስመር፡ 991
- የወንጀል ምርመራ ቀጥታ መስመር፡ +251 11 551 2222
- የፖሊስ ድረ-ገጽ ኦንላይን ጥቆማ መስጫ (ስም ሳይገለጽ የሚላክ)

### 3. የጠቋሚዎች ደህንነት ጥበቃ
መረጃ ለሰጡ ዜጎች ሙሉ ሚስጥራዊነት የተጠበቀ ሲሆን በህግ መሰረት የደህንነት ጥበቃ ይደረግላቸዋል።`,
      om: `### 1. Of Eeggannoo Lammilee
Shakkamtoota barbaadaman qabuuf ofiin hin yaalinaa; of eeggadhaa.

### 2. Bilbila Iccitii
Odeeffannoo yoo qabaattan bilbila bilisaa 991 yookiin toora intarneetii keenyaan icciitiin gabaasaa.

### 3. Eegumsa Iccitii
Eenyummaan nama odeeffannoo kenne guutummaatti eegamaadha.`
    },
    fileName: 'AAP_Wanted_Persons_Public_Notice_2026.pdf',
    fileSize: '1.9 MB',
    status: 'published',
    isActive: true,
    publishedAt: new Date()
  },
  {
    slug: 'city-wide-public-safety-advisory-guidelines',
    category: 'safety_advisories',
    documentNumber: 'AAP-DOC-2026-006',
    department: 'Addis Ababa Police Headquarters Operations Command',
    title: {
      en: 'City-Wide Public Safety Advisory & Major Events Vigilance Guidelines',
      am: 'የከተማ አቀፍ የህዝብ ደህንነት ማሳሰቢያ እና የህዝብ ሰብሰባዎች ጥንቃቄ መመሪያ',
      om: 'Gorsa Nageenya Ummataa fi Qajeelfama Dammaqina Walga\'ii Magaalaa'
    },
    summary: {
      en: 'General safety advisories for commercial districts, market corridors, seasonal festivities, crowd navigation, and reporting unattended bags or suspicious activity.',
      am: 'ለንግድ አካባቢዎች፣ ለገበያ ማዕከላት፣ ለበዓላት እና ለህዝብ እንቅስቃሴዎች የተዘጋጀ የደህንነት ማሳሰቢያና አጠራጣሪ ነገሮችን የመጠቆም መመሪያ።',
      om: 'Gorsa nageenyaa naannoo daldalaa, gabaa, ayyaanota, fi wantoota shakkisiisoo gabaasuu ilaalchisee qophaa\'e.'
    },
    content: {
      en: `### 1. Market Corridors & Crowded Public Spaces
In busy trading districts such as Merkato, Piazza, Megenagna, and Stadium transit hubs, remain attentive to personal belongings. Keep mobile phones, wallets, and legal documentation secured in zippered inside pockets.

### 2. Major Events and Public Gatherings Safety
During city-wide holidays, cultural festivals, and major sports gatherings:
- Establish designated reunification spots with family members.
- Adhere to perimeter security screening checkpoints conducted by federal and city police.
- Report unattended luggage, parcels, or parcels left in transport terminals to police immediately.

### 3. Neighborhood Vigilance & Suspicious Activity
If you observe abnormal gatherings, weapon brandishing, or unlicensed public disturbances, contact the division command without intervention. Cooperation between the police and public is the foundation of city safety.`,
      am: `### 1. የገበያ ቦታዎች እና የህዝብ መጓጓዣዎች
በመርካቶ፣ ፒያሳ፣ መገናኛ እና ሌሎች የህዝብ መበራከቻ አካባቢዎች የግል ንብረትዎን፣ ስልክዎን እና ቦርሳዎን በጥንቃቄ ይያዙ። የኪስ አውላቂዎችን ንቃት ይከታተሉ።

### 2. ህዝባዊ በዓላት እና ትላልቅ ዝግጅቶች
በበዓላት እና በስፖርታዊ ውድድሮች ወቅት፡
- ከቤተሰብ አባላት ጋር የመገናኛ ቦታዎችን አስቀድመው ይለዩ
- በፖሊስ የሚደረጉ የፍተሻ እና የደህንነት መመሪያዎችን ይተግብሩ
- ባለቤት አልባ ሻንጣዎችን ወይም እቃዎችን ሲመለከቱ በአስቸኳይ ለፖሊስ ይጠቁሙ

### 3. አጠራጣሪ እንቅስቃሴዎችን መጠቆም
ያልተለመዱ እንቅስቃሴዎችን፣ ህገ-ወጥ የጦር መሳሪያዎችን ወይም ጸጥታ የሚያውኩ ሁኔታዎችን ሲመለከቱ ሳይዘገዩ ለፖሊስ ጣቢያዎ ወይም በ991 ያሳውቁ።`,
      om: `### 1. Bakkeewwan Gabaa fi Geejjibaa
Merkato, Piyasaa fi Magananyaatti qabeenya keessan, moobaayilaa fi boorsaa of eeggannoon qabadhaa.

### 2. Ayyaanota fi Walga'iiwwan Gurguddoo
Wantoota shakkisiisoo, boorsaa abbaa hin qabne yoo argitan hatattamaan poolisiitti beeksisaa.

### 3. Nageenya Waliinii
Nageenyi magaalaa keenyaa kan mirkanaa'u wal-tumsa ummataa fi poolisiitiini.`
    },
    fileName: 'AAP_Public_Safety_Advisory_2026.pdf',
    fileSize: '2.8 MB',
    status: 'published',
    isActive: true,
    publishedAt: new Date()
  }
];

for (const doc of initialDocuments) {
  await SafetyDocument.updateOne(
    { slug: doc.slug },
    { $set: doc },
    { upsert: true }
  );
}

const initialMediaAssets = [
  {
    fileName: 'Addis_Ababa_Police_Patrol_Fleet.jpg',
    path: '/addis-skyline.jpg',
    mimeType: 'image/jpeg',
    size: 955160,
    category: 'image',
    altText: {
      en: 'Addis Ababa Police City Patrol Fleet and Rapid Response Units',
      am: 'የአዲስ አበባ ፖሊስ የከተማ ጥበቃ ተሸከርካሪዎች እና ፈጣን ምላሽ ክፍሎች',
      om: 'Mootaraa fi Konkolaattota Qophii Hatattamaa Poolisii Finfinnee'
    },
    caption: {
      en: 'Official parade and readiness display across major metropolitan patrol routes.',
      am: 'በዋና ዋና የከተማ መንገዶች የተከናወነ ይፋዊ የሰልፍ እና የዝግጁነት ማሳያ።',
      om: 'Daawwannaa fi qophii poolisii daandiiwwan gurguddoo irratti taasifame.'
    }
  },
  {
    fileName: 'Commissioner_General_Official_Portrait.jpg',
    path: '/commissioner.jpg',
    mimeType: 'image/jpeg',
    size: 703199,
    category: 'image',
    altText: {
      en: 'Official Portrait of Commissioner General Demelash Gebremichael',
      am: 'የኮሚሽነር ጀነራል ደመላሽ ገብረሚካኤል ይፋዊ ፎቶግራፍ',
      om: 'Suuraa Mootummaa Koomishinar Jeneraal Dammallaash Gabramikaa\'el'
    },
    caption: {
      en: 'High-resolution official portrait for press publications and official news coverage.',
      am: 'ለፕሬስ ህትመቶች እና ለይፋዊ የዜና ሽፋን የተዘጋጀ ጥራት ያለው ፎቶግራፍ።',
      om: 'Suuraa qulqullina olaanaa qabu kan maxxansa miidiyaatiif qophaa\'e.'
    }
  },
  {
    fileName: 'Addis_Ababa_Police_Official_Insignia_Crest.png',
    path: '/aap-crest.png',
    mimeType: 'image/png',
    size: 325188,
    category: 'image',
    altText: {
      en: 'Addis Ababa Police Official Seal and Crest',
      am: 'የአዲስ አበባ ፖሊስ ይፋዊ ማህተም እና አርማ',
      om: 'Asxaa fi Chaappaa Seera Qabeessa Poolisii Finfinnee'
    },
    caption: {
      en: 'High-definition vector insignia for accredited news publications and official documentation.',
      am: 'ለዜና ተቋማት እና ይፋዊ ሰነዶች የተዘጋጀ ከፍተኛ ጥራት ያለው የፖሊስ አርማ።',
      om: 'Asxaa qulqullina olaanaa qabu waraqaalee seera qabeessaaf.'
    }
  },
  {
    fileName: 'Annual_Readiness_Inspection_2026.mp4',
    path: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    mimeType: 'video/mp4',
    size: 15400000,
    category: 'video',
    altText: {
      en: 'Addis Ababa Police 2026 Annual Operational Readiness and Community Safety Review',
      am: 'የአዲስ አበባ ፖሊስ 2026 ዓመታዊ የክዋኔ ዝግጁነት እና የማህበረሰብ ደህንነት ግምገማ',
      om: 'Daawwannaa Qophii fi Nageenya Hawaasaa Poolisii Finfinnee 2026'
    },
    caption: {
      en: 'Broadcast recording of commissioner general addressing tactical modernization and emergency preparedness.',
      am: 'ኮሚሽነር ጀነራሉ ስለ ዘመናዊ አሰራር እና ድንገተኛ አደጋ ዝግጁነት ያስተላለፉት ይፋዊ የቪዲዮ ስርጭት።',
      om: 'Waraabbii tamsaasa viidiyoo qophii poolisii fi teknoolojii haaraa ilaalchisee.'
    }
  },
  {
    fileName: 'City_Traffic_Flow_Corridor_Briefing.mp4',
    path: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    mimeType: 'video/mp4',
    size: 12200000,
    category: 'video',
    altText: {
      en: 'Metropolitan Traffic Safety & Intelligent Signals Operation',
      am: 'የከተማው የትራፊክ ደህንነት እና ስማርት ሲግናሎች አሰራር',
      om: 'Nageenya Daandii Magaalaa fi Mallattoolee Ammayyaa'
    },
    caption: {
      en: 'Overview of city traffic safety initiatives, pedestrian corridors, and speed enforcement monitoring.',
      am: 'የትራፊክ ደህንነት፣ የእግረኞች መተላለፊያ እና የፍጥነት ቁጥጥር ስርዓትን የተመለከተ ማብራሪያ።',
      om: 'Ibsa nageenya daandii fi to\'annoo saffisa konkolaattotaa magaalaa keessaa.'
    }
  },
  {
    fileName: 'AAP_Official_Media_Kit_Brand_Guide_2026.pdf',
    path: '/AAP_Press_Media_Kit_2026.pdf',
    mimeType: 'application/pdf',
    size: 2450000,
    category: 'document',
    altText: {
      en: 'Official Media Guide, Accreditation Protocols & Media Contact Directory 2026',
      am: 'ይፋዊ የሚዲያ መመሪያ፣ የጋዜጠኞች እውቅና አሰጣጥ እና የመገናኛ አድራሻዎች 2026',
      om: 'Qajeelfama Miidiyaa, Haala Eeyyama Gaazexeessummaa fi Teessoo 2026'
    },
    caption: {
      en: 'Essential guidelines, embargo policy, and media contact channels for accredited press outlets.',
      am: 'ለተፈቀደላቸው የሚዲያ ተቋማት የተዘጋጀ መመሪያ፣ የስነ-ምግባር ደንብ እና የመገናኛ መስመሮች።',
      om: 'Qajeelfama barbaachisaa miidiyaalee seera qabeessaa fi qunnamtii isaaniif.'
    }
  },
  {
    fileName: 'Quarterly_Crime_Prevention_Statistical_Report_Q1.pdf',
    path: '/Quarterly_Safety_Statistics_Q1_2026.pdf',
    mimeType: 'application/pdf',
    size: 3820000,
    category: 'document',
    altText: {
      en: 'Quarterly Crime Reduction and Response Outcomes Report - Q1 2026',
      am: 'የሩብ ዓመት የወንጀል ቅነሳ እና የአስቸኳይ ጊዜ ምላሽ ሪፖርት - 2026',
      om: 'Gabaasa Istaatiistiksii Hir\'ina Yakkaa Kurmaana 1ffaa 2026'
    },
    caption: {
      en: 'Public statistical digest outlining emergency response times, crime prevention metrics, and division performance.',
      am: 'የምላሽ አሰጣጥ ፍጥነት፣ የወንጀል መከላከል ውጤቶች እና የክፍለ ከተሞች አፈፃፀም የተካተተበት ይፋዊ ሪፖርት።',
      om: 'Ibsa yeroo deebii hatattamaa fi qorannoo raawwii kutaalee magaalaa.'
    }
  },
  {
    fileName: 'Commissioner_General_City_Radio_Address.mp3',
    path: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
    mimeType: 'audio/mpeg',
    size: 4200000,
    category: 'audio',
    altText: {
      en: 'Commissioner General Demelash Gebremichael City-Wide Radio Address on Public Trust',
      am: 'ኮሚሽነር ጀነራል ደመላሽ ገብረሚካኤል ስለ ህዝብ አጋርነት ያስተላለፉት የሬዲዮ መልዕክት',
      om: 'Waraabbii Sagalee Raadiyoo: Koomishinar Jeneraal Dammallaash Gabramikaa\'el'
    },
    caption: {
      en: 'Audio recording: Keynote address broadcast across metropolitan radio on strengthening community trust and security partnership.',
      am: 'በሬዲዮ የተላለፈ የድምጽ ቅጂ፡ የማህበረሰብ ፖሊሲንግ እና የህዝብ ተሳትፎን ለማጠናከር የተላለፈ መልዕክት።',
      om: 'Waraabbii sagalee qajeelfama poolisii hawaasaa fi nageenya waloo irratti darbe.'
    }
  },
  {
    fileName: '991_Emergency_Dispatch_Protocols_Audio_Notice.mp3',
    path: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
    mimeType: 'audio/mpeg',
    size: 1950000,
    category: 'audio',
    altText: {
      en: 'Official Audio Guide: When and How to Use the 991 Emergency Hotline',
      am: 'ይፋዊ የድምጽ መመሪያ፡ የ991 አስቸኳይ ጊዜ መስመርን እንዴት መጠቀም እንደሚገባ',
      om: 'Qajeelfama Sagalee: Sarara Hatattamaa 991 Akkamitti Itti Fayyadamaa'
    },
    caption: {
      en: 'Public advisory audio explaining priority dispatch lines, medical cooperation, and emergency hotline etiquette.',
      am: 'የአደጋ ጊዜ ጥሪ ቅድሚያ አሰጣጥን እና ከህክምና ቡድኖች ጋር ያለውን ቅንጅት የሚያስረዳ የድምጽ ማስታወቂያ።',
      om: 'Beeksisa sagalee itti fayyadama sarara bilbila hatattamaa 991.'
    }
  }
];

for (const asset of initialMediaAssets) {
  await MediaAsset.updateOne(
    { fileName: asset.fileName },
    { $set: asset },
    { upsert: true }
  );
}

await SiteSettings.updateOne(
  { _key: 'singleton' },
  {
    $setOnInsert: {
      _key: 'singleton',
      heroSlides: [
        {
          tag: {
            en: 'PROTECTING OUR CITY, SERVING OUR COMMUNITY',
            am: 'ከተማችንን መጠበቅ፣ ማህበረሰባችንን ማገልገል',
            om: 'MAGAALAA KEENYA EEGUU, HAWAASA KEENYA TAJAAJILUU'
          },
          headline: {
            en: 'Safety, trust, and service.',
            am: 'ደህንነት፣ እምነት እና አገልግሎት።',
            om: 'Nageenya, amantaa fi tajaajila.'
          },
          body: {
            en: 'Working together for a safer Addis Ababa — with integrity, courage, and respect for every community.',
            am: 'ለተሻለች እና ሰላማዊ አዲስ አበባ በቅንነት፣ በድፍረት እና ለማህበረሰቡ ክብር በመስጠት በጋራ እንሰራለን።',
            om: 'Finfinnee nagaa fi tasgabbooftuu ijaaruuf qulqullinaan, gootummaan fi hawaasa hundaaf kabaja kennuun waliin hojjenna.'
          },
          image: '/addis-skyline.jpg',
          link: '#police-services',
          linkText: {
            en: 'POLICE SERVICES',
            am: 'የፖሊስ አገልግሎቶች',
            om: 'TAJAAJILA POOLISII'
          }
        },
        {
          tag: {
            en: '24/7 DEDICATED OPERATIONS',
            am: '24/7 ቀጣይነት ያለው አገልግሎት',
            om: "TAJAAJILA SA'AATII 24 BULTII 7"
          },
          headline: {
            en: 'Always vigilant. Ready to respond.',
            am: 'ሁልጊዜ ነቅተን ዝግጁ ሆነን እንጠብቃለን።',
            om: 'Yeroo hunda dammaqinaan tajaajiluuf qophiidha.'
          },
          body: {
            en: 'Over 11 Sub-City Divisions and round-the-clock emergency patrol units safeguarding peace day and night.',
            am: 'በ11ዱም ክፍለ ከተሞች እና በየወረዳው የሚገኙ ፈጣን ምላሽ ሰጪ ክፍሎች የከተማዋን ሰላምና ጸጥታ ቀን ከሌሊት ያስከብራሉ።',
            om: 'Kutaalee magaalaa 11 keessatti gareen deebii hatattamaa halkanii fi guyyaa nageenya lammilee eega.'
          },
          image: '/addis-skyline.jpg',
          link: '/stations',
          linkText: {
            en: 'STATIONS & CONTACTS',
            am: 'ጣቢያዎች እና አድራሻዎች',
            om: 'WAAJJIRAALEE & BILBILA'
          }
        },
        {
          tag: {
            en: 'COMMUNITY PARTNERSHIP',
            am: 'የማህበረሰብ አጋርነት',
            om: 'WALTUMSA HAWAASAA'
          },
          headline: {
            en: 'Stronger neighborhoods built together.',
            am: 'ጠንካራ ሰፈር በጋራ ጥረት ይገነባል።',
            om: "Naannoo nageenyi isaa mirkanaa'e waliin ijaarra."
          },
          body: {
            en: 'Proactive crime prevention through citizen dialogue, neighborhood watch forums, and trusted community engagement.',
            am: 'ከህዝቡ ጋር በሚደረግ የጋራ ውይይት፣ የሰፈር ጥበቃ እና የማህበረሰብ ፖሊሲንግ ወንጀልን አስቀድሞ መከላከል።',
            om: 'Marii ummataa, eegumsa naannoo fi poolisii hawaasaatiin yakka dursanii ittisuu.'
          },
          image: '/addis-skyline.jpg',
          link: '/community',
          linkText: {
            en: 'COMMUNITY POLICING',
            am: 'የማህበረሰብ ፖሊሲንግ',
            om: 'POOLISII HAWAASAA'
          }
        }
      ]
    }
  },
  { upsert: true }
);

const initialVacancies = [
  {
    title: {
      en: 'Cadet Police Officer (Regular Service)',
      am: 'የፖሊስ ካዴት መኮንን (መደበኛ አገልግሎት)',
      om: 'Miseensa Poolisii Kaadeetii'
    },
    department: 'Operations & Patrol Directorate',
    location: 'Addis Ababa Metropolitan Divisions (All 11 Sub-Cities)',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    description: {
      en: 'Entry-level cadet recruitment for patrol operations, incident response, and neighborhood protection. Full academy training provided upon selection.',
      am: 'ለመደበኛ የጥበቃ፣ የፈጣን ምላሽ እና የከተማ ሰላም ማስከበር ስራዎች የሚመለመሉ የፖሊስ ካዴት መኮንኖች ክፍት የስራ ቦታ።',
      om: 'Hojii eegumsaa, deebii hatattamaa fi nageenya eegsisuuf miseensota kaadeetii haaraa qacaruuf dorgommii banaa.'
    },
    requirements: {
      en: 'High school completion or diploma; Age 18–28; Ethiopian citizenship; clean criminal record; medical and physical fitness clearance.',
      am: 'የሁለተኛ ደረጃ ትምህርት ወይም ዲፕሎማ ያጠናቀቀ/ች፤ ዕድሜ ከ18-28፤ ከማንኛውም ወንጀል ነጻ፤ የህክምና እና የአካል ብቃት ማረጋገጫ።',
      om: 'Kutaa 12 kan xumure/diploma; Umuriin 18-28; Galmee yakkaa irraa bilisa; Fayyummaa qaamaa kan qabu.'
    },
    status: 'open',
    publishedAt: new Date()
  },
  {
    title: {
      en: 'Cybercrime Forensic Investigator',
      am: 'የሳይበር ወንጀል ፎረንሲክ መርማሪ',
      om: 'Qorataa Saayibarii fi Ragaa Diijitaalaa'
    },
    department: 'Digital Forensics & Cyber Investigation Unit',
    location: 'Police Headquarters, Mexico Square, Addis Ababa',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    description: {
      en: 'Specialist role investigating electronic fraud, system breaches, unauthorized data access, and digital forensic evidence recovery for judicial proceedings.',
      am: 'የኤሌክትሮኒክስ ማጭበርበር፣ የሲስተም ጥሰት እና የዲጂታል ማስረጃዎችን የመመርመር እና የማስረጃ ትንተና ስራ።',
      om: 'Yakka saayibarii, gowwoomsaa elektirooniksii fi ragaalee diijitaalaa qorachuu fi xiinxaluu.'
    },
    requirements: {
      en: 'BSc in Computer Science, Cybersecurity, Information Systems, or related field; 2+ years of relevant security/forensic analysis experience.',
      am: 'በኮምፒውተር ሳይንስ፣ ሳይበር ደህንነት ወይም ተዛማጅ መስክ የመጀመሪያ ዲግሪ እና 2+ ዓመት አግባብነት ያለው የስራ ልምድ።',
      om: 'Digirii jalqabaa Saayinsii Kompiwitaraa ykn Nageenya Saayibarii; Muuxannoo hojii waggaa 2 fi isaa ol.'
    },
    status: 'open',
    publishedAt: new Date()
  },
  {
    title: {
      en: 'Traffic Safety & Corridor Management Officer',
      am: 'የትራፊክ ደህንነት እና ቁጥጥር ባለሙያ',
      om: 'Ogeessa Nageenya Tiraafikaa Magaalaa'
    },
    department: 'Traffic Management & Highway Patrol Directorate',
    location: 'City Corridor Management Commands, Addis Ababa',
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    description: {
      en: 'Enforcing metropolitan road regulations, automated speed monitoring, major corridor collision response, and road safety education campaigns.',
      am: 'የከተማውን የትራፊክ ደንቦች ማስከበር፣ የፍጥነት ቁጥጥር እና የአደጋ መከላከል ግንዛቤ ማስጨበጫ ስራዎች።',
      om: 'Seera tiraafikaa kabachiisuu, to\'annoo saffisaa fi ittisa balaa konkolaataa irratti hojjechuu.'
    },
    requirements: {
      en: 'Diploma or Degree in Transport Management, Law Enforcement, or related field; Valid driver license; Good communication skills.',
      am: 'በትራንስፖርት ማኔጅመንት፣ ፖሊስ ሳይንስ ወይም ተዛማጅ መስክ ዲፕሎማ ወይም ዲግሪ፤ ህጋዊ የመንጃ ፈቃድ።',
      om: 'Tajaajila Geejjibaa ykn Saayinsii Poolisiitiin Diploomaa ykn Digirii; Hayyama konkolaachisummaa.'
    },
    status: 'open',
    publishedAt: new Date()
  },
  {
    title: {
      en: 'Community Outreach & Youth Engagement Specialist',
      am: 'የማህበረሰብ ፖሊሲንግ እና የወጣቶች አስተባባሪ',
      om: 'Qindeessaa Poolisii Hawaasaa fi Dargaggootaa'
    },
    department: 'Crime Prevention & Community Policing Directorate',
    location: 'Sub-City Police Commands, Addis Ababa',
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    description: {
      en: 'Coordinating neighborhood safety committees, youth anti-crime clubs, volunteer programs, and citizen-police consultative forums.',
      am: 'የሰፈር ደህንነት ኮሚቴዎችን፣ የወጣቶች የወንጀል መከላከያ ክበባትን እና የህዝብ ግንኙነት መድረኮችን የማስተባበር ስራ።',
      om: 'Koree nageenya naannoo, kilaba dargaggootaa fi waltumsa poolisii fi hawaasaa qindeessuu.'
    },
    requirements: {
      en: 'BA in Sociology, Social Work, Public Administration, or related discipline; strong community engagement and conflict mediation abilities.',
      am: 'በሶሲዮሎጂ፣ ማህበራዊ ስራ፣ የህዝብ አስተዳደር ወይም ተዛማጅ መስክ የመጀመሪያ ዲግሪ።',
      om: 'Digirii Soosiyoolojii, Hojii Hawaasummaa ykn Bulchiinsa Ummataa; Dandeettii hariiroo hawaasaa.'
    },
    status: 'open',
    publishedAt: new Date()
  },
  {
    title: {
      en: '991 Emergency Dispatch & Communications Operator',
      am: 'የ991 ድንገተኛ ጥሪ ተቀባይ እና አስተባባሪ',
      om: 'Ogeessa Sarara Hatattamaa 991'
    },
    department: 'Command & Emergency Dispatch Directorate',
    location: 'Central Police Command Center, Addis Ababa',
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    description: {
      en: 'Receiving incoming citizen distress calls, triaging emergency incidents, dispatching frontline patrol units, and coordinating with ambulance/fire services.',
      am: 'የህዝብ የአስቸኳይ ጊዜ ጥሪዎችን መቀበል፣ መመደብ እና የፈጣን ምላሽ ሰጪ ክፍሎችን በሬዲዮ ማስተባበር።',
      om: 'Bilbila hatattamaa ummataa fudhachuu, adda baasuu fi garee deebii hatattamaa qindeessuu.'
    },
    requirements: {
      en: 'Diploma or Degree; multi-lingual fluency (Amharic and Afaan Oromoo required, English advantageous); ability to work under high pressure on 24/7 rotational shifts.',
      am: 'ዲፕሎማ ወይም ዲግሪ፤ አማርኛ እና አፋን ኦሮሞ አቀላጥፎ መናገር የሚችል/የምትችል፤ በፈረቃ ለመስራት ፍቃደኛ።',
      om: 'Diploomaa ykn Digirii; Afaan Oromoo fi Amaariffa sirriitti kan danda\'u; Dabaree sa\'aatii 24 hojjechuuf qophii kan ta\'e.'
    },
    status: 'open',
    publishedAt: new Date()
  }
];

for (const vac of initialVacancies) {
  await Vacancy.updateOne(
    { 'title.en': vac.title.en },
    { $set: vac },
    { upsert: true }
  );
}

await SiteSettings.updateOne(
  { _key: 'singleton' },
  {
    $setOnInsert: {
      siteName: { en: 'Addis Ababa Police', am: 'የአዲስ አበባ ፖሊስ', om: 'Poolisii Finfinnee' },
      tagline: { en: 'Public service • Safety • Trust', am: 'የህዝብ አገልግሎት • ደህንነት • እምነት', om: 'Tajaajila Ummataa • Nageenya • Amanamummaa' },
      footerCopy: { en: '© 2026 Addis Ababa Police Commission. All rights reserved.', am: '© 2026 የአዲስ አበባ ፖሊስ ኮሚሽን። መብቱ በህግ የተጠበቀ ነው።', om: '© 2026 Koomishinii Poolisii Finfinnee. Mirgi seeraan eegamaadha.' },
      socialLinks: [
        { platform: 'Facebook', url: 'https://www.facebook.com/AddisAbabaPolice' },
        { platform: 'Telegram', url: 'https://t.me/AddisAbabaPolice' },
        { platform: 'X (Twitter)', url: 'https://x.com/AddisPolice' },
        { platform: 'YouTube', url: 'https://www.youtube.com/@AddisAbabaPoliceCommission' },
        { platform: 'TikTok', url: 'https://www.tiktok.com/@addisababapolice' }
      ]
    }
  },
  { upsert: true }
);

console.log('Seed complete. Admin login: admin@aap.local / password');
await mongoose.disconnect();
