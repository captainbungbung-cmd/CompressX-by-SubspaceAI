import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { JSDOM } from "jsdom";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to fetch and clean URL content
  app.post("/api/fetch-url", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      // Remove unwanted elements
      ['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe', 'ads'].forEach(tag => {
        const elements = document.querySelectorAll(tag);
        elements.forEach(el => el.remove());
      });

      // Try to find the main content more intelligently
      const selectors = ['article', 'main', '.content', '#content', '.post', '.article', 'body'];
      let mainContent = null;
      for (const selector of selectors) {
        const found = document.querySelector(selector);
        if (found && found.textContent && found.textContent.length > 500) {
          mainContent = found;
          break;
        }
      }
      
      if (!mainContent) mainContent = document.body;
      
      // Clean up text
      const cleanText = mainContent.textContent || "";
      const simplifiedText = cleanText
        .replace(/\t+/g, ' ')
        .replace(/\n+/g, '\n')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .substring(0, 20000); // Increased limit for better context

      res.json({ content: simplifiedText, title: document.title });
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
      res.status(500).json({ error: "Failed to fetch URL content" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
