import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageColor, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "pets" / "sarmate-cat"
DOCS = ROOT / "docs"

PALETTE = {
    "outline": "#4A2E22",
    "fur": "#E8A44D",
    "fur_dark": "#B86A32",
    "cream": "#FFF1D6",
    "eye": "#2F5D50",
    "white": "#FFFFFF",
    "blush": "#E88E7A",
    "scarf": "#3E6B63",
    "spark": "#F2C14E",
}
COLORS = {name: ImageColor.getrgb(hex_value) + (255,) for name, hex_value in PALETTE.items()}

SIZE = 32
ORDER = ["greet", "idle", "read", "think", "upload", "celebrate", "encourage", "hint", "explain", "search", "error", "sleep"]
FRAME_COUNTS = {
    "greet": 6,
    "idle": 6,
    "read": 6,
    "think": 6,
    "upload": 6,
    "celebrate": 8,
    "encourage": 6,
    "hint": 6,
    "explain": 6,
    "search": 6,
    "error": 6,
    "sleep": 6,
}
TIMING = {
    "greet": {"fps": 6, "loop": False, "durationMs": 2200},
    "idle": {"fps": 4, "loop": True},
    "read": {"fps": 4, "loop": True},
    "think": {"fps": 5, "loop": True},
    "upload": {"fps": 5, "loop": False, "durationMs": 2500},
    "celebrate": {"fps": 8, "loop": False, "durationMs": 2000},
    "encourage": {"fps": 4, "loop": False, "durationMs": 2200},
    "hint": {"fps": 5, "loop": False, "durationMs": 3200},
    "explain": {"fps": 4, "loop": False, "durationMs": 4200},
    "search": {"fps": 6, "loop": True},
    "error": {"fps": 5, "loop": False, "durationMs": 3000},
    "sleep": {"fps": 2, "loop": True},
}
STARTS = {}
cursor = 0
for key in ORDER:
    STARTS[key] = cursor
    cursor += FRAME_COUNTS[key]
COLUMNS = cursor
SCALE = 2


def pixel_values(image):
    if hasattr(image, "get_flattened_data"):
        return list(image.get_flattened_data())
    return list(image.getdata())


def blank():
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def draw_ellipse(draw, box, fill, outline=None, width=1):
    draw.ellipse(box, fill=COLORS[fill], outline=COLORS[outline] if outline else None, width=width)


def draw_rect(draw, box, fill, outline=None, width=1):
    draw.rectangle(box, fill=COLORS[fill], outline=COLORS[outline] if outline else None, width=width)


def draw_poly(draw, points, fill, outline=None):
    draw.polygon(points, fill=COLORS[fill], outline=COLORS[outline] if outline else None)


def draw_line(draw, points, color, width=1):
    draw.line(points, fill=COLORS[color], width=width, joint="curve")


def draw_tail(draw, variant):
    paths = [
        [(21, 25), (25, 25), (27, 22), (26, 19)],
        [(21, 25), (25, 24), (27, 20), (26, 18)],
        [(21, 25), (25, 25), (27, 22), (27, 19)],
        [(21, 25), (24, 26), (27, 24), (27, 21)],
        [(21, 25), (25, 24), (27, 22), (26, 19)],
        [(21, 25), (24, 25), (27, 23), (27, 20)],
    ]
    points = paths[variant % len(paths)]
    draw_line(draw, points, "outline", 5)
    draw_line(draw, points, "fur_dark", 3)
    draw_rect(draw, (25, 19 + variant % 2, 27, 20 + variant % 2), "fur")


def draw_ears(draw, head_x, head_y, low=0):
    left = [(7 + head_x, 8 + head_y + low), (8 + head_x, 2 + head_y + low), (13 + head_x, 7 + head_y + low)]
    right = [(18 + head_x, 7 + head_y + low), (23 + head_x, 2 + head_y + low), (24 + head_x, 8 + head_y + low)]
    draw_poly(draw, left, "fur", "outline")
    draw_poly(draw, right, "fur", "outline")
    draw_poly(draw, [(9 + head_x, 6 + head_y + low), (10 + head_x, 3 + head_y + low), (11 + head_x, 6 + head_y + low)], "blush")
    draw_poly(draw, [(21 + head_x, 6 + head_y + low), (22 + head_x, 3 + head_y + low), (22 + head_x, 6 + head_y + low)], "blush")


def draw_eyes(draw, expression, head_x, head_y):
    left_x, right_x = 11 + head_x, 19 + head_x
    eye_y = 11 + head_y
    if expression == "blink":
        draw_line(draw, [(left_x, eye_y + 1), (left_x + 2, eye_y + 1)], "outline", 1)
        draw_line(draw, [(right_x, eye_y + 1), (right_x + 2, eye_y + 1)], "outline", 1)
    elif expression == "closed":
        draw_line(draw, [(left_x, eye_y + 1), (left_x + 2, eye_y + 2)], "outline", 1)
        draw_line(draw, [(right_x, eye_y + 2), (right_x + 2, eye_y + 1)], "outline", 1)
    elif expression == "happy":
        draw_line(draw, [(left_x, eye_y + 2), (left_x + 1, eye_y + 1), (left_x + 2, eye_y + 2)], "outline", 1)
        draw_line(draw, [(right_x, eye_y + 2), (right_x + 1, eye_y + 1), (right_x + 2, eye_y + 2)], "outline", 1)
    elif expression == "wide":
        for x in (left_x, right_x):
            draw_rect(draw, (x - 1, eye_y - 1, x + 3, eye_y + 3), "white", "outline")
            draw_rect(draw, (x, eye_y, x + 1, eye_y + 1), "eye")
    elif expression == "look_left":
        for x, shift in ((left_x, 0), (right_x, -1)):
            draw_rect(draw, (x, eye_y, x + 2, eye_y + 2), "white", "outline")
            draw_rect(draw, (x + shift, eye_y + 1, x + shift, eye_y + 1), "eye")
    elif expression == "look_right":
        for x, shift in ((left_x, 1), (right_x, 0)):
            draw_rect(draw, (x, eye_y, x + 2, eye_y + 2), "white", "outline")
            draw_rect(draw, (x + shift, eye_y + 1, x + shift, eye_y + 1), "eye")
    elif expression == "squint":
        draw_line(draw, [(left_x, eye_y + 1), (left_x + 2, eye_y + 1)], "outline", 1)
        draw_rect(draw, (right_x, eye_y, right_x + 2, eye_y + 2), "white", "outline")
        draw_rect(draw, (right_x + 1, eye_y + 1, right_x + 1, eye_y + 1), "eye")
    else:
        for x in (left_x, right_x):
            draw_rect(draw, (x, eye_y, x + 2, eye_y + 2), "white", "outline")
            draw_rect(draw, (x + 1, eye_y + 1, x + 1, eye_y + 1), "eye")


def draw_mouth(draw, expression, head_x, head_y):
    mouth_y = 16 + head_y
    center = 16 + head_x
    if expression == "smile":
        draw_line(draw, [(center - 2, mouth_y), (center - 1, mouth_y + 1), (center + 1, mouth_y + 1), (center + 2, mouth_y)], "outline", 1)
    elif expression == "open":
        draw_ellipse(draw, (center - 1, mouth_y, center + 1, mouth_y + 2), "outline")
    elif expression == "down":
        draw_line(draw, [(center - 2, mouth_y + 1), (center - 1, mouth_y), (center + 1, mouth_y), (center + 2, mouth_y + 1)], "outline", 1)
    elif expression == "sleep":
        draw_line(draw, [(center - 1, mouth_y + 1), (center + 1, mouth_y + 1)], "outline", 1)
    else:
        draw_line(draw, [(center - 1, mouth_y + 1), (center + 1, mouth_y + 1)], "outline", 1)


def draw_book(draw, frame, body_y):
    shift = frame % 3
    draw_rect(draw, (11, 22 + body_y, 20, 27 + body_y), "outline")
    draw_rect(draw, (12, 23 + body_y, 15 + shift, 26 + body_y), "cream")
    draw_rect(draw, (17 - shift, 23 + body_y, 19, 26 + body_y), "cream")
    draw_line(draw, [(16, 23 + body_y), (16, 26 + body_y)], "outline", 1)
    draw_line(draw, [(13, 24 + body_y), (14 + shift, 24 + body_y)], "scarf", 1)
    draw_line(draw, [(17 - shift, 24 + body_y), (18, 24 + body_y)], "scarf", 1)


def draw_document(draw, frame, body_y):
    x = 13 + frame % 2
    draw_rect(draw, (x, 21 + body_y, x + 6, 27 + body_y), "cream", "outline")
    draw_rect(draw, (x + 4, 21 + body_y, x + 6, 23 + body_y), "outline")
    draw_line(draw, [(x + 1, 24 + body_y), (x + 4, 24 + body_y)], "scarf", 1)


def draw_magnifier(draw, frame):
    x = 19 + frame % 2
    draw_ellipse(draw, (x - 3, 10, x + 3, 16), "cream", "outline", 1)
    draw_line(draw, [(x + 3, 16), (x + 6, 20)], "scarf", 2)


def draw_accessory(draw, kind, frame, body_y):
    if kind == "book":
        draw_book(draw, frame, body_y)
    elif kind == "document":
        draw_document(draw, frame, body_y)
    elif kind == "magnifier":
        draw_magnifier(draw, frame)
    elif kind == "spark":
        positions = [(26, 5), (27, 6 + frame % 2), (25, 7), (26, 8)]
        x, y = positions[frame % len(positions)]
        draw_rect(draw, (x, y, x + 1, y + 1), "spark")
    elif kind == "idea":
        positions = [(24, 8), (25, 7), (26, 8), (25, 9), (24, 8), (25, 7)]
        x, y = positions[frame % len(positions)]
        draw_rect(draw, (x, y, x + 1, y + 1), "spark")


def draw_cat(opts):
    image = blank()
    draw = ImageDraw.Draw(image)
    body_y = opts.get("body_y", 0)
    head_x = opts.get("head_x", 0)
    head_y = opts.get("head_y", 0)
    draw_tail(draw, opts.get("tail", 0))
    draw_ellipse(draw, (9, 17 + body_y, 23, 28 + body_y), "fur", "outline")
    draw_ellipse(draw, (12, 20 + body_y, 20, 27 + body_y), "cream")
    draw_line(draw, [(11, 20 + body_y), (12, 22 + body_y)], "fur_dark", 1)
    draw_line(draw, [(21, 20 + body_y), (20, 22 + body_y)], "fur_dark", 1)
    draw_ears(draw, head_x, head_y, opts.get("ear_low", 0))
    draw_ellipse(draw, (6 + head_x, 5 + head_y, 25 + head_x, 20 + head_y), "fur", "outline")
    draw_rect(draw, (12 + head_x, 6 + head_y, 12 + head_x, 8 + head_y), "fur_dark")
    draw_rect(draw, (16 + head_x, 6 + head_y, 16 + head_x, 8 + head_y), "fur_dark")
    draw_rect(draw, (20 + head_x, 6 + head_y, 20 + head_x, 8 + head_y), "fur_dark")
    draw_rect(draw, (8 + head_x, 13 + head_y, 10 + head_x, 14 + head_y), "cream")
    draw_rect(draw, (21 + head_x, 13 + head_y, 23 + head_x, 14 + head_y), "cream")
    draw_rect(draw, (9 + head_x, 14 + head_y, 10 + head_x, 15 + head_y), "blush")
    draw_rect(draw, (21 + head_x, 14 + head_y, 22 + head_x, 15 + head_y), "blush")
    draw_eyes(draw, opts.get("eyes", "open"), head_x, head_y)
    draw_ellipse(draw, (12 + head_x, 14 + head_y, 19 + head_x, 18 + head_y), "cream")
    draw_poly(draw, [(15 + head_x, 14 + head_y), (17 + head_x, 14 + head_y), (16 + head_x, 15 + head_y)], "outline")
    draw_mouth(draw, opts.get("mouth", "smile"), head_x, head_y)
    draw_rect(draw, (10, 18 + body_y, 22, 20 + body_y), "scarf", "outline")
    draw_rect(draw, (20, 19 + body_y, 22, 21 + body_y), "scarf", "outline")
    paw = opts.get("paws", "rest")
    if paw in ("wave", "hint", "point"):
        draw_ellipse(draw, (21, 11 + body_y, 25, 15 + body_y), "cream", "outline")
        draw_rect(draw, (23, 9 + body_y, 24, 12 + body_y), "cream", "outline")
    elif paw == "carry":
        draw_ellipse(draw, (9, 20 + body_y, 13, 24 + body_y), "cream", "outline")
        draw_ellipse(draw, (19, 20 + body_y, 23, 24 + body_y), "cream", "outline")
    else:
        draw_ellipse(draw, (10, 26 + body_y, 14, 29 + body_y), "cream", "outline")
        draw_ellipse(draw, (18, 26 + body_y, 22, 29 + body_y), "cream", "outline")
    draw_accessory(draw, opts.get("accessory"), opts.get("frame", 0), body_y)
    return image


def build_frames():
    frames = {}
    frames["greet"] = [
        {"eyes": "open", "mouth": "smile", "paws": "rest", "tail": 0, "frame": 0},
        {"eyes": "happy", "mouth": "smile", "paws": "carry", "tail": 1, "frame": 1},
        {"eyes": "happy", "mouth": "open", "paws": "wave", "tail": 2, "frame": 2},
        {"eyes": "happy", "mouth": "smile", "paws": "wave", "tail": 3, "frame": 3, "head_x": 1},
        {"eyes": "open", "mouth": "smile", "paws": "wave", "tail": 4, "frame": 4},
        {"eyes": "open", "mouth": "smile", "paws": "rest", "tail": 5, "frame": 5},
    ]
    frames["idle"] = [
        {"eyes": "open", "mouth": "smile", "tail": 0, "frame": 0},
        {"eyes": "blink", "mouth": "smile", "tail": 1, "frame": 1, "body_y": 1},
        {"eyes": "open", "mouth": "smile", "tail": 2, "frame": 2},
        {"eyes": "open", "mouth": "smile", "tail": 3, "frame": 3, "body_y": 1},
        {"eyes": "look_right", "mouth": "smile", "tail": 4, "frame": 4},
        {"eyes": "open", "mouth": "smile", "tail": 5, "frame": 5, "body_y": 1},
    ]
    frames["read"] = [
        {"eyes": "look_left", "mouth": "flat", "paws": "carry", "tail": 0, "accessory": "book", "frame": 0},
        {"eyes": "look_right", "mouth": "flat", "paws": "carry", "tail": 1, "accessory": "book", "frame": 1},
        {"eyes": "blink", "mouth": "flat", "paws": "carry", "tail": 2, "accessory": "book", "frame": 2},
        {"eyes": "look_left", "mouth": "flat", "paws": "carry", "tail": 3, "accessory": "book", "frame": 3, "body_y": 1},
        {"eyes": "look_right", "mouth": "flat", "paws": "carry", "tail": 4, "accessory": "book", "frame": 4},
        {"eyes": "open", "mouth": "smile", "paws": "carry", "tail": 5, "accessory": "book", "frame": 5},
    ]
    frames["think"] = [
        {"eyes": "squint", "mouth": "flat", "paws": "point", "tail": 0, "head_x": 1, "accessory": "idea", "frame": 0},
        {"eyes": "look_left", "mouth": "flat", "paws": "point", "tail": 1, "head_x": 1, "accessory": "idea", "frame": 1},
        {"eyes": "blink", "mouth": "flat", "paws": "point", "tail": 2, "head_x": 1, "accessory": "idea", "frame": 2},
        {"eyes": "squint", "mouth": "flat", "paws": "point", "tail": 3, "head_x": 0, "accessory": "idea", "frame": 3},
        {"eyes": "look_right", "mouth": "flat", "paws": "point", "tail": 4, "head_x": 0, "accessory": "idea", "frame": 4},
        {"eyes": "open", "mouth": "smile", "paws": "rest", "tail": 5, "head_x": 0, "frame": 5},
    ]
    frames["upload"] = [
        {"eyes": "open", "mouth": "flat", "paws": "carry", "tail": 0, "accessory": "document", "frame": 0},
        {"eyes": "look_left", "mouth": "flat", "paws": "carry", "tail": 1, "accessory": "document", "frame": 1},
        {"eyes": "look_right", "mouth": "flat", "paws": "carry", "tail": 2, "accessory": "document", "frame": 2, "body_y": 1},
        {"eyes": "blink", "mouth": "flat", "paws": "carry", "tail": 3, "accessory": "document", "frame": 3},
        {"eyes": "look_left", "mouth": "open", "paws": "carry", "tail": 4, "accessory": "document", "frame": 4},
        {"eyes": "open", "mouth": "smile", "paws": "rest", "tail": 5, "frame": 5},
    ]
    frames["celebrate"] = [
        {"eyes": "open", "mouth": "smile", "tail": 0, "body_y": 1, "frame": 0},
        {"eyes": "happy", "mouth": "open", "tail": 1, "body_y": -2, "accessory": "spark", "frame": 1},
        {"eyes": "happy", "mouth": "open", "tail": 2, "body_y": -4, "paws": "wave", "accessory": "spark", "frame": 2},
        {"eyes": "happy", "mouth": "open", "tail": 3, "body_y": -2, "paws": "wave", "accessory": "spark", "frame": 3},
        {"eyes": "open", "mouth": "smile", "tail": 4, "body_y": 1, "accessory": "spark", "frame": 4},
        {"eyes": "happy", "mouth": "smile", "tail": 5, "body_y": 0, "frame": 5},
        {"eyes": "blink", "mouth": "smile", "tail": 5, "body_y": 1, "frame": 6},
        {"eyes": "open", "mouth": "smile", "tail": 1, "body_y": 0, "frame": 7},
    ]
    frames["encourage"] = [
        {"eyes": "open", "mouth": "smile", "paws": "rest", "tail": 0, "frame": 0},
        {"eyes": "happy", "mouth": "smile", "paws": "carry", "tail": 1, "frame": 1, "body_y": 1},
        {"eyes": "happy", "mouth": "smile", "paws": "point", "tail": 2, "frame": 2},
        {"eyes": "blink", "mouth": "smile", "paws": "point", "tail": 3, "frame": 3, "head_y": 1},
        {"eyes": "happy", "mouth": "smile", "paws": "carry", "tail": 4, "frame": 4},
        {"eyes": "open", "mouth": "smile", "paws": "rest", "tail": 5, "frame": 5},
    ]
    frames["hint"] = [
        {"eyes": "open", "mouth": "smile", "paws": "rest", "tail": 0, "frame": 0},
        {"eyes": "squint", "mouth": "smile", "paws": "point", "tail": 1, "accessory": "idea", "frame": 1},
        {"eyes": "squint", "mouth": "smile", "paws": "wave", "tail": 2, "accessory": "idea", "frame": 2},
        {"eyes": "look_left", "mouth": "smile", "paws": "wave", "tail": 3, "accessory": "idea", "frame": 3},
        {"eyes": "squint", "mouth": "smile", "paws": "point", "tail": 4, "accessory": "idea", "frame": 4},
        {"eyes": "open", "mouth": "smile", "paws": "rest", "tail": 5, "frame": 5},
    ]
    frames["explain"] = [
        {"eyes": "open", "mouth": "open", "paws": "carry", "tail": 0, "accessory": "book", "frame": 0},
        {"eyes": "look_right", "mouth": "open", "paws": "point", "tail": 1, "accessory": "book", "frame": 1},
        {"eyes": "look_left", "mouth": "flat", "paws": "point", "tail": 2, "accessory": "book", "frame": 2},
        {"eyes": "blink", "mouth": "open", "paws": "point", "tail": 3, "accessory": "book", "frame": 3},
        {"eyes": "open", "mouth": "open", "paws": "carry", "tail": 4, "accessory": "book", "frame": 4},
        {"eyes": "open", "mouth": "smile", "paws": "rest", "tail": 5, "frame": 5},
    ]
    frames["search"] = [
        {"eyes": "wide", "mouth": "flat", "tail": 0, "accessory": "magnifier", "frame": 0},
        {"eyes": "look_left", "mouth": "flat", "tail": 1, "accessory": "magnifier", "frame": 1, "head_x": -1},
        {"eyes": "look_right", "mouth": "flat", "tail": 2, "accessory": "magnifier", "frame": 2, "head_x": 1},
        {"eyes": "blink", "mouth": "flat", "tail": 3, "accessory": "magnifier", "frame": 3},
        {"eyes": "wide", "mouth": "open", "tail": 4, "accessory": "magnifier", "frame": 4, "body_y": 1},
        {"eyes": "open", "mouth": "smile", "tail": 5, "frame": 5},
    ]
    frames["error"] = [
        {"eyes": "wide", "mouth": "down", "tail": 0, "ear_low": 1, "frame": 0},
        {"eyes": "look_left", "mouth": "down", "tail": 1, "ear_low": 1, "frame": 1, "head_x": -1},
        {"eyes": "blink", "mouth": "down", "tail": 2, "ear_low": 1, "frame": 2},
        {"eyes": "squint", "mouth": "flat", "tail": 3, "ear_low": 1, "frame": 3},
        {"eyes": "open", "mouth": "flat", "tail": 4, "frame": 4},
        {"eyes": "open", "mouth": "smile", "tail": 5, "frame": 5},
    ]
    frames["sleep"] = [
        {"eyes": "closed", "mouth": "sleep", "tail": 0, "body_y": 1, "frame": 0},
        {"eyes": "closed", "mouth": "sleep", "tail": 1, "body_y": 1, "frame": 1, "accessory": "spark"},
        {"eyes": "closed", "mouth": "sleep", "tail": 2, "body_y": 1, "frame": 2},
        {"eyes": "closed", "mouth": "sleep", "tail": 3, "body_y": 1, "frame": 3},
        {"eyes": "closed", "mouth": "sleep", "tail": 4, "body_y": 1, "frame": 4, "accessory": "spark"},
        {"eyes": "closed", "mouth": "sleep", "tail": 5, "body_y": 1, "frame": 5},
    ]
    return frames


def build_manifest():
    animations = {}
    for key in ORDER:
        entry = {
            "frames": FRAME_COUNTS[key],
            "fps": TIMING[key]["fps"],
            "loop": TIMING[key]["loop"],
            "startFrame": STARTS[key],
            "row": 0,
        }
        if "durationMs" in TIMING[key]:
            entry["durationMs"] = TIMING[key]["durationMs"]
        animations[key] = entry
    return {
        "schema": "sarmate-pet-sprites/1",
        "id": "sarmate-cat",
        "displayName": "Mate",
        "sheet": "/pets/sarmate-cat/animation-sheet.png",
        "frameWidth": SIZE,
        "frameHeight": SIZE,
        "scale": SCALE,
        "columns": COLUMNS,
        "rows": 1,
        "animations": animations,
    }


def extract_frames(sheet):
    frames = {}
    for key in ORDER:
        start = STARTS[key]
        frames[key] = [sheet.crop((i * SIZE, 0, (i + 1) * SIZE, SIZE)) for i in range(start, start + FRAME_COUNTS[key])]
    return frames


def validate(sheet, manifest):
    problems = []
    if sheet.size != (COLUMNS * SIZE, SIZE):
        problems.append(f"sheet size {sheet.size} != {(COLUMNS * SIZE, SIZE)}")
    if manifest.get("columns") != COLUMNS or manifest.get("rows") != 1:
        problems.append("manifest geometry does not match generated atlas")
    allowed = {value for value in COLORS.values()}
    for key in ORDER:
        entry = manifest["animations"][key]
        if entry["frames"] != FRAME_COUNTS[key] or entry["startFrame"] != STARTS[key]:
            problems.append(f"{key} frame range is wrong")
        seen = set()
        for index, frame in enumerate(extract_frames(sheet)[key]):
            alpha = set(pixel_values(frame.getchannel("A")))
            if alpha - {0, 255}:
                problems.append(f"{key}[{index}] has semi-transparent pixels")
            if 0 not in alpha or 255 not in alpha:
                problems.append(f"{key}[{index}] is empty or not transparent")
            bbox = frame.getbbox()
            if not bbox or bbox[0] < 1 or bbox[1] < 1 or bbox[2] > SIZE - 1 or bbox[3] > SIZE - 1:
                problems.append(f"{key}[{index}] clips or lacks margin: {bbox}")
            colors = {pixel for pixel in pixel_values(frame) if pixel[3] == 255}
            if colors - allowed:
                problems.append(f"{key}[{index}] uses colors outside the palette")
            fingerprint = frame.tobytes()
            if fingerprint in seen:
                problems.append(f"{key}[{index}] duplicates an earlier frame")
            seen.add(fingerprint)
    return problems


def contact_sheet(sheet):
    cell = SIZE * 4
    label_height = 18
    columns = 8
    rows = math.ceil(COLUMNS / columns)
    output = Image.new("RGBA", (columns * cell, rows * (cell + label_height)), (247, 249, 247, 255))
    draw = ImageDraw.Draw(output)
    index = 0
    for key in ORDER:
        for frame_index, frame in enumerate(extract_frames(sheet)[key]):
            x = (index % columns) * cell
            y = (index // columns) * (cell + label_height)
            enlarged = frame.resize((cell, cell), Image.Resampling.NEAREST)
            output.alpha_composite(enlarged, (x, y + label_height))
            draw.rectangle((x, y + label_height, x + cell - 1, y + label_height + cell - 1), outline=(223, 230, 226, 255))
            draw.text((x + 3, y + 3), f"{key} {frame_index + 1}", fill=(74, 46, 34, 255))
            index += 1
    return output


def generate():
    frames = build_frames()
    sheet = Image.new("RGBA", (COLUMNS * SIZE, SIZE), (0, 0, 0, 0))
    index = 0
    for key in ORDER:
        for frame_index, options in enumerate(frames[key]):
            options = dict(options)
            options["frame"] = frame_index
            sheet.alpha_composite(draw_cat(options), (index * SIZE, 0))
            index += 1
    manifest = build_manifest()
    problems = validate(sheet, manifest)
    if problems:
        raise SystemExit("\n".join(problems))
    ASSETS.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(parents=True, exist_ok=True)
    sheet.save(ASSETS / "animation-sheet.png", optimize=True)
    (ASSETS / "animation-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    contact_sheet(sheet).save(ASSETS / "contact-sheet.png", optimize=True)
    reference = draw_cat(frames["idle"][0]).resize((SIZE * 8, SIZE * 8), Image.Resampling.NEAREST)
    reference.save(DOCS / "mate-reference.png", optimize=True)
    print(f"Generated {COLUMNS} frames at {SIZE}x{SIZE} ({sheet.size[0]}x{sheet.size[1]} px)")


def check():
    sheet = Image.open(ASSETS / "animation-sheet.png").convert("RGBA")
    manifest = json.loads((ASSETS / "animation-manifest.json").read_text(encoding="utf-8"))
    problems = validate(sheet, manifest)
    if problems:
        raise SystemExit("\n".join(problems))
    print(f"Validated {COLUMNS} frames at {SIZE}x{SIZE} ({sheet.size[0]}x{sheet.size[1]} px)")


if __name__ == "__main__":
    if "--check" in sys.argv:
        check()
    else:
        generate()
