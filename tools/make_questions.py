"""Make one question per card from the extracted deck data.

Questions reuse the card's own words, with the part to learn left blank, so
nothing is reworded. Writes src/data/questions.json; the author reviews it in
the app's card browser and corrections go into OVERRIDES below.

Kinds
- which: "which is said correctly?" right form vs the printed wrong forms.
- fill:  the card with its answer blanked; wrong choices are other answers
         from the same deck, nearest in shape first.
- pick:  Kirazira / Indangagaciro: choose the taboo (or the value) among
         statements from the other deck.
- read:  no question; the card is just read (definitions, unclear cards).

Usage: python3 -I tools/make_questions.py
"""

import hashlib
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DECKS = ["ntibavuga-bavuga", "ikeshamvugo", "imvugo", "kirazira", "indangagaciro"]
BLANK = "___"
MARKERS = ["BABYITA", "BAYITA", "BAHITA", "BAZITA", "BATWITA", "BAKITA", "BAMWITA", "UGIRA UTI"]

# Cards whose generated question is wrong or unclear; checked with the author.
OVERRIDES = {
    # Which reply "Amashyo" takes is not printed on the card.
    "ntibavuga-bavuga-9S": {"kind": "read", "review": "Igisubizo cy'indamukanyo 'Amashyo' ntikiri ku ikarita."},
}

QUOTES = "“”\"'"


def clean(s):
    return re.sub(r"\s+", " ", s).strip()


def unquote(s):
    return clean(s).strip(QUOTES).strip()


def stable(*parts):
    return int(hashlib.sha1("|".join(parts).encode()).hexdigest()[:8], 16)


def lines_of(card):
    return [clean(l) for l in card["text"].split("\n") if clean(l)]


def common_prefix(a, b):
    n = 0
    for x, y in zip(a, b):
        if x != y:
            break
        n += 1
    return n


def parse_correction(lines):
    """NTIBAVUGA <wrong...> BAVUGA <right>. Returns (before, wrong_alts, right) or None."""
    flat = " ".join(lines)
    m = re.match(r"^(.*?)\bNTIBAVUGA\b(.*?)\bBAVUGA\b(.*)$", flat)
    if m:
        before, wrong, right = m.group(1), m.group(2), m.group(3)
        # Alternatives: "X CYANGWA Y", or one per printed line between the two words.
        between = []
        inside = False
        for l in lines:
            if l.startswith("NTIBAVUGA"):
                inside = True
                rest = clean(l[len("NTIBAVUGA"):])
                if rest:
                    between.append(rest)
                continue
            if l.startswith("BAVUGA"):
                break
            if inside:
                between.append(l)
        alts = []
        if len(between) > 1 and not wrong.strip().startswith("BATI"):
            alts = between
        else:
            alts = [clean(wrong)]
        alts = [a for alt in alts for a in re.split(r"\s+CYANGWA\s+", alt)]
        return clean(before), [unquote(a) for a in alts if unquote(a)], unquote(right)
    m = re.match(r"^(.*?)\bNTAGO UVUGA UTI\b(.*?)\bUVUGA UTI\b(.*)$", flat)
    if m:
        return clean(m.group(1)), [unquote(m.group(2))], unquote(m.group(3))
    return None


def parse_marker(lines):
    flat = " ".join(lines)
    for mk in MARKERS:
        i = flat.rfind(" " + mk + " ")
        if i == -1 and flat.endswith(" " + mk):
            i = len(flat) - len(mk) - 1
        if i == -1 and flat.startswith(mk + " "):
            i = -1  # marker opening the card means nothing to ask about
        if i != -1:
            return clean(flat[: i + 1 + len(mk)]), unquote(flat[i + 1 + len(mk):])
    i = flat.rfind(" NI ")
    if i != -1:
        return clean(flat[: i + 3]), unquote(flat[i + 4:])
    return None


def parse_pair(lines):
    """'X NTI-verb / X verb': answer is what the second line adds."""
    if len(lines) != 2 or not re.search(r"\bNT(I|ABWO)\w*", lines[0]):
        return None
    first, second = lines[0].split(), lines[1].split()
    keep = 0
    while keep < len(second) - 1 and second[keep] in first:
        keep += 1
    if keep == 0 and len(second) > 1:
        keep = 1
    return clean(lines[0]), " ".join(second[:keep]), " ".join(second[keep:])


def base_question(deck_id, card):
    lines = lines_of(card)
    q = {"deck": deck_id, "card": card["id"], "rank": card["rank"], "suit": card["suit"]}

    if deck_id == "kirazira":
        statement = clean(" ".join(lines))
        statement = clean(re.sub(r"^KIRAZIRA\b", "", statement))
        return {**q, "kind": "pick", "category": "kirazira", "statement": statement, "answer": statement}
    if deck_id == "indangagaciro":
        statement = clean(" ".join(lines))
        if statement.startswith("INDANGAGACIRO NI"):
            return {**q, "kind": "read"}
        return {**q, "kind": "pick", "category": "indangagaciro", "statement": statement, "answer": statement}

    corr = parse_correction(lines)
    if corr:
        before, wrongs, right = corr
        if deck_id == "ntibavuga-bavuga":
            prompt = ([before] if before else []) + ["NTIBAVUGA " + " CYANGWA ".join(wrongs), "BAVUGA " + BLANK]
            if card["text"].startswith(("IYO", "NTAGO")) or "UVUGA UTI" in card["text"]:
                prompt = ([before] if before else []) + ["NTAGO UVUGA UTI " + wrongs[0], "UVUGA UTI " + BLANK]
            return {**q, "kind": "which", "prompt": prompt, "answer": right, "wrong": wrongs, "family": "correction"}
        # Elsewhere a blank to fill, keeping any words the two forms share.
        shared = common_prefix(wrongs[0].split(), right.split())
        lead = " ".join(right.split()[:shared])
        answer = " ".join(right.split()[shared:]) or right
        prompt = ([before] if before else []) + [
            "NTIBAVUGA " + " CYANGWA ".join(wrongs),
            "BAVUGA " + (lead + " " if lead and answer != right else "") + BLANK,
        ]
        return {**q, "kind": "fill", "prompt": prompt, "answer": answer, "family": "correction"}

    mk = parse_marker(lines)
    if mk and mk[1]:
        lead, answer = mk
        family = next((m for m in MARKERS if lead.endswith(m)), "NI")
        return {**q, "kind": "fill", "prompt": [lead + " " + BLANK], "answer": answer, "family": family}

    pair = parse_pair(lines)
    if pair:
        first, lead, answer = pair
        return {**q, "kind": "fill", "prompt": [first, (lead + " " if lead else "") + BLANK], "answer": answer, "family": "pair"}

    return {**q, "kind": "read", "review": "Nta kibazo cyakozwe ku ikarita."}


def add_distractors(questions):
    by_deck = {}
    for q in questions:
        by_deck.setdefault(q["deck"], []).append(q)

    for q in questions:
        if q["kind"] == "fill":
            pool = [o for o in by_deck[q["deck"]] if o["kind"] == "fill" and o["answer"] != q["answer"]]
            words = len(q["answer"].split())

            def rank(o):
                # Same opening letters usually means the same word class (IRA-, UMU-, KU-...).
                return (
                    o["family"] != q["family"],
                    o["answer"][:3] != q["answer"][:3],
                    abs(len(o["answer"].split()) - words),
                    abs(len(o["answer"]) - len(q["answer"])) // 4,
                    stable(q["card"], o["card"]),
                )

            picked = []
            for o in sorted(pool, key=rank):
                if o["answer"] not in picked:
                    picked.append(o["answer"])
                if len(picked) == 2:
                    break
            q["options"] = [q["answer"], *picked]
        elif q["kind"] == "which":
            q["options"] = [q["answer"], *[w for w in q["wrong"] if w != q["answer"]]]
        elif q["kind"] == "pick":
            other = "indangagaciro" if q["deck"] == "kirazira" else "kirazira"
            pool = [o for o in by_deck[other] if o["kind"] == "pick"]
            pool.sort(key=lambda o: (abs(len(o["statement"]) - len(q["statement"])) // 6, stable(q["card"], o["card"])))
            q["options"] = [q["statement"], *[o["statement"] for o in pool[:2]]]
    return questions


def main():
    questions = []
    for deck_id in DECKS:
        with open(os.path.join(ROOT, "src", "data", "decks", deck_id + ".json"), encoding="utf-8") as f:
            deck = json.load(f)
        for card in deck["cards"]:
            q = base_question(deck_id, card)
            q.update(OVERRIDES.get(card["id"], {}))
            questions.append(q)
    add_distractors(questions)
    for q in questions:
        q.pop("family", None)
        q.pop("wrong", None) if q["kind"] != "which" else None
    out = {q["card"]: q for q in questions}
    with open(os.path.join(ROOT, "src", "data", "questions.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    kinds = {}
    for q in questions:
        kinds[q["kind"]] = kinds.get(q["kind"], 0) + 1
    print(len(questions), "questions", kinds)


if __name__ == "__main__":
    main()
