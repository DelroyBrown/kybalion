"""
Build backend/library/data/ethiopian_bible.json from the raw texts in sources/.

The Ethiopian Orthodox Tewahedo broader canon, assembled from public-domain
and freely-licensed English translations (see sources/MANIFEST.md):

  - World English Bible USFM (sources/web_us/)      -> most OT/NT books
  - Charles 1917 (Project Gutenberg #77935)         -> 1 Enoch
  - Wikisource CC BY-SA translations                -> Meqabyan 1 (ch. 1-7), 2, 3
  - Abba Selama free translation (Wayback Machine)  -> 1 Meqabyan ch. 8-36
  - Books with no usable free English text yet      -> placeholder entries

Output structure mirrors what seed_ethiopian_bible expects:
  { "book": {...}, "edition": {...},
    "books": [ { number, slug, title, subtitle(group), intro, placeholder,
                 sections: [ { order, title, paragraphs: [ {order, text, kind,
                 is_placeholder} ] } ] } ] }

Usage:
    python scripts/build_ethiopian_bible.py
"""
import html as html_mod
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "sources"
USFM_DIR = SOURCES / "web_us"
OUT_PATH = ROOT / "backend" / "library" / "data" / "ethiopian_bible.json"

# --------------------------------------------------------------------------
# USFM parsing
# --------------------------------------------------------------------------

# Inline markup: strip footnotes/crossrefs entirely, unwrap everything else.
RE_NOTE = re.compile(r"\\f\s.*?\\f\*|\\x\s.*?\\x\*|\\fe\s.*?\\fe\*", re.DOTALL)
RE_W = re.compile(r"\\\+?w\s+([^\\|]*?)(?:\|[^\\]*?)?\\\+?w\*")
RE_CHAR_OPEN = re.compile(r"\\\+?(?:add|wj|nd|qs|bk|pn|k|ord|sig|sls|tl|em|bd|it|bdit|no|sc|qt|sup)\s+")
RE_CHAR_CLOSE = re.compile(r"\\\+?(?:add|wj|nd|qs|bk|pn|k|ord|sig|sls|tl|em|bd|it|bdit|no|sc|qt|sup)\*")
RE_ANY_MARKER = re.compile(r"\\[a-z0-9\-+]+\*?")

PARA_MARKERS = {
    "p", "m", "po", "pr", "cls", "pmo", "pm", "pmc", "pmr", "pi", "pi1", "pi2",
    "pi3", "mi", "nb", "pc", "ph", "b", "q", "q1", "q2", "q3", "q4", "qr", "qc",
    "qm", "qm1", "qm2", "qm3", "li", "li1", "li2", "li3", "li4", "lh", "lf",
    "lim", "lim1", "lim2",
}
SKIP_MARKERS = {
    "id", "ide", "sts", "rem", "h", "toc1", "toc2", "toc3", "mt", "mt1", "mt2",
    "mt3", "mt4", "imt", "is", "ip", "ipi", "im", "imi", "iot", "io", "io1",
    "io2", "iex", "ie", "s", "s1", "s2", "s3", "s4", "sr", "r", "sp", "qa",
    "ms", "ms1", "ms2", "mr", "d0", "cl", "cp", "cd", "va", "vp", "tr", "th1",
    "th2", "tc1", "tc2",
}


def clean_inline(text):
    text = RE_NOTE.sub("", text)
    text = RE_W.sub(r"\1", text)
    text = RE_CHAR_OPEN.sub("", text)
    text = RE_CHAR_CLOSE.sub("", text)
    text = RE_ANY_MARKER.sub("", text)
    return re.sub(r"\s+", " ", text).strip()


def parse_usfm(path, section_label="Chapter"):
    """Parse one USFM file into [{order, title, paragraphs}] sections."""
    sections = []
    current = None  # {"order": n, "title": str, "verses": {num: [chunks]}}
    verse_num = None
    descriptor = None  # psalm heading (\d)
    in_descriptor = False

    def flush():
        if current is None:
            return
        paragraphs = []
        if current["descriptor"]:
            text = clean_inline(current["descriptor"])
            if text:
                paragraphs.append({"order": 0, "text": text, "kind": "epigraph"})
        for num in sorted(current["verses"]):
            text = clean_inline(" ".join(current["verses"][num]))
            if text:
                paragraphs.append({"order": num, "text": text, "kind": "body"})
        if paragraphs:
            sections.append({
                "order": current["order"],
                "title": f"{section_label} {current['order']}",
                "paragraphs": paragraphs,
            })

    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.rstrip()
        if not line:
            continue
        if line.startswith("\\"):
            parts = line.split(None, 1)
            marker = parts[0][1:]
            rest = parts[1] if len(parts) > 1 else ""
            if marker == "c":
                flush()
                try:
                    order = int(re.match(r"\d+", rest.strip()).group())
                except AttributeError:
                    continue
                current = {"order": order, "verses": {}, "descriptor": ""}
                verse_num = None
                in_descriptor = False
            elif marker == "v" and current is not None:
                in_descriptor = False
                m = re.match(r"(\d+)(?:-(\d+))?\s*(.*)", rest, re.DOTALL)
                if not m:
                    continue
                verse_num = int(m.group(1))
                current["verses"].setdefault(verse_num, []).append(m.group(3))
            elif marker == "d" and current is not None:
                in_descriptor = True
                current["descriptor"] += " " + rest
            elif marker in PARA_MARKERS:
                # paragraph/poetry break inside a verse: text may follow inline
                if rest and current is not None:
                    if in_descriptor:
                        current["descriptor"] += " " + rest
                    elif verse_num is not None:
                        current["verses"][verse_num].append(rest)
            elif marker in SKIP_MARKERS:
                in_descriptor = False
            else:
                # unknown marker: keep any trailing text with current verse
                if rest and current is not None and verse_num is not None and not in_descriptor:
                    current["verses"][verse_num].append(rest)
        else:
            if current is None:
                continue
            if in_descriptor:
                current["descriptor"] += " " + line
            elif verse_num is not None:
                current["verses"][verse_num].append(line)
    flush()
    return sections


# --------------------------------------------------------------------------
# 1 Enoch — Charles 1917, Project Gutenberg plain text
# --------------------------------------------------------------------------

ROMAN_RE = re.compile(r"^\s*\[?([IVXLC]+)\.\s+(.*)$")
HEADING_REST_RE = re.compile(r"^(?:[IVXLC]+\.|=[A-Z])")  # "XLIII. XLIV. _..._" etc.
VERSE_SPLIT_RE = re.compile(r"(?:(?<=[\.\?\!\:\;\’\”\)\]〛])|^)\s*(\d{1,3})\.\s+")


def roman_to_int(s):
    vals = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100}
    total, prev = 0, 0
    for ch in reversed(s):
        v = vals[ch]
        total = total - v if v < prev else total + v
        prev = max(prev, v)
    return total


def parse_enoch(path):
    lines = path.read_text(encoding="utf-8").splitlines()
    # Body starts at the first flush-left "I. 1." chapter line; ends at PG footer.
    start = next(i for i, l in enumerate(lines) if re.match(r"^I\.\s+1\.\s", l))
    end = next(
        (i for i, l in enumerate(lines) if l.startswith("*** END OF THE PROJECT")),
        len(lines),
    )
    chapters = {}  # int -> [text lines]
    num = None
    skip_block = False
    for raw in lines[start:end]:
        line = raw.rstrip()
        if not line:
            skip_block = False
            continue
        if line.startswith("Footnote "):
            skip_block = True
            continue
        if skip_block:
            continue
        stripped = line.strip()
        m = ROMAN_RE.match(line)
        if m and m.group(2).startswith("_"):
            # A chapter title heading ("XXXVIII. _The Coming Judgement..._"):
            # marks the chapter start for chapters whose body carries no
            # numeral of its own; the title itself is not text.
            num = roman_to_int(m.group(1))
            chapters.setdefault(num, [])
            continue
        if m and not HEADING_REST_RE.match(m.group(2)):
            # A chapter start (poetic chapters are indented, so allow leading
            # whitespace) — but not a section heading like "XLIII. XLIV. _..._".
            num = roman_to_int(m.group(1))
            chapters.setdefault(num, []).append(m.group(2))
            continue
        # Remaining indented lines: poetry continuation is kept, centred
        # headings (italic/bold/roman ranges/all-caps) are dropped.
        if line.startswith("    "):
            if (
                m  # a heading that failed the rest-check above
                or re.match(r"^[_=]", stripped)
                or re.match(r"^[IVXLC\-\.\s]+$", stripped)
                or (stripped.isupper() and len(stripped) > 3)
                or stripped.endswith("_")
            ):
                continue
            if num is not None:
                chapters[num].append(stripped)
            continue
        if num is not None:
            chapters[num].append(line)

    sections = []
    for num in sorted(chapters):
        text = " ".join(chapters[num])
        text = re.sub(r"\[\d+\]", "", text)  # footnote refs
        text = text.replace("〚", "").replace("〛", "").replace("=", "")
        text = re.sub(r"\s+", " ", text).strip()
        # Split the running chapter text into verses on "N." markers.
        pieces = VERSE_SPLIT_RE.split(text)
        paragraphs = []
        # pieces = [pre, num, text, num, text, ...]; pre may be empty
        pre = pieces[0].strip() if pieces else ""
        if pre and not pre.isdigit():
            # text before the first verse number (chapters lacking "1.")
            paragraphs.append({"order": 1, "text": pre, "kind": "body"})
        pieces = pieces[1:]
        for i in range(0, len(pieces) - 1, 2):
            v = int(pieces[i])
            body = pieces[i + 1].strip()
            if body:
                paragraphs.append({"order": v, "text": body, "kind": "body"})
        # Deduplicate verse numbers (OCR quirks) keeping first occurrence.
        seen, unique = set(), []
        for p in paragraphs:
            if p["order"] in seen:
                unique[-1]["text"] += " " + p["text"]
                continue
            seen.add(p["order"])
            unique.append(p)
        if unique:
            sections.append({
                "order": num,
                "title": f"Chapter {num}",
                "paragraphs": unique,
            })
    return sections


# --------------------------------------------------------------------------
# Meqabyan — Wikisource wikitext + Abba Selama HTML
# --------------------------------------------------------------------------

def strip_wikitext(text):
    text = re.sub(r"\{\{[^{}]*\}\}", "", text, flags=re.DOTALL)
    text = re.sub(r"\{\{[^{}]*\}\}", "", text, flags=re.DOTALL)  # nested pass
    text = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]", r"\1", text)
    text = text.replace("'''", "").replace("''", "")
    return text


def parse_meqabyan_wiki(path):
    text = strip_wikitext(path.read_text(encoding="utf-8"))
    sections = []
    current = None
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = re.match(r"^=*\s*Chapter\s+(\d+)\s*=*$", line, re.IGNORECASE)
        if m:
            current = {"order": int(m.group(1)), "title": f"Chapter {m.group(1)}", "paragraphs": []}
            sections.append(current)
            continue
        if current is None:
            continue
        v = re.match(r"^\[?(\d+)\]?\s+(.*)$", line)
        if v:
            current["paragraphs"].append(
                {"order": int(v.group(1)), "text": v.group(2).strip(), "kind": "body"}
            )
        elif current["paragraphs"]:
            current["paragraphs"][-1]["text"] += " " + line
        else:
            # chapter preamble before verse 1 (e.g. the 1 Meqabyan heading line)
            current["paragraphs"].append({"order": 0, "text": line, "kind": "epigraph"})
    return [s for s in sections if s["paragraphs"]]


def parse_abbaselama(path, chapters_from=8):
    """Chapters >= chapters_from of 1 Meqabyan from the archived AOL page."""
    raw = path.read_text(encoding="utf-8", errors="ignore")
    # Drop the Wayback Machine chrome: content starts at "Book of Meqabyan".
    body_start = raw.find("Book of Meqabyan")
    raw = raw[body_start:] if body_start != -1 else raw
    text = re.sub(r"<script.*?</script>", " ", raw, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<style.*?</style>", " ", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "\n", text)
    text = html_mod.unescape(text)

    sections = []
    current = None
    for raw_line in text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        if not line:
            continue
        m = re.match(r"^Chapter\s+(\d+)\.?$", line, re.IGNORECASE)
        if m:
            num = int(m.group(1))
            current = {"order": num, "title": f"Chapter {num}", "paragraphs": []}
            sections.append(current)
            continue
        if current is None:
            continue
        v = re.match(r"^(\d+)\s*[;:.]\s+(.+)$", line)
        alone = re.match(r"^(\d+)\s*[;:.]?\s*$", line)
        if v:
            current["paragraphs"].append(
                {"order": int(v.group(1)), "text": v.group(2).strip(), "kind": "body"}
            )
        elif alone:
            # Verse number on its own line; text follows on the next line.
            current["paragraphs"].append(
                {"order": int(alone.group(1)), "text": "", "kind": "body"}
            )
        elif current["paragraphs"] and not re.match(r"^(Book of|Meqabyan|\[)", line):
            last = current["paragraphs"][-1]
            last["text"] = (last["text"] + " " + line).strip()
    for s in sections:
        s["paragraphs"] = [p for p in s["paragraphs"] if p["text"]]
    return [s for s in sections if s["paragraphs"] and s["order"] >= chapters_from]


# --------------------------------------------------------------------------
# Canon definition
# --------------------------------------------------------------------------

USFM_FILES = {p.name.split("-")[1][:3]: p for p in USFM_DIR.glob("*.usfm")}


def usfm(code, slug, title, group, label="Chapter"):
    return {"kind": "usfm", "code": code, "slug": slug, "title": title,
            "group": group, "label": label}


def special(kind, slug, title, group, **extra):
    return {"kind": kind, "slug": slug, "title": title, "group": group, **extra}


def placeholder(slug, title, group, note):
    return {"kind": "placeholder", "slug": slug, "title": title, "group": group,
            "note": note}


PLACEHOLDER_PREFIX = (
    "The verified English text of this book is still being prepared. "
)

CANON = [
    # -- The Octateuch --------------------------------------------------
    usfm("GEN", "genesis", "Genesis", "The Octateuch"),
    usfm("EXO", "exodus", "Exodus", "The Octateuch"),
    usfm("LEV", "leviticus", "Leviticus", "The Octateuch"),
    usfm("NUM", "numbers", "Numbers", "The Octateuch"),
    usfm("DEU", "deuteronomy", "Deuteronomy", "The Octateuch"),
    usfm("JOS", "joshua", "Joshua", "The Octateuch"),
    usfm("JDG", "judges", "Judges", "The Octateuch"),
    usfm("RUT", "ruth", "Ruth", "The Octateuch"),
    # -- The Histories --------------------------------------------------
    usfm("1SA", "1-samuel", "1 Samuel", "The Histories"),
    usfm("2SA", "2-samuel", "2 Samuel", "The Histories"),
    usfm("1KI", "1-kings", "1 Kings", "The Histories"),
    usfm("2KI", "2-kings", "2 Kings", "The Histories"),
    usfm("1CH", "1-chronicles", "1 Chronicles", "The Histories"),
    usfm("2CH", "2-chronicles", "2 Chronicles", "The Histories"),
    usfm("MAN", "prayer-of-manasseh", "Prayer of Manasseh", "The Histories"),
    # -- The Heavenly Books ---------------------------------------------
    special("enoch", "1-enoch", "1 Enoch (Henok)", "The Heavenly Books"),
    placeholder(
        "jubilees", "Jubilees (Kufale)", "The Heavenly Books",
        PLACEHOLDER_PREFIX + "R. H. Charles's public-domain translation (1902) is "
        "held in the project sources and awaits OCR cleanup.",
    ),
    # -- Ezra & Later Histories ------------------------------------------
    usfm("EZR", "ezra", "Ezra", "Ezra & Later Histories"),
    usfm("NEH", "nehemiah", "Nehemiah", "Ezra & Later Histories"),
    usfm("1ES", "1-esdras", "1 Esdras", "Ezra & Later Histories"),
    usfm("2ES", "2-esdras", "2 Esdras (Ezra Sutuel)", "Ezra & Later Histories"),
    usfm("TOB", "tobit", "Tobit", "Ezra & Later Histories"),
    usfm("JDT", "judith", "Judith", "Ezra & Later Histories"),
    usfm("ESG", "esther", "Esther (with Additions)", "Ezra & Later Histories"),
    # -- Meqabyan --------------------------------------------------------
    special("meqabyan1", "1-meqabyan", "1 Meqabyan", "The Books of Meqabyan"),
    special("meqabyan", "2-meqabyan", "2 Meqabyan", "The Books of Meqabyan",
            source=SOURCES / "meqabyan2_wikisource.wiki"),
    special("meqabyan", "3-meqabyan", "3 Meqabyan", "The Books of Meqabyan",
            source=SOURCES / "meqabyan3_wikisource.wiki"),
    placeholder(
        "josippon", "Josippon (Pseudo-Josephus)", "The Books of Meqabyan",
        PLACEHOLDER_PREFIX + "No public-domain English translation of the "
        "Ethiopic Josippon exists yet.",
    ),
    # -- Wisdom & Poetry -------------------------------------------------
    usfm("JOB", "job", "Job", "Wisdom & Poetry"),
    usfm("PSA", "psalms", "Psalms", "Wisdom & Poetry", label="Psalm"),
    usfm("PS2", "psalm-151", "Psalm 151", "Wisdom & Poetry", label="Psalm"),
    usfm("PRO", "proverbs", "Proverbs", "Wisdom & Poetry"),
    usfm("ECC", "ecclesiastes", "Ecclesiastes", "Wisdom & Poetry"),
    usfm("SNG", "song-of-songs", "Song of Songs", "Wisdom & Poetry"),
    usfm("WIS", "wisdom", "Wisdom of Solomon", "Wisdom & Poetry"),
    usfm("SIR", "sirach", "Sirach", "Wisdom & Poetry"),
    # -- The Prophets ----------------------------------------------------
    usfm("ISA", "isaiah", "Isaiah", "The Prophets"),
    usfm("JER", "jeremiah", "Jeremiah", "The Prophets"),
    usfm("LAM", "lamentations", "Lamentations", "The Prophets"),
    usfm("BAR", "baruch", "Baruch", "The Prophets"),
    placeholder(
        "4-baruch", "4 Baruch (Paralipomena of Jeremiah)", "The Prophets",
        PLACEHOLDER_PREFIX + "A public-domain English text is being sourced.",
    ),
    usfm("EZK", "ezekiel", "Ezekiel", "The Prophets"),
    usfm("DAG", "daniel", "Daniel (with Additions)", "The Prophets"),
    usfm("HOS", "hosea", "Hosea", "The Prophets"),
    usfm("JOL", "joel", "Joel", "The Prophets"),
    usfm("AMO", "amos", "Amos", "The Prophets"),
    usfm("OBA", "obadiah", "Obadiah", "The Prophets"),
    usfm("JON", "jonah", "Jonah", "The Prophets"),
    usfm("MIC", "micah", "Micah", "The Prophets"),
    usfm("NAM", "nahum", "Nahum", "The Prophets"),
    usfm("HAB", "habakkuk", "Habakkuk", "The Prophets"),
    usfm("ZEP", "zephaniah", "Zephaniah", "The Prophets"),
    usfm("HAG", "haggai", "Haggai", "The Prophets"),
    usfm("ZEC", "zechariah", "Zechariah", "The Prophets"),
    usfm("MAL", "malachi", "Malachi", "The Prophets"),
    # -- The Gospels -----------------------------------------------------
    usfm("MAT", "matthew", "Matthew", "The Gospels"),
    usfm("MRK", "mark", "Mark", "The Gospels"),
    usfm("LUK", "luke", "Luke", "The Gospels"),
    usfm("JHN", "john", "John", "The Gospels"),
    # -- Acts & Epistles -------------------------------------------------
    usfm("ACT", "acts", "Acts", "Acts & Epistles"),
    usfm("ROM", "romans", "Romans", "Acts & Epistles"),
    usfm("1CO", "1-corinthians", "1 Corinthians", "Acts & Epistles"),
    usfm("2CO", "2-corinthians", "2 Corinthians", "Acts & Epistles"),
    usfm("GAL", "galatians", "Galatians", "Acts & Epistles"),
    usfm("EPH", "ephesians", "Ephesians", "Acts & Epistles"),
    usfm("PHP", "philippians", "Philippians", "Acts & Epistles"),
    usfm("COL", "colossians", "Colossians", "Acts & Epistles"),
    usfm("1TH", "1-thessalonians", "1 Thessalonians", "Acts & Epistles"),
    usfm("2TH", "2-thessalonians", "2 Thessalonians", "Acts & Epistles"),
    usfm("1TI", "1-timothy", "1 Timothy", "Acts & Epistles"),
    usfm("2TI", "2-timothy", "2 Timothy", "Acts & Epistles"),
    usfm("TIT", "titus", "Titus", "Acts & Epistles"),
    usfm("PHM", "philemon", "Philemon", "Acts & Epistles"),
    usfm("HEB", "hebrews", "Hebrews", "Acts & Epistles"),
    usfm("JAS", "james", "James", "Acts & Epistles"),
    usfm("1PE", "1-peter", "1 Peter", "Acts & Epistles"),
    usfm("2PE", "2-peter", "2 Peter", "Acts & Epistles"),
    usfm("1JN", "1-john", "1 John", "Acts & Epistles"),
    usfm("2JN", "2-john", "2 John", "Acts & Epistles"),
    usfm("3JN", "3-john", "3 John", "Acts & Epistles"),
    usfm("JUD", "jude", "Jude", "Acts & Epistles"),
    # -- Revelation ------------------------------------------------------
    usfm("REV", "revelation", "Revelation", "Revelation"),
    # -- The Broader Canon ----------------------------------------------
    placeholder("sinodos-sirate-tsion", "Sinodos: Sirate Tsion", "The Broader Canon",
                PLACEHOLDER_PREFIX + "Horner's 1904 public-domain edition is held "
                "in the project sources and awaits OCR cleanup."),
    placeholder("sinodos-tizaz", "Sinodos: Tizaz", "The Broader Canon",
                PLACEHOLDER_PREFIX + "Horner's 1904 public-domain edition is held "
                "in the project sources and awaits OCR cleanup."),
    placeholder("sinodos-gitsew", "Sinodos: Gitsew", "The Broader Canon",
                PLACEHOLDER_PREFIX + "Horner's 1904 public-domain edition is held "
                "in the project sources and awaits OCR cleanup."),
    placeholder("sinodos-abtilis", "Sinodos: Abtilis", "The Broader Canon",
                PLACEHOLDER_PREFIX + "Horner's 1904 public-domain edition is held "
                "in the project sources and awaits OCR cleanup."),
    placeholder("covenant-1", "Book of the Covenant I", "The Broader Canon",
                PLACEHOLDER_PREFIX + "Cooper & Maclean's 1902 public-domain "
                "translation (Syriac recension) is held in the project sources "
                "and awaits OCR cleanup."),
    placeholder("covenant-2", "Book of the Covenant II", "The Broader Canon",
                PLACEHOLDER_PREFIX + "M. R. James's 1924 public-domain "
                "translation is held in the project sources and awaits OCR "
                "cleanup."),
    placeholder("clement", "Ethiopic Clement (Qalementos)", "The Broader Canon",
                PLACEHOLDER_PREFIX + "Only parallel recensions are in the public "
                "domain; a direct English translation of the Ge'ez is not yet "
                "freely available."),
    placeholder("didascalia", "Ethiopic Didascalia", "The Broader Canon",
                PLACEHOLDER_PREFIX + "Harden's 1920 public-domain translation is "
                "held in the project sources and awaits OCR cleanup."),
]

IYARIC_NOTE = (
    "Editorial note — chapters 8 to 36 below are given in the freely "
    "distributed Abba Selama translation, which renders the Ge'ez in Iyaric "
    "(Rastafari-influenced) English. Its voice differs markedly from the "
    "Wikisource translation used for chapters 1-7. A single consistent modern "
    "translation will replace this text when one becomes freely available."
)


def build_meqabyan1():
    wiki = parse_meqabyan_wiki(SOURCES / "meqabyan1_wikisource.wiki")
    selama = parse_abbaselama(SOURCES / "meqabyan1_abbaselama.html", chapters_from=8)
    have = {s["order"] for s in wiki}
    added = [s for s in selama if s["order"] not in have]
    if added:
        added[0]["paragraphs"].insert(
            0, {"order": 0, "text": IYARIC_NOTE, "kind": "editorial"}
        )
    return sorted(wiki + added, key=lambda s: s["order"])


def build_sections(entry):
    if entry["kind"] == "usfm":
        path = USFM_FILES.get(entry["code"])
        if path is None:
            sys.exit(f"USFM file for {entry['code']} not found in {USFM_DIR}")
        sections = parse_usfm(path, section_label=entry.get("label", "Chapter"))
        if len(sections) == 1:
            sections[0]["title"] = ""
        return sections, False
    if entry["kind"] == "enoch":
        return parse_enoch(SOURCES / "enoch_charles.txt"), False
    if entry["kind"] == "meqabyan":
        return parse_meqabyan_wiki(entry["source"]), False
    if entry["kind"] == "meqabyan1":
        return build_meqabyan1(), False
    if entry["kind"] == "placeholder":
        return [{
            "order": 1,
            "title": "",
            "paragraphs": [{
                "order": 1, "text": entry["note"], "kind": "editorial",
                "is_placeholder": True,
            }],
        }], True
    raise ValueError(entry["kind"])


def main():
    books = []
    total_paragraphs = 0
    for number, entry in enumerate(CANON, start=1):
        sections, is_placeholder = build_sections(entry)
        count = sum(len(s["paragraphs"]) for s in sections)
        total_paragraphs += count
        books.append({
            "number": number,
            "slug": entry["slug"],
            "title": entry["title"],
            "subtitle": entry["group"],
            "intro": "",
            "placeholder": is_placeholder,
            "sections": sections,
        })
        print(f"{number:3d}. {entry['title']:42s} {len(sections):4d} sections {count:6d} paragraphs")

    data = {
        "book": {
            "slug": "ethiopian-bible",
            "title": "The Ethiopian Bible",
            "subtitle": "The Broader Canon of the Ethiopian Orthodox Tewahedo Church",
            "author_attribution": "",
            "description": (
                "The scriptures of the Ethiopian Orthodox Tewahedo Church — the "
                "broadest biblical canon in Christendom — assembled in English "
                "from public-domain and freely licensed translations. The shared "
                "books follow the World English Bible; 1 Enoch follows R. H. "
                "Charles (1917); the books of Meqabyan follow free community "
                "translations from the Ge'ez. Books whose English text is still "
                "being prepared are present as clearly marked placeholders."
            ),
            "published_year": None,
            "is_public_domain": True,
        },
        "edition": {
            "slug": "ethiopian-bible-assembled",
            "name": "Assembled Public-Domain Edition",
            "publisher": "",
            "year": None,
            "source_url": "https://ebible.org/web/",
            "source_notes": (
                "Old and New Testament books: World English Bible (public "
                "domain, ebible.org), including the deuterocanon. 1 Enoch: R. H. "
                "Charles, 1917 (Project Gutenberg #77935, public domain). "
                "1 Meqabyan ch. 1-7, 2 Meqabyan, 3 Meqabyan: Wikisource "
                "community translations (CC BY-SA 4.0). 1 Meqabyan ch. 8-36: "
                "Abba Selama free translation (archived; Iyaric English). See "
                "sources/MANIFEST.md in the repository for full provenance."
            ),
            "license_note": (
                "Public domain except the Meqabyan Wikisource translations "
                "(CC BY-SA 4.0, attribution: Wikisource contributors)."
            ),
            "is_primary": True,
        },
        "books": books,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    size_mb = OUT_PATH.stat().st_size / 1e6
    print(f"\nWrote {OUT_PATH} — {len(books)} books, {total_paragraphs} paragraphs, {size_mb:.1f} MB")


if __name__ == "__main__":
    main()
