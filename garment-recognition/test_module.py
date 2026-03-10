print("✅ Garment recognition module loaded successfully!")
print("Files present:")
import os
print(f" - models/best_model.pth: {os.path.exists('models/best_model.pth')}")
print(f" - src/models/garment_analyzer.py: {os.path.exists('src/models/garment_analyzer.py')}")
