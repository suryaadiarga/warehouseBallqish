from pathlib import Path
from PIL import Image

SOURCE_DIR = Path(r"C:\Users\lenovo\.codex\generated_images\019ef389-c3b7-7df0-8398-45abe1f9d7f4")
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "backendBallqish" / "public" / "product-images"

SHEETS = [
    (
        "ig_0ffb269bb06857d4016a3a558b7ae48191b651676e31e993d7.png",
        [
            "front-brake-pad", "rear-brake-shoe", "brake-master-cylinder", "brake-caliper",
            "brake-disc-rotor", "brake-hose", "brake-lever", "master-cylinder-seal-kit",
            "piston-kit", "piston-rings", "cylinder-block", "engine-valves",
            "timing-chain", "chain-sprocket-set", "crankshaft-bearing", "fuel-injector",
        ],
    ),
    (
        "ig_0ffb269bb06857d4016a3a56020798819191160289c853b694.png",
        [
            "throttle-body", "air-filter", "throttle-cable", "clutch-cable",
            "rear-shock-absorber", "engine-gasket-set", "iridium-spark-plug", "motorcycle-battery",
            "led-headlight", "turn-signal-lamp", "motorcycle-horn", "starter-relay",
            "blade-fuse", "ignition-coil", "voltage-regulator", "starter-motor",
        ],
    ),
    (
        "ig_039747784bd77f53016a3a579662888191b2c9b5121f12812a.png",
        [
            "front-motorcycle-tire", "rear-motorcycle-tire", "inner-tube", "racing-wheel",
            "tubeless-valve", "wheel-bearing", "wheel-spokes", "engine-oil",
            "gear-oil", "brake-fluid", "radiator-coolant", "injector-cleaner",
            "chain-lubricant", "bearing-grease", "narrow-front-tire", "wide-rear-tire",
        ],
    ),
    (
        "ig_058932111e6ccf8a016a3a58d46104819a9eeb8f64e6b505e4.png",
        [
            "side-mirror", "handgrip", "motorcycle-top-box", "motorcycle-cover",
            "phone-holder", "footpeg", "windscreen-visor", "motorcycle-seat",
            "combination-wrench-set", "socket-wrench-set", "t-handle-wrench-set", "adjustable-wrench",
            "combination-pliers", "screwdriver-set", "hydraulic-floor-jack", "digital-multimeter",
        ],
    ),
    (
        "ig_03e1e92ae112d2f4016a3a5bdc1c688191a15ef6e8c02d118f.png",
        [
            "grease-gun", "mini-air-compressor", "compact-socket-set", "heavy-duty-socket-set",
            "small-bottle-jack", "heavy-duty-floor-jack", "compact-multimeter", "professional-multimeter",
            "ceramic-brake-pad", "organic-brake-pad", "black-brake-caliper", "gold-brake-caliper",
            "solid-brake-disc", "ventilated-brake-disc", "chrome-brake-lever", "sport-brake-lever",
        ],
    ),
    (
        "ig_03e1e92ae112d2f4016a3a5c4b7d0c8191a9adb6c4d4c75edb.png",
        [
            "scooter-piston-kit", "performance-piston-kit", "standard-piston-rings", "performance-piston-rings",
            "air-cooled-cylinder-block", "liquid-cooled-cylinder-block", "valve-pair", "valve-spring-set",
            "standard-timing-chain", "heavy-duty-timing-chain", "small-chain-sprocket", "sport-chain-sprocket",
            "sealed-crankshaft-bearing", "roller-crankshaft-bearing", "single-port-injector", "multi-hole-injector",
        ],
    ),
    (
        "ig_03e1e92ae112d2f4016a3a5cdc22c08191b436b4bce4511ae2.png",
        [
            "scooter-throttle-body", "sport-throttle-body", "foam-air-filter", "paper-air-filter",
            "standard-shock-absorber", "reservoir-shock-absorber", "copper-spark-plug", "premium-iridium-spark-plug",
            "maintenance-free-battery", "conventional-battery", "compact-led-headlight", "projector-led-headlight",
            "black-racing-wheel", "silver-racing-wheel", "one-liter-engine-oil", "small-engine-oil",
        ],
    ),
]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for source_name, keys in SHEETS:
        image = Image.open(SOURCE_DIR / source_name).convert("RGB")
        width, height = image.size

        for index, key in enumerate(keys):
            row, column = divmod(index, 4)
            left = round(column * width / 4)
            top = round(row * height / 4)
            right = round((column + 1) * width / 4)
            bottom = round((row + 1) * height / 4)
            cell = image.crop((left, top, right, bottom)).resize((480, 480), Image.Resampling.LANCZOS)
            cell.save(OUTPUT_DIR / f"{key}.webp", "WEBP", quality=88, method=6)

    default_source = Image.open(
        SOURCE_DIR / "ig_0e4da2e9205a059b016a3a550c9a3c81919c5feb94889b3222.png"
    ).convert("RGB")
    default_source.resize((480, 480), Image.Resampling.LANCZOS).save(
        OUTPUT_DIR / "default-product.webp", "WEBP", quality=88, method=6
    )

    print(f"Generated {len(list(OUTPUT_DIR.glob('*.webp')))} product images in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
