#!/usr/bin/env python3
"""tools/whisper_words.py — faster-whisper -> JSON sa vremenima po rečima.

    python tools/whisper_words.py <wav> <out.json> [--model small.en]

Na stdout ide **samo jedna linija statusa**. Transkript narracije od 3:37 ima ~600 reči sa
timestamp-ovima; jedan ispis toga je 15–20k tokena i pojede sesiju pre nego što alignment
uopšte počne (docs/plan/C05-align.md). Zato: rezultat uvek u fajl, nikad na konzolu.

Ulaz je 16 kHz mono wav koji pravi tools/align.mjs preko ffmpeg-a. Model se traži u HF kešu
(`small.en` i `medium.en` su već skinuti); ako mreže nema, drugi pokušaj ide sa
local_files_only.
"""

import argparse
import json
import sys
import time
from pathlib import Path


def main() -> int:
    # Windows konzola je cp1252; bez ovoga i --help puca na prvom našem slovu.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

    ap = argparse.ArgumentParser(description="narration wav -> word timestamps JSON")
    ap.add_argument("wav", help="16 kHz mono wav")
    ap.add_argument("out", help="izlazni JSON")
    ap.add_argument("--model", default="small.en", help="small.en (podrazumevano) ili medium.en")
    ap.add_argument("--device", default="cpu")
    ap.add_argument("--compute-type", default="int8")
    ap.add_argument("--beam-size", type=int, default=5)
    args = ap.parse_args()

    from faster_whisper import WhisperModel

    t0 = time.time()
    try:
        model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
    except Exception:  # nema mreže -> probaj samo keš
        model = WhisperModel(
            args.model, device=args.device, compute_type=args.compute_type, local_files_only=True
        )

    segments, info = model.transcribe(
        args.wav,
        language="en",
        beam_size=args.beam_size,
        word_timestamps=True,
        vad_filter=False,
    )

    words = []
    segs = []
    for s in segments:  # generator — tek ovde whisper stvarno radi
        segs.append({"start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip()})
        for w in s.words or []:
            words.append(
                {
                    "word": w.word.strip(),
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                    "probability": round(w.probability, 4),
                }
            )

    payload = {
        "model": args.model,
        "audio_duration": round(info.duration, 3),
        "language": info.language,
        "elapsed": round(time.time() - t0, 1),
        "words": words,
        "segments": segs,
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    # ASCII status linija: stdout ide kroz pipe, a Windows locale je cp1252
    print(
        f"whisper_words: {len(words)} words, {payload['audio_duration']}s audio, "
        f"{payload['elapsed']}s elapsed, model {args.model} -> {out.as_posix()}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
