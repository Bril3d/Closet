from typing import List, Dict
import random

class AIService:
    def classify_image(self, image_data: bytes) -> dict:
        """
        Mock AI Classification.
        In a real app, this would use a PyTorch model or a Computer Vision API.
        """
        import random
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

    def remove_background(self, image_data: bytes) -> bytes:
        """
        Remove background from image using rembg.
        """
        try:
            from rembg import remove
            import io
            from PIL import Image
            
            # Use rembg to remove background
            output_data = remove(image_data)
            
            # Process with Pillow to ensure it's still a valid image
            # rembg returns bytes, but let's make sure it's optimized
            img = Image.open(io.BytesIO(output_data))
            
            # Convert to RGBA if not already (rembg should return RGBA)
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            output_buffer = io.BytesIO()
            img.save(output_buffer, format='PNG')
            return output_buffer.getvalue()
        except Exception as e:
            print(f"Background removal failed: {str(e)}")
            # Fallback to original image if removal fails
            return image_data

ai_service = AIService()
