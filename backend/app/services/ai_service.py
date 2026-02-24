from typing import List, Dict
import random

class AIService:
    def classify_image(self, image_data: bytes) -> Dict:
        """
        Mock AI Classification.
        In a real app, this would use a PyTorch model or a Computer Vision API.
        """
        categories = ["Tops", "Bottoms", "Outerwear", "Shoes", "Accessories"]
        colors = ["Black", "White", "Blue", "Red", "Green", "Neutral"]
        
        # Simulate top-3 predictions
        predictions = random.sample(categories, 3)
        dominant_color = random.choice(colors)
        
        return {
            "top_predictions": predictions,
            "dominant_color": dominant_color,
            "confidence": 0.85
        }

ai_service = AIService()
