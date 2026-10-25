"""Makes Till Morning's UI sounds (assets/sounds/*.wav) from scratch: soft marimba and bell tones,
a charging hum for the hold-the-moon button and a warm "boom into the sun". Pure Python, no
dependencies, so anyone can re-run it:  python scripts/make-sounds.py
"""

import math
import os
import random
import struct
import wave

RATE = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')
random.seed(7)


def blank(sec):
    return [0.0] * int(sec * RATE)


def add(buf, start, samples, vol=1.0):
    i0 = int(start * RATE)
    for i, v in enumerate(samples):
        if i0 + i < len(buf):
            buf[i0 + i] += v * vol


def marimba(freq, dur=0.25, decay=14.0):
    """A soft wooden note: the fundamental, a quick 4x overtone and a gentle attack."""
    out = []
    for i in range(int(dur * RATE)):
        t = i / RATE
        att = min(1.0, t / 0.004)
        v = math.sin(2 * math.pi * freq * t) * math.exp(-decay * t)
        v += 0.35 * math.sin(2 * math.pi * freq * 4 * t) * math.exp(-decay * 3.5 * t)
        out.append(v * att)
    return out


def bell(freq, dur=0.8, decay=5.0):
    """A glassy bell: inharmonic partials that fade at different speeds."""
    parts = [(1.0, 1.0, 1.0), (2.76, 0.45, 1.8), (5.4, 0.22, 3.2), (8.9, 0.1, 5.0)]
    out = []
    for i in range(int(dur * RATE)):
        t = i / RATE
        att = min(1.0, t / 0.003)
        v = sum(a * math.sin(2 * math.pi * freq * m * t) * math.exp(-decay * d * t) for m, a, d in parts)
        out.append(v * att * 0.6)
    return out


def sweep(f0, f1, dur, decay=0.0):
    out, ph = [], 0.0
    n = int(dur * RATE)
    for i in range(n):
        t = i / RATE
        f = f0 * (f1 / f0) ** (i / n)
        ph += 2 * math.pi * f / RATE
        out.append(math.sin(ph) * math.exp(-decay * t))
    return out


def noise(dur, decay=20.0, smooth=0.6):
    out, prev = [], 0.0
    for i in range(int(dur * RATE)):
        t = i / RATE
        prev = prev * smooth + random.uniform(-1, 1) * (1 - smooth)
        out.append(prev * math.exp(-decay * t))
    return out


def finish(buf, peak=0.5, fade=0.01):
    m = max(1e-9, max(abs(v) for v in buf))
    buf = [v / m * peak for v in buf]
    n = int(fade * RATE)
    for i in range(min(n, len(buf))):
        buf[-1 - i] *= i / n
        buf[i] *= min(1.0, i / max(1, int(0.002 * RATE)))
    return buf


def save(name, buf):
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v)) * 32767)) for v in buf))
    print(name, f'{len(buf) / RATE:.2f}s')


# tap: a soft pop with a little pitch drop
b = blank(0.09)
add(b, 0, [s * math.exp(-45 * i / RATE) for i, s in enumerate(sweep(1150, 650, 0.09))])
save('tap', finish(b, 0.32))

# next: two wooden notes going up (E6 → A6)
b = blank(0.32)
add(b, 0.0, marimba(1318.5, 0.25))
add(b, 0.075, marimba(1760.0, 0.25), 0.9)
save('next', finish(b, 0.4))

# back: two softer notes going down (A5 → E5)
b = blank(0.3)
add(b, 0.0, marimba(880.0, 0.22, 16))
add(b, 0.065, marimba(659.3, 0.22, 16), 0.85)
save('back', finish(b, 0.32))

# select: a tiny woodblock for chips and choices
b = blank(0.07)
add(b, 0, marimba(1568.0, 0.07, 40))
add(b, 0, noise(0.01, 300, 0.2), 0.3)
save('select', finish(b, 0.26))

# tab: a low, soft tick for the tab bar
b = blank(0.08)
add(b, 0, marimba(1046.5, 0.08, 34))
save('tab', finish(b, 0.24))

# toggles: a blip up (on) and down (off)
for name, f0, f1 in [('toggle_on', 700, 1150), ('toggle_off', 1150, 700)]:
    b = blank(0.09)
    add(b, 0, [s * math.exp(-30 * i / RATE) for i, s in enumerate(sweep(f0, f1, 0.09))])
    save(name, finish(b, 0.3))

# hold: 2.6 s of a hum rising as the moon fills, with a shimmer and a quickening flutter
dur = 2.6
n = int(dur * RATE)
b, ph, ph2 = [], 0.0, 0.0
for i in range(n):
    t = i / RATE
    k = i / n
    f = 165 * (4.5 ** k)  # 165 Hz → ~740 Hz
    ph += 2 * math.pi * f / RATE
    ph2 += 2 * math.pi * f * 2.01 / RATE
    flutter = 0.75 + 0.25 * math.sin(2 * math.pi * (5 + 14 * k) * t)
    v = (math.sin(ph) + 0.35 * math.sin(2 * ph) + 0.25 * k * math.sin(ph2)) * flutter
    b.append(v * (0.12 + 0.88 * k ** 1.4))
save('hold', finish(b, 0.34, fade=0.04))

# boom: a warm thump, a soft whoosh, then a sunrise of bell notes (C6 E6 G6 C7)
b = blank(1.6)
add(b, 0, [s * math.exp(-7 * i / RATE) for i, s in enumerate(sweep(110, 38, 0.6))], 1.0)
add(b, 0, noise(0.35, 9, 0.85), 0.5)
for j, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
    add(b, 0.12 + j * 0.09, bell(f, 1.0, 4.0), 0.32)
save('boom', finish(b, 0.6, fade=0.2))

# chime: "In your trolley!" — three quick bells going up (C6 E6 G6)
b = blank(0.9)
for j, f in enumerate([1046.5, 1318.5, 1568.0]):
    add(b, j * 0.07, bell(f, 0.75, 5.5), 0.8)
save('chime', finish(b, 0.38, fade=0.15))

# tear: a crackly paper tear, rising in brightness
b = blank(0.26)
prev, out = 0.0, []
for i in range(int(0.26 * RATE)):
    t = i / RATE
    k = t / 0.26
    sm = 0.75 - 0.5 * k
    prev = prev * sm + random.uniform(-1, 1) * (1 - sm)
    crackle = 0.5 + 0.5 * (random.random() > 0.55)
    out.append(prev * crackle * math.sin(math.pi * k) ** 0.6)
add(b, 0, out)
save('tear', finish(b, 0.4))

# pop: a bubbly little pop for things appearing (tags, stickers)
b = blank(0.12)
add(b, 0, [s * math.exp(-28 * i / RATE) for i, s in enumerate(sweep(500, 1300, 0.12))])
save('pop', finish(b, 0.28))
