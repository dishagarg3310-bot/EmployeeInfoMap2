(function() {
    const ROLE = "admin";

    // ✅ DOM ready hone ka wait karo
    function initChatbot() {
        const toggle = document.getElementById("chatbot-toggle");
        const box = document.getElementById("chatbot-box");
        const closeBtn = document.getElementById("chatbot-close");
        const input = document.getElementById("chatbot-input");
        const sendBtn = document.getElementById("chatbot-send");
        const messages = document.getElementById("chatbot-messages");

        if (!toggle) {
            // DOM abhi ready nahi — retry karo
            setTimeout(initChatbot, 100);
            return;
        }

        toggle.addEventListener("click", () => box.classList.toggle("hidden"));
        closeBtn.addEventListener("click", () => box.classList.add("hidden"));

        async function sendMessage() {
            const message = input.value.trim();
            if (!message) return;

            addMessage(message, "user");
            input.value = "";

            const typing = addMessage("Typing...", "typing");

            try {
                const response = await fetch("http://localhost:5000/api/chatbot/message", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message, role: ROLE })
                });
                const data = await response.json();
                typing.remove();
                addMessage(data.reply || "Koi jawab nahi mila!", "bot");
            } catch (err) {
                typing.remove();
                addMessage("Server se connection nahi ho paya!", "bot");
            }
        }

        function addMessage(text, type) {
            const div = document.createElement("div");
            div.className = `chat-msg ${type}`;
            div.innerHTML = text.replace(/\n/g, "<br>");
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
            return div;
        }

        sendBtn.addEventListener("click", sendMessage);
        input.addEventListener("keydown", e => {
            if (e.key === "Enter") sendMessage();
        });
    }

    initChatbot();
})();