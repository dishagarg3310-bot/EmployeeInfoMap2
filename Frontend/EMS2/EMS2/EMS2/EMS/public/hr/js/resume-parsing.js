async function uploadResume(){

const fileInput = document.getElementById("resumeFile");
const file = fileInput.files[0];

if(!file){
alert("Please select a resume PDF");
return;
}

const formData = new FormData();
formData.append("resume",file);

// Python Resume Parser
const response = await fetch("http://127.0.0.1:5001/api/parse-resume",{
method:"POST",
body:formData
});

const result = await response.json();

document.getElementById("candidateName").innerText = result.name;
document.getElementById("candidateEmail").innerText = result.email;
document.getElementById("candidatePhone").innerText = result.phone;
document.getElementById("candidateSkills").innerText = result.skills.join(", ");

}


async function saveCandidate(){

console.log("Button clicked"); // 🔥 DEBUG

const name = document.getElementById("candidateName").innerText;
const email = document.getElementById("candidateEmail").innerText;
const phone = document.getElementById("candidatePhone").innerText;

const skillsText = document.getElementById("candidateSkills").innerText;
const skills = skillsText.split(",").map(s => s.trim());

const data = {
name,
email,
phone,
skills,
status:"NEW"
};

console.log("Sending Data:", data); // 🔥 DEBUG

const response = await fetch("http://127.0.0.1:5000/api/candidates",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(data)
});

const result = await response.json();

alert("Candidate Saved Successfully");

}