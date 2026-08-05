"""
FIRE STONE - Background Removal Microservice
Powered by rembg (open-source AI, 100% free, runs locally)

Usage:
  python remove_bg_server.py

Endpoints:
  POST /remove-bg
    - Body: JSON { "url": "https://..." } to process a remote image URL
    OR multipart/form-data with field "image" (file upload)

  Response: JSON { "success": true, "dataUrl": "data:image/png;base64,..." }

Requirements:
  pip install "rembg[cpu]" flask flask-cors pillow requests
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import os
import base64
import requests as req

app = Flask(__name__)
CORS(app)

session = None


def get_session():
    global session
    if session is None:
        from rembg import new_session
        print("Loading AI model (u2net)...")
        session = new_session("u2net")
        print("AI Model loaded!")
    return session


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "FIRE STONE Background Remover"})


@app.route("/remove-bg", methods=["POST"])
def remove_background():
    try:
        from rembg import remove
        from PIL import Image

        image_data = None
        original_filename = "player.png"

        if request.content_type and "multipart/form-data" in request.content_type:
            if "image" not in request.files:
                return jsonify({"success": False, "error": "No image field"}), 400
            file = request.files["image"]
            image_data = file.read()
            original_filename = file.filename or "player.png"

        elif request.is_json:
            body = request.get_json()
            url = body.get("url")
            if not url:
                return jsonify({"success": False, "error": "No url field"}), 400
            print(f"Fetching: {url}")
            resp = req.get(url, timeout=20)
            resp.raise_for_status()
            image_data = resp.content
            original_filename = url.split("/")[-1].split("?")[0] or "player.png"

        else:
            return jsonify({"success": False, "error": "Unsupported content type"}), 415

        print(f"Processing {len(image_data) // 1024} KB image...")
        input_img = Image.open(io.BytesIO(image_data)).convert("RGBA")
        output_img = remove(input_img, session=get_session())

        output_buffer = io.BytesIO()
        output_img.save(output_buffer, format="PNG")
        output_bytes = output_buffer.getvalue()

        b64 = base64.b64encode(output_bytes).decode("utf-8")
        data_url = f"data:image/png;base64,{b64}"
        base_name = os.path.splitext(original_filename)[0]

        print(f"Done! Output size: {len(output_bytes) // 1024} KB")
        return jsonify({
            "success": True,
            "dataUrl": data_url,
            "filename": f"{base_name}_nobg.png",
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    get_session()
    print("\n====================================================")
    print("  FIRE STONE - Background Removal API")
    print("  Running on: http://localhost:5050")
    print("  Endpoint:   POST http://localhost:5050/remove-bg")
    print("====================================================\n")
    app.run(host="0.0.0.0", port=5050, debug=False)
