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

# select: a clear little "pip" for chips and choices (habits, prices, reasons)
b = blank(0.16, R)
add(b, 0, glass(1318.5, 0.1, R, attack=0.002, decay=34, bright=0.2), R)
add(b, 0.03, glass(1975.5, 0.08, R, attack=0.002, decay=40, bright=0.1), R, 0.45)
save('select', finish(room(lowpass(b, 0.6), R), 0.24, R))

# tab: a soft round tock (option H on the sound demo)
b = blank(0.16, R)
add(b, 0, glass(523.25, 0.12, R, attack=0.002, decay=30, bright=0.3), R)
save('tab', finish(room(lowpass(b, 0.45), R), 0.2, R))

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

# hold: soft notes that climb and come faster as the moon fills, the last one landing just
# before 2.5 s (when the moon is full and the boom takes over). Short notes, so letting go stops cleanly.
HOLD = 2.5
PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5, 1568.0, 1760.0, 2093.0, 2349.3, 2637.0]
b = blank(HOLD, R)
times, t, gap = [], 0.0, 0.34
while t < HOLD - 0.12:
    times.append(t)
    t += gap
    gap = max(0.075, gap * 0.82)
for j, t0 in enumerate(times):
    k = j / max(1, len(times) - 1)
    f = PENTA[min(len(PENTA) - 1, round(k * (len(PENTA) - 1)))]
    note = glass(f, 0.22, R, attack=0.003, decay=22, bright=0.12)
    add(b, t0, note, R, 0.55 + 0.45 * k)
b = room(lowpass(b, 0.55), R)[: int(HOLD * R)]
save('hold', finish(b, 0.3, R, fade=0.03))

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

# tear: a proper "rrrip" — crackly bursts of paper that get brighter and faster, about 0.4 s
TEAR = 0.42
out, y = [], 0.0
burst = 0.0
for i in range(int(TEAR * R)):
    t = i / R
    k = t / TEAR
    if random.random() < 0.0016 + 0.004 * k:  # the fibres giving way, more often as it goes
        burst = 1.0
    burst *= 0.9985
    a = 0.18 + 0.6 * k
    y += a * (random.uniform(-1, 1) - y)
    shape = math.sin(math.pi * min(1, k * 1.15)) ** 0.5
    out.append(y * (0.45 + 0.55 * burst) * shape)
out = lowpass(out, 0.7)
save('tear', finish(room(out, R, taps=((0.017, 0.2), (0.033, 0.12))), 0.46, R, fade=0.03))

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
