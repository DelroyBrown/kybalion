"""
The curated study layer over the verbatim 1908 text.

CHAPTER_META supplies each chapter's slug and editorial framing (introduction
and summary — clearly labelled commentary, never original text).

CURATED_PASSAGES anchors annotations to the real text: each entry names a
chapter and an exact phrase; the seeder locates the phrase in that chapter's
paragraphs (case-insensitively) and stores the passage with verified offsets.
A phrase that cannot be found aborts the seed, so curation can never drift
silently out of sync with the text.
"""

CHAPTER_META = [
    {
        "number": 1, "slug": "the-hermetic-philosophy", "title": "The Hermetic Philosophy",
        "introduction": (
            "The opening chapter introduces the tradition attributed to Hermes Trismegistus and explains why its "
            "teachings were kept close: not as jealousy, but as timing — instruction reserved for readiness."
        ),
        "summary": (
            "Chapter I frames the whole book: a compact transmission of Hermetic teaching, offered as keys rather "
            "than conclusions, to be tested by the reader's own understanding."
        ),
    },
    {
        "number": 2, "slug": "the-seven-hermetic-principles", "title": "The Seven Hermetic Principles",
        "introduction": (
            "The heart of the book: seven principles stated as axioms. Each is unfolded in its own later chapter, "
            "and in this edition each also has an interactive study page."
        ),
        "summary": (
            "Seven axioms — Mentalism, Correspondence, Vibration, Polarity, Rhythm, Cause and Effect, Gender — form "
            "the skeleton of the entire Hermetic teaching as this book presents it."
        ),
    },
    {
        "number": 3, "slug": "mental-transmutation", "title": "Mental Transmutation",
        "introduction": (
            "The book's art: if states of mind are real materials, they can be worked — changed from state to "
            "state along the axes the principles describe."
        ),
        "summary": (
            "Mental Transmutation names the practical side of the philosophy: the deliberate changing of one's own "
            "mental states, framed as the true subject hidden inside the old alchemical language of metals."
        ),
    },
    {
        "number": 4, "slug": "the-all", "title": "The All",
        "introduction": "What can — and pointedly cannot — be said about ultimate reality as the book conceives it.",
        "summary": (
            "THE ALL is defined mostly by negation: infinite, unchanging, unknowable in essence — the ground of "
            "everything without being any thing."
        ),
    },
    {
        "number": 5, "slug": "the-mental-universe", "title": "The Mental Universe",
        "introduction": "The first principle unfolded: in what sense the universe can be 'in the mind' of THE ALL and still be real.",
        "summary": (
            "The universe is presented as a mental creation of THE ALL — real to its inhabitants, yet held in mind "
            "the way an author holds a world."
        ),
    },
    {
        "number": 6, "slug": "the-divine-paradox", "title": "The Divine Paradox",
        "introduction": "The chapter that keeps the philosophy honest: the universe is and is not — and the wise live in both truths at once.",
        "summary": (
            "Against both naive realism and world-denying idealism, the chapter counsels using the laws of the "
            "relative world while understanding its nature."
        ),
    },
    {
        "number": 7, "slug": "the-all-in-all", "title": "“The All” in All",
        "introduction": "The complementary truth: if all is in THE ALL, THE ALL is equally in all — wholly present in every part.",
        "summary": (
            "The chapter develops divine immanence: the whole present in each part, as a melody is wholly present "
            "in each of its performances."
        ),
    },
    {
        "number": 8, "slug": "planes-of-correspondence", "title": "Planes of Correspondence",
        "introduction": "The second principle unfolded: the great planes of being and the harmony that lets one illuminate another.",
        "summary": (
            "The chapter maps the physical, mental, and spiritual planes and applies 'as above, so below' as an "
            "instrument of inference between them."
        ),
    },
    {
        "number": 9, "slug": "vibration", "title": "Vibration",
        "introduction": "The third principle unfolded: motion as the universal condition, and mental states as motion.",
        "summary": (
            "From spinning matter to shifting moods, the chapter presents differences of state as differences of "
            "rate — and mastery as the power to change one's rate deliberately."
        ),
    },
    {
        "number": 10, "slug": "polarity", "title": "Polarity",
        "introduction": "The fourth principle unfolded: opposites as the two ends of every scale.",
        "summary": (
            "The chapter turns paradox into method: identify the axis behind an opposition and change becomes a "
            "movement of degrees."
        ),
    },
    {
        "number": 11, "slug": "rhythm", "title": "Rhythm",
        "introduction": "The fifth principle unfolded: the pendulum in all things, and the art of not being carried by it.",
        "summary": (
            "The chapter describes the universal swing between poles and teaches what it calls neutralisation: "
            "rising above the pendulum rather than abolishing it."
        ),
    },
    {
        "number": 12, "slug": "causation", "title": "Causation",
        "introduction": "The sixth principle unfolded: law without exception, and the difference between moving and being moved.",
        "summary": (
            "Chance is dissolved into untraced causation, and the reader is invited to become a deliberate cause "
            "rather than a passed-along effect."
        ),
    },
    {
        "number": 13, "slug": "gender", "title": "Gender",
        "introduction": "The seventh principle unfolded: the generative and receptive functions present in all creation.",
        "summary": (
            "The chapter presents creation as the cooperation of two functions, warning against readings that "
            "reduce the teaching to biology."
        ),
    },
    {
        "number": 14, "slug": "mental-gender", "title": "Mental Gender",
        "introduction": "The seventh principle turned inward: both creative functions at work within a single mind.",
        "summary": (
            "The 'I' that initiates and the 'me' that develops are presented as two functions of one mind — "
            "creativity as their cooperation."
        ),
    },
    {
        "number": 15, "slug": "hermetic-axioms", "title": "Hermetic Axioms",
        "introduction": "The book closes as it opened: with maxims — compressed counsel meant to be used, not merely admired.",
        "summary": (
            "A closing sheaf of axioms restates the practical heart of the teaching: study, then use; knowledge "
            "unapplied is called a thing of naught."
        ),
    },
]

# ---------------------------------------------------------------------------
# Curated passages: chapter number + exact phrase from the verbatim text.
# ---------------------------------------------------------------------------

CURATED_PASSAGES = [
    {
        "slug": "lips-of-wisdom", "chapter": 1,
        "phrase": "The lips of wisdom are closed, except to the ears of Understanding",
        "principles": [], "definitions": ["hermetic", "initiate"],
        "annotations": [
            {"type": "plain", "title": "In plain terms",
             "body": "Teaching lands only where there is readiness to hear it. The maxim is less about secrecy than about timing: the same sentence is noise to one listener and a key to another."},
            {"type": "deep", "title": "Readiness as the real gate",
             "body": "The gate in this image is not held shut by the teacher — it is the state of the student. 'Understanding' names a capacity that must exist before content can matter, which is why the book everywhere prefers questions and axioms to systems: it is trying to produce readiness, not agreement."},
            {"type": "historical", "title": "Esoteric schools and reserve",
             "body": "Mystery traditions from Pythagoras onward practised graded instruction: teachings disclosed step by step as students demonstrated capacity. The 1908 authors, writing for an anonymous public readership, open by acknowledging the tension in publishing a 'closed' teaching at all."},
            {"type": "misunderstanding", "title": "Not gatekeeping",
             "body": "A common modern misreading treats this line as elitism. In context it is closer to a claim about pedagogy: explanation cannot substitute for the experience that makes explanation meaningful."},
            {"type": "reflection", "title": "For reflection",
             "body": "What idea did you once dismiss that later opened for you? What changed — the idea, or the ears?"},
        ],
    },
    {
        "slug": "magic-key", "chapter": 2,
        "phrase": "the Magic Key before whose touch all the Doors of the Temple fly open",
        "principles": [], "definitions": [],
        "annotations": [
            {"type": "symbolism", "title": "Key and temple",
             "body": "The temple is a standing image for reality-as-meaningful; the key, for method. Note what the metaphor promises and what it withholds: a key opens doors, but the walking through — and what is found inside — remains the reader's."},
            {"type": "plain", "title": "In plain terms",
             "body": "The seven principles are offered as a compact toolkit: understand them well and the rest of the teaching becomes navigable."},
            {"type": "cross-reference", "title": "Where the seven are unfolded",
             "body": "The seven principles this epigraph promises are enumerated immediately below, and each receives its own chapter later in the book."},
        ],
    },
    {
        "slug": "axiom-mentalism", "chapter": 2,
        "phrase": "THE ALL is MIND; The Universe is Mental",
        "principles": ["mentalism"], "definitions": ["the-all", "mentalism"],
        "annotations": [
            {"type": "plain", "title": "In plain terms",
             "body": "Reality, at its deepest level, is claimed to be mental — everything exists within an infinite mind the book calls THE ALL, the way a story exists within its author."},
            {"type": "principle-link", "title": "Principle I", "principles": ["mentalism"],
             "body": "This is the first and, the book insists, the foundational principle: every other principle describes how this mental universe behaves."},
            {"type": "misunderstanding", "title": "Not wish-fulfilment",
             "body": "The axiom is a metaphysical claim about what reality is, not a promise that thinking about outcomes produces them. The book's own applications concern self-mastery, not manifestation."},
            {"type": "modern-example", "title": "The constructed world",
             "body": "You never experience the world raw — only your nervous system's working model of it. Two colleagues leave the same meeting having attended different meetings. The modest core of this axiom is observable daily."},
        ],
    },
    {
        "slug": "axiom-correspondence", "chapter": 2,
        "phrase": "As above, so below; as below, so above",
        "principles": ["correspondence"], "definitions": ["plane"],
        "annotations": [
            {"type": "plain", "title": "In plain terms",
             "body": "Patterns repeat across scales. What is true of the small is claimed to echo in the large, and the visible level can be used to reason about the hidden one."},
            {"type": "historical", "title": "The Emerald Tablet",
             "body": "This is the oldest formula in the book, descending from the Tabula Smaragdina — the Emerald Tablet — a short Hermetic text known in Arabic from around the eighth century and in Latin from the twelfth, centuries before this 1908 restatement."},
            {"type": "practical", "title": "Using the visible level",
             "body": "When a large system of yours is opaque — a career, a relationship — inspect a small system you can see clearly. The desk often knows what the calendar is hiding."},
        ],
    },
    {
        "slug": "axiom-vibration", "chapter": 2,
        "phrase": "Nothing rests; everything moves; everything vibrates",
        "principles": ["vibration"], "definitions": ["vibration"],
        "annotations": [
            {"type": "plain", "title": "In plain terms",
             "body": "Stillness is apparent, not real. Things — and, in the book's view, states of mind — differ by their rate and pattern of motion."},
            {"type": "misunderstanding", "title": "Not quantum physics",
             "body": "The resemblance to modern physics is a happy metaphor, not anticipation. The chapter's real subject is the changeability of mental states."},
            {"type": "practical", "title": "Change the tempo",
             "body": "A stuck state often yields to a change of rate rather than of content: walk, breathe slower, work faster. Same material, different motion."},
        ],
    },
    {
        "slug": "axiom-polarity", "chapter": 2,
        "phrase": "opposites are identical in nature, but different in degree",
        "principles": ["polarity"], "definitions": ["polarity"],
        "annotations": [
            {"type": "plain", "title": "In plain terms",
             "body": "Hot and cold are one thermometer; courage and fear, the book claims, are one axis. Opposites are degrees of a shared scale, which is why a state can be moved along its own axis by degrees."},
            {"type": "deep", "title": "The engine of transmutation",
             "body": "Polarity is the working mechanism behind the book's 'mental alchemy': change happens along an axis, never by leaping to an unrelated quality. Find the axis and you have found the path."},
            {"type": "reflection", "title": "For reflection",
             "body": "Take a pair you treat as either/or. If they were two ends of one scale, what would the scale measure?"},
        ],
    },
    {
        "slug": "axiom-rhythm", "chapter": 2,
        "phrase": "the measure of the swing to the right is the measure of the swing to the left; rhythm compensates",
        "principles": ["rhythm"], "definitions": ["rhythm"],
        "annotations": [
            {"type": "plain", "title": "In plain terms",
             "body": "Processes swing. The reach of an advance measures the reach of its return — so expect the ebb during the flood, and treat neither as permanent."},
            {"type": "modern-example", "title": "Regression to the mean",
             "body": "After an extreme result, the next is usually closer to average. Statistics calls it regression to the mean; the pendulum image captures how it feels from inside."},
            {"type": "misunderstanding", "title": "Not fatalism",
             "body": "'Rhythm compensates' counsels foresight, not surrender: plan the recovery inside the plan. Tides return, yet the shoreline still changes."},
        ],
    },
    {
        "slug": "axiom-causation", "chapter": 2,
        "phrase": "Chance is but a name for Law not recognized",
        "principles": ["causation"], "definitions": [],
        "annotations": [
            {"type": "plain", "title": "In plain terms",
             "body": "Nothing merely happens. What we call luck is causation we have not traced — and the practical question is whether you are setting causes or only inheriting effects."},
            {"type": "misunderstanding", "title": "Not karma",
             "body": "The axiom describes lawfulness, not moral bookkeeping. Effects follow causes; they do not follow what anyone deserves."},
            {"type": "practical", "title": "Trace one chain",
             "body": "Pick one recurring effect in your week and walk it backward — five whys deep — to the earliest cause you control. Agency lives at that link."},
        ],
    },
    {
        "slug": "axiom-gender", "chapter": 2,
        "phrase": "Gender is in everything; everything has its Masculine and Feminine Principles; Gender manifests on all planes",
        "principles": ["gender"], "definitions": ["gender-principle"],
        "annotations": [
            {"type": "editorial", "title": "A note on terminology",
             "body": "In this 1908 text, 'gender' names paired functions in creative processes — a generative, initiating force and a receptive, form-giving one — located in every person and process. It is not a claim about biological sex, social roles, or modern gender identity. The book's own fourteenth chapter places both functions inside every mind."},
            {"type": "plain", "title": "In plain terms",
             "body": "Everything created requires both a beginning impulse and the patient development that gives it form. Neither function alone completes anything."},
            {"type": "misunderstanding", "title": "Not about roles",
             "body": "Reading this axiom as prescribing what men and women should do imports assumptions the text does not make — and contradicts its own account, which locates both principles in every individual."},
        ],
    },
    {
        "slug": "transmutation-axiom", "chapter": 3,
        "phrase": "True Hermetic Transmutation is a Mental Art",
        "principles": ["mentalism", "polarity", "vibration"], "definitions": ["transmutation"],
        "annotations": [
            {"type": "plain", "title": "In plain terms",
             "body": "The alchemist's furnace was always, on this reading, the mind. Transmutation means changing a mental state by degrees along its own axis — dread into readiness, agitation into attention."},
            {"type": "principle-link", "title": "Three principles at work",
             "principles": ["mentalism", "polarity", "vibration"],
             "body": "Transmutation applies Mentalism (states are the material), Polarity (change moves along an axis), and Vibration (states are processes with a rate, so their rate can be changed)."},
            {"type": "misunderstanding", "title": "Not suppression, not magic",
             "body": "Transmutation is neither pretending a state away nor conjuring its opposite by force of wish. The book describes gradual, deliberate movement of attention and framing — closer to practice than to spell."},
            {"type": "ai", "title": "A sceptical reading", "origin": "ai",
             "ai_model": "local-mock", "ai_prompt_kind": "sceptical-interpretation", "ai_reviewed": False,
             "body": "A sceptic might note that 'mental alchemy' repackages a familiar observation — moods can be regulated — in mystifying language, and that the alchemical framing adds authority rather than evidence. The useful test is purely practical: does deliberately reframing a state change what you can do next? Where it does, the technique stands on its own without the metaphysics; where it does not, no metaphysics rescues it."},
        ],
    },
    {
        "slug": "mentalism-restated", "chapter": 5,
        "phrase": "The Universe is Mental—held in the Mind of THE ALL",
        "principles": ["mentalism"], "definitions": [],
        "annotations": [
            {"type": "cross-reference", "title": "The first axiom, unfolded",
             "body": "The chapter opens by restating the first axiom in its own form. What follows works out how a mental universe can remain lawful, obdurate, and real to everyone within it."},
        ],
    },
    {
        "slug": "correspondence-restated", "chapter": 8,
        "phrase": "As above, so below; as below, so above",
        "principles": ["correspondence"], "definitions": ["plane"],
        "annotations": [
            {"type": "cross-reference", "title": "The axiom restated",
             "body": "The second axiom returns as this chapter's epigraph before the authors set out their scheme of planes and sub-planes."},
        ],
    },
    {
        "slug": "vibration-restated", "chapter": 9,
        "phrase": "Nothing rests; everything moves; everything vibrates",
        "principles": ["vibration"], "definitions": ["vibration"],
        "annotations": [
            {"type": "cross-reference", "title": "The axiom restated",
             "body": "The third axiom opens its own chapter, where the authors extend it from matter and energy to thought and mood."},
        ],
    },
    {
        "slug": "polarity-restated", "chapter": 10,
        "phrase": "like and unlike are the same; opposites are identical in nature, but different in degree",
        "principles": ["polarity"], "definitions": ["polarity"],
        "annotations": [
            {"type": "cross-reference", "title": "The axiom restated",
             "body": "The fourth axiom in full, opening the chapter that develops the book's method of moving along axes of degree."},
        ],
    },
    {
        "slug": "rhythm-restated", "chapter": 11,
        "phrase": "everything has its tides; all things rise and fall",
        "principles": ["rhythm"], "definitions": ["rhythm"],
        "annotations": [
            {"type": "cross-reference", "title": "The axiom restated",
             "body": "The fifth axiom opens its chapter, where the swing of the pendulum is traced through moods, fortunes, and civilisations."},
        ],
    },
    {
        "slug": "causation-restated", "chapter": 12,
        "phrase": "everything happens according to Law",
        "principles": ["causation"], "definitions": [],
        "annotations": [
            {"type": "cross-reference", "title": "The axiom restated",
             "body": "The sixth axiom opens the chapter in which the authors dissolve 'chance' into causation not yet traced."},
        ],
    },
    {
        "slug": "gender-restated", "chapter": 13,
        "phrase": "Gender manifests on all planes",
        "principles": ["gender"], "definitions": ["gender-principle"],
        "annotations": [
            {"type": "editorial", "title": "Reading this chapter today",
             "body": "This edition renders the chapter's two functions as generative and receptive. The 1908 masculine/feminine vocabulary belongs to its period; the argument concerns paired creative functions in every process and person, and the book's own following chapter locates both within each mind. It makes no claims about social roles or modern gender identity."},
            {"type": "cross-reference", "title": "The axiom restated",
             "body": "The seventh axiom opens its chapter and is developed psychologically in Chapter XIV, Mental Gender."},
        ],
    },
]

RELATED_PASSAGES = [
    ("axiom-mentalism", "mentalism-restated", "references",
     "The first axiom is restated as the epigraph of Chapter V, where it is unfolded at length."),
    ("axiom-correspondence", "correspondence-restated", "references",
     "The second axiom returns as the epigraph of Chapter VIII."),
    ("axiom-vibration", "vibration-restated", "references",
     "The third axiom returns as the epigraph of Chapter IX."),
    ("axiom-polarity", "polarity-restated", "references",
     "The fourth axiom returns as the epigraph of Chapter X."),
    ("axiom-rhythm", "rhythm-restated", "references",
     "The fifth axiom returns as the epigraph of Chapter XI."),
    ("axiom-causation", "causation-restated", "references",
     "The sixth axiom returns as the epigraph of Chapter XII."),
    ("axiom-gender", "gender-restated", "references",
     "The seventh axiom returns as the epigraph of Chapter XIII."),
    ("axiom-mentalism", "transmutation-axiom", "develops",
     "If states of mind are the primary material, transmutation is the art of working that material."),
    ("axiom-polarity", "transmutation-axiom", "develops",
     "Transmutation proceeds along the axes Polarity identifies: pole to pole, degree by degree."),
    ("axiom-polarity", "axiom-rhythm", "parallel",
     "Rhythm swings between the very poles Polarity establishes: the two axioms describe one motion from two sides."),
    ("lips-of-wisdom", "magic-key", "parallel",
     "Readiness as the gate in Chapter I; the seven principles as the key in Chapter II."),
]
