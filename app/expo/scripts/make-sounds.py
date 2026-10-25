"""Makes Till Morning's sounds (assets/sounds/*.wav) from scratch: soft glassy taps with a little
room echo, a warm rising pad for holding the moon, a boom into the sun, and a calm 24-second music
loop for waiting screens. Pure Python, no dependencies:  python scripts/make-sounds.py
"""

import math
import os
import random
import struct
import wave

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')
random.seed(11)
TAU = 2 * math.pi


def blank(sec, rate):
    return [0.0] * int(sec * rate)


def add(buf, start, samples, rate, vol=1.0, wrap=False):
    i0 = int(start * rate)
    n = len(buf)
    for i, v in enumerate(samples):
        j = i0 + i
        if wrap:
            buf[j % n] += v * vol
        elif j < n:
            buf[j] += v * vol


def glass(freq, dur, rate, attack=0.004, decay=9.0, bright=0.18):
    """A soft glassy note: a pure tone with a touch of its 2nd and 3rd harmonics."""
    out = []
    for i in range(int(dur * rate)):
        t = i / rate
        env = min(1.0, t / attack) * math.exp(-decay * t)
        v = math.sin(TAU * freq * t) + bright * math.sin(TAU * 2 * freq * t) * math.exp(-decay * t) + 0.05 * math.sin(TAU * 3 * freq * t)
        out.append(v * env)
    return out


def bell(freq, dur, rate, decay=4.5):
    parts = [(1.0, 1.0, 1.0), (2.0, 0.25, 1.6), (2.76, 0.3, 2.2), (5.4, 0.1, 4.0)]
    out = []
    for i in range(int(dur * rate)):
        t = i / rate
        att = min(1.0, t / 0.003)
        out.append(att * sum(a * math.sin(TAU * freq * m * t) * math.exp(-decay * d * t) for m, a, d in parts) * 0.6)
    return out


def glide(f0, f1, dur, rate, decay=0.0, attack=0.003):
    out, ph = [], 0.0
    n = int(dur * rate)
    for i in range(n):
        t = i / rate
        f = f0 * (f1 / f0) ** min(1.0, i / max(1, n * 0.6))
        ph += TAU * f / rate
        out.append(math.sin(ph) * min(1.0, t / attack) * math.exp(-decay * t))
    return out


def lowpass(buf, a=0.35):
    out, y = [], 0.0
    for v in buf:
        y += a * (v - y)
        out.append(y)
    return out


def room(buf, rate, taps=((0.023, 0.32), (0.041, 0.24), (0.067, 0.16), (0.103, 0.09)), wrap=False):
    """A small room: a few soft echoes (looped round for the music)."""
    out = list(buf)
    n = len(buf)
    for d, g in taps:
        k = int(d * rate)
        for i in range(n):
            j = i + k
            if wrap:
                out[j % n] += buf[i] * g
            elif j < n:
                out[j] += buf[i] * g
    return out


def finish(buf, peak, rate, fade=0.012, edges=True):
    m = max(1e-9, max(abs(v) for v in buf))
    buf = [v / m * peak for v in buf]
    if edges:
        n = int(fade * rate)
        for i in range(min(n, len(buf))):
            buf[-1 - i] *= i / n
    return buf


def save(name, buf, rate=44100):
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v)) * 32767)) for v in buf))
    print(f'{name:11} {len(buf) / rate:5.2f}s')


R = 44100

# tap: a soft bubble
b = blank(0.14, R)
add(b, 0, glide(480, 760, 0.1, R, decay=34), R)
save('tap', finish(room(lowpass(b, 0.5), R), 0.2, R))

# select: a tiny glass tick
b = blank(0.1, R)
add(b, 0, glass(2093, 0.06, R, attack=0.001, decay=70, bright=0.1), R)
save('select', finish(room(b, R), 0.15, R))

# tab: a soft click, like the iPhone keyboard (picked from the demo, option A)
click, y = [], 0.0
for i in range(int(0.025 * R)):
    t = i / R
    y += 0.5 * (random.uniform(-1, 1) - y)
    click.append(y * min(1.0, t / 0.0005) * math.exp(-260 * t) + 0.6 * math.sin(TAU * 2600 * t) * min(1.0, t / 0.0005) * math.exp(-300 * t))
save('tab', finish(room(click + [0.0] * int(0.06 * R), R, taps=((0.021, 0.25), (0.039, 0.16), (0.061, 0.09))), 0.22, R))

# next: two glassy notes going up (D6 → A6)
b = blank(0.5, R)
add(b, 0.0, glass(1174.7, 0.36, R), R)
add(b, 0.085, glass(1760.0, 0.36, R), R, 0.85)
save('next', finish(room(lowpass(b, 0.55), R), 0.26, R, fade=0.05))

# back: two softer notes going down (A5 → E5)
b = blank(0.46, R)
add(b, 0.0, glass(880.0, 0.32, R, decay=11), R)
add(b, 0.075, glass(659.25, 0.32, R, decay=11), R, 0.85)
save('back', finish(room(lowpass(b, 0.5), R), 0.22, R, fade=0.05))

# toggles: a soft glide up (on) and down (off)
for name, f0, f1 in [('toggle_on', 520, 880), ('toggle_off', 880, 520)]:
    b = blank(0.2, R)
    add(b, 0, glide(f0, f1, 0.14, R, decay=18), R)
    save(name, finish(room(lowpass(b, 0.5), R), 0.22, R, fade=0.04))

# hold: a warm chord swelling and rising an octave as the moon fills (2.6 s)
dur = 2.6
n = int(dur * R)
b = []
phases = [0.0] * 6
voices = [(1.0, 1.0), (1.003, 0.6), (1.5, 0.55), (1.497, 0.35), (2.0, 0.35), (3.0, 0.0)]
for i in range(n):
    t = i / R
    k = i / n
    base = 220 * (2 ** k)  # A3 → A4
    v = 0.0
    for j, (m, a) in enumerate(voices):
        phases[j] += TAU * base * m / R
        amp = a if j < 5 else 0.18 * k  # a bright top joins as it fills
        v += amp * math.sin(phases[j])
    swell = 0.08 + 0.92 * (k ** 1.6)
    breathe = 0.9 + 0.1 * math.sin(TAU * (3 + 4 * k) * t)
    b.append(v * swell * breathe)
save('hold', finish(room(lowpass(b, 0.3), R), 0.32, R, fade=0.05))

# boom: a soft warm thump, an airy whoosh, then a sunrise of bells (C6 E6 G6 C7)
b = blank(2.0, R)
add(b, 0, glide(90, 42, 0.7, R, decay=6), R, 0.9)
wh, y = [], 0.0
for i in range(int(0.5 * R)):
    t = i / R
    y += 0.08 * (random.uniform(-1, 1) - y)
    wh.append(y * math.sin(math.pi * min(1, t / 0.5)) * 2.2)
add(b, 0, wh, R, 0.5)
for j, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
    add(b, 0.14 + j * 0.1, bell(f, 1.3, R, 3.6), R, 0.3)
save('boom', finish(room(b, R), 0.55, R, fade=0.3))

# chime: "In your trolley!" — three quick bells going up (C6 E6 G6)
b = blank(1.1, R)
for j, f in enumerate([1046.5, 1318.5, 1568.0]):
    add(b, j * 0.075, bell(f, 0.9, R, 5.0), R, 0.8)
save('chime', finish(room(b, R), 0.32, R, fade=0.2))

# tear: a soft paper tear
out, y = [], 0.0
for i in range(int(0.24 * R)):
    t = i / R
    k = t / 0.24
    a = 0.25 + 0.5 * k
    y += a * (random.uniform(-1, 1) - y)
    out.append(y * (0.55 + 0.45 * (random.random() > 0.5)) * math.sin(math.pi * k) ** 0.7)
save('tear', finish(lowpass(out, 0.6), 0.3, R))

# pop: a bubbly pop for things appearing
b = blank(0.14, R)
add(b, 0, glide(420, 980, 0.11, R, decay=26), R)
save('pop', finish(room(b, R), 0.2, R))

# ---- calm: 24 s of soft, breathing chords for waiting screens (loops seamlessly) ----
CR = 22050
LOOP = 24.0
b = blank(LOOP, CR)
n = len(b)
# Cmaj7 · Am7 · Fmaj7 · G6, 6 s each, low and warm
CHORDS = [
    [130.81, 196.0, 329.63, 493.88],
    [110.0, 164.81, 261.63, 392.0],
    [87.31, 130.81, 220.0, 329.63],
    [98.0, 146.83, 246.94, 329.63],
]
for c, notes in enumerate(CHORDS):
    start = c * 6.0 - 1.0  # each chord fades in a second early and lingers a second after
    length = 8.0
    for f in notes:
        voice = []
        for i in range(int(length * CR)):
            t = i / CR
            env = math.sin(math.pi * t / length) ** 2
            v = math.sin(TAU * f * t) + 0.12 * math.sin(TAU * 2 * f * t) + 0.5 * math.sin(TAU * f * 1.002 * t)
            voice.append(v * env)
        add(b, start, voice, CR, 0.22, wrap=True)
# a few soft chimes from the C major pentatonic, high up
for t0, f in [(1.5, 1046.5), (4.8, 1318.5), (8.2, 1568.0), (11.4, 1174.7), (14.6, 1318.5), (17.9, 1760.0), (21.3, 1568.0)]:
    add(b, t0, bell(f, 2.6, CR, 1.6), CR, 0.07, wrap=True)
# breathing: a gentle swell every 8 seconds (fits the loop exactly)
b = [v * (0.82 + 0.18 * math.sin(TAU * (i / CR) / 8.0)) for i, v in enumerate(b)]
b = room(lowpass(b, 0.25), CR, taps=((0.09, 0.3), (0.17, 0.22), (0.29, 0.14), (0.43, 0.08)), wrap=True)
save('calm', finish(b, 0.5, CR, edges=False), CR)
