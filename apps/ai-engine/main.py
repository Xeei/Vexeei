from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from worker import brain # Import our brain instance
import json

app = FastAPI()

# Allow Frontend to talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "system": "Vexeei AI Engine"}

@app.post("/segment")
async def segment_road(
    file: UploadFile = File(...), 
    coords: str = Form(...) # Expecting string "[x, y]"
):
    print(f"Received request for coords: {coords}")
    
    # 1. Parse Coordinates
    point = json.loads(coords)
    
    # 2. Read Image
    image_bytes = await file.read()
    
    # 3. Ask the Brain
    polygon = brain.predict(image_bytes, point)
    
    return {
        "success": True, 
        "polygon": polygon
    }