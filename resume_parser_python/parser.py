import pdfplumber
import re

def parse_resume(path):

    text=""

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text

    text_lower = text.lower()

    email = re.findall(r"\S+@\S+", text)

    phone = re.findall(r"\d{10}", text)

    name = text.split("\n")[0]

    skill_keywords = [
        "python","java","sql","html","css",
        "machine learning","javascript",
        "react","node","mongodb","c++","c"
    ]

    skills = []

    for skill in skill_keywords:
        if skill in text_lower:
            skills.append(skill.title())

    return {
        "name": name,
        "email": email[0] if email else "",
        "phone": phone[0] if phone else "",
        "skills": skills
    }