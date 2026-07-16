"""
Seed content for the Kybalion Experience: book metadata, the seven
principles, annotation types, definitions, and visualisation references.

CONTENT POLICY
--------------
* The original text is loaded verbatim from library/data/kybalion_1908.json,
  generated from the public-domain Project Gutenberg transcription (ebook
  #14209) of the 1908 Yogi Publication Society edition by
  scripts/import_gutenberg.py. Nothing in this module is presented as
  original text.
* The chapter structure and curated annotated passages live in
  library/seed_curation.py; passages anchor to the verbatim text by exact
  phrase search at seed time.
* Explanations, examples, and interpretations are original editorial
  commentary written for this project; they are always shown as commentary,
  never as original text.
"""

BOOK = {
    "slug": "the-kybalion",
    "title": "The Kybalion",
    "subtitle": "A Study of the Hermetic Philosophy of Ancient Egypt and Greece",
    "author_attribution": "Three Initiates",
    "published_year": 1908,
    "is_public_domain": True,
    "description": (
        "Published in 1908 by the Yogi Publication Society of Chicago, The Kybalion presents "
        "seven principles said to summarise the Hermetic tradition. This digital edition pairs "
        "the original text with clearly separated modern commentary, definitions, and "
        "interactive study tools."
    ),
}

EDITION = {
    "slug": "yogi-publication-society-1908",
    "name": "Yogi Publication Society, Chicago, 1908",
    "publisher": "Yogi Publication Society",
    "year": 1908,
    "source_url": "https://www.gutenberg.org/ebooks/14209",
    "source_notes": (
        "Text loaded verbatim from the Project Gutenberg transcription (ebook #14209) of the "
        "1908 Yogi Publication Society edition, converted with scripts/import_gutenberg.py. "
        "Chapters I–XV are complete; the publisher's front matter and Introduction are not "
        "included in the reader. See docs/CONTENT.md for provenance and update workflow."
    ),
    "license_note": "Public domain (published 1908, USA).",
    "is_primary": True,
}

SOURCE_REFERENCES = [
    {
        "citation": "Three Initiates, The Kybalion (Chicago: Yogi Publication Society, 1908).",
        "url": "",
        "notes": "Primary source. All quoted text is attributed to this edition.",
    },
    {
        "citation": "The Kybalion, Project Gutenberg ebook #14209 (public-domain transcription).",
        "url": "https://www.gutenberg.org/ebooks/14209",
        "notes": "Transcription from which the reader text was imported verbatim.",
    },
]

ANNOTATION_TYPES = [
    {"slug": "definition", "name": "Definition", "icon": "book-open", "accent": "parchment", "order": 1,
     "description": "Meaning of an unusual or technical term."},
    {"slug": "plain", "name": "Plain English", "icon": "align-left", "accent": "gold", "order": 2,
     "description": "The passage restated in modern, everyday language."},
    {"slug": "deep", "name": "Deep Interpretation", "icon": "layers", "accent": "violet", "order": 3,
     "description": "A fuller philosophical reading of the passage."},
    {"slug": "historical", "name": "Historical Context", "icon": "landmark", "accent": "bronze", "order": 4,
     "description": "Where the idea comes from and how it was understood at the time."},
    {"slug": "symbolism", "name": "Symbolism", "icon": "shapes", "accent": "copper", "order": 5,
     "description": "Symbols and imagery at work in the passage."},
    {"slug": "principle-link", "name": "Principle Link", "icon": "link", "accent": "gold", "order": 6,
     "description": "How the passage connects to one of the seven principles."},
    {"slug": "modern-example", "name": "Modern Example", "icon": "lightbulb", "accent": "amber", "order": 7,
     "description": "A contemporary illustration of the idea."},
    {"slug": "practical", "name": "Practical Application", "icon": "compass", "accent": "amber", "order": 8,
     "description": "A way to notice or use the idea in daily life."},
    {"slug": "reflection", "name": "Reflection", "icon": "feather", "accent": "violet", "order": 9,
     "description": "A question inviting your own interpretation."},
    {"slug": "misunderstanding", "name": "Common Misunderstanding", "icon": "alert-circle", "accent": "crimson", "order": 10,
     "description": "How the passage is often misread, and a clarification."},
    {"slug": "cross-reference", "name": "Cross-Reference", "icon": "git-branch", "accent": "copper", "order": 11,
     "description": "Related passages elsewhere in the book."},
    {"slug": "visualisation", "name": "Visualisation", "icon": "eye", "accent": "gold", "order": 12,
     "description": "An interactive conceptual diagram of the idea."},
    {"slug": "editorial", "name": "Editorial Note", "icon": "pen-tool", "accent": "parchment", "order": 13,
     "description": "A note from the editors of this digital edition."},
    {"slug": "ai", "name": "AI Interpretation", "icon": "sparkles", "accent": "violet", "order": 14,
     "description": "Machine-generated commentary, always labelled and reviewed separately."},
]

DEFINITIONS = [
    {"slug": "hermetic", "term": "Hermetic", "etymology": "From Hermes Trismegistus, the legendary Greco-Egyptian sage.",
     "meaning": "Belonging to the tradition of philosophy and esoteric teaching attributed to Hermes Trismegistus. "
                "By extension, 'hermetically sealed' came to mean perfectly closed — a nod to the tradition's secrecy."},
    {"slug": "the-all", "term": "THE ALL", "etymology": "",
     "meaning": "The Kybalion's name for ultimate reality — the total, unknowable ground from which everything arises. "
                "It is deliberately left undefined; the book insists it cannot be described, only pointed toward."},
    {"slug": "transmutation", "term": "Transmutation", "etymology": "Latin transmutare, 'to change across'.",
     "meaning": "In alchemy, turning one metal into another. The Kybalion uses it for changing one mental state "
                "into another — the 'Mental Art' it claims the alchemists were really describing."},
    {"slug": "plane", "term": "Plane", "etymology": "",
     "meaning": "A level or scale of existence. The book speaks of physical, mental, and spiritual planes, and claims "
                "the same laws repeat on each — the ground of the Principle of Correspondence."},
    {"slug": "polarity", "term": "Polarity", "etymology": "Greek polos, 'axis, pivot'.",
     "meaning": "The framing of apparent opposites as two ends of one continuous scale — hot and cold, light and dark — "
                "differing in degree rather than in kind."},
    {"slug": "vibration", "term": "Vibration", "etymology": "Latin vibrare, 'to shake'.",
     "meaning": "In the book's usage, the claim that nothing is truly at rest and that differences between things "
                "correspond to differences in rate of motion. A metaphorical, pre-scientific usage — not modern physics."},
    {"slug": "rhythm", "term": "Rhythm", "etymology": "Greek rhythmos, 'measured flow'.",
     "meaning": "The pendulum-like swing the book sees in all processes: tides, moods, fortunes, eras — advance and "
                "return, rise and fall, each swing compensating the other."},
    {"slug": "mentalism", "term": "Mentalism", "etymology": "",
     "meaning": "The doctrine that reality is fundamentally mental in character — that the universe exists within "
                "mind. In The Kybalion, the first and most foundational of the seven principles."},
    {"slug": "gender-principle", "term": "Gender (Hermetic)", "etymology": "Latin genus, 'kind, sort'.",
     "meaning": "In the book's historical vocabulary, the claim that creation always involves a generative and a "
                "receptive force working together. It is a statement about creative processes, not about biological "
                "sex or modern gender identity."},
    {"slug": "initiate", "term": "Initiate", "etymology": "Latin initiare, 'to begin, to admit to secret rites'.",
     "meaning": "One admitted into a tradition's inner teaching. The anonymous authors of The Kybalion styled "
                "themselves 'Three Initiates'."},
]

# ---------------------------------------------------------------------------
# The Seven Principles
# ---------------------------------------------------------------------------

PRINCIPLES = [
    {
        "slug": "mentalism", "number": 1, "name": "The Principle of Mentalism",
        "aphorism": "THE ALL IS MIND; The Universe is Mental.",
        "aphorism_source": "The Kybalion, ch. II (Yogi Publication Society, 1908)",
        "accent": "gold", "symbol": "mentalism", "visualisation_key": "mentalism",
        "summary": "Reality, at its root, is held to be mental — the universe is a creation of, and exists within, mind.",
        "plain_explanation": (
            "The first principle claims that everything we experience is, at bottom, mental. Just as a story exists "
            "in the mind of its author, the universe is said to exist in the mind of THE ALL. On the human scale, the "
            "principle points at something more modest and observable: the world you live in reaches you only through "
            "perception and interpretation. Change the mind that perceives, and the world-as-experienced changes with it."
        ),
        "deep_interpretation": (
            "Philosophically, Mentalism is a form of idealism: the view that mind, not matter, is fundamental. The "
            "Kybalion's version is hierarchical — finite minds exist within an infinite one — which lets the book "
            "affirm both that the universe is mental and that it is stubbornly real to those inside it. Read "
            "sceptically, the principle is unprovable metaphysics; read practically, it is an invitation to treat "
            "attention, framing, and belief as the first materials any of us actually work with. Both readings are "
            "kept in view throughout this edition."
        ),
        "editorial_note": (
            "Mentalism is a metaphysical claim, not a scientific finding. This edition presents it as a historical "
            "philosophical position to be examined, not as established fact."
        ),
        "examples": [
            {"kind": "modern", "title": "The interface of experience", "body": (
                "Cognitive science describes perception as a controlled construction: the brain predicts, then checks "
                "its predictions against the senses. Two people can attend the same meeting and genuinely experience "
                "different meetings. That constructive character of experience is the modest, defensible core of what "
                "Mentalism gestures at.")},
            {"kind": "practical", "title": "Reframing before reacting", "body": (
                "Before responding to a difficult email, notice the story you have already told yourself about its "
                "tone. Rewrite that story once — charitably — and watch the felt situation change before any outer "
                "fact has. That is transmutation at the smallest useful scale.")},
        ],
        "misunderstandings": [
            {"claim": "Mentalism means you can think things into existence.", "clarification": (
                "The book does not promise that wishes rearrange matter. Its claim is about the nature of reality and "
                "the leverage of mental states over experience and action — not a mechanism for conjuring outcomes.")},
            {"claim": "If the universe is mental, nothing is real.", "clarification": (
                "The Kybalion explicitly holds that the universe is real to every finite being within it. 'Mental' "
                "describes its ultimate substance, not its unreliability.")},
        ],
        "prompts": [
            "Where today did an interpretation, rather than an event, determine your experience?",
            "What would change in your conduct if you treated attention as your primary instrument?",
        ],
    },
    {
        "slug": "correspondence", "number": 2, "name": "The Principle of Correspondence",
        "aphorism": "As above, so below; as below, so above.",
        "aphorism_source": "The Kybalion, ch. II (Yogi Publication Society, 1908)",
        "accent": "copper", "symbol": "correspondence", "visualisation_key": "correspondence",
        "summary": "Patterns are held to repeat across scales and planes: study one level well and you hold a key to the others.",
        "plain_explanation": (
            "Correspondence claims a structural harmony between levels of reality. The shape of a thing at one scale "
            "— a habit, a household, a nation — is said to echo at other scales. The practical use the book proposes "
            "is inference: when a level is hidden from you, examine a level you can see and reason by analogy, the "
            "way early astronomers reasoned from geometry on Earth to motion in the heavens."
        ),
        "deep_interpretation": (
            "This is the oldest and most quoted Hermetic formula, descending from the Emerald Tablet. Its strong form "
            "— that reality is literally self-similar across planes — is untestable. Its weak form is a genuine "
            "method: analogy and model-building are how science and mathematics extend knowledge past the reachable. "
            "The discipline lies in checking the analogy, since correspondence proposes hypotheses but never confirms "
            "them. The book's own image is the Magic Key: not an answer, but an instrument for opening."
        ),
        "editorial_note": (
            "Analogy is a tool for forming hypotheses, not proof. Patterns that rhyme across scales still need "
            "independent verification at each scale."
        ),
        "examples": [
            {"kind": "modern", "title": "Fractals and self-similarity", "body": (
                "Coastlines, fern leaves, and market charts show statistically similar structure at different "
                "magnifications. Self-similarity is a real mathematical property of many natural systems — a modern, "
                "precise cousin of the correspondence intuition.")},
            {"kind": "practical", "title": "The desk and the calendar", "body": (
                "The state of a person's smallest systems often mirrors their largest. Someone who cannot find a pen "
                "usually cannot find an hour. Tidying one legible level — the desk, the inbox — frequently reveals "
                "what the illegible levels need.")},
        ],
        "misunderstandings": [
            {"claim": "Correspondence proves astrology or divination works.", "clarification": (
                "The principle asserts structural analogy, not causal influence between planets and persons. "
                "The Kybalion itself is a philosophy text, not a manual of fortune-telling.")},
            {"claim": "Any resemblance between two things is meaningful.", "clarification": (
                "Analogies are cheap; verified analogies are rare. The principle invites disciplined comparison, "
                "not pattern-matching on coincidence.")},
        ],
        "prompts": [
            "Pick one small system you run — a drawer, a playlist, a morning. What larger system of yours does it resemble?",
            "Where has an analogy misled you because you never tested it?",
        ],
    },
    {
        "slug": "vibration", "number": 3, "name": "The Principle of Vibration",
        "aphorism": "Nothing rests; everything moves; everything vibrates.",
        "aphorism_source": "The Kybalion, ch. II (Yogi Publication Society, 1908)",
        "accent": "amber", "symbol": "vibration", "visualisation_key": "vibration",
        "summary": "Nothing is truly still: differences between things are framed as differences in rate and quality of motion.",
        "plain_explanation": (
            "Vibration claims that rest is an illusion of scale. Matter, energy, and — in the book's view — mental "
            "states differ not in whether they move but in how fast and in what pattern. Moods, rooms, and "
            "conversations each have something like a frequency: a characteristic rate and quality of change. To "
            "shift a state, the book suggests, change its rate — slow a racing mind, quicken a dull hour."
        ),
        "deep_interpretation": (
            "Written before quantum mechanics, the chapter reads today as a lucky metaphor: physics did dissolve "
            "solid matter into oscillation and field. But the book's claim is not physics — it is a psychology of "
            "states. Its working idea is that mental conditions are dynamic processes rather than fixed things, and "
            "that processes can be re-tuned. That idea needs no physical theory to be useful, and no physical theory "
            "validates its metaphysical extension. This edition keeps the two registers explicitly apart."
        ),
        "editorial_note": (
            "The overlap with modern physics is metaphorical. 'Everything vibrates' in the Hermetic sense is a claim "
            "about process and change, not a statement about quantum fields."
        ),
        "examples": [
            {"kind": "modern", "title": "State, not trait", "body": (
                "Psychology distinguishes stable traits from transient states. Treating anxiety or enthusiasm as a "
                "state — something with a rate, a rise, a decay — rather than an identity is a clinically useful "
                "reframe, and precisely the move this chapter proposes in older language.")},
            {"kind": "practical", "title": "Changing tempo deliberately", "body": (
                "When a working session goes dead, change its tempo instead of its content: stand, walk one block, "
                "put on faster or slower music, breathe at half speed for a minute. The material is unchanged; the "
                "state doing the work is not.")},
        ],
        "misunderstandings": [
            {"claim": "'Raising your vibration' makes good things happen to you.", "clarification": (
                "The book proposes that changing mental tempo changes experience and capacity — not that frequencies "
                "attract rewards. The popular 'vibes attract outcomes' reading is a later invention.")},
            {"claim": "The chapter anticipated quantum physics.", "clarification": (
                "Superficial resemblance is not anticipation. The authors used the physics imagery of their own era "
                "(ether, waves) as metaphor, and the metaphor should be enjoyed as one.")},
        ],
        "prompts": [
            "What is the current tempo of your day — and did you choose it?",
            "Recall a state you assumed was permanent that later passed. What changed its rate?",
        ],
    },
    {
        "slug": "polarity", "number": 4, "name": "The Principle of Polarity",
        "aphorism": (
            "Everything is Dual; everything has poles; everything has its pair of opposites; like and unlike are the "
            "same; opposites are identical in nature, but different in degree; extremes meet; all truths are but "
            "half-truths; all paradoxes may be reconciled."
        ),
        "aphorism_source": "The Kybalion, ch. II (Yogi Publication Society, 1908)",
        "accent": "crimson", "symbol": "polarity", "visualisation_key": "polarity",
        "summary": "Apparent opposites are framed as the two ends of one scale, differing in degree rather than in kind.",
        "plain_explanation": (
            "Where is the line between hot and cold? There isn't one — only degrees on a single thermometer. "
            "Polarity generalises that observation: courage and fear, love and hate, light and dark are treated as "
            "poles of one continuum rather than separate substances. The practical consequence the book draws is "
            "that a state can be moved along its own axis — fear toward courage — where an unrelated state cannot "
            "simply be swapped in."
        ),
        "deep_interpretation": (
            "Polarity is the book's instrument for dissolving false dichotomies and for its art of 'mental alchemy': "
            "transmutation happens along an axis, degree by degree, never by leaping to an unrelated quality. "
            "Philosophically it echoes Heraclitus — the unity of opposites — and anticipates the modern habit of "
            "replacing binaries with spectra. Its limit is equally important: not every pair of terms names one "
            "axis, and calling two things 'poles' does not make them so. The chapter rewards use as a question — "
            "'is this a real axis?' — more than as a doctrine."
        ),
        "editorial_note": (
            "Emotional opposites are not literally measurable like temperature. The scale language is an analogy "
            "with practical value, not an instrument reading."
        ),
        "examples": [
            {"kind": "modern", "title": "Spectra replace switches", "body": (
                "Modern usage keeps discovering that binaries were spectra: introvert/extrovert became a trait "
                "dimension, health/illness became ranges of markers. The conceptual move The Kybalion urges — look "
                "for the axis behind the opposition — is now ordinary good practice in many fields.")},
            {"kind": "practical", "title": "Moving along the axis", "body": (
                "You rarely jump from dread to confidence. But dread can become apprehension, apprehension "
                "readiness, readiness resolve — four small moves along one axis. Naming the axis makes the next "
                "degree visible.")},
        ],
        "misunderstandings": [
            {"claim": "Polarity means good and evil are the same thing.", "clarification": (
                "Saying two poles share an axis is not saying they are equivalent or interchangeable. Degrees "
                "matter — that is the entire point of the principle.")},
            {"claim": "All opposites are poles of one scale.", "clarification": (
                "Some oppositions are genuine dichotomies or category differences. The principle is a lens to try, "
                "and to discard where it does not fit.")},
        ],
        "prompts": [
            "Choose a conflict you frame as either/or. What would the axis between the two positions be called?",
            "Which of your own 'opposites' — discipline and ease, solitude and company — might be degrees of one thing?",
        ],
    },
    {
        "slug": "rhythm", "number": 5, "name": "The Principle of Rhythm",
        "aphorism": (
            "Everything flows, out and in; everything has its tides; all things rise and fall; the pendulum-swing "
            "manifests in everything; the measure of the swing to the right is the measure of the swing to the "
            "left; rhythm compensates."
        ),
        "aphorism_source": "The Kybalion, ch. II (Yogi Publication Society, 1908)",
        "accent": "violet", "symbol": "rhythm", "visualisation_key": "rhythm",
        "summary": "All processes are held to swing like a pendulum: advance and return, rise and fall, in compensating measure.",
        "plain_explanation": (
            "Rhythm claims that nothing moves in a straight line. Energies, moods, projects, and eras swing between "
            "the poles that Polarity establishes — and the swing one way measures the swing back. The book's counsel "
            "is not to stop the pendulum (it says you cannot) but to know where you are in the arc: to expect the "
            "ebb during the flood, and the flood during the ebb, and to stop treating either as permanent."
        ),
        "deep_interpretation": (
            "The chapter introduces what it calls the Law of Neutralisation — the practiced ability to let the "
            "pendulum swing beneath you rather than through you: feeling the ebb without being emptied by it. Read "
            "alongside Stoic practice, it is a doctrine of poise; read alongside behavioural research on regression "
            "to the mean, it is a caution against extrapolating any streak. Its shadow side deserves note: 'rhythm "
            "compensates' can rationalise fatalism. The book intends the opposite — foresight, not surrender."
        ),
        "editorial_note": (
            "Cycles in moods, markets, and seasons have different causes; the pendulum is a unifying image, not a "
            "single mechanism. Beware of using 'rhythm' to predict specifics."
        ),
        "examples": [
            {"kind": "modern", "title": "Regression to the mean", "body": (
                "Exceptional quarters are usually followed by ordinary ones — not because excellence exhausts luck's "
                "budget, but because extremes are rare by definition. Statisticians call it regression to the mean; "
                "the pendulum image gets the phenomenology right even where it gets the mechanism wrong.")},
            {"kind": "practical", "title": "Scheduling for the ebb", "body": (
                "Plan recovery into the plan itself: the day after the launch, the quiet week after the sprint. "
                "Riding rhythm means the return swing is on your calendar before the outswing begins.")},
        ],
        "misunderstandings": [
            {"claim": "Rhythm means effort is pointless because everything reverses.", "clarification": (
                "The principle describes oscillation around a course, not the erasure of progress. Tides return; "
                "the shoreline still changes.")},
            {"claim": "You can time life's cycles precisely.", "clarification": (
                "The book claims pattern, not schedule. Treating the pendulum as a forecasting device turns an "
                "insight about impermanence into a prediction engine it never claims to be.")},
        ],
        "prompts": [
            "Where in an arc — outswing, apex, return — is your current main effort? How do you know?",
            "What would 'neutralising' the next ebb look like in practice, concretely, for you?",
        ],
    },
    {
        "slug": "causation", "number": 6, "name": "The Principle of Cause and Effect",
        "aphorism": (
            "Every Cause has its Effect; every Effect has its Cause; everything happens according to Law; Chance is "
            "but a name for Law not recognized; there are many planes of causation, but nothing escapes the Law."
        ),
        "aphorism_source": "The Kybalion, ch. II (Yogi Publication Society, 1908)",
        "accent": "bronze", "symbol": "causation", "visualisation_key": "causation",
        "summary": "Nothing merely happens: every event is framed as a link in chains of cause, on more planes than one.",
        "plain_explanation": (
            "The sixth principle denies luck any final status: what we call chance is causation we have not traced. "
            "Its human application is a distinction between playing and being played — between acting as a cause "
            "and merely inheriting effects. The book urges the reader to rise from the crowd of the moved into the "
            "smaller company of movers: to choose the causes one sets in motion, knowing effects will follow them."
        ),
        "deep_interpretation": (
            "Philosophically this is determinism with a ladder in it: the 'planes of causation' allow higher-order "
            "causes (habits, intentions, characters) to govern lower-order ones without breaking law. It sits "
            "interestingly beside modern debates on free will — compatibilists would recognise the move. The "
            "practical teaching survives every metaphysical position: consequences are systematic, most people "
            "underestimate how legible their own causes are, and agency begins with auditing which of one's actions "
            "are chosen and which merely triggered."
        ),
        "editorial_note": (
            "Causal talk about human affairs is probabilistic, not mechanical. The examples in this edition are "
            "illustrative chains, not predictions."
        ),
        "examples": [
            {"kind": "modern", "title": "Root-cause analysis", "body": (
                "When engineers investigate an outage they ask 'why' five times, walking effect back to cause "
                "through as many planes as needed — code, process, incentive, culture. The method is this principle "
                "operationalised, minus the metaphysics.")},
            {"kind": "practical", "title": "Choosing your causes", "body": (
                "List three recurring effects in your weeks — the argument, the deadline scramble, the good Sunday. "
                "Trace each to the earliest cause you control. That short list is where agency actually lives.")},
        ],
        "misunderstandings": [
            {"claim": "Cause and Effect here means karma or cosmic justice.", "clarification": (
                "The book describes lawfulness, not moral bookkeeping. Effects follow causes; they do not follow "
                "deserts.")},
            {"claim": "Determinism means resignation.", "clarification": (
                "The chapter's whole thrust is the reverse: because effects are lawful, choosing causes is "
                "powerful. The 'player' the book describes is more responsible, not less.")},
        ],
        "prompts": [
            "Which recurring effect in your life have you never actually traced to its first cause?",
            "Today, where were you a cause — and where merely an effect?",
        ],
    },
    {
        "slug": "gender", "number": 7, "name": "The Principle of Gender",
        "aphorism": "Gender is in everything; everything has its Masculine and Feminine Principles; Gender manifests on all planes.",
        "aphorism_source": "The Kybalion, ch. II (Yogi Publication Society, 1908)",
        "accent": "plum", "symbol": "gender", "visualisation_key": "gender",
        "summary": "Creation is framed as the interplay of two complementary forces — generative impulse and receptive formation.",
        "plain_explanation": (
            "In the book's 1908 vocabulary, 'gender' names two functions present in every creative process: an "
            "initiating, projecting force and a receiving, gestating, form-giving force. A finished anything — an "
            "idea, a piece of music, a company — is said to require both: the spark that begins and the patient "
            "work that develops. Neither function is superior; incomplete creation is what happens when either "
            "operates alone."
        ),
        "deep_interpretation": (
            "The chapter is best read as a process philosophy of creativity: impulse and development, divergence "
            "and convergence, proposal and cultivation. The book itself directs the principle inward — its "
            "fourteenth chapter treats the 'masculine' and 'feminine' as functions within every single mind. "
            "Historically, the male/female vocabulary reflects its era; the underlying claim is about complementary "
            "operations, not about people. This edition retains the original terminology where the text requires "
            "it and uses generative/receptive elsewhere, so the idea can be evaluated apart from its period dress."
        ),
        "editorial_note": (
            "IMPORTANT CONTEXT. The Hermetic 'gender' of 1908 is not a claim about biological sex, social roles, or "
            "modern gender identity. It describes paired functions in creative processes. Reading it as prescribing "
            "human gender roles imports assumptions the text is not making — and flattening it to stereotype "
            "('men initiate, women receive') is precisely the misreading its own fourteenth chapter argues against, "
            "locating both functions in every mind."
        ),
        "examples": [
            {"kind": "modern", "title": "Divergent and convergent thinking", "body": (
                "Design practice alternates deliberately between generating options and developing them — divergence "
                "then convergence, brainstorm then critique. The pairing of an initiating function with a form-giving "
                "one is the same structural insight in contemporary clothes.")},
            {"kind": "practical", "title": "The idea and the drawer", "body": (
                "Notice which half of creation you avoid. Endless beginners need the receptive discipline of "
                "finishing; endless polishers need the generative courage of starting badly. The principle is a "
                "diagnostic for your missing half.")},
        ],
        "misunderstandings": [
            {"claim": "This chapter prescribes roles for men and women.", "clarification": (
                "It does not discuss social roles at all. The functions it names are located in every person and "
                "every process; the book's own sequel chapter, Mental Gender, makes this explicit.")},
            {"claim": "Generative is active and therefore better; receptive is passive and lesser.", "clarification": (
                "In the book's account the receptive function does the greater share of the work — gestation, "
                "development, completion. 'Receptive' is not 'passive'; nothing finished exists without it.")},
        ],
        "prompts": [
            "In your current main project, which function — starting or completing — is underfed?",
            "Recall a collaboration that worked unusually well. How were the generative and receptive functions shared?",
        ],
    },
]

GENERAL_PROMPTS = [
    {"prompt": "What does this passage challenge in your current way of thinking?", "context": "daily"},
    {"prompt": "Where do you notice this principle operating in daily life?", "context": "daily"},
    {"prompt": "What alternative interpretation could be made?", "context": "chapter"},
    {"prompt": "What part of this idea feels useful, and what part feels questionable?", "context": "chapter"},
    {"prompt": "How could this principle be misunderstood?", "context": "chapter"},
]

PRINCIPLE_RELATIONSHIPS = [
    ("correspondence", "mentalism", "builds_on",
     "If reality is mental, planes can mirror one another the way thoughts mirror the mind that holds them."),
    ("vibration", "mentalism", "builds_on",
     "Mental states are the first place the book applies motion and rate: thought as movement."),
    ("polarity", "vibration", "builds_on",
     "Poles are framed as different rates of the same underlying vibration."),
    ("rhythm", "polarity", "builds_on",
     "The pendulum swings between the very poles Polarity establishes."),
    ("causation", "rhythm", "complements",
     "Rhythm describes the shape of change; Cause and Effect describes its lawfulness."),
    ("gender", "polarity", "expresses",
     "Generative and receptive are a creative polarity — one axis, two cooperating ends."),
    ("gender", "causation", "complements",
     "Every chain of causes begins with a generative impulse and is carried by receptive development."),
    ("mentalism", "causation", "complements",
     "Choosing causes deliberately is Mentalism applied: mind as the plane where causes are set."),
    ("correspondence", "rhythm", "complements",
     "Cycles repeat across scales — the tide, the mood, the era — a rhythm seen through correspondence."),
    ("vibration", "rhythm", "complements",
     "Vibration is oscillation up close; Rhythm is the same oscillation seen whole."),
]

VISUALISATIONS = [
    {"slug": "viz-mentalism", "component_key": "mentalism", "principle": "mentalism",
     "title": "The Field of Mind",
     "description": "An interactive field in which a central idea radiates connected nodes of perception, "
                    "interpretation, intention, and act. Touching one node propagates change through its neighbours, "
                    "illustrating — conceptually, not scientifically — how a shift in framing cascades through experience."},
    {"slug": "viz-correspondence", "component_key": "correspondence", "principle": "correspondence",
     "title": "As Above, So Below",
     "description": "Nested rings representing personal, social, natural, and cosmic scales. Moving between rings "
                    "reveals the same geometric motif recurring at each level, with related passages surfacing as you travel."},
    {"slug": "viz-vibration", "component_key": "vibration", "principle": "vibration",
     "title": "The Moving Stillness",
     "description": "A wave field whose frequency, amplitude, and harmony you can adjust. Interference between two "
                    "waves shows how states combine, reinforce, and cancel. Presented as a conceptual metaphor for states of mind."},
    {"slug": "viz-polarity", "component_key": "polarity", "principle": "polarity",
     "title": "One Axis, Two Ends",
     "description": "A continuous spectrum between named opposites — heat and cold, stillness and motion. Sliding "
                    "along the axis shows opposites as degrees, with excerpts and reflection prompts at meaningful positions."},
    {"slug": "viz-rhythm", "component_key": "rhythm", "principle": "rhythm",
     "title": "The Pendulum",
     "description": "A meditative pendulum whose period you control, with the option of a second pendulum for "
                    "comparing rhythms. Pausing the swing reveals passages on tides, cycles, and compensation."},
    {"slug": "viz-causation", "component_key": "causation", "principle": "causation",
     "title": "Chains of Consequence",
     "description": "A branching tree grown from a chosen first action, showing immediate, secondary, and unintended "
                    "effects. Steps can be walked backward from any leaf to the root. Examples are illustrative, not predictive."},
    {"slug": "viz-gender", "component_key": "gender", "principle": "gender",
     "title": "The Two Currents",
     "description": "Two intertwined currents — generative impulse and receptive formation — whose balance you adjust. "
                    "Creation completes only when both currents contribute, illustrating complementary creative functions."},
]
