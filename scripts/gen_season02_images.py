import requests
import json
import base64
import os
import time

API_KEY = os.environ.get("GOOGLE_API_KEY", "")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "attached_assets", "season02")
MODEL = "imagen-4.0-fast-generate-001"

os.makedirs(OUT_DIR, exist_ok=True)

def generate_image(prompt, filename, aspect_ratio="3:4"):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:predict?key={API_KEY}"
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": aspect_ratio,
            "safetyFilterLevel": "block_only_high"
        }
    }
    r = requests.post(url, json=payload, timeout=120)
    if r.status_code != 200:
        print(f"ERROR {filename}: {r.status_code} {r.text[:300]}")
        return False
    data = r.json()
    try:
        img_b64 = data["predictions"][0]["bytesBase64Encoded"]
        out_path = os.path.join(OUT_DIR, filename)
        with open(out_path, 'wb') as f:
            f.write(base64.b64decode(img_b64))
        print(f"SAVED: {filename} -> {out_path}")
        return True
    except Exception as e:
        print(f"PARSE ERROR {filename}: {e} | response: {str(data)[:300]}")
        return False

images = [
    (
        "01_processor_coat_flat.png",
        "High-end fashion product photography flat lay. Long charcoal wool-nylon bonded technical coat, 115cm length. Asymmetric EVA foam padding inserts at right lateral thorax and off-center left posterior shoulder. Matte gunmetal D-ring hardware with nylon webbing closures down center front, no buttons. Interior construction exposed, raw seam allowances visible, no lining. Flat-felled seams. Garment laid flat on jet black background. Cold directional overhead studio lighting. Architectural, avant-garde, Margiela-esque precision. No model or person present. Season 02 technical fashion editorial."
    ),
    (
        "02_token_jacket_flat.png",
        "High-end fashion product photography flat lay. Bone white heat-pleated technical nylon jacket. Entire surface covered in permanent micro-pleats at 3mm herringbone diagonal. Single D-ring hardware at collar with nylon webbing pull. Faint tonal cut-guide stripes woven into fabric. Garment laid flat on jet black background. Cold overhead studio lighting. Issey Miyake Pleats Please aesthetic. Minimal, architectural, reductive. No model or person present. Season 02 avant-garde fashion."
    ),
    (
        "03_protocol_jacket_flat.png",
        "High-end fashion product photography flat lay. Matte black bonded industrial mesh jacket. Clear transparent TPU back panel showing interior seam construction through it. Single panel of raw unbleached linen at left chest with unhemmed raw edges. Nylon webbing collar 25mm wide. Exposed industrial YKK zipper at center front. Garment laid flat on jet black background. Cold architectural studio lighting. Helmut Lang industrial reduction aesthetic. Technical, precise, material-honest. No model or person present. Season 02 fashion editorial."
    ),
    (
        "04_contract_shirt_flat.png",
        "High-end fashion product photography flat lay. Matte black bonded neoprene boxy cropped shirt. Five matte steel press-studs down center front. Secondary shoulder panel on right held under TPU overlay with recessed press-studs at perimeter, sealed. Industrial open-weave mesh rectangle chest panel retained by four matte D-ring hardware at corners. Back yoke seam fold held by visible basting stitch. Garment laid flat on jet black background. Cold architectural studio lighting. Hussein Chalayan precision minimalism. No model or person present. Season 02 fashion editorial."
    ),
    (
        "05_diagonal_flat.png",
        "High-end fashion product photography flat lay. Raw ecru bias-cut shirt-jacket in technical poly-linen twill. All seams cut at 45 degrees to grain, diagonal seam lines visible. Natural texture variation from linen threads. Slightly uneven raw hem following bias drape physics. Five matte brass hooks-and-eyes at center front. Single patch chest pocket on same diagonal. Bias-cut band collar. Garment laid flat on jet black background. Cold directional overhead lighting. Vionnet mathematical precision. Undyed raw ecru. No model or person present. Season 02 fashion editorial."
    ),
    (
        "01_processor_coat_lookbook.png",
        "Moody fashion editorial photograph. Dark cold industrial interior, concrete walls, fluorescent underlit corridor. Lone figure wearing long charcoal bonded technical coat, shot from behind, no face visible. The coat silhouette subtly wrong: padding mass at lateral thorax and posterior shoulder offset, proposing a non-human body geometry. Anonymous figure. Cold grey-green industrial light. High contrast. Atmospheric, architectural, Margiela-esque anonymity. Technical fashion photography. Season 02."
    ),
    (
        "02_token_jacket_lookbook.png",
        "Moody fashion editorial photograph. Stark white minimalist brutalist interior space. Figure wearing bone white heat-pleated technical nylon jacket. The micro-pleat texture catches light with herringbone diagonal pattern across entire jacket. Cold overexposed white light from above. Issey Miyake aesthetic, material intelligence, pleats as architecture. Architectural, minimal, cold. Season 02 fashion editorial."
    ),
    (
        "03_protocol_jacket_lookbook.png",
        "Moody fashion editorial photograph. Dark industrial warehouse, raw concrete walls. Figure wearing matte black bonded mesh jacket with transparent TPU back panel. Shot from behind showing the transparent panel revealing interior construction through it. Raw linen chest panel contrasts against technical black. Cold harsh side-lighting. Helmut Lang industrial reduction. High contrast shadow. Dark, architectural, cold. Season 02 fashion editorial."
    ),
    (
        "04_contract_shirt_lookbook.png",
        "Moody fashion editorial photograph. Dim server room environment, LED strip lights, steel rack silhouettes in background. Figure wearing matte black bonded neoprene cropped shirt. Sealed shoulder panel and mesh chest panel with D-ring hardware visible. Figure standing still. Cold blue-white light. Hussein Chalayan precision, garment as interface. Cold, precise, architectural. Season 02 fashion editorial."
    ),
    (
        "05_diagonal_lookbook.png",
        "Moody fashion editorial photograph. Empty urban concrete space at dusk. Figure wearing raw ecru bias-cut shirt-jacket in technical twill. Bias drape visible as fabric moves, diagonal seam lines catch light, hem uneven by physics. Cool grey natural light, long shadows. Vionnet diagonal mathematics as fabric behavior. Minimal, architectural, material-honest. Season 02 fashion editorial."
    ),
]

for name, prompt in images:
    print(f"\nGenerating: {name}...")
    ok = generate_image(prompt, name)
    if not ok:
        print(f"  FAILED: {name}")
    time.sleep(2)

print("\nAll done.")
