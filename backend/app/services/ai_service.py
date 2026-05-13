"""
AI Service - Real Fashion Classification using Marqo FashionSigLIP
Zero-shot garment classification with no training required.
"""

import io
import logging
from typing import List, Dict, Optional
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

# ============================================================
# Lazy-loaded singleton — model loads once on first request
# ============================================================
_model = None
_processor = None
_model_name = "Marqo/marqo-fashionSigLIP"


def _load_model():
    """Load FashionSigLIP model (lazy singleton)."""
    global _model, _processor
    if _model is not None:
        return

    import torch
    from transformers import AutoModel, AutoProcessor

    logger.info(f"Loading AI model: {_model_name} ...")
    _processor = AutoProcessor.from_pretrained(_model_name, trust_remote_code=True)
    _model = AutoModel.from_pretrained(
        _model_name,
        trust_remote_code=True,
        device_map=None,           # Don't use accelerate/meta tensors
        torch_dtype=torch.float32, # Force full precision on CPU
    ).to("cpu")
    _model.eval()
    logger.info("AI model loaded successfully!")


# ============================================================
# Label sets for zero-shot classification
# ============================================================
CATEGORY_LABELS = [
    "a photo of a t-shirt",
    "a photo of a blouse",
    "a photo of a shirt",
    "a photo of a sweater",
    "a photo of a hoodie",
    "a photo of a jacket",
    "a photo of a coat",
    "a photo of jeans",
    "a photo of trousers",
    "a photo of shorts",
    "a photo of a skirt",
    "a photo of a dress",
    "a photo of sneakers",
    "a photo of boots",
    "a photo of sandals",
    "a photo of heels",
    "a photo of a hat",
    "a photo of a bag",
    "a photo of a scarf",
    "a photo of sunglasses",
    "a photo of a watch",
    "a photo of a belt",
]

CATEGORY_MAP = {
    "a photo of a t-shirt": "Tops",
    "a photo of a blouse": "Tops",
    "a photo of a shirt": "Tops",
    "a photo of a sweater": "Tops",
    "a photo of a hoodie": "Tops",
    "a photo of a jacket": "Outerwear",
    "a photo of a coat": "Outerwear",
    "a photo of jeans": "Bottoms",
    "a photo of trousers": "Bottoms",
    "a photo of shorts": "Bottoms",
    "a photo of a skirt": "Bottoms",
    "a photo of a dress": "Dress",
    "a photo of sneakers": "Shoes",
    "a photo of boots": "Shoes",
    "a photo of sandals": "Shoes",
    "a photo of heels": "Shoes",
    "a photo of a hat": "Accessories",
    "a photo of a bag": "Accessories",
    "a photo of a scarf": "Accessories",
    "a photo of sunglasses": "Accessories",
    "a photo of a watch": "Accessories",
    "a photo of a belt": "Accessories",
}

SUBCATEGORY_MAP = {
    "a photo of a t-shirt": "T-Shirt",
    "a photo of a blouse": "Blouse",
    "a photo of a shirt": "Shirt",
    "a photo of a sweater": "Sweater",
    "a photo of a hoodie": "Hoodie",
    "a photo of a jacket": "Jacket",
    "a photo of a coat": "Coat",
    "a photo of jeans": "Jeans",
    "a photo of trousers": "Trousers",
    "a photo of shorts": "Shorts",
    "a photo of a skirt": "Skirt",
    "a photo of a dress": "Dress",
    "a photo of sneakers": "Sneakers",
    "a photo of boots": "Boots",
    "a photo of sandals": "Sandals",
    "a photo of heels": "Heels",
    "a photo of a hat": "Hat",
    "a photo of a bag": "Bag",
    "a photo of a scarf": "Scarf",
    "a photo of sunglasses": "Sunglasses",
    "a photo of a watch": "Watch",
    "a photo of a belt": "Belt",
}

STYLE_LABELS = [
    "casual clothing", "formal clothing", "athletic sportswear",
    "bohemian clothing", "minimalist clothing", "streetwear",
    "vintage clothing", "business clothing",
]

PATTERN_LABELS = [
    "solid color fabric", "striped pattern", "floral pattern",
    "plaid pattern", "polka dot pattern", "geometric pattern",
    "graphic print", "camouflage pattern", "animal print",
]

SLEEVE_LABELS = [
    "short sleeves", "long sleeves", "sleeveless", "three-quarter sleeves",
]

FABRIC_LABELS = [
    "cotton fabric", "denim fabric", "wool fabric", "silk fabric",
    "leather material", "polyester fabric", "linen fabric",
    "velvet fabric", "knit fabric", "lace fabric",
]

# ============================================================
# Named color mapping (LAB color space)
# ============================================================
NAMED_COLORS = {
    "Black": (0, 0, 0),
    "White": (255, 255, 255),
    "Gray": (128, 128, 128),
    "Red": (220, 50, 50),
    "Blue": (50, 80, 200),
    "Navy": (30, 30, 100),
    "Green": (50, 160, 50),
    "Yellow": (240, 220, 50),
    "Orange": (240, 150, 30),
    "Pink": (240, 150, 180),
    "Purple": (130, 50, 180),
    "Brown": (130, 80, 40),
    "Beige": (210, 190, 160),
    "Burgundy": (130, 30, 50),
    "Teal": (50, 150, 150),
    "Olive": (110, 120, 50),
    "Coral": (240, 120, 100),
    "Lavender": (180, 160, 220),
}


class AIService:
    """Real AI classification using Marqo FashionSigLIP."""

    def _ensure_model_loaded(self):
        _load_model()

    def _zero_shot_classify(self, image: Image.Image, labels: List[str], top_k: int = 3) -> List[Dict]:
        """Run zero-shot classification on an image with given labels."""
        import torch

        self._ensure_model_loaded()

        processed = _processor(
            text=labels,
            images=[image],
            padding="max_length",
            return_tensors="pt",
        )

        with torch.no_grad():
            image_features = _model.get_image_features(
                processed["pixel_values"], normalize=True
            )
            text_features = _model.get_text_features(
                processed["input_ids"], normalize=True
            )

        similarities = (100.0 * image_features @ text_features.T).softmax(dim=-1)
        probs = similarities[0].cpu().numpy()

        # Sort by probability descending
        sorted_indices = np.argsort(probs)[::-1][:top_k]

        results = []
        for idx in sorted_indices:
            results.append({
                "label": labels[idx],
                "confidence": round(float(probs[idx]), 4),
            })
        return results

    def classify_image(self, image_data: bytes) -> dict:
        """
        Full AI classification pipeline:
        - Category (Tops, Bottoms, etc.)
        - Subcategory (T-Shirt, Jeans, etc.)
        - Color (via OpenCV KMeans)
        - Style, Pattern, Sleeve, Fabric (via zero-shot)
        """
        try:
            image = Image.open(io.BytesIO(image_data)).convert("RGB")

            # 1. Category classification
            category_results = self._zero_shot_classify(image, CATEGORY_LABELS, top_k=3)

            top_label = category_results[0]["label"]
            main_category = CATEGORY_MAP.get(top_label, "Tops")
            subcategory = SUBCATEGORY_MAP.get(top_label, "Unknown")

            top_predictions = []
            for r in category_results:
                top_predictions.append({
                    "category": CATEGORY_MAP.get(r["label"], "Other"),
                    "subcategory": SUBCATEGORY_MAP.get(r["label"], "Unknown"),
                    "confidence": r["confidence"],
                })

            # 2. Color detection (OpenCV KMeans)
            dominant_color = self.detect_color(image_data)

            # 3. Attribute detection (zero-shot)
            attributes = self.detect_attributes(image)

            return {
                "top_predictions": top_predictions,
                "category": main_category,
                "subcategory": subcategory,
                "dominant_color": dominant_color,
                "confidence": category_results[0]["confidence"],
                "attributes": attributes,
            }

        except Exception as e:
            logger.error(f"AI classification failed: {e}")
            # Graceful fallback
            return {
                "top_predictions": [{"category": "Tops", "subcategory": "Unknown", "confidence": 0.0}],
                "category": "Tops",
                "subcategory": "Unknown",
                "dominant_color": "Unknown",
                "confidence": 0.0,
                "attributes": {},
            }

    def detect_color(self, image_data: bytes) -> str:
        """Detect dominant color using OpenCV KMeans in LAB color space."""
        try:
            import cv2
            from sklearn.cluster import KMeans

            # Decode image
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return "Unknown"

            # Resize for speed
            img = cv2.resize(img, (100, 100))
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # Center crop to focus on garment (middle 60%)
            h, w = img_rgb.shape[:2]
            crop_y, crop_x = int(h * 0.2), int(w * 0.2)
            cropped = img_rgb[crop_y:h - crop_y, crop_x:w - crop_x]

            pixels = cropped.reshape(-1, 3).astype(np.float32)

            # KMeans with 5 clusters
            kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
            kmeans.fit(pixels)

            # Find dominant cluster (largest)
            labels, counts = np.unique(kmeans.labels_, return_counts=True)
            dominant_idx = labels[np.argmax(counts)]
            dominant_rgb = kmeans.cluster_centers_[dominant_idx].astype(int)

            # Match to named color (nearest Euclidean distance)
            min_dist = float("inf")
            matched_color = "Unknown"
            for name, rgb in NAMED_COLORS.items():
                dist = np.sqrt(np.sum((dominant_rgb - np.array(rgb)) ** 2))
                if dist < min_dist:
                    min_dist = dist
                    matched_color = name

            return matched_color

        except Exception as e:
            logger.error(f"Color detection failed: {e}")
            return "Unknown"

    def detect_attributes(self, image: Image.Image) -> dict:
        """Detect style, pattern, sleeve, and fabric via zero-shot."""
        try:
            attributes = {}

            # Style
            style_results = self._zero_shot_classify(image, STYLE_LABELS, top_k=1)
            if style_results:
                raw = style_results[0]["label"]
                attributes["style"] = raw.replace(" clothing", "").replace(" sportswear", "").strip().capitalize()

            # Pattern
            pattern_results = self._zero_shot_classify(image, PATTERN_LABELS, top_k=1)
            if pattern_results:
                raw = pattern_results[0]["label"]
                attributes["pattern"] = raw.replace(" pattern", "").replace(" fabric", "").replace(" print", "").strip().capitalize()

            # Sleeve
            sleeve_results = self._zero_shot_classify(image, SLEEVE_LABELS, top_k=1)
            if sleeve_results:
                raw = sleeve_results[0]["label"]
                attributes["sleeve"] = raw.replace(" sleeves", "").strip().capitalize()

            # Fabric
            fabric_results = self._zero_shot_classify(image, FABRIC_LABELS, top_k=1)
            if fabric_results:
                raw = fabric_results[0]["label"]
                attributes["fabric"] = raw.replace(" fabric", "").replace(" material", "").strip().capitalize()

            return attributes

        except Exception as e:
            logger.error(f"Attribute detection failed: {e}")
            return {}

    def suggest_tags(self, image_data: bytes) -> List[str]:
        """Generate smart tag suggestions based on AI classification."""
        try:
            result = self.classify_image(image_data)
            tags = set()

            # Add category and subcategory as tags
            if result.get("category"):
                tags.add(result["category"].lower())
            if result.get("subcategory") and result["subcategory"] != "Unknown":
                tags.add(result["subcategory"].lower())

            # Add color
            if result.get("dominant_color") and result["dominant_color"] != "Unknown":
                tags.add(result["dominant_color"].lower())

            # Add attributes
            attrs = result.get("attributes", {})
            for key, value in attrs.items():
                if value and value != "Unknown":
                    tags.add(value.lower())

            return list(tags)

        except Exception as e:
            logger.error(f"Tag suggestion failed: {e}")
            return []

    def remove_background(self, image_data: bytes) -> bytes:
        """Remove background from image using rembg."""
        try:
            from rembg import remove

            output_data = remove(image_data)

            img = Image.open(io.BytesIO(output_data))
            if img.mode != "RGBA":
                img = img.convert("RGBA")

            output_buffer = io.BytesIO()
            img.save(output_buffer, format="PNG")
            return output_buffer.getvalue()

        except Exception as e:
            logger.error(f"Background removal failed: {e}")
            return image_data


ai_service = AIService()
