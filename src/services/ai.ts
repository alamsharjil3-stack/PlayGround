import type {
  ChatMessage,
  Difficulty,
  Flashcard,
  InterviewSession,
  InterviewTurn,
  Language,
  MCQQuestion,
  MainsEvaluation,
  PaperId,
  StudyProfile,
  Topic,
} from '../types'
import { knowledge, fallbackLesson } from '../data/knowledge'
import { questions, questionsForTopic } from '../data/questions'
import { currentAffairs } from '../data/currentAffairs'
import { subjectById, subjectName, topicById, topics, topicName } from '../data/syllabus'
import { uid } from '../lib/id'
import { clamp, pct } from '../lib/scoring'
import { generateStudyPlan } from '../lib/planner'

const PROXY_URL = (import.meta.env.VITE_AI_PROXY_URL as string | undefined)?.trim()

const SYSTEM_PROMPT = `You are UPSC Mentor AI, an experienced Indian Civil Services Examination mentor.
You teach to the UPSC syllabus, prioritise conceptual clarity, and connect static concepts with PYQs and current affairs.
Structure answers with: Concept, UPSC Relevance, Key Points, Example, PYQ Connection, Common Mistakes, Quick Revision, Practice Question.
Never fabricate PYQs, constitutional articles, judgments, schemes, statistics or current events. If uncertain, say so.
Be rigorous, concise and exam-oriented. Reply in the user's language (English or Hindi).`

const aliases: Record<string, string[]> = {
  't-rights': ['fundamental rights', 'article 21', 'article 14', 'article 32', 'writs', 'मूल अधिकार', 'fundamental right'],
  't-fiscal': ['fiscal deficit', 'budget', 'frbm', 'fiscal policy', 'राजकोषीय घाटा', 'बजट', 'deficit'],
  't-monetary': ['monetary policy', 'rbi', 'repo rate', 'inflation', 'मुद्रा नीति', 'आरबीआई', 'महंगाई'],
  't-union-state': ['parliament', 'president', 'prime minister', 'lok sabha', 'rajya sabha', 'संसद', 'राष्ट्रपति'],
  't-judiciary': ['judiciary', 'supreme court', 'high court', 'judicial review', 'न्यायपालिका', 'सुप्रीम कोर्ट'],
  't-federalism': ['federalism', 'centre state', 'संघवाद'],
  't-constitution-basics': ['constitution', 'preamble', 'dpsp', 'directive principles', 'संविधान', 'प्रस्तावना'],
  't-modern': ['1857', 'freedom struggle', 'national movement', 'gandhi', 'स्वतंत्रता संग्राम', 'आधुनिक भारत'],
  't-ancient': ['ancient india', 'indus valley', 'maurya', 'gupta', 'प्राचीन भारत'],
  't-modern-mains': ['modern history', 'freedom struggle mains'],
  't-geography': ['geography', 'monsoon', 'भूगोल', 'मानसून'],
  't-indian-geo': ['monsoon', 'rivers', 'western ghats', 'tropic of cancer', 'भारत का भूगोल', 'नदियाँ'],
  't-physical-geo': ['plate tectonics', 'climate', 'ocean currents', 'भौतिक भूगोल'],
  't-ecology': ['ecology', 'ecosystem', 'food chain', 'पारिस्थितिकी'],
  't-climate': ['climate change', 'paris agreement', 'unfccc', 'जलवायु परिवर्तन', 'पेरिस समझौता'],
  't-biodiversity': ['biodiversity', 'ramsar', 'project tiger', 'जैव विविधता'],
  't-pollution': ['pollution', 'pm2.5', 'air quality', 'प्रदूषण'],
  't-digital': ['artificial intelligence', 'ai', 'upi', 'blockchain', 'quantum', 'semiconductor', 'कृत्रिम बुद्धिमत्ता', 'डिजिटल'],
  't-space': ['space', 'isro', 'chandrayaan', 'अंतरिक्ष'],
  't-biotech': ['biotechnology', 'crispr', 'vaccine', 'जैव प्रौद्योगिकी'],
  't-ethics': ['ethics', 'integrity', 'case study', 'नीतिशास्त्र', 'सत्यनिष्ठा'],
  't-ir': ['international relations', 'quad', 'imec', 'foreign policy', 'अंतर्राष्ट्रीय संबंध'],
  't-agriculture': ['agriculture', 'msp', 'irrigation', 'कृषि'],
  't-economy-mains': ['economy mains', 'growth', 'अर्थव्यवस्था'],
  't-social-justice': ['social justice', 'welfare', 'सामाजिक न्याय'],
  't-governance': ['governance', 'rti', 'civil services', 'शासन'],
  't-disaster': ['disaster', 'urban flooding', 'आपदा'],
  't-internal-security': ['internal security', 'terrorism', 'आंतरिक सुरक्षा'],
  't-essay': ['essay', 'निबंध'],
}

export function detectTopic(query: string): Topic | undefined {
  const q = query.toLowerCase()
  let best: { topic: Topic; score: number } | undefined
  for (const topic of topics) {
    let score = 0
    if (q.includes(topic.name.toLowerCase())) score += 12
    if (topic.nameHi && q.includes(topic.nameHi)) score += 12
    const alias = aliases[topic.id] ?? []
    for (const a of alias) if (q.includes(a.toLowerCase())) score += 9
    for (const sub of topic.subtopics) if (q.includes(sub.toLowerCase())) score += 5
    if (score > 0 && (!best || score > best.score)) best = { topic, score }
  }
  return best?.topic
}

export function detectIntent(query: string): 'teach' | 'quiz' | 'pyq' | 'notes' | 'revise' | 'plan' | 'evaluate' | 'interview' | 'explain' {
  const q = query.toLowerCase()
  if (/study plan|schedule|planner|योजना|टाइमटेबल|time table/.test(q)) return 'plan'
  if (/evaluate|review my answer|check my answer|जाँच|मूल्यांकन/.test(q)) return 'evaluate'
  if (/quiz|mcq|test me|प्रश्नोत्तरी|क्विज/.test(q)) return 'quiz'
  if (/pyq|previous year|पिछले वर्ष/.test(q)) return 'pyq'
  if (/notes|summary|summarise|summarize|नोट्स|सारांश/.test(q)) return 'notes'
  if (/revis|रिवीजन|दोहरा/.test(q)) return 'revise'
  if (/interview|mock board|साक्षात्कार/.test(q)) return 'interview'
  if (/teach|पढ़ाओ|पढाओ|सिखाओ|learn|session/.test(q)) return 'teach'
  return 'explain'
}

function heading(lang: Language, en: string, hi: string) {
  return lang === 'hi' ? hi : en
}

function localizedTopic(topic: Topic, lang: Language) {
  return lang === 'hi' ? topic.nameHi || topic.name : topic.name
}

export function buildLesson(topic: Topic, lang: Language = 'en', level: StudyProfile['level'] = 'beginner'): string {
  const k = knowledge[topic.id] ?? fallbackLesson(localizedTopic(topic, lang), topic.subtopics, subjectName(topic.subjectId, lang))
  const name = localizedTopic(topic, lang)
  const h = (en: string, hi: string) => heading(lang, en, hi)
  const list = (items: string[]) => items.map(i => `- ${i}`).join('\n')
  const advanced = k.advanced ?? []
  return `## ${name}
*${h('A complete learning session', 'एक संपूर्ण अधिगम सत्र')} · ${h('Beginner → Intermediate → UPSC → Advanced', 'प्रारंभिक → मध्यम → यूपीएससी → उन्नत')}*

### 1. ${h('Concept introduction', 'अवधारणा परिचय')}
${k.hook}

### 2. ${h('Simple explanation', 'सरल व्याख्या')}
${k.simple.map(p => `${p}`).join('\n\n')}

### 3. ${h('UPSC relevance', 'यूपीएससी में प्रासंगिकता')}
${k.upsc}

### 4. ${h('Important facts', 'महत्वपूर्ण तथ्य')}
${list(k.facts)}

### 5. ${h('Example', 'उदाहरण')}
${k.example}

### 6. ${h('PYQ connection', 'पिछले वर्ष के प्रश्नों से जोड़')}
${k.pyq}

### 7. ${h('Common mistakes', 'सामान्य गलतियाँ')}
${list(k.mistakes)}

### 8. ${h('Quick revision', 'त्वरित पुनरावृत्ति')}
${k.revision.map((r, i) => `${i + 1}. ${r}`).join('\n')}

### 9. ${h('Practice question', 'अभ्यास प्रश्न')}
**Q.** ${k.practice.stem}
${k.practice.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}

<details>
<summary>${h('Show answer and explanation', 'उत्तर एवं व्याख्या देखें')}</summary>

**${h('Answer', 'उत्तर')}:** ${String.fromCharCode(65 + k.practice.answer)}

${k.practice.explanation}

</details>

### 10. ${h('Progressive depth', 'क्रमिक गहराई')}
**${h('Beginner', 'प्रारंभिक')}:** ${k.simple[0]}

**${h('Intermediate', 'मध्यम')}:** ${k.simple[1] ?? k.simple[0]}

**${h('UPSC level', 'यूपीएससी स्तर')}:** ${k.upsc}

**${h('Advanced', 'उन्नत')}:** ${advanced.length ? advanced.join(' ') : 'Use this concept in a 250-word answer with a definition, two examples and a way forward.'}

> ${h('Current level selected', 'चयनित स्तर')}: **${level}**. ${h('Ask me to go deeper on any section, or say “quiz me”.', 'किसी भी भाग पर और गहराई से पूछें, या “क्विज” कहें।')}`
}

function quizFromTopic(topic: Topic | undefined, difficulty?: Difficulty): string {
  const pool = topic ? questionsForTopic(topic.id) : questions
  const filtered = difficulty ? pool.filter(q => q.difficulty === difficulty) : pool
  const selected = (filtered.length ? filtered : pool).slice(0, 3)
  if (!selected.length) return 'I do not have verified practice questions for this topic yet. Add questions from the Admin content manager, then try again.'
  return `## Quiz — ${topic ? topic.name : 'Mixed revision'}

${selected.map((q, i) => `**Q${i + 1}.** ${q.stem}

${q.options.map((o, j) => `${String.fromCharCode(65 + j)}. ${o}`).join('\n')}`).join('\n\n')}

---

### Answer key
${selected.map((q, i) => {
  const answer = Array.isArray(q.correct) ? q.correct.map(n => String.fromCharCode(65 + n)).join(', ') : String.fromCharCode(65 + q.correct)
  return `**Q${i + 1}: ${answer}.** ${q.explanation}`
}).join('\n\n')}

${selected.some(q => q.source.type === 'ai-practice') ? '_Some questions above are AI Generated Practice Questions, not official UPSC PYQs._' : ''}`
}

function pyqFromTopic(topic: Topic | undefined): string {
  const pool = topic ? questionsForTopic(topic.id).filter(q => q.source.type === 'pyq') : questions.filter(q => q.source.type === 'pyq')
  if (!pool.length) {
    return `## PYQ connection

I do not have a verified PYQ for **${topic?.name ?? 'this topic'}** in the local bank. I will not invent one.

**What to do instead**
- Search official UPSC question papers for the subject and year.
- Use the ${topic ? topic.name : 'topic'} practice set in the PYQ engine.
- Ask me to explain a specific question you paste here — I can deconstruct its options, concepts and likely traps.

> All unverified items in this product are labelled **AI Generated Practice Question**.
`
  }
  return `## PYQ connection — ${topic?.name ?? 'mixed topics'}

${pool.slice(0, 4).map(q => `### ${q.source.type === 'pyq' ? `UPSC ${q.source.exam ?? 'CSE'} ${q.source.year ?? ''}` : 'AI Generated Practice Question'}
${q.stem}

${q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}

**Answer:** ${Array.isArray(q.correct) ? q.correct.map(n => String.fromCharCode(65 + n)).join(', ') : String.fromCharCode(65 + q.correct)}

${q.explanation}`).join('\n\n')}

> Curated demo records should be checked against official UPSC papers. Questions without a verified source are clearly marked.
`
}

export function notesForTopic(topic: Topic): string {
  const k = knowledge[topic.id] ?? fallbackLesson(topic.name, topic.subtopics, subjectName(topic.subjectId))
  return `## Revision notes — ${topic.name}

### Core definition
${k.hook}

### Syllabus map
${topic.subtopics.map(s => `- ${s}`).join('\n')}

### Must-remember facts
${k.facts.map(f => `- ${f}`).join('\n')}

### Exam angles
- **Prelims:** ${topic.subtopics.slice(0, 3).join(', ')}; article/institution matching.
- **Mains:** causes, consequences, stakeholder analysis, way forward.
- **Linkage:** current affairs + PYQ pattern.

### Common mistakes
${k.mistakes.map(m => `- ${m}`).join('\n')}

### 60-second recall
${k.revision.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
}

export function revisionForTopics(topicIds: string[]): string {
  const selected = topicIds.map(id => topicById(id)).filter(Boolean) as Topic[]
  const list = selected.length ? selected : topics.filter(t => t.weight === 'high').slice(0, 6)
  return `## Revise today

Use **active recall**, not rereading. For each item: close the notes, write what you remember, then check.

${list.map((t, i) => `${i + 1}. **${t.name}** — ${t.subtopics.slice(0, 3).join('; ')}. *Prompt: explain it in 90 seconds, then answer one MCQ.*`).join('\n')}

### Spaced repetition plan
- **Today:** recall + 5 MCQs.
- **Tomorrow:** 3-minute summary from memory.
- **Day 4:** mixed quiz with related topics.
- **Day 8:** write a 150-word answer linking the concept to current affairs.

> Priority is based on weak performance, high syllabus weight and recent errors.`
}

export function planSummary(profile: StudyProfile, topicIds: string[] = []): string {
  const plan = generateStudyPlan(profile, 7)
  const today = new Date().toISOString().slice(0, 10)
  const todays = plan.tasks.filter(t => t.date === today)
  return `## Your next 7 days

**Profile:** ${profile.stagePriority} priority · ${profile.dailyHours} hours/day · target ${profile.targetYear}.

${todays.map(t => `- **${t.type.toUpperCase()}** — ${t.title} (${t.minutes} min)`).join('\n')}

### Why this plan
${plan.rationale}

### Rules that make it work
1. Study in 50-minute blocks with a 10-minute recall break.
2. End every session by writing three lines from memory.
3. Review wrong MCQs the same day; schedule them again after 3 days.
4. Keep one weekly test slot fixed. Do not move it for new content.
5. If you miss a day, do not double the load — shorten the revision block and continue.

${topicIds.length ? `### Priority topics\n${topicIds.map(id => `- ${topicName(id)}`).join('\n')}` : ''}

> Open **Study Plan** to generate, edit and track the full calendar.`
}

export function evaluateAnswer(input: {
  question: string
  answer: string
  paper: PaperId
  topicId?: string
  wordLimit?: number
}): Omit<MainsEvaluation, 'id' | 'userId' | 'createdAt'> {
  const topic = input.topicId ? topicById(input.topicId) : detectTopic(input.question)
  const k = topic ? (knowledge[topic.id] ?? fallbackLesson(topic.name, topic.subtopics, subjectName(topic.subjectId))) : undefined
  const answer = input.answer.trim()
  const words = answer ? answer.split(/\s+/).filter(Boolean).length : 0
  const lower = answer.toLowerCase()
  const target = input.wordLimit ?? (input.paper === 'mains-essay' ? 1000 : 250)
  const maxScore = input.paper === 'mains-essay' ? 125 : target >= 200 ? 15 : 10

  const has = (re: RegExp) => re.test(answer)
  const refs = (lower.match(/article \d+|amendment|committee|commission|scheme|act,? \d{4}|supreme court|niti aayog/g) ?? []).length
  const dataPoints = (answer.match(/\d+(\.\d+)?\s?%|₹\s?\d|rs\.?\s?\d|\b(19|20)\d{2}\b/g) ?? []).length
  const examples = (lower.match(/for example|for instance|e\.g\.|such as|case of/g) ?? []).length
  const dimensions = [
    /social|society|समाज/.test(lower),
    /economic|economy|अर्थ/.test(lower),
    /political|polity|राजनीति/.test(lower),
    /environment|climate|पर्यावरण/.test(lower),
    /ethical|justice|नैतिक/.test(lower),
    /administrative|governance|शासन/.test(lower),
    /international|global|अंतर्राष्ट्रीय/.test(lower),
  ].filter(Boolean).length
  const structure = (answer.split(/\n\s*\n/).filter(Boolean).length) + (has(/^\s*[-*·]/m) ? 2 : 0)
  const introWords = answer.split(/\n\s*\n/)[0]?.split(/\s+/).length ?? 0
  const conclusion = /conclusion|in conclusion|way forward|therefore|thus|to sum up|निष्कर्ष|आगे की राह/i.test(answer.slice(-500))
  const lengthRatio = target ? words / target : 0

  const dim = (label: string, score: number, feedback: string) => ({ label, score: clamp(Math.round(score), 0, 10), feedback })

  const dimensionsOut = [
    dim('Understanding the question', 4 + (words > 40 ? 2 : 0) + (k ? 2 : 0) + (has(new RegExp((topic?.name ?? 'upsc').split(' ')[0], 'i')) ? 1 : 0), 'Directly address the directive word (discuss, examine, critically analyse) and define the core term early.'),
    dim('Structure & flow', 3 + Math.min(4, structure) + (introWords <= 90 ? 1 : 0) + (conclusion ? 2 : 0), 'Use a short introduction, 2–3 body blocks and a conclusion. Each paragraph should make one argument.'),
    dim('Content depth', 3 + Math.min(3, refs) + (words >= target * 0.6 ? 2 : 0) + (dimensions >= 3 ? 2 : 0), 'Add mechanisms, causes and consequences rather than a list of headlines.'),
    dim('Examples & data', 2 + Math.min(3, examples) + Math.min(3, dataPoints) + (has(/scheme|योजना/i) ? 1 : 0), 'Use one concrete scheme, case or committee. Cite data only when you can verify it.'),
    dim('Constitutional / institutional references', 1 + Math.min(5, refs) + (has(/article|अनुच्छेद/i) ? 2 : 0), 'Anchor the answer in an Article, Act, committee or constitutional body where relevant.'),
    dim('Balance & multi-dimensionality', 2 + dimensions + (has(/however|on the other hand|critics| limitation|चुनौती/i) ? 2 : 0), 'Show the counter-view and a trade-off. Do not make the answer one-sided.'),
    dim('Language & clarity', 5 + (words > 60 ? 2 : 0) + (words < target * 1.6 ? 1 : 0) + (has(/[;:]/) ? 1 : 0), 'Prefer short, precise sentences. Avoid jargon without explanation.'),
    dim('Conclusion & way forward', 2 + (conclusion ? 4 : 0) + (has(/way forward|recommend|reform|suggest|सुझाव/i) ? 2 : 0), 'End with a forward-looking, feasible conclusion linked to the question.'),
  ]
  if (lengthRatio > 0 && lengthRatio < 0.45) dimensionsOut[1].score = Math.max(1, dimensionsOut[1].score - 1)
  if (lengthRatio > 1.5) dimensionsOut[6].score = Math.max(1, dimensionsOut[6].score - 2)

  const average = dimensionsOut.reduce((s, d) => s + d.score, 0) / dimensionsOut.length
  const score = Math.round((average / 10) * maxScore * 10) / 10
  const strengths = dimensionsOut.filter(d => d.score >= 7).map(d => d.label)
  const weaknesses = dimensionsOut.filter(d => d.score < 6).map(d => d.label)
  const missing: string[] = []
  if (refs < 2) missing.push('Constitutional / legal or institutional anchor')
  if (examples < 1) missing.push('A concrete example or case')
  if (dimensions < 3) missing.push('Additional dimensions (social, economic, political, ethical, environmental)')
  if (!conclusion) missing.push('A clear conclusion or way forward')
  if (words < target * 0.6) missing.push(`Substance for the ${target}-word expectation`)
  if (!has(/however|critics|limitation|challenge/i)) missing.push('A counter-argument or limitation')

  const modelAnswer = buildModelAnswer(input.question, topic, k, target)

  return {
    question: input.question,
    paper: input.paper,
    answer,
    wordCount: words,
    score,
    maxScore,
    dimensions: dimensionsOut,
    strengths: strengths.length ? strengths : ['Attempted the question and established a base structure'],
    weaknesses: weaknesses.length ? weaknesses : ['No major structural weakness detected; sharpen examples and precision'],
    missing,
    suggestions: [
      'Underline the directive word before writing, then plan three body points.',
      'Open with a definition or context, not a repetition of the question.',
      'Embed at least one Article/Act/scheme and one concrete example.',
      'Reserve the final 15% of the word limit for the way forward.',
      'After writing, check whether every paragraph answers the question directly.',
    ],
    modelAnswer,
    betterIntro: `The question of ${input.question.replace(/[?.]$/g, '').toLowerCase()} must be located within India’s constitutional framework and its contemporary development challenges. A balanced response separates the principle from the practice and evaluates both.`,
    betterConclusion: `A durable approach requires institutional capacity, predictable resources and accountability to citizens. The goal should be reform that is constitutionally sound, administratively feasible and socially inclusive.`,
  }
}

function buildModelAnswer(question: string, topic: Topic | undefined, k: ReturnType<typeof fallbackLesson> | undefined, target: number) {
  const facts = k?.facts.slice(0, 4).map(f => `- ${f}`).join('\n') ?? '- Define the core concept and its constitutional or policy context.'
  const dims = k?.simple.slice(0, 2).join(' ') ?? 'Explain the mechanism, its consequences and the institutional response.'
  return `**Introduction**
${question.replace(/[?.]$/g, '')} is best understood through its constitutional design, institutional practice and development consequences. This answer examines the core concept, its significance and the way forward.

**Body**
${dims}

**Key anchors**
${facts}

**Evaluation**
- The policy intent must be assessed against implementation capacity and equity.
- A single-dimensional response is incomplete; consider social, economic, political and ethical dimensions.
- Counter-arguments and limitations should be stated, not avoided.

**Conclusion**
A constitutionally sound and administratively feasible approach — backed by transparency, resources and measurable outcomes — is the appropriate way forward.

_Indicative answer for a ${target}-word question. It is a structure guide, not a substitute for your own reading and verified sources._`
}

export function evaluateEssay(input: {
  topic: string
  essay: string
}): Omit<MainsEvaluation, 'id' | 'userId' | 'createdAt'> {
  const base = evaluateAnswer({ question: input.topic, answer: input.essay, paper: 'mains-essay', wordLimit: 1000 })
  const essayDimensions = [
    { label: 'Introduction', score: Math.min(10, base.dimensions[0].score + 1), feedback: 'Open with an idea, anecdote, definition or paradox — not a dictionary definition.' },
    { label: 'Thesis & argument', score: Math.min(10, base.dimensions[1].score + 1), feedback: 'State a clear central argument in the first 150 words and return to it in the conclusion.' },
    { label: 'Structure', score: base.dimensions[1].score, feedback: 'Use 4–6 sections with transitions. Each section should advance the thesis.' },
    { label: 'Multi-dimensionality', score: base.dimensions[5].score, feedback: 'Cover social, economic, political, cultural, ethical and philosophical dimensions.' },
    { label: 'Examples & illustration', score: base.dimensions[3].score, feedback: 'Use historical, contemporary and personal examples; avoid unverified statistics.' },
    { label: 'Philosophical depth', score: Math.min(10, base.dimensions[2].score + 1), feedback: 'Bring in an idea or thinker where it genuinely illuminates the argument.' },
    { label: 'Balance', score: base.dimensions[5].score, feedback: 'Acknowledge counter-arguments and complexity without losing your position.' },
    { label: 'Language & expression', score: base.dimensions[6].score, feedback: 'Prefer clarity over ornament. Vary sentence length.' },
    { label: 'Conclusion', score: base.dimensions[7].score, feedback: 'End with a forward-looking idea, not a summary of the same points.' },
  ]
  const average = essayDimensions.reduce((s, d) => s + d.score, 0) / essayDimensions.length
  return {
    ...base,
    score: Math.round((average / 10) * 125 * 10) / 10,
    maxScore: 125,
    dimensions: essayDimensions,
    strengths: essayDimensions.filter(d => d.score >= 7).map(d => d.label),
    weaknesses: essayDimensions.filter(d => d.score < 6).map(d => d.label),
    suggestions: [
      'Brainstorm five dimensions before you write; choose the three strongest.',
      'Write a one-line thesis and test every paragraph against it.',
      'Use a concrete example in each major section.',
      'Keep philosophical references precise and relevant.',
      'Reserve time to revise the introduction and conclusion.',
    ],
    modelAnswer: `**Possible thesis:** ${input.topic} is not a binary choice but a tension between competing values that must be negotiated through institutions and public reasoning.

**Structure**
1. Introduction — a vivid context or paradox.
2. Conceptual map — define the terrain and state the thesis.
3. Social and cultural dimension — identity, community and change.
4. Economic and technological dimension — incentives, inequality and opportunity.
5. Political and institutional dimension — power, accountability and reform.
6. Philosophical dimension — rights, duty, justice and the good life.
7. Counter-argument — the strongest objection to the thesis.
8. Conclusion — a forward-looking synthesis.

_This is an essay architecture, not a substitute for your own writing._`,
    betterIntro: `Begin with a concrete scene, a striking idea or a well-chosen paradox that captures the tension in “${input.topic}”. Then narrow to your thesis within three sentences.`,
    betterConclusion: `Return to the opening image. State what must change, who must act and what principle should guide the choice. End with a sentence that the examiner will remember.`,
  }
}

export function interviewOpening(session: Pick<InterviewSession, 'daf'>): string {
  const d = session.daf
  return `Good morning. Please take a seat. I am the Chair of this board. We have read your DAF.

You are ${d.name || 'a candidate'} from ${d.homeState || 'your home State'}, with ${d.optional || 'your optional subject'} as your optional and an interest in ${d.hobbies || 'your stated hobbies'}. Your background is ${d.background || 'as stated in your DAF'}.

Let us begin simply: **tell us about yourself in a way that is not already on your DAF.**`
}

export function interviewQuestions(session: Pick<InterviewSession, 'daf'>): string[] {
  const d = session.daf
  return [
    `You are from ${d.homeState || 'your home State'}. What is the most important development challenge there, and what would you do about it as a district officer?`,
    `Why did you choose ${d.optional || 'your optional subject'}? How does it help you understand governance?`,
    `You mention ${d.hobbies || 'your hobbies'}. What has that interest taught you about patience or teamwork?`,
    `The board is concerned about ethical compromises in public life. Tell us about a situation where you chose the harder right over the easier wrong.`,
    `Should welfare schemes be universal or targeted? Take a position and defend it.`,
    `If a senior officer directs you to implement a policy you believe is unfair, what do you do?`,
    `What is one current international issue that will shape India’s next decade?`,
    `If you were posted in a district with a severe flood and limited resources, what would your first 48 hours look like?`,
  ]
}

export function interviewReply(session: Pick<InterviewSession, 'daf'>, turns: InterviewTurn[]): string {
  const candidateTurns = turns.filter(t => t.role === 'candidate')
  const n = candidateTurns.length
  const qs = interviewQuestions(session)
  const last = candidateTurns.at(-1)?.content.toLowerCase() ?? ''
  let followUp = ''
  if (/scheme|policy|welfare/.test(last)) followUp = 'You mentioned a policy. Who are the stakeholders, and what is the strongest objection to your proposal?'
  else if (/officer|senior|order/.test(last)) followUp = 'Suppose your senior disagrees with your reasoning. How would you dissent without breaking the chain of command?'
  else if (/flood|disaster|district/.test(last)) followUp = 'What would you deprioritise in those first 48 hours, and how would you explain that choice to the public?'
  else if (/india|world|global/.test(last)) followUp = 'What is India’s interest here, and what is the cost of getting it wrong?'
  else followUp = 'That is a reasonable start. Give me one concrete example, and then tell me what you would do differently if resources were halved.'

  if (n >= qs.length) {
    return `We have covered a range of ground. Before we close, is there anything you would like the board to know that you have not had a chance to say?

_When you are ready, end the interview to receive structured feedback._`
  }
  return `**Follow-up:** ${followUp}

_(${qs[Math.min(n, qs.length - 1)]})_`
}

export function interviewFeedback(session: InterviewSession) {
  const answers = session.turns.filter(t => t.role === 'candidate').map(t => t.content)
  const all = answers.join(' ').toLowerCase()
  const words = answers.reduce((s, a) => s + a.split(/\s+/).filter(Boolean).length, 0)
  const avg = answers.length ? Math.round(words / answers.length) : 0
  const hasExample = /for example|for instance|such as|case/.test(all)
  const hasBalance = /however|on the other hand|balance|trade-off|limitation/.test(all)
  const hasEthics = /ethic|integrity|public interest|accountab|नैतिक/.test(all)
  const hasFacts = /article|scheme|policy|committee|commission|report/.test(all)
  const clarity = clamp(4 + Math.min(4, Math.round(avg / 40)) + (hasExample ? 1 : 0), 1, 9)
  const confidence = clamp(4 + Math.min(3, answers.length) + (avg > 40 ? 1 : 0), 1, 9)
  const reasoning = clamp(3 + (hasExample ? 2 : 0) + (hasBalance ? 2 : 0) + (hasFacts ? 1 : 0), 1, 9)
  const communication = clamp(4 + Math.min(4, Math.round(avg / 50)), 1, 9)
  const knowledge = clamp(3 + (hasFacts ? 3 : 0) + (hasExample ? 1 : 0), 1, 9)
  const balance = clamp(3 + (hasBalance ? 3 : 0) + (hasEthics ? 1 : 0), 1, 9)
  const personality = clamp(4 + (answers.length >= 4 ? 1 : 0) + (hasEthics ? 2 : 0) + (hasBalance ? 1 : 0), 1, 9)
  return {
    dimensions: [
      { label: 'Communication', score: communication, note: 'Aim for structured, conversational answers of 60–90 seconds.' },
      { label: 'Clarity', score: clarity, note: 'Lead with your conclusion, then give reasons and an example.' },
      { label: 'Confidence', score: confidence, note: 'Pause instead of filling silence. Acknowledge uncertainty honestly.' },
      { label: 'Reasoning', score: reasoning, note: 'Show trade-offs and a defensible decision rule.' },
      { label: 'Balance', score: balance, note: 'The board tests temperament as much as knowledge.' },
      { label: 'Knowledge', score: knowledge, note: 'Anchor claims in constitutional or policy specifics.' },
      { label: 'Personality', score: personality, note: 'Consistency between DAF, values and answers matters.' },
    ],
    strengths: [
      answers.length >= 4 ? 'Engaged consistently across the board’s questions' : 'Made a start on the board’s questions',
      hasExample ? 'Used concrete examples' : 'Showed willingness to reason from principle',
      hasEthics ? 'Connected answers to public interest and ethics' : 'Kept the tone civil and responsive',
    ],
    improvements: [
      'Structure each answer as: position → reason → example → caveat.',
      hasFacts ? 'Verify every factual claim before the interview.' : 'Add one constitutional or policy anchor per answer.',
      hasBalance ? 'Keep the balance, but end with a clear personal position.' : 'Acknowledge the strongest counter-view before concluding.',
      'Practise DAF-based follow-ups aloud, not only in writing.',
    ],
    verdict: 'Indicative practice feedback — not a UPSC mark or prediction.',
    disclaimer: 'This is an AI practice tool. It cannot replicate the UPSC Personality Test, its board, or its marking. Use it to rehearse structure and self-awareness only.',
  }
}

async function callProxy(task: string, payload: unknown, messages: ChatMessage[] = []): Promise<string | null> {
  if (!PROXY_URL) return null
  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, payload, messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role, content: m.content }))] }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.content === 'string' ? data.content : null
  } catch {
    return null
  }
}

export async function mentorReply(input: {
  message: string
  language: Language
  profile: StudyProfile
  contextTopicId?: string
  history: ChatMessage[]
  weakTopicIds?: string[]
}): Promise<string> {
  const remote = await callProxy('mentor', { profile: input.profile, contextTopicId: input.contextTopicId }, [...input.history.slice(-6), { id: 'x', role: 'user', content: input.message, createdAt: new Date().toISOString() }])
  if (remote) return remote

  const topic = (input.contextTopicId ? topicById(input.contextTopicId) : undefined) ?? detectTopic(input.message)
  const intent = detectIntent(input.message)
  const hindi = input.language === 'hi'

  if (intent === 'plan') return planSummary(input.profile, input.weakTopicIds ?? [])
  if (intent === 'evaluate') {
    return `## Answer evaluation

Paste the full question and your answer in **Mains → Answer Writing** for a detailed rubric. In chat, include the question, your answer and the word limit.

I will assess: understanding, structure, content depth, examples and data, constitutional references, balance, language and conclusion. I will also give you a model answer and a better introduction and conclusion.

> I will not award marks as UPSC would. The score is an indicative practice signal.`
  }
  if (intent === 'interview') {
    return `## Interview preparation

Open **Interview** to run a DAF-based mock. The board will ask about your background, optional, home State, hobbies, ethics and current affairs, with follow-ups.

After the session I will give indicative feedback on communication, clarity, confidence, reasoning, balance, knowledge and personality.

> These are practice signals, not UPSC interview marks.`
  }
  if (intent === 'quiz') return quizFromTopic(topic)
  if (intent === 'pyq') return pyqFromTopic(topic)
  if (intent === 'notes') return topic ? notesForTopic(topic) : 'Tell me the topic and I will turn it into structured revision notes with facts, exam angles and a recall checklist.'
  if (intent === 'revise') return revisionForTopics(input.weakTopicIds?.length ? input.weakTopicIds : topic ? [topic.id] : [])
  if (intent === 'teach' && topic) return buildLesson(topic, input.language, input.profile.level === 'beginner' ? 'beginner' : 'intermediate')
  if (topic) return buildLesson(topic, input.language, input.profile.level === 'beginner' ? 'beginner' : 'intermediate')

  const ca = currentAffairs.find(c => input.message.toLowerCase().includes(c.title.toLowerCase().split(' ').slice(0, 2).join(' ')))
  if (ca) {
    return `## ${ca.title}

**What happened:** ${ca.whatHappened}

**Why it matters:** ${ca.whyImportant}

### Prelims facts
${ca.prelimsFacts.map(f => `- ${f}`).join('\n')}

### Mains dimensions
${ca.mainsDimensions.map(d => `- **${d.label}:** ${d.text}`).join('\n')}

### Possible questions
${ca.questions.map(q => `- ${q}`).join('\n')}`
  }

  return `## Let us make this exam-relevant

I could not map your question to a specific syllabus topic with confidence. I will not invent an answer.

**Try one of these**
- “Teach me Fundamental Rights” / “मूल अधिकार पढ़ाओ”
- “Explain fiscal deficit with examples”
- “Quiz me on climate change”
- “Give me PYQs on the judiciary”
- “Make revision notes on the monsoon”
- “Build my study plan”

Or paste a specific question, judgment, scheme or news item and I will break it into **concept → relevance → facts → example → PYQ link → mistakes → revision → practice**.

${hindi ? 'आप हिंदी में भी लिख सकते हैं।' : 'You can write in English or Hindi.'}`
}

export function generateMCQs(topicId: string | undefined, count = 5): MCQQuestion[] {
  const pool = topicId ? questionsForTopic(topicId) : questions
  return pool.slice(0, count)
}

export function flashcardsFromText(source: string, deck: string): Pick<Flashcard, 'front' | 'back' | 'deck'>[] {
  const sentences = source
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 40)
  return sentences.slice(0, 6).map(s => {
    const pivot = s.split(/\s+/)
    const front = pivot.slice(0, Math.min(12, Math.ceil(pivot.length / 2))).join(' ')
    return { front: `${front}…`, back: s, deck }
  })
}

export function summariseNotes(content: string): string {
  const sentences = content.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)
  const ranked = sentences
    .map((s, i) => ({ s, i, score: s.length + (/therefore|important|key|thus|conclusion/i.test(s) ? 30 : 0) - i * 0.1 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .sort((a, b) => a.i - b.i)
  return ranked.map((r, i) => `${i + 1}. ${r.s}`).join('\n')
}

export function noteAction(action: string, content: string, topicId?: string) {
  const topic = topicId ? topicById(topicId) : undefined
  switch (action) {
    case 'summarize':
      return `## Summary\n\n${summariseNotes(content)}`
    case 'simplify':
      return `## Simplified\n\n${content.split(/(?<=[.!?])\s+/).slice(0, 8).map(s => `- ${s.trim()}`).join('\n') || '- Add more content to simplify.'}`
    case 'revision':
      return `## Revision notes\n\n${(topic ? knowledge[topic.id]?.facts ?? [] : []).map(f => `- ${f}`).join('\n') || content.split('\n').filter(Boolean).slice(0, 8).map(l => `- ${l.replace(/^[-*]\s*/, '')}`).join('\n')}\n\n### Recall prompts\n- Explain the central idea in one sentence.\n- Give one example.\n- Connect it to a current issue.\n- State one limitation.`
    case 'mcqs':
      return topic ? quizFromTopic(topic) : 'Link this note to a syllabus topic, then I can generate a topic-aligned quiz from the question bank.'
    case 'flashcards':
      return `## Flashcards created\n\n${flashcardsFromText(content, topic?.name ?? 'My notes').map((c, i) => `${i + 1}. **${c.front}**\n   → ${c.back}`).join('\n\n')}\n\nOpen **Flashcards** to review them with spaced repetition.`
    case 'missing':
      return `## Missing points checklist\n\n- Definition or core concept\n- Constitutional / legal / institutional anchor\n- One concrete example\n- A counter-argument or limitation\n- A current-affairs link\n- A way forward\n\n${topic ? `For **${topic.name}**, also check: ${topic.subtopics.join(', ')}.` : ''}`
    default:
      return content
  }
}
