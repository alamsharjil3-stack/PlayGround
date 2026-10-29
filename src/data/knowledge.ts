export interface LessonKnowledge {
  hook: string
  simple: string[]
  upsc: string
  facts: string[]
  example: string
  pyq: string
  mistakes: string[]
  revision: string[]
  practice: { stem: string; options: string[]; answer: number; explanation: string }
  advanced?: string[]
}

export const knowledge: Record<string, LessonKnowledge> = {
  't-rights': {
    hook: 'Fundamental Rights are the constitutional limits on state power and the clearest expression of the Indian citizen’s relationship with the State.',
    simple: [
      'Part III (Articles 12–35) contains Fundamental Rights. They are enforceable in courts, mainly through Articles 32 and 226. Some rights are available only to citizens, while others apply to all persons.',
      'Think of them as six families: equality (14–18), freedom (19–22), against exploitation (23–24), religion (25–28), cultural and educational rights (29–30), and constitutional remedies (32).',
      'Rights are not absolute. The State can impose reasonable restrictions, and courts balance individual liberty with public interest. The “basic structure” doctrine means Parliament cannot destroy the core of the Constitution.',
    ],
    upsc: 'A high-yield area for Prelims (article matching, writs, landmark cases) and Mains GS II (rights versus duties, judicial review, privacy, federalism). Link every right to a current controversy and a constitutional article.',
    facts: [
      'Article 14: equality before law and equal protection of laws.',
      'Article 17: abolition of untouchability; Article 18: abolition of titles.',
      'Article 19: six freedoms, subject to reasonable restrictions.',
      'Article 21: protection of life and personal liberty; expanded by Maneka Gandhi (1978).',
      'Article 32: right to constitutional remedies; Dr Ambedkar called it the “heart and soul” of the Constitution.',
      'Article 15(3) permits special provisions for women and children; Articles 15(4) and 16(4) permit affirmative action.',
    ],
    example: 'If a State university denies admission solely on the basis of caste, Article 15 is engaged. If a person is detained without being informed of the grounds, Article 22 and Article 21 are engaged. If a law restricts speech, the State must show a reasonable restriction under Article 19(2).',
    pyq: 'UPSC frequently asks about the scope of Article 21, the difference between Article 32 and Article 226, the status of the right to privacy after K.S. Puttaswamy (2017), and the relationship between Fundamental Rights and Directive Principles.',
    mistakes: [
      'Treating all Fundamental Rights as available only to citizens — Articles 14, 20, 21, 21A, 25–28 apply to all persons.',
      'Confusing Article 32 with Article 226 — Article 32 is a fundamental right; Article 226 is a constitutional power of High Courts and is wider.',
      'Assuming rights are absolute — reasonable restrictions and judicial balancing are central.',
    ],
    revision: ['Name the six families of rights.', 'Match Articles 14–32 with their subject matter.', 'Explain one landmark case for Article 21.', 'Distinguish Article 32 and Article 226.', 'Link one current event to a Fundamental Right.'],
    practice: {
      stem: 'Which of the following rights is available to both citizens and non-citizens?',
      options: ['Right to freedom of speech and expression under Article 19', 'Right to equality under Article 14', 'Right to vote under Article 326', 'Right to reside in any part of India under Article 19(1)(e)'],
      answer: 1,
      explanation: 'Article 14 applies to all persons, not only citizens. Article 19 freedoms and the right to vote are available only to citizens.',
    },
    advanced: [
      'The “basic structure” doctrine emerged from Kesavananda Bharati (1973) and limits the amending power under Article 368.',
      'The right to privacy was recognised as intrinsic to Article 21 in K.S. Puttaswamy (2017), with tests of legality, necessity and proportionality.',
      'The interplay between Part III and Part IV has moved from conflict to harmonisation, especially in environmental and education jurisprudence.',
    ],
  },
  't-fiscal': {
    hook: 'Fiscal policy is the government’s use of spending and taxation to influence the economy. The deficit is the headline number that tells you how much the government must borrow.',
    simple: [
      'A government earns revenue (taxes, dividends, fees) and spends on consumption, welfare and capital projects. When spending exceeds non-borrowed receipts, it borrows. That gap is the fiscal deficit.',
      'Three deficits matter: revenue deficit (spending on consumption exceeds revenue), fiscal deficit (total gap including capital spending), and primary deficit (fiscal deficit minus interest payments). Primary deficit shows the current year’s borrowing need excluding past debt costs.',
      'Deficit spending can support demand and capital formation, but persistent borrowing raises interest costs and can crowd out private investment. The FRBM Act provides a fiscal rule framework.',
    ],
    upsc: 'Prelims tests definitions, FRBM targets, Finance Commission and budget terminology. Mains GS III asks about fiscal consolidation, debt sustainability, fiscal federalism and counter-cyclical policy.',
    facts: [
      'Fiscal deficit = total expenditure − total receipts excluding borrowings.',
      'Revenue deficit = revenue expenditure − revenue receipts.',
      'Primary deficit = fiscal deficit − interest payments.',
      'The FRBM Act was enacted in 2003 to institutionalise fiscal discipline.',
      'The Finance Commission (Article 280) recommends tax devolution between the Union and States.',
      'Capital expenditure creates assets; revenue expenditure does not.',
    ],
    example: 'If a government spends ₹120, of which ₹30 is capital expenditure, and earns ₹100 in non-borrowed receipts, the fiscal deficit is ₹20. If interest payments are ₹12, the primary deficit is ₹8. The government is borrowing partly to service past debt.',
    pyq: 'Previous questions have tested the meaning of fiscal deficit, revenue deficit and primary deficit, FRBM review committee recommendations, and the distinction between debt and deficit.',
    mistakes: [
      'Calling fiscal deficit “total expenditure minus total receipts” without excluding borrowings.',
      'Confusing revenue deficit with fiscal deficit — the former excludes capital expenditure.',
      'Assuming all deficit spending is bad — capital expenditure can raise future growth.',
    ],
    revision: ['Write the three deficit formulas.', 'Explain why borrowings are excluded from receipts.', 'State two FRBM objectives.', 'Distinguish capital and revenue expenditure.', 'Give one argument for and one against deficit spending.'],
    practice: {
      stem: 'If total expenditure is ₹500, total receipts excluding borrowings are ₹420, and interest payments are ₹60, what is the primary deficit?',
      options: ['₹20', '₹60', '₹80', '₹140'],
      answer: 0,
      explanation: 'Fiscal deficit = 500 − 420 = ₹80. Primary deficit = fiscal deficit − interest payments = 80 − 60 = ₹20.',
    },
    advanced: [
      'Debt sustainability depends on the primary balance, interest rate and nominal growth (r − g dynamics).',
      'Off-budget borrowings and contingent liabilities can obscure the true fiscal position.',
      'State fiscal rules, GST compensation and centrally sponsored schemes shape fiscal federalism.',
    ],
  },
  't-monetary': {
    hook: 'Monetary policy manages money supply and credit conditions. The RBI’s key lever is the policy rate, which transmits to borrowing costs across the economy.',
    simple: [
      'The Reserve Bank of India conducts monetary policy with a flexible inflation target of 4% CPI inflation, within a 2–6% band. The Monetary Policy Committee (MPC) sets the repo rate.',
      'When inflation is high, the RBI may raise the repo rate to make credit costlier and cool demand. When growth is weak, it may cut rates to encourage borrowing and investment.',
      'Transmission is not automatic: banks’ deposit and lending behaviour, liquidity conditions and fiscal policy all affect how quickly rate changes reach the real economy.',
    ],
    upsc: 'Prelims tests repo/reverse repo, CRR, SLR, MPC composition and RBI functions. Mains GS III asks about inflation targeting, liquidity management, financial inclusion and the RBI’s role in development.',
    facts: [
      'Repo rate: rate at which RBI lends short-term funds to banks against securities.',
      'Reverse repo rate: rate at which RBI absorbs liquidity from banks.',
      'CRR: percentage of net demand and time liabilities kept as cash with the RBI.',
      'SLR: percentage of NDTL invested in approved securities.',
      'MPC has six members: three from the RBI and three appointed by the Central Government.',
      'The RBI was nationalised in 1949 and is the banker to the government and lender of last resort.',
    ],
    example: 'If inflation rises well above the 6% upper tolerance, the MPC may raise the repo rate. Higher policy rates typically raise lending rates, reduce credit demand and moderate aggregate demand, though the effect lags.',
    pyq: 'Questions have tested the inflation-targeting framework, the difference between repo and reverse repo, quantitative easing, and the RBI’s role in government securities.',
    mistakes: [
      'Confusing repo and reverse repo directions.',
      'Assuming the RBI alone controls inflation — supply shocks, fiscal policy and global prices matter.',
      'Forgetting that the inflation target is 4% with a band, not a fixed 4% ceiling.',
    ],
    revision: ['Define repo, reverse repo, CRR and SLR.', 'State the inflation target and band.', 'Explain one transmission channel.', 'List three RBI functions.', 'Distinguish monetary and fiscal policy.'],
    practice: {
      stem: 'Which instrument is used by the RBI to absorb liquidity from the banking system?',
      options: ['Repo rate', 'Reverse repo rate', 'Bank rate', 'Marginal standing facility'],
      answer: 1,
      explanation: 'The reverse repo rate is the rate at which the RBI absorbs liquidity from banks. The repo rate is used to inject liquidity.',
    },
    advanced: [
      'The RBI uses variable rate reverse repo (VRRR) auctions for liquidity management.',
      'The monetary-fiscal interface matters during large government borrowing programmes.',
      'Financial stability concerns can complicate inflation targeting, especially during credit booms.',
    ],
  },
  't-climate': {
    hook: 'Climate change is a global commons problem: the costs of emissions are borne by everyone, but the benefits of emitting accrue to the emitter. That is why international cooperation is hard.',
    simple: [
      'Greenhouse gases trap heat in the atmosphere. Carbon dioxide from fossil fuels, methane from agriculture and industry, and nitrous oxide are the main long-lived contributors.',
      'The UNFCCC (1992) established the principle of common but differentiated responsibilities. The Kyoto Protocol (1997) set binding targets for developed countries. The Paris Agreement (2015) adopted nationally determined contributions and a long-term temperature goal.',
      'India’s climate policy balances adaptation, mitigation and development. Its NDCs include reducing emissions intensity and increasing non-fossil capacity, but finance and technology transfer remain contested.',
    ],
    upsc: 'Prelims tests institutions, protocols, greenhouse gases and reports. Mains GS III asks about climate justice, adaptation, loss and damage, carbon markets and the energy transition.',
    facts: [
      'Paris Agreement: hold warming well below 2°C and pursue 1.5°C above pre-industrial levels.',
      'UNFCCC: adopted in 1992 at the Rio Earth Summit.',
      'Kyoto Protocol: adopted in 1997; first commitment period 2008–2012.',
      'Loss and Damage Fund: established at COP27 and operationalised at COP28.',
      'IPCC: assesses climate science; it does not conduct original research.',
      'Global Stocktake: five-yearly assessment of collective progress under the Paris Agreement.',
    ],
    example: 'A coastal city facing sea-level rise needs adaptation (embankments, drainage, early warning), while a coal-dependent region needs a just transition plan. Mitigation alone does not address existing vulnerability.',
    pyq: 'UPSC has asked about the Paris Agreement, Kyoto Protocol mechanisms, IPCC, climate finance, and the difference between mitigation and adaptation.',
    mistakes: [
      'Treating the Paris Agreement as legally binding on emissions targets — NDCs are nationally determined.',
      'Confusing mitigation (reducing emissions) with adaptation (adjusting to impacts).',
      'Ignoring equity and historical responsibility in answers.',
    ],
    revision: ['State the Paris temperature goal.', 'Distinguish mitigation and adaptation.', 'Name three climate funds.', 'Explain common but differentiated responsibilities.', 'List two India NDC targets.'],
    practice: {
      stem: 'The principle of “common but differentiated responsibilities” is associated with which environmental agreement?',
      options: ['Montreal Protocol', 'UNFCCC', 'Basel Convention', 'Ramsar Convention'],
      answer: 1,
      explanation: 'CBDR is a founding principle of the UNFCCC (1992), recognising differing capabilities and historical responsibilities.',
    },
    advanced: [
      'Carbon border adjustment mechanisms raise competitiveness and equity concerns for developing economies.',
      'Article 6 of the Paris Agreement governs voluntary cooperation and carbon markets.',
      'The adaptation finance gap is larger than the mitigation finance gap for many vulnerable countries.',
    ],
  },
  't-union-state': {
    hook: 'The Union and States are not rivals but interlocking constitutionally created governments. Parliament is the primary law-making body, but federalism shapes how power is actually exercised.',
    simple: [
      'The President is the constitutional head of the Union; real executive power lies with the Prime Minister and the Council of Ministers, which is collectively responsible to the Lok Sabha.',
      'Parliament has two Houses: the Lok Sabha (directly elected) and the Rajya Sabha (representing States and Union Territories). A Bill must generally pass both Houses and receive presidential assent.',
      'Federalism is asymmetric: the Union has stronger legislative and financial powers, while States have their own elected governments and subjects. Cooperative and competitive federalism operate simultaneously.',
    ],
    upsc: 'Prelims tests articles, parliamentary procedures, President’s powers and money bills. Mains GS II asks about federalism, centre-state relations, parliamentary committees and governance.',
    facts: [
      'Article 74: Council of Ministers to aid and advise the President.',
      'Article 75: Prime Minister appointed by the President; ministers on PM’s advice.',
      'Article 110: definition of Money Bill; Speaker certifies.',
      'Article 108: joint sitting of both Houses (not for Money Bills or Constitution Amendment Bills).',
      'Article 112: Annual Financial Statement (Budget).',
      'Article 368: amendment procedure.',
    ],
    example: 'If the Rajya Sabha disagrees on an ordinary Bill, a joint sitting can resolve the deadlock. A Money Bill, however, can be passed by the Lok Sabha with the Rajya Sabha only making recommendations within 14 days.',
    pyq: 'Previous questions have tested the President’s pardoning power, the role of the Rajya Sabha, Money Bills, parliamentary committees and the Governor’s discretion.',
    mistakes: [
      'Saying the President is the real executive — the President acts on ministerial advice.',
      'Confusing a Money Bill with a Financial Bill.',
      'Assuming the Rajya Sabha is powerless — it has special powers under Article 249 and cannot be bypassed on ordinary Bills.',
    ],
    revision: ['List the President’s legislative powers.', 'Explain the Money Bill procedure.', 'Distinguish Lok Sabha and Rajya Sabha powers.', 'Name three parliamentary committees.', 'Give one example of cooperative federalism.'],
    practice: {
      stem: 'Who decides whether a Bill is a Money Bill?',
      options: ['President', 'Speaker of the Lok Sabha', 'Chairman of the Rajya Sabha', 'Parliamentary Affairs Minister'],
      answer: 1,
      explanation: 'Under Article 110(3), the Speaker’s decision on whether a Bill is a Money Bill is final.',
    },
    advanced: [
      'The anti-defection law (Tenth Schedule) affects the balance between party discipline and parliamentary deliberation.',
      'The Governor’s discretionary powers and assent to Bills have become a major federalism controversy.',
      'Parliamentary committees strengthen scrutiny but their effectiveness depends on referral practices and attendance.',
    ],
  },
  't-digital': {
    hook: 'Digital public infrastructure is India’s distinctive contribution to technology governance: build rails, not just apps, and let innovation happen on top.',
    simple: [
      'India’s digital stack includes Aadhaar (identity), UPI (payments) and DigiLocker (documents). These are public digital rails that private and public actors can build on.',
      'Emerging technologies such as AI, blockchain and quantum computing create new opportunities and risks. Regulation must balance innovation, rights and security.',
      'Cybersecurity is a cross-cutting concern: critical infrastructure, financial systems and personal data all depend on resilient digital systems.',
    ],
    upsc: 'Prelims tests UPI/NPCI, Aadhaar, AI, blockchain, quantum computing and cyber institutions. Mains GS III asks about digital economy, data governance, AI regulation and cybersecurity.',
    facts: [
      'UPI is operated by NPCI.',
      'Aadhaar is issued by UIDAI under the Aadhaar Act, 2016.',
      'The Digital Personal Data Protection Act, 2023, provides a data protection framework.',
      'Quantum computing uses qubits and superposition, unlike classical bits.',
      'Blockchain is a distributed ledger; it is not the same as cryptocurrency.',
    ],
    example: 'A fintech app can use UPI rails to offer instant payments without building its own settlement network. The public rail lowers entry costs but also creates systemic concentration risks.',
    pyq: 'UPSC has asked about UPI, blockchain, AI, data protection and the digital economy. Expect matching questions on institutions and applications.',
    mistakes: [
      'Equating blockchain with cryptocurrency.',
      'Assuming digital public infrastructure is only about government apps.',
      'Ignoring privacy and exclusion risks in digital-first service delivery.',
    ],
    revision: ['Define digital public infrastructure.', 'Name three India Stack components.', 'Distinguish AI, ML and deep learning.', 'Explain one cybersecurity challenge.', 'State the purpose of the DPDP Act, 2023.'],
    practice: {
      stem: 'Which institution operates the Unified Payments Interface?',
      options: ['RBI', 'NPCI', 'SEBI', 'UIDAI'],
      answer: 1,
      explanation: 'NPCI operates UPI. The RBI regulates payment systems, while UIDAI administers Aadhaar.',
    },
    advanced: [
      'The DPDP Act, 2023, introduces consent managers and data principal rights but leaves implementation details to rules.',
      'AI regulation is moving toward risk-based approaches, as in the EU AI Act.',
      'Quantum-safe cryptography is becoming a strategic priority for long-term data security.',
    ],
  },
  't-ethics': {
    hook: 'Ethics is not a list of rules to memorise. It is the disciplined practice of justifying choices when values conflict.',
    simple: [
      'Ethics deals with what is right and good. Morality is the lived set of norms; ethics is the systematic reflection on them.',
      'Three families of reasoning dominate: consequentialism (judge by outcomes), deontology (judge by duties and rules), and virtue ethics (judge by character and habits).',
      'In public administration, ethics translates into integrity, impartiality, accountability, transparency and respect for constitutional values.',
    ],
    upsc: 'GS IV tests conceptual clarity, application to case studies and consistency of reasoning. Answers should show stakeholders, options, trade-offs, a decision and its justification.',
    facts: [
      'Article 51A lists Fundamental Duties, including upholding the Constitution and protecting the environment.',
      'The Second Administrative Reforms Commission examined ethics in governance.',
      'Probity in governance means scrupulous honesty and integrity in public life.',
      'Emotional intelligence helps balance empathy with objectivity in administration.',
      'Mahatma Gandhi’s trusteeship and means-ends ethic are frequently cited.',
    ],
    example: 'A civil servant finds a junior officer leaking confidential information. Options include ignoring it, informally warning the officer, initiating a formal inquiry, or protecting the source. A strong answer weighs public interest, due process, proportionality and institutional trust.',
    pyq: 'Case studies often involve conflicting loyalties, resource scarcity, political pressure, whistleblowing and gender or caste sensitivity. Concept questions ask about attitude, aptitude, integrity and ethical thinkers.',
    mistakes: [
      'Giving a purely legal answer to an ethical dilemma.',
      'Listing values without applying them to the specific facts.',
      'Ignoring the consequences of the chosen option on vulnerable stakeholders.',
    ],
    revision: ['Define integrity and probity.', 'Compare deontology and consequentialism.', 'List three constitutional values.', 'Apply a stakeholder lens to one case.', 'Write a 50-word decision justification.'],
    practice: {
      stem: 'A public servant discloses wrongdoing in her department to the media before exhausting internal channels. Which ethical tension is most central?',
      options: ['Efficiency versus economy', 'Transparency versus loyalty and due process', 'Federalism versus decentralisation', 'Neutrality versus secularism'],
      answer: 1,
      explanation: 'The core tension is between exposing wrongdoing (transparency/public interest) and obligations of loyalty, confidentiality and due process.',
    },
    advanced: [
      'Kant’s categorical imperative and Rawls’s veil of ignorance offer powerful tests for impartiality.',
      'Indian ethical thought, including dharma and nishkama karma, can enrich answers when used precisely.',
      'Ethical regulation must be complemented by institutional design; individual virtue alone is insufficient.',
    ],
  },
}

export const fallbackLesson = (topicName: string, subtopics: string[], subjectName: string): LessonKnowledge => ({
  hook: `${topicName} is a high-value part of the UPSC syllabus. Build it as a network of concepts rather than a list of facts.`,
  simple: [
    `Start with the core idea: what problem does ${topicName} address, and which institutions, processes or principles are involved?`,
    `Build the concept in layers: definition → causes → mechanisms → consequences → responses. This structure works for both Prelims facts and Mains arguments.`,
    `Connect the topic with the syllabus: ${subtopics.join(', ')}. Each subtopic should have one definition, one example and one current linkage.`,
  ],
  upsc: `${topicName} appears in ${subjectName}. Expect factual matching in Prelims and analytical questions in Mains. Always connect static concepts to a recent development or a constitutional/legal principle.`,
  facts: [
    `Core sub-areas: ${subtopics.slice(0, 4).join('; ')}.`,
    'For each sub-area, note one definition, one institution and one example.',
    'Keep a one-page revision sheet with key terms, dates and constitutional/legal references.',
    'Verify time-sensitive facts against official sources before relying on them.',
  ],
  example: `Take one recent news item related to ${topicName}, identify the underlying static concept, and write a three-line UPSC link: what happened, why it matters, and which syllabus topic it connects to.`,
  pyq: `Search the PYQ engine for ${topicName} to see the pattern of questions. If no verified PYQ is available, use AI-generated practice questions and label them clearly.`,
  mistakes: [
    'Studying facts without understanding the underlying mechanism.',
    'Ignoring the current-affairs linkage.',
    'Writing generic Mains answers without definitions, examples or a clear structure.',
  ],
  revision: ['Define the topic in one sentence.', 'Draw a concept map with three branches.', 'Recall three key facts.', 'Link one current event.', 'Answer one 150-word question.'],
  practice: {
    stem: `Which approach is most appropriate for preparing ${topicName} for UPSC?`,
    options: ['Memorise isolated facts without context', 'Build concepts, link them to current affairs, and practise questions', 'Study only previous-year questions', 'Ignore the topic if it is not in the news'],
    answer: 1,
    explanation: 'UPSC rewards conceptual clarity and application. A concept-first approach with current-affairs linkage and practice is more robust than rote memorisation.',
  },
})
