import csv
import json
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parent
    rows: list[list[str]] = []

    # Backend (pip) - from requirements.txt + known license mapping
    req_path = root / "backend" / "requirements.txt"
    if req_path.exists():
        license_map = {
            "Flask": "BSD-3-Clause",
            "Flask-CORS": "MIT",
            "psycopg2-binary": "LGPL with exceptions",
            "python-dotenv": "BSD-3-Clause",
            "pypdf": "BSD-3-Clause",
            "Flask-JWT-Extended": "MIT",
            "bcrypt": "Apache-2.0",
            "reportlab": "BSD-like",
        }

        for line in req_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "==" in line:
                name, version = line.split("==", 1)
                name = name.strip()
                version = version.strip()
            else:
                name, version = line, "UNKNOWN"

            license_id = license_map.get(name, "UNKNOWN")
            commercial_use = "yes"
            notes = ""

            if name == "psycopg2-binary":
                commercial_use = "depends"
                notes = "LGPL with exceptions; review obligations for your distribution model."
            elif license_id == "UNKNOWN":
                commercial_use = "unknown"

            rows.append([
                "pip",
                name,
                version,
                license_id,
                "runtime",
                commercial_use,
                notes,
            ])

    # Frontend (npm) - from package-lock.json
    lock_path = root / "frontend" / "package-lock.json"
    if lock_path.exists():
        lock = json.loads(lock_path.read_text(encoding="utf-8"))
        pkgs = lock.get("packages", {})
        for pkg_path, p in pkgs.items():
            if not isinstance(p, dict):
                continue
            version = p.get("version")
            if not version:
                continue

            name = p.get("name")
            if not name:
                if pkg_path == "":
                    name = lock.get("name", "frontend")
                elif pkg_path.startswith("node_modules/"):
                    name = pkg_path[len("node_modules/"):]

            if not name:
                continue

            if "node_modules/" in name:
                name = name.split("node_modules/")[-1]

            license_val = p.get("license") or p.get("licenses") or "UNKNOWN"
            if isinstance(license_val, list):
                license_val = "|".join(str(x) for x in license_val)
            else:
                license_val = str(license_val)

            scope = "dev" if p.get("dev") else "runtime"
            commercial_use = "yes"
            notes = ""

            if license_val == "CC-BY-4.0":
                notes = "Attribution required."
            elif license_val == "UNKNOWN":
                commercial_use = "unknown"

            rows.append([
                "npm",
                name,
                str(version),
                license_val,
                scope,
                commercial_use,
                notes,
            ])

    # De-duplicate by (ecosystem, package, version, scope)
    seen: set[tuple[str, str, str, str]] = set()
    dedup: list[list[str]] = []
    for r in rows:
        key = (r[0], r[1], r[2], r[4])
        if key in seen:
            continue
        seen.add(key)
        dedup.append(r)

    dedup.sort(key=lambda r: (r[0], r[1].lower(), r[2], r[4]))

    out_path = root / "OSS_BOM.csv"
    with out_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["ecosystem", "package", "version", "license", "scope", "commercial_use", "notes"])
        w.writerows(dedup)

    print(f"Wrote {out_path} with {len(dedup)} rows")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
