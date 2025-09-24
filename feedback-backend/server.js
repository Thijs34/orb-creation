import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve static frontend files (from project root)
app.use(express.static(path.join(__dirname, "..")));

// ✅ Example API endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is running fine 🚀" });
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Streaming summary endpoint
app.post("/api/summary", express.json(), async (req, res) => {
  try {
    const { feedbacks } = req.body;

    if (!feedbacks || feedbacks.length === 0) {
      return res.status(400).json({ error: "No feedbacks provided" });
    }

    const prompt = `
    You are an assistant helping summarize workplace feedback. All feedback is directed at the Fontys ICT - InnovationLab in Strijp S.

    Task:
    - Only look at the feedback given, do not make anything up. If there is no positive feedback, say that, the same goes for negative.
    - Provide a structured, easy-to-read summary of the following feedback.
    - Organize the summary into clear sections with short paragraphs, bullet points, or numbered lists.
    - Highlight:
      1. The most common positive points
      2. The main areas of concern
      3. Any suggestions or recurring themes from employees
    - Do NOT include a top-level title like "Feedback Summary" (the UI already has one).
    - Keep it concise, but well formatted with line breaks for readability.
    - Suggest what should be improved in a short way.

    Feedbacks:
    ${feedbacks.map((f, i) => `${i + 1}. ${f}`).join("\n")}
    `;

    // ✅ Streaming headers
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.flushHeaders?.();

    // ✅ OpenAI stream
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        res.write(delta);
      }
    }

    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate summary" });
    }
  }
});

// ✅ Default route (serve index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
