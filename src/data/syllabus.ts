import type { Paper, Subject, Topic } from '../types'

export const papers: Paper[] = [
  {
    id: 'prelims-gs1',
    name: 'Prelims — General Studies Paper I',
    nameHi: 'प्रारंभिक — सामान्य अध्ययन प्रश्नपत्र I',
    shortName: 'Prelims GS I',
    description: 'History, Geography, Polity, Economy, Environment, Science & Technology and Current Affairs.',
    subjects: ['history', 'art-culture', 'geography', 'polity', 'economy', 'environment', 'science-tech', 'current-affairs'],
  },
  {
    id: 'csat',
    name: 'Prelims — CSAT Paper II',
    nameHi: 'प्रारंभिक — सीएसएटी प्रश्नपत्र II',
    shortName: 'CSAT',
    description: 'A qualifying paper testing comprehension, reasoning, numeracy and decision making.',
    subjects: ['comprehension', 'reasoning', 'numeracy', 'data-interpretation', 'decision-making'],
  },
  {
    id: 'mains-essay',
    name: 'Mains — Essay',
    nameHi: 'मुख्य — निबंध',
    shortName: 'Essay',
    description: 'Two essays on philosophical, social, economic and political themes.',
    subjects: ['essay'],
  },
  {
    id: 'mains-gs1',
    name: 'Mains — GS Paper I',
    nameHi: 'मुख्य — सामान्य अध्ययन I',
    shortName: 'GS I',
    description: 'Indian heritage and culture, history, geography and society.',
    subjects: ['heritage', 'history-mains', 'geography-mains', 'society'],
  },
  {
    id: 'mains-gs2',
    name: 'Mains — GS Paper II',
    nameHi: 'मुख्य — सामान्य अध्ययन II',
    shortName: 'GS II',
    description: 'Constitution, polity, governance, social justice and international relations.',
    subjects: ['constitution', 'governance', 'social-justice', 'ir'],
  },
  {
    id: 'mains-gs3',
    name: 'Mains — GS Paper III',
    nameHi: 'मुख्य — सामान्य अध्ययन III',
    shortName: 'GS III',
    description: 'Economy, agriculture, science and technology, environment, disaster management and internal security.',
    subjects: ['economy-mains', 'agriculture', 'science-tech-mains', 'environment-mains', 'disaster', 'internal-security'],
  },
  {
    id: 'mains-gs4',
    name: 'Mains — GS Paper IV',
    nameHi: 'मुख्य — सामान्य अध्ययन IV',
    shortName: 'GS IV',
    description: 'Ethics, integrity and aptitude, including case studies.',
    subjects: ['ethics', 'integrity-aptitude', 'case-studies'],
  },
  {
    id: 'optional',
    name: 'Optional Subject',
    nameHi: 'वैकल्पिक विषय',
    shortName: 'Optional',
    description: 'Two papers on a chosen optional subject. Add syllabi dynamically from Admin.',
    subjects: ['optional'],
    optional: true,
  },
]

export const subjects: Subject[] = [
  { id: 'history', paperId: 'prelims-gs1', name: 'History', nameHi: 'इतिहास', code: 'HIS', description: 'Ancient, medieval and modern Indian history with world history linkages.', color: '#b45309' },
  { id: 'art-culture', paperId: 'prelims-gs1', name: 'Art & Culture', nameHi: 'कला एवं संस्कृति', code: 'ART', description: 'Architecture, sculpture, painting, dance, music and religious traditions.', color: '#a21caf' },
  { id: 'geography', paperId: 'prelims-gs1', name: 'Geography', nameHi: 'भूगोल', code: 'GEO', description: 'Physical, Indian and world geography with human and economic dimensions.', color: '#0f766e' },
  { id: 'polity', paperId: 'prelims-gs1', name: 'Indian Polity', nameHi: 'भारतीय राजव्यवस्था', code: 'POL', description: 'Constitution, institutions, federalism and governance.', color: '#1d4ed8' },
  { id: 'economy', paperId: 'prelims-gs1', name: 'Economy', nameHi: 'अर्थव्यवस्था', code: 'ECO', description: 'Growth, fiscal and monetary policy, external sector and inclusion.', color: '#047857' },
  { id: 'environment', paperId: 'prelims-gs1', name: 'Environment & Ecology', nameHi: 'पर्यावरण एवं पारिस्थितिकी', code: 'ENV', description: 'Ecology, biodiversity, conservation, climate change and pollution.', color: '#4d7c0f' },
  { id: 'science-tech', paperId: 'prelims-gs1', name: 'Science & Technology', nameHi: 'विज्ञान एवं प्रौद्योगिकी', code: 'S&T', description: 'Space, biotechnology, digital technology, health and defence.', color: '#0369a1' },
  { id: 'current-affairs', paperId: 'prelims-gs1', name: 'Current Affairs', nameHi: 'समसामयिकी', code: 'CA', description: 'Issues of national and international importance linked to static syllabus.', color: '#be123c' },
  { id: 'comprehension', paperId: 'csat', name: 'Reading Comprehension', nameHi: 'पठनबोध', code: 'ENG', description: 'Comprehension of passages and logical inference.', color: '#475569' },
  { id: 'reasoning', paperId: 'csat', name: 'Logical Reasoning', nameHi: 'तार्किक अभिक्षमता', code: 'LR', description: 'Analytical and logical reasoning, series, puzzles and syllogisms.', color: '#7c3aed' },
  { id: 'numeracy', paperId: 'csat', name: 'Basic Numeracy', nameHi: 'प्रारंभिक अंकगणित', code: 'NUM', description: 'Number system, arithmetic, algebra and geometry fundamentals.', color: '#b91c1c' },
  { id: 'data-interpretation', paperId: 'csat', name: 'Data Interpretation', nameHi: 'आंकड़ा निर्वचन', code: 'DI', description: 'Tables, graphs, charts and data sufficiency.', color: '#0e7490' },
  { id: 'decision-making', paperId: 'csat', name: 'Decision Making', nameHi: 'निर्णय क्षमता', code: 'DM', description: 'Situational decision making and administrative judgement.', color: '#4338ca' },
  { id: 'essay', paperId: 'mains-essay', name: 'Essay', nameHi: 'निबंध', code: 'ESY', description: 'Multi-dimensional essays with clear thesis and structure.', color: '#9d174d' },
  { id: 'heritage', paperId: 'mains-gs1', name: 'Indian Heritage & Culture', nameHi: 'भारतीय विरासत एवं संस्कृति', code: 'HRT', description: 'Art forms, literature, architecture and cultural traditions.', color: '#a21caf' },
  { id: 'history-mains', paperId: 'mains-gs1', name: 'History', nameHi: 'इतिहास', code: 'HIM', description: 'Modern Indian history, freedom struggle and post-independence consolidation.', color: '#b45309' },
  { id: 'geography-mains', paperId: 'mains-gs1', name: 'Geography', nameHi: 'भूगोल', code: 'GEM', description: 'Geographical features, resources, distribution and associated issues.', color: '#0f766e' },
  { id: 'society', paperId: 'mains-gs1', name: 'Indian Society', nameHi: 'भारतीय समाज', code: 'SOC', description: 'Diversity, social empowerment, poverty, population and urbanisation.', color: '#c2410c' },
  { id: 'constitution', paperId: 'mains-gs2', name: 'Constitution', nameHi: 'संविधान', code: 'CON', description: 'Constitutional framework, rights, federalism and amendments.', color: '#1d4ed8' },
  { id: 'governance', paperId: 'mains-gs2', name: 'Governance', nameHi: 'शासन', code: 'GOV', description: 'Government policies, civil services, transparency and accountability.', color: '#0e7490' },
  { id: 'social-justice', paperId: 'mains-gs2', name: 'Social Justice', nameHi: 'सामाजिक न्याय', code: 'SJ', description: 'Justice, welfare schemes, vulnerable sections and human rights.', color: '#7e22ce' },
  { id: 'ir', paperId: 'mains-gs2', name: 'International Relations', nameHi: 'अंतर्राष्ट्रीय संबंध', code: 'IR', description: 'India and its neighbourhood, global groupings and institutions.', color: '#155e75' },
  { id: 'economy-mains', paperId: 'mains-gs3', name: 'Economy', nameHi: 'अर्थव्यवस्था', code: 'ECM', description: 'Growth, development, fiscal policy, banking and external sector.', color: '#047857' },
  { id: 'agriculture', paperId: 'mains-gs3', name: 'Agriculture', nameHi: 'कृषि', code: 'AGR', description: 'Cropping patterns, irrigation, subsidies, food processing and MSP.', color: '#65a30d' },
  { id: 'science-tech-mains', paperId: 'mains-gs3', name: 'Science & Technology', nameHi: 'विज्ञान एवं प्रौद्योगिकी', code: 'STM', description: 'Indigenisation, emerging technologies and their applications.', color: '#0369a1' },
  { id: 'environment-mains', paperId: 'mains-gs3', name: 'Environment', nameHi: 'पर्यावरण', code: 'ENM', description: 'Conservation, pollution, climate negotiations and sustainable development.', color: '#4d7c0f' },
  { id: 'disaster', paperId: 'mains-gs3', name: 'Disaster Management', nameHi: 'आपदा प्रबंधन', code: 'DIS', description: 'Hazards, vulnerability, disaster preparedness and risk reduction.', color: '#b45309' },
  { id: 'internal-security', paperId: 'mains-gs3', name: 'Internal Security', nameHi: 'आंतरिक सुरक्षा', code: 'SEC', description: 'Security challenges, terrorism, organised crime and border management.', color: '#334155' },
  { id: 'ethics', paperId: 'mains-gs4', name: 'Ethics & Human Interface', nameHi: 'नीतिशास्त्र एवं मानवीय संबंध', code: 'ETH', description: 'Ethics in human actions, attitude, emotional intelligence and thinkers.', color: '#6d28d9' },
  { id: 'integrity-aptitude', paperId: 'mains-gs4', name: 'Integrity & Aptitude', nameHi: 'सत्यनिष्ठा एवं अभिक्षमता', code: 'IAP', description: 'Integrity, probity in governance, codes of conduct and work culture.', color: '#0f766e' },
  { id: 'case-studies', paperId: 'mains-gs4', name: 'Case Studies', nameHi: 'केस अध्ययन', code: 'CST', description: 'Applied ethical dilemmas in public administration.', color: '#9d174d' },
  { id: 'optional', paperId: 'optional', name: 'My Optional Subject', nameHi: 'मेरा वैकल्पिक विषय', code: 'OPT', description: 'Add paper-wise topics from the Admin content manager.', color: '#57534e' },
]

type TopicSeed = [id: string, subjectId: string, name: string, nameHi: string, weight: Topic['weight'], subtopics: string[]]

const rawTopics: TopicSeed[] = [
  ['t-ancient', 'history', 'Ancient India', 'प्राचीन भारत', 'high', ['Indus Valley Civilisation', 'Vedic age', 'Mahajanapadas', 'Mauryas', 'Guptas', 'Buddhism and Jainism']],
  ['t-medieval', 'history', 'Medieval India', 'मध्यकालीन भारत', 'medium', ['Delhi Sultanate', 'Vijayanagara', 'Bhakti movement', 'Mughal administration', 'Maratha state']],
  ['t-modern', 'history', 'Modern India', 'आधुनिक भारत', 'high', ['Revolt of 1857', 'Socio-religious reform', 'National movement', 'Gandhian mass movements', 'Partition and integration']],
  ['t-world-history', 'history', 'World History', 'विश्व इतिहास', 'medium', ['Renaissance', 'Industrial Revolution', 'World Wars', 'Decolonisation']],
  ['t-architecture', 'art-culture', 'Architecture & Sculpture', 'स्थापत्य एवं मूर्तिकला', 'high', ['Temple styles', 'Stupas', 'Rock-cut caves', 'Indo-Islamic architecture', 'Colonial architecture']],
  ['t-performing-arts', 'art-culture', 'Performing Arts', 'प्रदर्शन कलाएँ', 'high', ['Classical dance', 'Hindustani and Carnatic music', 'Theatre forms', 'Folk traditions']],
  ['t-literature', 'art-culture', 'Literature & Religion', 'साहित्य एवं धर्म', 'medium', ['Sanskrit literature', 'Sangam literature', 'Bhakti and Sufi literature', 'Religious movements']],
  ['t-physical-geo', 'geography', 'Physical Geography', 'भौतिक भूगोल', 'high', ['Plate tectonics', 'Geomorphology', 'Climatology', 'Oceanography', 'Biogeography']],
  ['t-indian-geo', 'geography', 'Indian Geography', 'भारत का भूगोल', 'high', ['Physiographic divisions', 'Drainage systems', 'Monsoon', 'Soils', 'Natural vegetation']],
  ['t-human-geo', 'geography', 'Human & Economic Geography', 'मानव एवं आर्थिक भूगोल', 'medium', ['Population', 'Urbanisation', 'Agriculture', 'Industries', 'Resources']],
  ['t-world-geo', 'geography', 'World Geography', 'विश्व भूगोल', 'medium', ['Continents', 'Ocean currents', 'Major straits', 'Climate zones']],
  ['t-constitution-basics', 'polity', 'Constitutional Framework', 'संवैधानिक ढाँचा', 'high', ['Making of the Constitution', 'Preamble', 'Features', 'Basic structure', 'Amendments']],
  ['t-rights', 'polity', 'Fundamental Rights & Duties', 'मूल अधिकार एवं कर्तव्य', 'high', ['Articles 12–35', 'Right to equality', 'Right to life', 'Writs', 'Directive Principles']],
  ['t-union-state', 'polity', 'Union & State Government', 'संघ एवं राज्य सरकार', 'high', ['President', 'Prime Minister and Council', 'Parliament', 'Governor', 'Chief Minister']],
  ['t-judiciary', 'polity', 'Judiciary & Federalism', 'न्यायपालिका एवं संघवाद', 'high', ['Supreme Court', 'High Courts', 'Judicial review', 'Centre-state relations', 'Inter-state councils']],
  ['t-local-bodies', 'polity', 'Local Government & Bodies', 'स्थानीय शासन', 'medium', ['Panchayati Raj', 'Urban local bodies', 'Election Commission', 'UPSC and CAG', 'Finance Commission']],
  ['t-econ-basics', 'economy', 'Economic Concepts', 'आर्थिक अवधारणाएँ', 'high', ['GDP and GVA', 'Inflation', 'Unemployment', 'Poverty', 'National income']],
  ['t-fiscal', 'economy', 'Public Finance', 'लोक वित्त', 'high', ['Budget', 'Fiscal deficit', 'FRBM', 'Taxation', 'Finance Commission transfers']],
  ['t-monetary', 'economy', 'Money & Banking', 'मुद्रा एवं बैंकिंग', 'high', ['RBI functions', 'Monetary policy', 'Banking regulation', 'Financial inclusion', 'Capital markets']],
  ['t-external', 'economy', 'External Sector', 'बाह्य क्षेत्र', 'medium', ['Balance of payments', 'Exchange rate', 'FDI and FPI', 'Trade agreements', 'Forex reserves']],
  ['t-agri-prelims', 'economy', 'Agriculture & Inclusion', 'कृषि एवं समावेशन', 'medium', ['MSP', 'Food security', 'Schemes', 'MSMEs', 'Employment programmes']],
  ['t-ecology', 'environment', 'Ecology & Ecosystems', 'पारिस्थितिकी एवं पारितंत्र', 'high', ['Food chains', 'Biomes', 'Ecological succession', 'Wetlands', 'Mangroves']],
  ['t-biodiversity', 'environment', 'Biodiversity & Conservation', 'जैव विविधता एवं संरक्षण', 'high', ['Protected areas', 'Species in news', 'Conservation projects', 'CBD', 'Invasive species']],
  ['t-climate', 'environment', 'Climate Change', 'जलवायु परिवर्तन', 'high', ['UNFCCC', 'Paris Agreement', 'Carbon markets', 'Adaptation', 'Loss and damage']],
  ['t-pollution', 'environment', 'Pollution & Waste', 'प्रदूषण एवं अपशिष्ट', 'medium', ['Air pollution', 'Water pollution', 'Solid waste', 'Plastic waste', 'EIA']],
  ['t-space', 'science-tech', 'Space Technology', 'अंतरिक्ष प्रौद्योगिकी', 'high', ['ISRO missions', 'Launch vehicles', 'Satellite applications', 'Space policy']],
  ['t-biotech', 'science-tech', 'Biotechnology & Health', 'जैव प्रौद्योगिकी एवं स्वास्थ्य', 'high', ['Genetics', 'Vaccines', 'Biomedical research', 'Public health']],
  ['t-digital', 'science-tech', 'Digital & Emerging Tech', 'डिजिटल एवं उभरती प्रौद्योगिकी', 'high', ['AI', 'Blockchain', 'Quantum technology', 'Semiconductors', 'Cybersecurity']],
  ['t-defence', 'science-tech', 'Defence Technology', 'रक्षा प्रौद्योगिकी', 'medium', ['Missiles', 'Aircraft', 'Naval platforms', 'Defence indigenisation']],
  ['t-ca-polity', 'current-affairs', 'Polity & Governance in News', 'समाचार में राजव्यवस्था', 'high', ['Parliament', 'Judiciary', 'Elections', 'Governance reforms']],
  ['t-ca-economy', 'current-affairs', 'Economy in News', 'समाचार में अर्थव्यवस्था', 'high', ['Budget', 'RBI decisions', 'Trade', 'Industry']],
  ['t-ca-environment', 'current-affairs', 'Environment in News', 'समाचार में पर्यावरण', 'high', ['Climate summits', 'Biodiversity', 'Pollution']],
  ['t-ca-ir', 'current-affairs', 'International Relations in News', 'समाचार में अंतर्राष्ट्रीय संबंध', 'high', ['Neighbourhood', 'Global groupings', 'Conflicts']],
  ['t-comprehension', 'comprehension', 'Passage Comprehension', 'गद्यांश बोध', 'high', ['Main idea', 'Inference', 'Tone', 'Assumption']],
  ['t-reasoning', 'reasoning', 'Logical & Analytical Reasoning', 'तार्किक एवं विश्लेषणात्मक तर्क', 'high', ['Series', 'Syllogism', 'Blood relations', 'Seating arrangement', 'Statements and assumptions']],
  ['t-numeracy', 'numeracy', 'Arithmetic & Algebra', 'अंकगणित एवं बीजगणित', 'high', ['Percentages', 'Ratio', 'Time and work', 'Profit and loss', 'Equations']],
  ['t-di', 'data-interpretation', 'Data Interpretation', 'आंकड़ा निर्वचन', 'high', ['Tables', 'Bar charts', 'Pie charts', 'Data sufficiency']],
  ['t-dm', 'decision-making', 'Situational Decision Making', 'परिस्थितिजन्य निर्णय', 'medium', ['Administrative dilemmas', 'Priority setting', 'Ethical judgement']],
  ['t-essay', 'essay', 'Essay Craft', 'निबंध लेखन', 'high', ['Thesis', 'Structure', 'Multi-dimensionality', 'Conclusion']],
  ['t-heritage', 'heritage', 'Indian Heritage', 'भारतीय विरासत', 'high', ['Cultural syncretism', 'Art and architecture', 'Literature', 'UNESCO heritage']],
  ['t-modern-mains', 'history-mains', 'Modern India & Freedom Struggle', 'आधुनिक भारत एवं स्वतंत्रता संग्राम', 'high', ['Nationalism', 'Mass movements', 'Constitutional development', 'Post-independence']],
  ['t-geo-mains', 'geography-mains', 'Geography of India', 'भारत का भूगोल', 'high', ['Resources', 'Hazards', 'Regional development', 'Climate']],
  ['t-society', 'society', 'Indian Society & Diversity', 'भारतीय समाज एवं विविधता', 'high', ['Caste', 'Gender', 'Urbanisation', 'Globalisation', 'Communalism']],
  ['t-constitution-mains', 'constitution', 'Constitutional Governance', 'संवैधानिक शासन', 'high', ['Federalism', 'Separation of powers', 'Judicial review', 'Emergency provisions']],
  ['t-governance', 'governance', 'Governance & Accountability', 'शासन एवं जवाबदेही', 'high', ['Civil services reform', 'e-Governance', 'RTI', 'Transparency', 'Citizen charters']],
  ['t-social-justice', 'social-justice', 'Welfare & Social Justice', 'कल्याण एवं सामाजिक न्याय', 'high', ['Schemes', 'Vulnerable groups', 'Health and education', 'Hunger and poverty']],
  ['t-ir', 'ir', 'India & the World', 'भारत एवं विश्व', 'high', ['Neighbourhood', 'Great powers', 'Global South', 'Multilateral institutions']],
  ['t-economy-mains', 'economy-mains', 'Growth & Development', 'वृद्धि एवं विकास', 'high', ['Growth strategy', 'Fiscal consolidation', 'Banking reform', 'Employment']],
  ['t-agriculture', 'agriculture', 'Agriculture & Food Systems', 'कृषि एवं खाद्य प्रणाली', 'high', ['Cropping patterns', 'Irrigation', 'MSP and procurement', 'Food processing']],
  ['t-sci-mains', 'science-tech-mains', 'Technology & Society', 'प्रौद्योगिकी एवं समाज', 'high', ['Emerging tech', 'Indigenisation', 'IPR', 'Digital economy']],
  ['t-env-mains', 'environment-mains', 'Environment & Sustainability', 'पर्यावरण एवं संधारणीयता', 'high', ['Conservation', 'Climate finance', 'Pollution', 'Sustainable development']],
  ['t-disaster', 'disaster', 'Disaster Risk Reduction', 'आपदा जोखिम न्यूनीकरण', 'high', ['Hazards', 'Preparedness', 'Sendai Framework', 'Institutional response']],
  ['t-security', 'internal-security', 'Internal Security Challenges', 'आंतरिक सुरक्षा चुनौतियाँ', 'high', ['Terrorism', 'Left-wing extremism', 'Border management', 'Cybercrime']],
  ['t-ethics', 'ethics', 'Ethics & Thinkers', 'नीतिशास्त्र एवं विचारक', 'high', ['Determinants of ethics', 'Consequentialism', 'Deontology', 'Indian ethical thought']],
  ['t-integrity', 'integrity-aptitude', 'Probity in Governance', 'शासन में सत्यनिष्ठा', 'high', ['Integrity', 'Codes of conduct', 'Corruption', 'Work culture']],
  ['t-case-studies', 'case-studies', 'Ethical Case Studies', 'नैतिक केस अध्ययन', 'high', ['Stakeholder analysis', 'Options', 'Ethical reasoning', 'Decision']],
  ['t-optional-paper1', 'optional', 'Optional Paper I', 'वैकल्पिक प्रश्नपत्र I', 'medium', ['Add your optional syllabus section']],
  ['t-optional-paper2', 'optional', 'Optional Paper II', 'वैकल्पिक प्रश्नपत्र II', 'medium', ['Add your optional syllabus section']],
]

export const topics: Topic[] = rawTopics.map(([id, subjectId, name, nameHi, weight, subtopics]) => {
  const subject = subjects.find(s => s.id === subjectId)!
  return {
    id,
    subjectId,
    paperId: subject.paperId,
    name,
    nameHi,
    description: `${name} — build conceptual clarity, link static concepts with current affairs, and practise UPSC-style questions.`,
    subtopics,
    weight,
    stage: subject.paperId === 'prelims-gs1' || subject.paperId === 'csat' ? ['prelims'] : ['mains'],
  }
})

export const subjectById = (id: string) => subjects.find(s => s.id === id)
export const topicById = (id: string) => topics.find(t => t.id === id)
export const paperById = (id: string) => papers.find(p => p.id === id)
export const topicsForSubject = (subjectId: string) => topics.filter(t => t.subjectId === subjectId)
export const topicsForPaper = (paperId: string) => topics.filter(t => t.paperId === paperId)
export const subjectName = (id: string, lang: 'en' | 'hi' = 'en') => {
  const s = subjectById(id)
  if (!s) return id
  return lang === 'hi' ? s.nameHi : s.name
}
export const topicName = (id: string, lang: 'en' | 'hi' = 'en') => {
  const t = topicById(id)
  if (!t) return id
  return lang === 'hi' ? t.nameHi : t.name
}
export const totalTopics = topics.filter(t => !t.id.startsWith('t-optional')).length
