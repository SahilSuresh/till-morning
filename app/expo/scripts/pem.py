#!/usr/bin/env python3
"""Writes the key in environment variable NAME to FILE as a proper PEM file:
one header line, the body in 64-character lines, one footer line. A key
pasted into a web form often loses its line breaks, or its first and last
lines (-----BEGIN … / -----END …), or gains spaces or Windows line ends; the
App Store Connect tools then refuse it.

    python3 tool/ios/pem.py APP_STORE_CONNECT_PRIVATE_KEY /tmp/asc.p8 "PRIVATE KEY"
    python3 tool/ios/pem.py CERTIFICATE_PRIVATE_KEY /tmp/cert.pem "RSA PRIVATE KEY"

KIND is the key's type, used when its BEGIN and END lines were lost. Says
which variable is wrong if it doesn't look like a key at all. Never prints
the key.
"""

import base64
import binascii
import os
import re
import sys

name, path = sys.argv[1], sys.argv[2]
kind = sys.argv[3] if len(sys.argv) > 3 else "PRIVATE KEY"
value = os.environ.get(name, "").replace("\r", "").replace("\\n", "\n").strip()
match = re.search(r"-----BEGIN ([A-Z ]+)-----(.*?)-----END \1-----", value, re.S)
if match:
    kind, body = match.group(1), match.group(2)
else:
    # Only the middle was pasted: keep it if it's all base64.
    body = re.sub(r"-----[A-Z ]*-----", "", value)
body = re.sub(r"\s+", "", body)
try:
    if len(body) < 100:
        raise ValueError
    base64.b64decode(body, validate=True)
except (binascii.Error, ValueError):
    sys.exit(
        f"{name} doesn't look like a key ({len(value)} characters given). Open the key file "
        "in Notepad, select all (Ctrl+A), copy, and paste it into Codemagic again."
    )
lines = [body[i:i + 64] for i in range(0, len(body), 64)]
with open(path, "w") as f:
    f.write(f"-----BEGIN {kind}-----\n" + "\n".join(lines) + f"\n-----END {kind}-----\n")
print(f"{name}: a {kind.lower()} of {len(body)} characters, written to {path}"
      + ("" if match else " (its BEGIN and END lines were missing, so they were added)"))
