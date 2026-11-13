// Find the chat elements in index.html.
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

// Replace "your-subdomain" with the address of your class Cloudflare Worker.
const WORKER_URL = "https://loreal-worker.scampercityepic.workers.dev/";

// Keep earlier messages so the assistant can follow the conversation.
const conversation = [];

// Show the assistant's welcome message.
addMessage(
  "ai",
  "👋 Hello! How can I help you find products or build a beauty routine?",
);

// Send each submitted message to the class Cloudflare Worker.
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = userInput.value.trim();
  if (!question) return;

  addMessage("user", question);
  userInput.value = "";
  sendBtn.disabled = true;

  const thinkingMessage = addMessage("ai", "Thinking...");

  // The system message gives the assistant its role and helpfulness guidelines.
  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...conversation,
    { role: "user", content: question },
  ];

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`The chatbot request failed (${response.status}).`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("The chatbot returned an empty or unexpected response.");
    }

    thinkingMessage.textContent = reply;
    conversation.push(
      { role: "user", content: question },
      { role: "assistant", content: reply },
    );
  } catch (error) {
    console.error("Could not get a chatbot response:", error);
    thinkingMessage.textContent =
      "Sorry, I couldn't get a response right now. Please try again.";
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});

// Create a chat message using textContent so user and assistant text is safe to display.
function addMessage(role, text) {
  const message = document.createElement("p");
  message.className = `msg ${role}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return message;
}

// Set the assistant's role and keep recommendations general and responsible.
function buildSystemPrompt() {
  return `You are a friendly L'Oréal beauty product advisor. Help people explore makeup, skincare, haircare, fragrances, and simple beauty routines. Ask helpful questions when you need to understand someone's preferences. Do not invent specific product details or availability, and do not diagnose skin or health conditions.`;
}
