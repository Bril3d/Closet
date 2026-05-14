"""
STYLESPHERE - SINGLE MODEL TRAINING
One ResNet50 to rule them all!
RTX 4080 OPTIMIZED - FINAL VERSION
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.cuda.amp import autocast, GradScaler
from torch.utils.data import Dataset, DataLoader
import torchvision.models as models
import pandas as pd
import numpy as np
import cv2
import os
from tqdm import tqdm
import albumentations as A
from albumentations.pytorch import ToTensorV2
import random
from pathlib import Path
from sklearn.cluster import KMeans

print("🎯 STYLESPHERE - GARMENT ANALYZER TRAINING")
print("="*50)

# ============================================
# CONFIGURATION
# ============================================
class Config:
    base_path = "data/DeepFashion2"
    df_path = os.path.join(base_path, "img_info_dataframes")
    output_path = "models/garment_analyzer"
    
    batch_size = 64
    num_workers = 4
    epochs = 50
    learning_rate = 0.001
    
    categories = [
        "short_sleeve_top", "long_sleeve_top", "short_sleeve_outwear",
        "long_sleeve_outwear", "vest", "sling", "shorts", "trousers",
        "skirt", "short_sleeve_dress", "long_sleeve_dress", "vest_dress",
        "sling_dress"
    ]
    
    colors = [
        "black", "white", "gray", "red", "blue", "green", "yellow",
        "purple", "pink", "brown", "orange", "beige", "navy", "burgundy",
        "olive", "teal", "maroon", "coral", "lavender", "turquoise"
    ]
    
    sleeves = ["short", "long", "sleeveless", "three_quarter"]
    necks = ["crew", "v_neck", "turtle", "collar", "hood", "strapless"]
    fabrics = ["cotton", "denim", "wool", "silk", "leather", "polyester", "linen", "velvet", "lace", "knit"]
    patterns = ["solid", "striped", "floral", "plaid", "polka_dot", "geometric", "abstract", "graphic"]
    styles = ["casual", "formal", "athletic", "bohemian", "minimalist"]

config = Config()

# ============================================
# BBOX PARSER
# ============================================
def parse_bbox(bbox_str):
    try:
        if pd.isna(bbox_str):
            return None
        bbox_str = str(bbox_str).replace('[', '').replace(']', '').strip()
        parts = bbox_str.split(',') if ',' in bbox_str else bbox_str.split()
        bbox = [float(p.strip()) for p in parts if p.strip()]
        return bbox if len(bbox) == 4 else None
    except:
        return None

# ============================================
# DATASET - WITH FIXED COLOR ESTIMATION
# ============================================
class GarmentDataset(Dataset):
    def __init__(self, split='train', transform=None, max_samples=None):
        self.split = split
        self.transform = transform
        self.valid_indices = []
        
        csv_file = os.path.join(config.df_path, f'{split}.csv')
        print(f"Loading {csv_file}...")
        self.df = pd.read_csv(csv_file)
        
        if max_samples:
            self.df = self.df.head(max_samples)
        
        print("   Pre-filtering valid entries...")
        for idx in tqdm(range(len(self.df)), desc="Checking entries"):
            row = self.df.iloc[idx]
            
            if pd.isna(row['b_box']):
                continue
                
            bbox = parse_bbox(row['b_box'])
            if bbox is None:
                continue
            
            filename = os.path.basename(row['path'])
            if split == 'train':
                img_path = f"data/DeepFashion2/deepfashion2_original_images/train/image/{filename}"
            else:
                img_path = f"data/DeepFashion2/deepfashion2_original_images/validation/image/{filename}"
            
            if not os.path.exists(img_path):
                continue
                
            img = cv2.imread(img_path)
            if img is None:
                continue
            
            h, w = img.shape[:2]
            x, y, box_w, box_h = [int(v) for v in bbox]
            
            if x < 0 or y < 0 or x+box_w > w or y+box_h > h or box_w <= 0 or box_h <= 0:
                continue
                
            self.valid_indices.append(idx)
        
        print(f"   Found {len(self.valid_indices)} valid garments out of {len(self.df)}")
    
    def __len__(self):
        return len(self.valid_indices)
    
    def get_image_path(self, filename):
        if self.split == 'train':
            return f"data/DeepFashion2/deepfashion2_original_images/train/image/{filename}"
        return f"data/DeepFashion2/deepfashion2_original_images/validation/image/{filename}"
    
    def extract_garment(self, img_path, bbox):
        img = cv2.imread(img_path)
        if img is None:
            return None
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        x, y, w, h = [int(v) for v in bbox]
        pad_x, pad_y = int(w*0.1), int(h*0.1)
        x, y = max(0, x-pad_x), max(0, y-pad_y)
        w = min(img.shape[1]-x, w+2*pad_x)
        h = min(img.shape[0]-y, h+2*pad_y)
        return None if w<=0 or h<=0 else img[y:y+h, x:x+w]
    
    def estimate_color(self, garment_img):
        """SAFE color estimation with error handling"""
        # Check if image is valid
        if garment_img is None:
            return 0
        if not isinstance(garment_img, np.ndarray):
            return 0
        if garment_img.size == 0:
            return 0
        if garment_img.shape[0] < 10 or garment_img.shape[1] < 10:
            return 0
        
        try:
            small = cv2.resize(garment_img, (64, 64))
            pixels = small.reshape(-1, 3)  # FIXED: -1 not -
            kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
            kmeans.fit(pixels)
            labels = kmeans.labels_
            cluster_sizes = np.bincount(labels)
            dominant_idx = np.argmax(cluster_sizes)
            dominant_color = kmeans.cluster_centers_[dominant_idx]
            
            lab = cv2.cvtColor(np.uint8([[dominant_color]]), cv2.COLOR_RGB2LAB)[0][0]
            l, a, b = lab
            
            if l < 30:
                return 0  # black
            elif l > 220:
                return 1  # white
            elif abs(a) < 10 and abs(b) < 10:
                return 2  # gray
            elif a > 10 and b > 10:
                return 3  # red/orange
            elif a < -10 and b > 10:
                return 4  # yellow/green
            elif a < -10 and b < -10:
                return 5  # blue
            elif a > 10 and b < -10:
                return 6  # purple
            return 2
        except Exception as e:
            # If anything fails, return default
            return 0
    
    def estimate_sleeve(self, category_id):
        if category_id in [1, 3, 10]:
            return 0  # short
        if category_id in [2, 4, 11]:
            return 1  # long
        if category_id in [5, 6, 12, 13]:
            return 2  # sleeveless
        return 0
    
    def __getitem__(self, idx):
        real_idx = self.valid_indices[idx]
        row = self.df.iloc[real_idx]
        
        filename = os.path.basename(row['path'])
        img_path = self.get_image_path(filename)
        
        bbox = parse_bbox(row['b_box'])
        if bbox is None:
            return self.__getitem__(random.randint(0, len(self.valid_indices)-1))
        
        garment = self.extract_garment(img_path, bbox)
        if garment is None:
            return self.__getitem__(random.randint(0, len(self.valid_indices)-1))
        
        try:
            garment = cv2.resize(garment, (224, 224))
        except:
            return self.__getitem__(random.randint(0, len(self.valid_indices)-1))
        
        category = int(row['category_id']) - 1
        if category >= len(config.categories):
            category = 0
        
        mask = np.zeros((224, 224), dtype=np.float32)
        mask[20:204, 20:204] = 1.0
        
        if self.transform:
            try:
                transformed = self.transform(image=garment, mask=mask)
                garment = transformed['image']
                mask = transformed['mask']
            except:
                return self.__getitem__(random.randint(0, len(self.valid_indices)-1))
        
        return {
            'image': garment,
            'mask': mask.unsqueeze(0),
            'category': torch.tensor(category, dtype=torch.long),
            'color': torch.tensor(self.estimate_color(garment), dtype=torch.long),
            'sleeve': torch.tensor(self.estimate_sleeve(int(row['category_id'])), dtype=torch.long),
            'neck': torch.tensor(0, dtype=torch.long),
            'fabric': torch.tensor(0, dtype=torch.long),
            'pattern': torch.tensor(0, dtype=torch.long),
            'style': torch.tensor(0, dtype=torch.long)
        }

# ============================================
# MODEL
# ============================================
class GarmentAnalyzer(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
        self.features = nn.Sequential(*list(self.backbone.children())[:-2])
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        
        self.category_head = nn.Sequential(nn.Linear(2048, 512), nn.ReLU(), nn.Dropout(0.3), nn.Linear(512, len(config.categories)))
        self.color_head = nn.Sequential(nn.Linear(2048, 256), nn.ReLU(), nn.Dropout(0.2), nn.Linear(256, len(config.colors)))
        self.sleeve_head = nn.Sequential(nn.Linear(2048, 128), nn.ReLU(), nn.Linear(128, len(config.sleeves)))
        self.neck_head = nn.Sequential(nn.Linear(2048, 128), nn.ReLU(), nn.Linear(128, len(config.necks)))
        self.fabric_head = nn.Sequential(nn.Linear(2048, 256), nn.ReLU(), nn.Linear(256, len(config.fabrics)))
        self.pattern_head = nn.Sequential(nn.Linear(2048, 128), nn.ReLU(), nn.Linear(128, len(config.patterns)))
        self.style_head = nn.Sequential(nn.Linear(2048, 128), nn.ReLU(), nn.Linear(128, len(config.styles)))
        
        self.mask_head = nn.Sequential(
            nn.ConvTranspose2d(2048, 256, 4, 2, 1), nn.ReLU(),
            nn.ConvTranspose2d(256, 64, 4, 2, 1), nn.ReLU(),
            nn.ConvTranspose2d(64, 16, 4, 2, 1), nn.ReLU(),
            nn.Conv2d(16, 1, 1)
        )
    
    def forward(self, x):
        features = self.features(x)
        pooled = self.pool(features).flatten(1)
        return {
            'category': self.category_head(pooled),
            'color': self.color_head(pooled),
            'sleeve': self.sleeve_head(pooled),
            'neck': self.neck_head(pooled),
            'fabric': self.fabric_head(pooled),
            'pattern': self.pattern_head(pooled),
            'style': self.style_head(pooled),
            'mask': nn.functional.interpolate(self.mask_head(features), (224, 224), mode='bilinear')
        }

# ============================================
# TRAINER
# ============================================
class Trainer:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"🔥 Training on: {self.device}")
        if torch.cuda.is_available():
            print(f"   GPU: {torch.cuda.get_device_name(0)}")
            print(f"   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        
        self.model = GarmentAnalyzer().to(self.device)
        self.optimizer = optim.AdamW(self.model.parameters(), lr=config.learning_rate, weight_decay=0.01)
        self.scheduler = optim.lr_scheduler.CosineAnnealingLR(self.optimizer, T_max=config.epochs)
        self.scaler = GradScaler()
        
        self.criterion_ce = nn.CrossEntropyLoss()
        self.criterion_mask = nn.BCEWithLogitsLoss()
        
        self.best_acc = 0
    
    def train_epoch(self, train_loader):
        self.model.train()
        total_loss = 0
        correct_cat = 0
        total = 0
        
        pbar = tqdm(train_loader, desc='Training')
        for batch in pbar:
            images = batch['image'].to(self.device)
            masks = batch['mask'].to(self.device)
            categories = batch['category'].to(self.device)
            colors = batch['color'].to(self.device)
            sleeves = batch['sleeve'].to(self.device)
            
            with autocast():
                outputs = self.model(images)
                loss = (self.criterion_ce(outputs['category'], categories) * 1.0 +
                       self.criterion_ce(outputs['color'], colors) * 0.5 +
                       self.criterion_ce(outputs['sleeve'], sleeves) * 0.3 +
                       self.criterion_mask(outputs['mask'], masks) * 1.0)
            
            self.optimizer.zero_grad()
            self.scaler.scale(loss).backward()
            self.scaler.step(self.optimizer)
            self.scaler.update()
            
            total_loss += loss.item()
            _, pred_cat = outputs['category'].max(1)
            correct_cat += pred_cat.eq(categories).sum().item()
            total += categories.size(0)
            
            pbar.set_postfix({'loss': f'{loss.item():.4f}', 'acc': f'{100.*correct_cat/total:.2f}%'})
        
        return total_loss / len(train_loader), 100. * correct_cat / total
    
    def validate(self, val_loader):
        self.model.eval()
        correct_cat = 0
        total = 0
        with torch.no_grad():
            for batch in tqdm(val_loader, desc='Validating'):
                images = batch['image'].to(self.device)
                categories = batch['category'].to(self.device)
                outputs = self.model(images)
                _, pred_cat = outputs['category'].max(1)
                total += categories.size(0)
                correct_cat += pred_cat.eq(categories).sum().item()
        return 100. * correct_cat / total
    
    def train(self):
        print("\n🚀 STARTING TRAINING")
        print("="*50)
        
        train_transform = A.Compose([
            A.Resize(224, 224),
            A.RandomBrightnessContrast(p=0.2),
            A.HorizontalFlip(p=0.5),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ])
        
        val_transform = A.Compose([
            A.Resize(224, 224),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ])
        
        train_dataset = GarmentDataset('train', train_transform, max_samples=None)
        val_dataset = GarmentDataset('validation', val_transform, max_samples=None)
        
        if len(train_dataset) == 0 or len(val_dataset) == 0:
            print("❌ ERROR: No valid images found!")
            return
        
        train_loader = DataLoader(train_dataset, batch_size=config.batch_size, shuffle=True,
                                 num_workers=config.num_workers, pin_memory=True, drop_last=True)
        val_loader = DataLoader(val_dataset, batch_size=config.batch_size*2, shuffle=False,
                               num_workers=config.num_workers, pin_memory=True)
        
        print(f"   Train samples: {len(train_dataset)}")
        print(f"   Val samples: {len(val_dataset)}")
        
        for epoch in range(config.epochs):
            print(f"\n📚 Epoch {epoch+1}/{config.epochs}")
            train_loss, train_acc = self.train_epoch(train_loader)
            val_acc = self.validate(val_loader)
            self.scheduler.step()
            
            print(f"\n📊 Results:")
            print(f"   Train Loss: {train_loss:.4f}")
            print(f"   Train Acc: {train_acc:.2f}%")
            print(f"   Val Acc: {val_acc:.2f}%")
            print(f"   LR: {self.optimizer.param_groups[0]['lr']:.6f}")
            
            if val_acc > self.best_acc:
                self.best_acc = val_acc
                self.save_model('best_model.pth')
                print(f"   💾 New best model saved! ({val_acc:.2f}%)")
            
            if (epoch + 1) % 10 == 0:
                self.save_checkpoint(epoch)
        
        print(f"\n🎉 Training complete! Best accuracy: {self.best_acc:.2f}%")
    
    def save_model(self, filename):
        os.makedirs(config.output_path, exist_ok=True)
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'config': {
                'categories': config.categories,
                'colors': config.colors,
                'sleeves': config.sleeves,
                'necks': config.necks,
                'fabrics': config.fabrics,
                'patterns': config.patterns,
                'styles': config.styles
            }
        }, os.path.join(config.output_path, filename))
    
    def save_checkpoint(self, epoch):
        os.makedirs(f"{config.output_path}/checkpoints", exist_ok=True)
        torch.save({
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'best_acc': self.best_acc
        }, f"{config.output_path}/checkpoints/epoch_{epoch}.pt")

# ============================================
# MAIN
# ============================================
if __name__ == "__main__":
    trainer = Trainer()
    trainer.train()
    print("\n✅ TRAINING COMPLETE!")
    print(f"📁 Model saved in: {config.output_path}")