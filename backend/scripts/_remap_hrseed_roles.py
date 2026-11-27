"""One-shot: remap EMP-QMIS roles in hrSeed.js to approved designation codes."""
from __future__ import annotations

import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
PATH = REPO / "src" / "Pages" / "HR" / "domain" / "hrSeed.js"

REPLACEMENTS = {
    "EMP-QMIS-082": "pro",
    "EMP-QMIS-083": "accountassistant",
    "EMP-QMIS-090": "financemanager",
    "EMP-QMIS-097": "accountassistant",
    "EMP-QMIS-098": "accountassistant",
    "EMP-QMIS-108": "accountassistant",
    "EMP-QMIS-110": "pro",
    "EMP-QMIS-119": "accountassistant",
}


def main() -> None:
    text = PATH.read_text(encoding="utf-8")
    for emp, role in REPLACEMENTS.items():
        pat = re.compile(rf'(id: "{emp}"[^\n]*role: ")[^"]+(")')
        text, n = pat.subn(rf"\g<1>{role}\2", text, count=1)
        if n != 1:
            raise SystemExit(f"failed {emp} n={n}")
    PATH.write_text(text, encoding="utf-8")
    for emp, role in REPLACEMENTS.items():
        m = re.search(rf'id: "{emp}"[^\n]*role: "([^"]+)"', text)
        assert m and m.group(1) == role, (emp, m.group(1) if m else None, role)
    print(f"updated {len(REPLACEMENTS)} hrSeed roles")


if __name__ == "__main__":
    main()
