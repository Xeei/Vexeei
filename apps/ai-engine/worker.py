import sys
import torch
import cv2
import numpy as np
from segment_anything import sam_model_registry, SamPredictor

class VexeeiBrain:
    def __init__(self):
        print("🧠 Vexeei Brain: Loading SAM Model... (This takes a few seconds)")
        
        # 1. Select the device (GPU if available, else CPU)
        # On Mac M1/M2, 'mps' is the GPU. On Windows/Linux, 'cuda'.
        if torch.backends.mps.is_available():
            self.device = "mps"
        elif torch.cuda.is_available():
            self.device = "cuda"
        else:
            self.device = "cpu"
            
        print(f"⚡ Device selected: {self.device}")

        # 2. Load the Model Config
        model_type = "vit_b"
        checkpoint = "sam_vit_b_01ec64.pth"

        self.sam = sam_model_registry[model_type](checkpoint=checkpoint)
        self.sam.to(device=self.device)
        self.predictor = SamPredictor(self.sam)
        
        print("✅ Vexeei Brain: Model Loaded & Ready!")

    def predict(self, image_bytes, point_coords):
        """
        Receives an image and a click point [x, y].
        Returns the polygon coordinates.
        """
        # Convert bytes to an image OpenCV can read
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) # SAM expects RGB

        # Set the image for the predictor
        self.predictor.set_image(image)

        # Convert point to numpy array (SAM expects input_point, input_label)
        input_point = np.array([point_coords])
        input_label = np.array([1]) # 1 means "Include this point"

        # Run Prediction
        masks, scores, logits = self.predictor.predict(
            point_coords=input_point,
            point_labels=input_label,
            multimask_output=False, # We just want the best single mask
        )

        # Process the mask into a Polygon (for Mapbox)
        binary_mask = (masks[0] * 255).astype(np.uint8)
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return []

        # Simplify the polygon (reduce points to make it web-friendly)
        largest_contour = max(contours, key=cv2.contourArea)
        epsilon = 0.005 * cv2.arcLength(largest_contour, True)
        approx = cv2.approxPolyDP(largest_contour, epsilon, True)

        # Convert to standard Python list [[x,y], [x,y]...]
        return approx.reshape(-1, 2).tolist()

# Create a singleton instance
brain = VexeeiBrain()