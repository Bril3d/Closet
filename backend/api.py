"""
StyleSphere Garment Detection API - Local Model + Color Detection
Run: python api.py
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
import uvicorn
import base64
import asyncio
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import io
import json
import uuid
import os

# ============================================
# LOAD YOUR TRAINED MODEL
# ============================================
MODEL_PATH = os.getenv("LOCAL_MODEL_PATH", "C:/Users/gasmi/Documents/Closet/garment-recognition/models/best_model.pth")
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class GarmentClassifier(nn.Module):
    def __init__(self, num_classes=13):
        super().__init__()
        self.backbone = models.resnet50(weights=None)
        self.backbone.fc = nn.Linear(2048, num_classes)
    
    def forward(self, x):
        return self.backbone(x)

model = None
categories = ["short_sleeve_top", "long_sleeve_top", "short_sleeve_outwear", "long_sleeve_outwear", 
              "vest", "sling", "shorts", "trousers", "skirt", "short_sleeve_dress", 
              "long_sleeve_dress", "vest_dress", "sling_dress"]

if os.path.exists(MODEL_PATH):
    try:
        model = GarmentClassifier(num_classes=13).to(device)
        checkpoint = torch.load(MODEL_PATH, map_location=device)
        if 'model_state_dict' in checkpoint:
            model.load_state_dict(checkpoint['model_state_dict'], strict=False)
        else:
            model.load_state_dict(checkpoint, strict=False)
        model.eval()
        print(f"✅ Local model loaded from {MODEL_PATH}")
    except Exception as e:
        print(f"⚠️ Could not load model: {e}")

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

app = FastAPI(title="StyleSphere Garment Detection")

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(400, "File must be an image")
    
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    
    # Try local model first
    if model:
        try:
            input_tensor = transform(image).unsqueeze(0).to(device)
            with torch.no_grad():
                output = model(input_tensor)
                probs = torch.softmax(output, dim=1)
                confidence, pred_idx = torch.max(probs, dim=1)
            
            category = categories[pred_idx.item()]
            color = analyze_color(image)
            
            print(f"✅ Local model: {category} ({confidence.item():.2f})")
            
            return {
                "success": True,
                "detection_id": str(uuid.uuid4()),
                "source": "local_model",
                "attributes": {
                    "category": category,
                    "color": color,
                    "pattern": "solid",
                    "sleeve": "short",
                    "neck": "crew",
                    "fabric": "cotton",
                    "confidence": float(confidence.item())
                }
            }
        except Exception as e:
            print(f"Model inference error: {e}")
    
    # Fallback: color only
    color = analyze_color(image)
    print(f"🟡 Fallback: color={color}")
    
    return {
        "success": True,
        "detection_id": str(uuid.uuid4()),
        "source": "basic",
        "attributes": {
            "category": "unknown",
            "color": color,
            "pattern": "solid",
            "sleeve": "short",
            "neck": "crew",""
            "fabric": "cotton"
        }
    }

def analyze_color(image: Image.Image) -> str:
    try:
        img = image.resize((50, 50))
        pixels = list(img.getdata())
        r = sum(p[0] for p in pixels) / len(pixels)
        g = sum(p[1] for p in pixels) / len(pixels)
        b = sum(p[2] for p in pixels) / len(pixels)
        
        if r > 200 and g > 200 and b > 200: return "white"
        elif r < 50 and g < 50 and b < 50: return "black"
        elif r > 200: return "red"
        elif g > 200: return "green"
        elif b > 200: return "blue"
        elif r > 150 and g > 150: return "yellow"
        else: return "gray"
    except:
        return "unknown"

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)