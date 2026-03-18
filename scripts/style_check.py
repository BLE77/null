"""
Off-Human Style Checker — FashionCLIP quality gate for generated images.

Scores an image against fashion concepts and returns whether it passes
the Off-Human aesthetic threshold.

Usage:
    cd autoresearch-win-rtx
    uv run ../Off-Human/scripts/style_check.py path/to/image.png
    uv run ../Off-Human/scripts/style_check.py path/to/folder/  # check all images
"""
import json
import sys
from pathlib import Path

import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

# Off-Human target concepts — what we WANT to score high
TARGET_CONCEPTS = [
    "deconstructed avant-garde garment",
    "Maison Margiela artisanal fashion",
    "conceptual fashion piece",
    "high fashion editorial piece",
]

# What we want to score LOW (too generic)
GENERIC_CONCEPTS = [
    "basic streetwear graphic tee",
    "plain casual clothing",
    "fast fashion mass produced",
]

# All concepts for scoring
ALL_CONCEPTS = TARGET_CONCEPTS + GENERIC_CONCEPTS

# Threshold: target score must be above this to pass
TARGET_THRESHOLD = 0.25  # at least 25% combined target score
# Generic score must be below this
GENERIC_CEILING = 0.50  # if more than 50% generic, fail


def load_model():
    model = CLIPModel.from_pretrained("patrickjohncyh/fashion-clip")
    processor = CLIPProcessor.from_pretrained("patrickjohncyh/fashion-clip")
    return model, processor


def check_image(image_path: Path, model, processor) -> dict:
    image = Image.open(image_path).convert("RGB")
    inputs = processor(text=ALL_CONCEPTS, images=image, return_tensors="pt", padding=True)

    with torch.no_grad():
        outputs = model(**inputs)

    probs = outputs.logits_per_image.softmax(dim=1)[0]

    scores = {concept: float(probs[i]) for i, concept in enumerate(ALL_CONCEPTS)}
    target_score = sum(scores[c] for c in TARGET_CONCEPTS)
    generic_score = sum(scores[c] for c in GENERIC_CONCEPTS)

    passed = target_score >= TARGET_THRESHOLD and generic_score <= GENERIC_CEILING

    top_concept = max(scores, key=scores.get)

    return {
        "file": image_path.name,
        "passed": passed,
        "target_score": round(target_score, 3),
        "generic_score": round(generic_score, 3),
        "top_concept": top_concept,
        "top_score": round(scores[top_concept], 3),
        "verdict": "PASS" if passed else "TOO GENERIC — regenerate with more conceptual/avant-garde prompt",
        "scores": {k: round(v, 3) for k, v in sorted(scores.items(), key=lambda x: -x[1])},
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: style_check.py <image_or_folder>")
        sys.exit(1)

    target = Path(sys.argv[1])
    if target.is_dir():
        images = sorted(target.glob("*.png")) + sorted(target.glob("*.jpg"))
    else:
        images = [target]

    if not images:
        print("No images found")
        sys.exit(1)

    print("Loading FashionCLIP...")
    model, processor = load_model()
    print(f"Checking {len(images)} image(s)...\n")

    results = []
    for img in images:
        result = check_image(img, model, processor)
        results.append(result)
        status = "PASS" if result["passed"] else "FAIL"
        print(f"  [{status}] {result['file']:>40s}  target={result['target_score']:.0%}  generic={result['generic_score']:.0%}  top={result['top_concept']}")

    passed = sum(1 for r in results if r["passed"])
    print(f"\n{passed}/{len(results)} passed style check")

    # Save detailed results
    out = target if target.is_dir() else target.parent
    report_path = out / "style_check_report.json"
    with open(report_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Detailed report: {report_path}")


if __name__ == "__main__":
    main()
