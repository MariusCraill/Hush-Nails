import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Curated South African salon ideas fallback generator
function getCuratedIdeas(platform = "TikTok", serviceFocus = "All Nails", tone = "Trendy & Viral", season = "Current Season") {
  return [
    {
      title: `${serviceFocus} Transformation & ASMR Prep`,
      platform: platform,
      hook: "She thought her grown-out set was beyond saving... wait until the Russian cuticle prep! 💅✨",
      format: "Before & After Timelapse + Satisfying filing audio",
      bestPostingTime: "18:30 - 20:30 (SAST Evening Peak)",
      caption: `Fresh ${serviceFocus} sculpts for the weekend! Precision apex balance, dry cuticle detailing, and high-shine seal. Handcrafted with zero nail damage. 📍 Studio slots open in JHB & CPT. Check our menu for ZAR prices. Tap link to WhatsApp us! 💖 #SANails #AcrylicNailsSA #NailTransformation #SouthAfricaNails #${serviceFocus.replace(/[^a-zA-Z0-9]/g, "")}`,
      hashtags: ["#SANails", "#NailTechLife", "#NailTransformation", "#SouthAfricaNails", "#NailTok"],
      estimatedReach: "High Viral Potential",
      callToAction: "DM or WhatsApp to grab the last slots for this weekend!"
    },
    {
      title: `The 'Clean Girl' ${serviceFocus} Routine`,
      platform: platform,
      hook: "Why 90% of my clients switched to this natural nail retention system this month...",
      format: "Macro lens detail of apex structure + glossy topcoat reveal",
      bestPostingTime: "12:30 - 13:45 (Lunchtime Scrolling)",
      caption: `Natural nail growth journey with ${serviceFocus}! 4+ weeks of healthy natural length with zero lifting or peeling. Overlays from R320 this month. Bookings via WhatsApp! 🌸 #BIAB #BuilderGel #NaturalNails #CleanGirlAesthetic`,
      hashtags: ["#BIABNails", "#NailHealth", "#CleanGirlAesthetic", "#SalonDay", "#NailInspo"],
      estimatedReach: "Very High Engagement",
      callToAction: "Send your nail inspo pic on WhatsApp for a quick quote!"
    },
    {
      title: "Price Breakdown: What Quality Work Actually Gets You",
      platform: platform,
      hook: "Clients always ask: 'Why does a luxury set take 2 hours?' Let's break down the artistry...",
      format: "Step-by-step breakdown (Cuticle work, Dehydration, Dual-form sculpted acrylic, Hand-painted chrome)",
      bestPostingTime: "07:30 - 09:00 (Morning Commute)",
      caption: `Quality, precision, zero damage. Invest in your hands! Quality ${serviceFocus} designed to last through chores, work, and workouts. Check our updated menu in bio. Secure your appointment with a 50% deposit. 💖 #NailTechDiaries #NailPricing #LuxuryNails #SANails`,
      hashtags: ["#NailArtistry", "#SouthAfricanBusiness", "#SalonLife", "#NailTrends"],
      estimatedReach: "High Saves & Shares",
      callToAction: "WhatsApp us to lock in your appointment before payday rush."
    },
    {
      title: `${season} Special: Pinterest Inspo vs. Reality`,
      platform: platform,
      hook: "She brought this viral Pinterest photo and asked: 'Can you do this?' 💅🔥",
      format: "POV Reveal with trending sound + client reaction",
      bestPostingTime: "17:30 - 19:30 (SAST Commute & Relaxation)",
      caption: `Did we understand the assignment?! Featuring ${serviceFocus} with custom chrome & French finish for ${season}. Slots filling fast for the weekend! 💎 Book via WhatsApp link in bio. #NailInspo #PinterestNails #SANails #NailTok`,
      hashtags: ["#NailInspo", "#PinterestNails", "#NailTrends", "#SANails", "#WeekendVibes"],
      estimatedReach: "High Viral Potential",
      callToAction: "WhatsApp 'SPECIAL' for 10% off your first set."
    }
  ];
}

function getCuratedCaption(nailStyle = "Acrylic Ombré", length = "Medium Coffin", nailArt = "Chrome glaze", price = "380", platform = "TikTok") {
  return {
    hook: "POV: You finally found a nail tech who actually understands the assignment 💅🔥",
    caption: `Obsessed with this set! 😍 ${nailStyle} (${length}) with custom ${nailArt || "nail art"}. Handcrafted perfection! 💅✨\n\n💰 Price: R${price || 380}\n📍 Studio bookings open for this week\n📲 Tap WhatsApp link to reserve your slot with a 50% deposit!\n\n#SANails #NailTok #NailInspo #SouthAfricaNails #AcrylicNails #BIAB`,
    hashtags: ["#SANails", "#NailTechLife", "#NailTrends", "#JohannesburgNails", "#CapeTownNails", "#NailTok"]
  };
}

// Resilient Gemini multi-model caller
const CANDIDATE_MODELS = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];

async function generateWithGeminiFallback(ai: GoogleGenAI, prompt: string): Promise<string> {
  let lastError: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || "";
      console.warn(`Gemini model ${modelName} returned status ${status}. Falling back to next model...`);
    }
  }
  throw lastError || new Error("All candidate Gemini models failed");
}

// Marketing ideas generator endpoint
app.post("/api/gemini/marketing-ideas", async (req: Request, res: Response) => {
  const { platform = "TikTok", serviceFocus = "All Nails", tone = "Trendy & Viral", season = "Current Season" } = req.body;
  const ai = getGenAI();

  if (!ai) {
    return res.json({
      success: true,
      ideas: getCuratedIdeas(platform, serviceFocus, tone, season),
      source: "curated",
      notice: "Curated South African salon playbook active."
    });
  }

  try {
    const prompt = `You are a top-tier social media growth strategist and marketing coach specifically for South African independent nail artists, nail tech salons, and mobile manicurists.
Generate 4 highly engaging, viral, and actionable marketing content ideas for a South African nail business.
Target Platform: ${platform}
Focus Service / Style: ${serviceFocus}
Tone: ${tone}
Context/Season: ${season}
Currency / Context: South Africa (ZAR / Rands, mention local vibes like payday weekend, matric dance, wedding season, Durban/Joburg/Cape Town/Pretoria vibes, WhatsApp booking links).

Output strictly valid JSON matching this schema:
{
  "ideas": [
    {
      "title": "Short catchy concept title",
      "platform": "${platform}",
      "hook": "The first 3 seconds audio/visual hook to stop the scroll",
      "format": "E.g., Before & After, ASMR sounds, Talking head, POV nail tech, Storytime",
      "bestPostingTime": "Optimal SAST time slot (e.g., 07:30 - 09:00, 12:30 - 13:30, or 18:30 - 20:30)",
      "caption": "Compelling caption with prices in Rands (R), emojis, and WhatsApp booking call to action",
      "hashtags": ["#SANails", "#NailTok", "#AcrylicNailsSA"],
      "estimatedReach": "High / Very High / Viral",
      "callToAction": "Clear step for client (e.g. WhatsApp, DM, Book Now)"
    }
  ]
}`;

    const responseText = await generateWithGeminiFallback(ai, prompt);
    const parsed = JSON.parse(responseText || "{}");
    const ideas = Array.isArray(parsed.ideas) && parsed.ideas.length > 0
      ? parsed.ideas
      : getCuratedIdeas(platform, serviceFocus, tone, season);

    return res.json({
      success: true,
      ideas,
      source: "ai"
    });
  } catch (error: any) {
    // Graceful handling of 429 quota exhaustion, 503 high demand, or network issues
    console.warn("Gemini API rate limit or demand spike encountered. Serving curated SA marketing ideas without failing.");
    return res.json({
      success: true,
      ideas: getCuratedIdeas(platform, serviceFocus, tone, season),
      source: "curated_fallback",
      notice: "Generated from South African salon playbook (AI model quota cooling down)."
    });
  }
});

// AI Caption & Hook Generator for custom nail photo/video
app.post("/api/gemini/generate-caption", async (req: Request, res: Response) => {
  const { nailStyle, length, nailArt, price, platform = "TikTok" } = req.body;
  const ai = getGenAI();

  if (!ai) {
    return res.json({
      success: true,
      ...getCuratedCaption(nailStyle, length, nailArt, price, platform),
      source: "curated"
    });
  }

  try {
    const prompt = `Create a viral social media post for a nail tech in South Africa.
Nail Style: ${nailStyle || "Acrylic Ombré & French Tips"}
Length & Shape: ${length || "Medium Coffin"}
Nail Art: ${nailArt || "Chrome glaze and 3D charms"}
Price: R${price || "380"}
Platform: ${platform}

Write a punchy 3-second hook, an engaging caption with South African salon flair, realistic Rand price, clear WhatsApp booking call to action, and 6 trending hashtags.
Return JSON format:
{
  "hook": "...",
  "caption": "...",
  "hashtags": ["#tag1", "#tag2", ...]
}`;

    const responseText = await generateWithGeminiFallback(ai, prompt);
    const parsed = JSON.parse(responseText || "{}");
    return res.json({
      success: true,
      ...parsed,
      source: "ai"
    });
  } catch (error: any) {
    console.warn("Caption generator fallback activated.");
    return res.json({
      success: true,
      ...getCuratedCaption(nailStyle, length, nailArt, price, platform),
      source: "curated_fallback"
    });
  }
});

// Setup Vite development or production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HUSH nails Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
