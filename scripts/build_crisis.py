"""
Build The Crisis (Nov 1910 - Dec 1930) into backend/library/data/the_crisis.json.

Pipeline (raw sources come from scripts/download_crisis.py):
  1. For every month, score the one-or-two available microfilm OCR texts and
     keep the scan that reads better.
  2. Fetch that scan's hOCR (word-level OCR with page geometry, font sizes,
     confidences, and running-head tags) — cached in sources/crisis/hocr/.
  3. Parse each issue: locate the editorial body between the advertising
     sections, split it into its departments and feature articles, drop
     running heads / page numbers / photo captions / low-confidence garble,
     and assemble flowing paragraphs (verse keeps its line breaks).
  4. Emit one JSON with book + edition metadata and every issue.

The output is an honest OCR reading text: imperfections of the microfilm
scan remain, and every issue links back to its original page images.

Usage:
    python scripts/download_crisis.py   # once, fetches raw OCR text
    python scripts/build_crisis.py
"""
import gzip
import io
import json
import re
import statistics
import time
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "sources" / "crisis"
RAW_DIR = SRC / "raw"
HOCR_DIR = SRC / "hocr"
INDEX_PATH = SRC / "index.json"
OUT_PATH = ROOT / "backend" / "library" / "data" / "the_crisis.json"
REPORT_PATH = SRC / "build_report.txt"

HEADERS = {"User-Agent": "the-perennial-library/1.0 (public-domain text ingest)"}

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

# Standing departments of the magazine across 1910-1930. Keys are the
# normalised match form; values are the canonical display titles.
DEPARTMENTS = {
    "ALONG THE COLOR LINE": "Along the Color Line",
    "MEN OF THE MONTH": "Men of the Month",
    "MEN OF MONTH": "Men of the Month",
    "MIEN OF THE MONTH": "Men of the Month",
    "MIEN OF MONTH": "Men of the Month",
    "WOMEN OF THE MONTH": "Women of the Month",
    "OPINION": "Opinion",
    "OPINIONS": "Opinion",
    "EDITORIAL": "Editorial",
    "EDITORIALS": "Editorial",
    "THE N A A C P": "The N.A.A.C.P.",
    "N A A C P": "The N.A.A.C.P.",
    "THE N A A C P BATTLE FRONT": "The N.A.A.C.P. Battle Front",
    "NATIONAL ASSOCIATION FOR THE ADVANCEMENT OF COLORED PEOPLE": "The N.A.A.C.P.",
    "THE BURDEN": "The Burden",
    "WHAT TO READ": "What to Read",
    "TALKS ABOUT WOMEN": "Talks About Women",
    "THE HORIZON": "The Horizon",
    "THE LOOKING GLASS": "The Looking Glass",
    "THE OUTER POCKET": "The Outer Pocket",
    "POSTSCRIPT": "Postscript",
    "AS THE CROW FLIES": "As the Crow Flies",
    "THE LITTLE PAGE": "The Little Page",
    "THE POETS CORNER": "The Poets' Corner",
    "YOUTHPORT": "Youthport",
    "THE BROWSING READER": "The Browsing Reader",
    "OUR BOOK SHELF": "Our Book Shelf",
    "KRIGWA": "Krigwa",
}
# Common crossheads ("EDUCATION", "MUSIC AND ART") are deliberately NOT
# departments: they appear constantly in school advertisements and inside
# Along the Color Line, and would tear the body apart if promoted.

SMALL_WORDS = {"a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to"}

VOWELS = set("aeiouyAEIOUY")


# ------------------------------------------------------------------ #
# Small text utilities                                                #
# ------------------------------------------------------------------ #

def normalise_heading(text):
    """Uppercase, strip everything but letters/digits, collapse spaces."""
    text = re.sub(r"[^A-Za-z0-9 ]+", " ", text.upper())
    return re.sub(r"\s+", " ", text).strip()


def strip_trailing_number(text):
    return re.sub(r"\s*\d+\s*$", "", text).strip()


def fuzzy_department(text):
    """Canonical department title for a heading-ish line, or None."""
    key = normalise_heading(strip_trailing_number(text))
    if not key:
        return None
    if key in DEPARTMENTS:
        return DEPARTMENTS[key]
    # Tolerate small OCR slips (EDITONAL, OP1NION) via edit distance.
    for known, canonical in DEPARTMENTS.items():
        if abs(len(known) - len(key)) <= 2 and len(known) > 4:
            if _close(known, key):
                return canonical
    return None


def _close(a, b):
    """Edit distance <= 1 + one extra slip for longer strings."""
    limit = 1 if len(a) <= 8 else 2
    # quick reject
    if abs(len(a) - len(b)) > limit:
        return False
    # bounded Levenshtein
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        current = [i]
        for j, cb in enumerate(b, 1):
            current.append(min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (ca != cb)))
        if min(current) > limit:
            return False
        previous = current
    return previous[-1] <= limit


def smart_title(text):
    """Title-case an OCR'd all-caps heading the way a masthead would."""
    words = text.strip().split()
    result = []
    for index, word in enumerate(words):
        lower = word.lower()
        after_colon = bool(result) and result[-1].endswith((":", "?", "!"))
        if 0 < index < len(words) - 1 and lower in SMALL_WORDS and not after_colon:
            result.append(lower)
        elif re.match(r"^[A-Z]\.([A-Z]\.)+$", word):  # initialisms: N.A.A.C.P.
            result.append(word)
        else:  # capitalize every hyphenated part: JIM-CROW → Jim-Crow
            result.append("-".join(part.capitalize() for part in lower.split("-")))
    return " ".join(result)


def word_quality(text):
    """Fraction of tokens that look like real words — OCR quality signal."""
    tokens = re.findall(r"[A-Za-z]{3,}", text)
    if not tokens:
        return 0.0
    good = sum(1 for token in tokens if set(token) & VOWELS)
    return good / len(tokens)


def roman(number):
    pairs = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"),
             (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]
    out = []
    for value, glyph in pairs:
        while number >= value:
            out.append(glyph)
            number -= value
    return "".join(out)


# ------------------------------------------------------------------ #
# hOCR parsing                                                        #
# ------------------------------------------------------------------ #

def _title_attrs(title):
    """Parse an hOCR title attribute into a dict of its clauses."""
    parts = {}
    for clause in title.split(";"):
        clause = clause.strip()
        if clause.startswith("bbox "):
            parts["bbox"] = [int(v) for v in clause[5:].split()]
        elif clause.startswith("x_size "):
            parts["x_size"] = float(clause.split()[1])
        elif clause.startswith("x_wconf "):
            parts["x_wconf"] = float(clause.split()[1])
    return parts


def parse_hocr(path):
    """
    Yield pages: {height, header: str, paragraphs: [{lines: [...]}, ...]}
    where each line is {text, x_size, y0, conf, kind}.
    kind is 'header' | 'caption' | 'body'.
    """
    pages = []
    context = ET.iterparse(str(path), events=("start", "end"))
    page = par = None
    for event, node in context:
        tag = node.tag.rsplit("}", 1)[-1]
        cls = node.get("class", "")
        if event == "start":
            if tag == "div" and cls == "ocr_page":
                bbox = _title_attrs(node.get("title", "")).get("bbox", [0, 0, 0, 0])
                page = {"width": bbox[2], "height": bbox[3], "paragraphs": []}
            elif tag == "p" and cls == "ocr_par" and page is not None:
                par = {"lines": []}
            continue
        # end events
        if tag == "span" and cls in ("ocr_line", "ocr_header", "ocr_caption", "ocr_textfloat"):
            attrs = _title_attrs(node.get("title", ""))
            words, confs = [], []
            for word in node:
                if word.get("class") == "ocrx_word":
                    text = "".join(word.itertext()).strip()
                    if text:
                        words.append(text)
                        wc = _title_attrs(word.get("title", "")).get("x_wconf")
                        if wc is not None:
                            confs.append(wc)
            if words and par is not None:
                kind = {"ocr_header": "header", "ocr_caption": "caption"}.get(cls, "body")
                par["lines"].append({
                    "text": " ".join(words),
                    "x_size": attrs.get("x_size", 0.0),
                    "y0": attrs.get("bbox", [0, 0, 0, 0])[1],
                    "conf": statistics.mean(confs) if confs else 0.0,
                    "kind": kind,
                })
            node.clear()
        elif tag == "p" and cls == "ocr_par":
            if par and par["lines"]:
                page["paragraphs"].append(par)
            par = None
            node.clear()
        elif tag == "div" and cls == "ocr_page":
            pages.append(page)
            page = None
            node.clear()
    return pages


# ------------------------------------------------------------------ #
# Issue assembly                                                      #
# ------------------------------------------------------------------ #

AD_HEAD = re.compile(r"ADVERT|MENTION", re.IGNORECASE)
BYLINE = re.compile(r"^By\b[ .:]*(.{2,80})$", re.IGNORECASE)
PAGE_NUMBER = re.compile(r"^\d{1,3}$")
# Masthead / running-head / dateline noise that must never become content.
NOISE = re.compile(
    r"^(\d+ )?(T?HE |CHE )?CR[Il1]S[Il1]S?( ADVERTISER)?( \d+)?$"
    r"|^A RECORD OF THE DARKER RACES$"
    r"|^PUBLISHED MONTHLY"
    r"|^CONTENTS( FOR)?\b"
    r"|^(VOL|NO|WHOLE NO|NUMBER|VOLUME)\b"
    r"|^(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER"
    r"|NOVEMBER|DECEMBER)( \d{4})?$"
    r"|^(ONE DOLLAR|TEN CENTS|FIFTEEN CENTS)\b"
)
# Advertising vocabulary in display type — two or more marks an ad page.
COMMERCE = re.compile(
    r"COLLEGE|UNIVERSITY|SCHOOL|INSTITUTE|ACADEMY|SEMINARY|NORMAL|TRAINING"
    r"|WANTED|INSURANCE|HOTEL|BANK|REGALIA|AGENTS|SALESMAN|CATALOG|TUITION"
    r"|NURSING|HOSPITAL|BEAUTY|HAIR|TYPEWRITER|DRUG|PHARMACY|REALTY|SOCIETY"
    r"|CHRISTIAN ASSOCIATION|CONSERVATORY|STREET|AVENUE",
    re.IGNORECASE,
)
# Words whose opening drop-cap letter the OCR often severs ("HE" for "THE").
DROPCAP_MENDS = {"HE": "THE", "HF": "THE", "HIS": "THIS", "HAT": "THAT",
                 "HERE": "THERE", "HEN": "THEN", "ITH": "WITH", "HETHER": "WHETHER"}
DROPCAP_WORDS = {"THE", "THIS", "THAT", "THERE", "THEN", "WHAT", "WHEN", "WHERE",
                 "WHO", "WHILE", "WITH", "SHE", "HE", "WE", "IT", "IN", "IS", "IF",
                 "ON", "OF", "OR", "AS", "AT", "AN", "NO", "NOT", "NOW", "SO", "TO",
                 "DO", "MY", "BY", "ALL", "AND", "FOR", "FROM", "BUT", "OUR", "ONE",
                 "OUT", "UP", "YOU"}

FALLBACK_SECTION = "This Issue"


def is_noise(text):
    return bool(NOISE.match(normalise_heading(text)))


def naacp_heading(text):
    """The N.A.A.C.P. head survives OCR in many disguises."""
    key = normalise_heading(text)
    if len(key) > 60:
        return False
    if "A A C P" in key or "AACP" in key.replace(" ", ""):
        return True
    return key.startswith("NATIONAL ASSOCIATION") or "ADVANCEMENT OF COLORED" in key


def is_crisis_masthead(text):
    key = normalise_heading(text)
    return key in ("THE CRISIS", "CRISIS") or _close("THE CRISIS", key)


def page_running_head(page):
    """The page's running head text, from tagged headers or top-of-page lines."""
    texts = []
    for par in page["paragraphs"]:
        for line in par["lines"]:
            if line["kind"] == "header" or (
                page["height"] and line["y0"] < page["height"] * 0.09
            ):
                texts.append(line["text"])
    return " ".join(texts)


def body_font_size(pages):
    sizes = [
        line["x_size"]
        for page in pages
        for par in page["paragraphs"]
        for line in par["lines"]
        if line["kind"] == "body" and len(line["text"]) > 30 and line["x_size"] > 0
    ]
    return statistics.median(sizes) if sizes else 30.0


def clean_join(lines):
    """Join OCR lines into one flowing string, mending hyphenated breaks."""
    out = ""
    for line in lines:
        text = re.sub(r"\s+", " ", line).strip()
        if not text:
            continue
        if out.endswith("-") and text and text[0].islower():
            out = out[:-1] + text
        elif out:
            out += " " + text
        else:
            out = text
    return out.strip()


def mend_dropcap(text_lines):
    """
    Re-attach an ornamental drop capital the OCR severed. Two shapes:
    the letter strays to the head of a following line ("HE only thing … /
    T what you call…"), or it is lost entirely ("HE object of this…").
    """
    if not text_lines:
        return text_lines
    first_word = text_lines[0].split(" ", 1)[0].rstrip(".,;:")
    if not re.fullmatch(r"[A-Z]{1,6}", first_word):
        return text_lines
    if text_lines[0].split(" ", 1)[0] != first_word:  # had punctuation: "HF."
        text_lines = [first_word + text_lines[0][len(first_word) + 1:]] + list(text_lines[1:])
    for index in range(1, min(4, len(text_lines))):
        match = re.match(r"^([A-Z]) (?=\S)", text_lines[index])
        if match and (match.group(1) + first_word) in DROPCAP_WORDS:
            text_lines = list(text_lines)
            text_lines[index] = text_lines[index][2:]
            text_lines[0] = match.group(1) + text_lines[0]
            return text_lines
    mended = DROPCAP_MENDS.get(first_word)
    rest = text_lines[0][len(first_word):]
    if mended and rest.startswith(" ") and (rest[1:2].islower() or rest[1:2] in "'\"“‘"):
        text_lines = list(text_lines)
        text_lines[0] = mended + rest
    return text_lines


def looks_like_verse(lines):
    """
    Poetry keeps its line breaks. Body columns are narrow too, so the
    signals are that verse lines begin with capitals AND sit ragged —
    a justified column's lines all run to nearly the same measure.
    """
    if len(lines) < 3:
        return False
    texts = [line["text"] for line in lines]
    capital_starts = sum(1 for t in texts if t[:1].isupper())
    lengths = sorted(len(t) for t in texts)
    median_length = lengths[len(lengths) // 2]
    full_lines = sorted(len(t) for t in texts[:-1])  # last line may fall short
    ragged = (full_lines[-1] - full_lines[0]) > 6 if len(full_lines) > 1 else False
    return (
        ragged
        and capital_starts / len(texts) >= 0.75
        and 8 <= median_length <= 46
        and word_quality(" ".join(texts)) >= 0.6
    )


def acceptable_heading(text):
    """Sanity for titles: real words, no stray single letters."""
    words = re.findall(r"[A-Za-z']+", text)
    if not words or word_quality(text) < 0.65:
        return False
    strays = sum(1 for w in words if len(w) == 1 and w.upper() not in ("A", "I"))
    return strays == 0 and sum(len(w) for w in words) >= 5


def split_title_byline(title):
    """'Some Whys … by Randolph Edmonds' → title + byline."""
    match = re.search(r"\s[Bb]y\s+([A-Z].{2,60})$", title)
    if match and len(title) - len(match.group(0)) >= 8:
        return title[: match.start()].rstrip(" ,—-"), "By " + match.group(1)
    return title, None


class IssueBuilder:
    """Walks an issue's body pages, accumulating sections and paragraphs."""

    def __init__(self, base_size):
        self.base = base_size
        self.sections = []
        self.current = None
        self.pages_fed = 0
        self.section_opened_at = 0

    def open_section(self, title):
        if self.current and not self.current["paragraphs"]:
            self.sections.pop()
        self.current = {"title": title, "paragraphs": []}
        self.section_opened_at = self.pages_fed
        self.sections.append(self.current)

    def switch_department(self, department, from_running_head=False):
        if self.current is not None and self.current["title"] == department:
            return
        # A running head names the section its page belongs to — content that
        # arrived a page or two before any heading was this same section's
        # opening page (its display head often defeats the OCR).
        if (
            from_running_head
            and self.current is not None
            and len(self.sections) == 1
            and self.current["title"] == FALLBACK_SECTION
            and self.pages_fed - self.section_opened_at <= 2
        ):
            self.current["title"] = department
            return
        self.open_section(department)

    def ensure_section(self):
        if self.current is None:
            self.open_section(FALLBACK_SECTION)

    def add_paragraph(self, text, kind="body"):
        text = text.strip()
        if not text:
            return
        self.ensure_section()
        previous = self.current["paragraphs"][-1] if self.current["paragraphs"] else None
        open_ended = (
            kind == "body"
            and previous
            and previous["kind"] == "body"
            and "\n" not in previous["text"]
            and "\n" not in text
            and not previous["text"].rstrip().endswith(('.', '!', '?', '"', '”', ':', ';'))
        )
        # Column/page breaks split sentences: mend when the previous paragraph
        # stops mid-sentence and this one starts mid-sentence.
        if open_ended and (text[0].islower() or previous["text"].rstrip().endswith(('-', ','))):
            if previous["text"].endswith("-") and text[0].islower():
                previous["text"] = previous["text"][:-1] + text
            else:
                previous["text"] = previous["text"] + " " + text
            return
        # A drop capital stranded at a column break: the previous paragraph
        # opens "N THE one hundredth…" and this one "O Lincoln's birth…" —
        # the stray letter completes the previous opening word (ON).
        if open_ended:
            stray = re.match(r"^([A-Z]) (?=\S)", text)
            first = previous["text"].split(" ", 1)[0]
            if stray and re.fullmatch(r"[A-Z]{1,5}", first) \
                    and (stray.group(1) + first) in DROPCAP_WORDS:
                previous["text"] = stray.group(1) + previous["text"] + " " + text[2:]
                return
        self.current["paragraphs"].append({"text": text, "kind": kind})

    # ---- paragraph classification ---------------------------------- #

    def _clean_lines(self, par, keep_headers=False):
        lines = []
        for line in par["lines"]:
            # Ornate display heads are often mistagged as photo captions;
            # keep them when they are display-sized heading candidates.
            if line["kind"] == "caption" and not (
                keep_headers and line["x_size"] >= self.base * 1.8
            ):
                continue
            if line["kind"] == "header" and not (
                keep_headers and line["x_size"] >= self.base * 1.8
            ):
                continue
            if line["conf"] < 35 and len(line["text"]) <= 60:
                continue
            text = line["text"].strip()
            if PAGE_NUMBER.match(text) or is_noise(text):
                continue
            lines.append(line)
        return lines

    def _is_heading_par(self, par):
        """A display-heading paragraph → (text, max_size), else None."""
        lines = self._clean_lines(par, keep_headers=True)
        if not lines or sum(len(l["text"]) for l in lines) > 70:
            return None
        if not all(l["x_size"] >= self.base * 1.35 for l in lines):
            return None
        text = clean_join([l["text"] for l in lines])
        if not text or len(text.split()) > 10:
            return None
        # Ornamental initials and engraving junk read as tiny stray words.
        alpha = re.sub(r"[^A-Za-z]", "", text)
        if len(alpha) < 3 or word_quality(text) < 0.5:
            return None
        if len(text.split()) == 1 and len(alpha) <= 4 and text != text.upper():
            return None
        return text, max(l["x_size"] for l in lines)

    def feed_page(self, page):
        # Group the page into runs: consecutive heading paragraphs merge into
        # one heading ("Athens and" + "Brownsville"); a byline between title
        # fragments is held aside and attached once the section opens.
        pending, pending_byline = [], None
        for par in page["paragraphs"]:
            heading = self._is_heading_par(par)
            if heading is not None:
                pending.append(heading)
                continue
            if pending and pending_byline is None:
                lines = self._clean_lines(par)
                joined = clean_join([line["text"] for line in lines])
                byline = BYLINE.match(joined)
                if byline and len(joined) <= 60:
                    pending_byline = "By " + smart_title(byline.group(1))
                    continue
            if pending:
                self._open_from_heading(pending, pending_byline)
                pending, pending_byline = [], None
            self._feed_text_par(par)
        if pending:
            self._open_from_heading(pending, pending_byline)

    def _open_from_heading(self, fragments, byline=None):
        text = " ".join(fragment for fragment, _ in fragments)
        max_size = max(size for _, size in fragments)
        if is_noise(text):
            return
        department = fuzzy_department(strip_trailing_number(text))
        if department is None and naacp_heading(text):
            department = "The N.A.A.C.P."
        if department:
            self.switch_department(department)
            return
        # A torn fragment of the long-form N.A.A.C.P. head ("-Colored:People.")
        # must not shear the section it just opened.
        if normalise_heading(text) and normalise_heading(text) in \
                "NATIONAL ASSOCIATION FOR THE ADVANCEMENT OF COLORED PEOPLE":
            return
        title = smart_title(strip_trailing_number(text).strip(" \"'“”‘’—–-:.,|"))
        title, inline_byline = split_title_byline(title)
        byline = byline or inline_byline
        if not acceptable_heading(title) or len(title) < 4:
            return
        caps = text == text.upper()
        # Display type well above the body: a feature article's title —
        # unless it is a short all-caps crosshead with no byline.
        if max_size >= self.base * 1.8 and (not caps or byline or len(title.split()) >= 3):
            self.open_section(title)
            if byline:
                self.add_paragraph(byline, kind="epigraph")
            return
        self.ensure_section()
        self.add_paragraph(title, kind="epigraph")

    def _feed_text_par(self, par):
        lines = self._clean_lines(par)
        if not lines:
            return
        text_lines = mend_dropcap([line["text"] for line in lines])
        joined = clean_join(text_lines)
        if not joined or word_quality(joined) < 0.55:
            return
        # Column-edge fragments: a stack of tiny broken lines.
        lengths = sorted(len(t) for t in text_lines)
        if len(text_lines) >= 2 and lengths[len(lengths) // 2] < 8:
            return

        caps = joined == joined.upper() and len(re.findall(r"[A-Za-z]", joined)) >= 3
        if caps and len(joined) <= 70:
            department = fuzzy_department(strip_trailing_number(joined))
            if department and not re.search(r"\d\s*$", joined):
                self.switch_department(department)
                return
            if len(joined.split()) <= 6:
                crosshead = smart_title(strip_trailing_number(joined))
                if acceptable_heading(crosshead):
                    self.ensure_section()
                    self.add_paragraph(crosshead, kind="epigraph")
                return

        byline = BYLINE.match(joined)
        if byline and len(joined) <= 60 and self.current and len(self.current["paragraphs"]) <= 1:
            self.add_paragraph("By " + smart_title(byline.group(1)), kind="epigraph")
            return

        if looks_like_verse(lines):
            self.add_paragraph("\n".join(text_lines), kind="quote")
            return

        if len(joined) < 15 and len(joined.split()) < 3:
            return
        self.add_paragraph(joined)

    def result(self):
        sections = [s for s in self.sections if s["paragraphs"]]
        # Merge consecutive duplicate departments (OCR re-detections).
        merged = []
        for section in sections:
            if merged and merged[-1]["title"] == section["title"]:
                merged[-1]["paragraphs"].extend(section["paragraphs"])
            else:
                merged.append(section)
        return merged


def build_issue(pages):
    """All sections of one issue from its parsed hOCR pages."""
    base = body_font_size(pages)

    def display_lines(page, minimum_ratio):
        for par in page["paragraphs"]:
            for line in par["lines"]:
                if line["x_size"] >= base * minimum_ratio:
                    yield line

    def is_front_page(page):
        """Cover / contents / masthead pages: the big nameplate with its
        'A Record of the Darker Races' subtitle. The editorial section's
        own nameplate page carries no subtitle, so it stays in."""
        has_masthead = any(
            is_crisis_masthead(line["text"]) for line in display_lines(page, 2.2)
        )
        if not has_masthead:
            return False
        subtitle = "A RECORD OF THE DARKER RACES"
        for par in page["paragraphs"]:
            for line in par["lines"]:
                key = normalise_heading(line["text"])
                if key == subtitle or (len(key) > 15 and _close(subtitle, key)):
                    return True
        return False

    def is_ad_page(page):
        if AD_HEAD.search(page_running_head(page)):
            return True
        hits = sum(1 for line in display_lines(page, 1.5) if COMMERCE.search(line["text"]))
        return hits >= 2

    def page_department(page):
        department = fuzzy_department(strip_trailing_number(page_running_head(page)))
        if department:
            return department
        for line in display_lines(page, 1.35):
            found = fuzzy_department(strip_trailing_number(line["text"]))
            if found:
                return found
        return None

    def has_long_paragraph(page):
        return any(
            sum(len(line["text"]) for line in par["lines"]) >= 240
            for par in page["paragraphs"]
        )

    front = [index for index, page in enumerate(pages) if is_front_page(page)]
    ads = {index for index, page in enumerate(pages) if is_ad_page(page)}
    marks = [
        index for index, page in enumerate(pages)
        if index not in ads and index not in front and page_department(page)
    ]

    # The editorial body sits between the advertising sections: it opens
    # after the contents page and closes after the last department, running
    # on while story pages continue.
    anchor = max((i for i in front if i <= len(pages) // 3), default=None)
    if anchor is not None:
        start = anchor + 1
    elif marks:
        start = marks[0]
    else:
        start = 0
    stop = marks[-1] if marks else len(pages) - 1
    while stop + 1 < len(pages) and stop + 1 not in ads and (stop + 1) not in front \
            and has_long_paragraph(pages[stop + 1]) \
            and not any(COMMERCE.search(l["text"]) for l in display_lines(pages[stop + 1], 1.5)):
        stop += 1

    builder = IssueBuilder(base)
    for index in range(start, stop + 1):
        page = pages[index]
        if index in ads or index in front:
            continue
        header_department = fuzzy_department(strip_trailing_number(page_running_head(page)))
        if header_department:
            builder.switch_department(header_department, from_running_head=True)
        builder.feed_page(page)
        builder.pages_fed += 1
    return builder.result()
# ------------------------------------------------------------------ #
# Scan choice + hOCR download                                         #
# ------------------------------------------------------------------ #

def choose_scan(entry):
    best_id, best_score = None, -1.0
    for identifier in entry["identifiers"]:
        path = RAW_DIR / f"{identifier}.txt"
        if not path.exists():
            continue
        score = word_quality(path.read_text(encoding="utf-8", errors="replace"))
        if score > best_score:
            best_id, best_score = identifier, score
    return best_id


def fetch_hocr(identifier):
    target = HOCR_DIR / f"{identifier}.hocr"
    if target.exists() and target.stat().st_size > 0:
        return "cached"
    url = f"https://archive.org/download/{identifier}/{identifier}_hocr.html"
    request = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                data = response.read()
            if data[:2] == b"\x1f\x8b":
                data = gzip.GzipFile(fileobj=io.BytesIO(data)).read()
            target.write_bytes(data)
            return f"{len(data) // 1024} KB"
        except Exception:
            if attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))


# ------------------------------------------------------------------ #
# Main                                                                #
# ------------------------------------------------------------------ #

def main():
    HOCR_DIR.mkdir(parents=True, exist_ok=True)
    index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))

    chosen = []
    for entry in index:
        identifier = choose_scan(entry)
        if identifier:
            chosen.append((entry, identifier))
        else:
            print(f"WARNING no raw text for {entry['date']}")

    print(f"fetching hOCR for {len(chosen)} issues...")
    with ThreadPoolExecutor(max_workers=6) as pool:
        for (entry, identifier), note in zip(
            chosen, pool.map(lambda pair: fetch_hocr(pair[1]), chosen)
        ):
            if note != "cached":
                print(f"  {identifier} ({note})", flush=True)

    issues, report_lines = [], []
    for number, (entry, identifier) in enumerate(chosen, start=1):
        pages = parse_hocr(HOCR_DIR / f"{identifier}.hocr")
        sections = build_issue(pages)
        year, month = int(entry["date"][:4]), int(entry["date"][5:7])
        volume, issue_no = entry.get("volume"), entry.get("issue")
        title = f"{MONTH_NAMES[month - 1]} {year}"
        subtitle = f"Vol. {volume}, No. {issue_no}" if volume else ""
        paragraph_count = sum(len(s["paragraphs"]) for s in sections)
        issues.append({
            "slug": f"crisis-{entry['date']}",
            "number": number,
            "title": title,
            "subtitle": subtitle,
            "source_url": f"https://archive.org/details/{identifier}",
            "sections": [
                {
                    "order": order,
                    "title": section["title"],
                    "paragraphs": [
                        {"order": p_order, "text": p["text"], "kind": p["kind"]}
                        for p_order, p in enumerate(section["paragraphs"], start=1)
                    ],
                }
                for order, section in enumerate(sections, start=1)
            ],
        })
        report_lines.append(
            f"{entry['date']}  {identifier:44s} sections={len(sections):2d} "
            f"paragraphs={paragraph_count:4d}  " +
            " | ".join(s["title"][:28] for s in sections[:8])
        )
        if number % 24 == 0:
            print(f"  parsed {number}/{len(chosen)}", flush=True)

    data = {
        "book": {
            "slug": "the-crisis",
            "title": "The Crisis",
            "subtitle": "A Record of the Darker Races",
            "author_attribution": "Edited by W. E. Burghardt Du Bois",
            "description": (
                "The monthly magazine of the National Association for the "
                "Advancement of Colored People, founded and edited by W. E. B. "
                "Du Bois. From November 1910 the Crisis chronicled Black life, "
                "protest, and achievement — news along the color line, searing "
                "editorials, and the poets and artists of the Harlem "
                "Renaissance. This archive holds its first twenty years."
            ),
            "published_year": 1910,
            "is_public_domain": True,
        },
        "edition": {
            "slug": "crisis-ia-microfilm",
            "name": "Internet Archive microfilm digitisation (OCR text)",
            "publisher": "National Association for the Advancement of Colored People",
            "year": 1910,
            "source_url": "https://archive.org/details/pub_crisis",
            "source_notes": (
                "Text recovered by optical character recognition from the "
                "Internet Archive's microfilm digitisation of The Crisis "
                "(collection pub_crisis), issues of November 1910 through "
                "December 1930 — all in the public domain. Advertising pages, "
                "running heads and photograph captions are omitted; OCR "
                "imperfections of the microfilm remain. Each issue links to "
                "its original page scans."
            ),
            "license_note": "Public domain (published in the United States before 1931).",
            "is_primary": True,
        },
        "issues": issues,
    }

    OUT_PATH.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    REPORT_PATH.write_text("\n".join(report_lines), encoding="utf-8")
    total_sections = sum(len(i["sections"]) for i in issues)
    total_paragraphs = sum(len(s["paragraphs"]) for i in issues for s in i["sections"])
    size_mb = OUT_PATH.stat().st_size / 1e6
    print(f"wrote {OUT_PATH.name}: {len(issues)} issues, {total_sections} sections, "
          f"{total_paragraphs} paragraphs, {size_mb:.1f} MB")
    print(f"report: {REPORT_PATH}")


if __name__ == "__main__":
    main()
