from flask import Flask,request,jsonify
from flask_cors import CORS
from parser import parse_resume
from models import employees
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:5001", "http://127.0.0.1:5001"])

UPLOAD_FOLDER="uploads"

# Ensure uploads folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route("/api/parse-resume", methods=["POST"])
def parse_resume_route():
    try:
        if "resume" not in request.files:
            return jsonify({"error": "No resume file provided"}), 400
        
        file = request.files["resume"]
        
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        data = parse_resume(filepath)

        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/save-candidate",methods=["POST"])
def save():

    data=request.json

    data["status"]="NEW"

    employees.insert_one(data)

    return jsonify({"message":"Candidate saved successfully"})


app.run(debug=True,port=5001)