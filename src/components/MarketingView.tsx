import React, { useState } from "react";
import { MarketingPost, MarketingIdea, SocialPlatform, MenuItem, SalonProfile } from "../types";
import { exportToCSV, formatZAR } from "../utils/formatters";
import {
  Sparkles,
  Calendar,
  Clock,
  Send,
  Copy,
  Check,
  Plus,
  Flame,
  Share2,
  Trash2,
  Edit2,
  Download,
  Smartphone,
  MessageCircle,
  ExternalLink,
  Tag,
  RefreshCw,
  X
} from "lucide-react";

interface MarketingViewProps {
  posts: MarketingPost[];
  menu: MenuItem[];
  salon: SalonProfile;
  onAddPost: (post: MarketingPost) => void;
  onUpdatePost: (post: MarketingPost) => void;
  onDeletePost: (id: string) => void;
}

const DEFAULT_MARKETING_IDEAS: MarketingIdea[] = [
  {
    title: "4-Week Grown-Out Acrylic Transformation (ASMR Tapping)",
    platform: "TikTok",
    hook: "She thought her nails were beyond saving... wait until the Russian cuticle prep! 💅✨",
    format: "Before & After Timelapse + Satisfying filing audio",
    bestPostingTime: "18:30 - 20:30 (SAST Evening Peak)",
    caption: "Fresh French Ombré sculpts for the weekend! Tap the link in bio to book your set before payday slots fill up. 📍 Rosebank, JHB #SANails #AcrylicNailsSA #NailTransformation #SouthAfricaNails",
    hashtags: ["#SANails", "#NailTechLife", "#AcrylicFullSet", "#JohannesburgNails", "#NailTok"],
    estimatedReach: "High Viral Potential",
    callToAction: "DM or WhatsApp to grab the last 2 slots this Friday!"
  },
  {
    title: "The 'Clean Girl' BIAB Builder Gel Routine",
    platform: "TikTok",
    hook: "Why 90% of my clients ditched regular gel for Builder Gel this month...",
    format: "Macro lens detail of apex structure + glossy topcoat reveal",
    bestPostingTime: "12:30 - 13:45 (Lunchtime Scrolling)",
    caption: "Natural nail growth journey! 5 weeks of healthy natural length with zero lifting. Builder Gel overlays are R320 this month. Bookings via WhatsApp! 🌸 #BIAB #BuilderGel #NaturalNails #CapeTownNails",
    hashtags: ["#BIABNails", "#NailHealth", "#CleanGirlAesthetic", "#SalonDay", "#NailInspo"],
    estimatedReach: "Very High Engagement",
    callToAction: "Send your nail inspo pic on WhatsApp for a quick quote!"
  },
  {
    title: "Price Breakdown: What R450 Actually Gets You",
    platform: "Instagram",
    hook: "Clients always ask: 'Why does a luxury set take 2 hours?' Let's break down the artistry...",
    format: "Step-by-step breakdown (Cuticle work, Dehydration, Dual-form sculpted acrylic, Hand-painted chrome)",
    bestPostingTime: "07:30 - 09:00 (Morning Commute)",
    caption: "Quality, precision, zero damage. Invest in your hands! Check our updated menu in bio. Secure your appointment with a 50% deposit. 💖 #NailTechDiaries #NailPricing #LuxuryNails #DurbanNails",
    hashtags: ["#NailArtistry", "#SouthAfricanBusiness", "#SalonLife", "#NailTrends"],
    estimatedReach: "High Saves & Shares",
    callToAction: "WhatsApp 'SPECIAL' to 082-NAILS for 10% off your first set."
  },
  {
    title: "Pinterest Inspo vs What She Got",
    platform: "TikTok",
    hook: "She brought this viral Pinterest photo and asked: 'Can you do this?' 💅🔥",
    format: "POV Reveal with trending audio",
    bestPostingTime: "17:30 - 19:30 (SAST Commute & Evening)",
    caption: "Did we understand the assignment?! Custom French chrome glazed sculpted set. Slots filling fast for the weekend! 💎 Book via WhatsApp in bio. #NailInspo #PinterestNails #SANails #NailTok",
    hashtags: ["#NailInspo", "#PinterestNails", "#NailTrends", "#SANails", "#WeekendVibes"],
    estimatedReach: "Very High Engagement",
    callToAction: "DM or WhatsApp to claim the last weekend slot!"
  }
];

export const MarketingView: React.FC<MarketingViewProps> = ({
  posts,
  menu,
  salon,
  onAddPost,
  onUpdatePost,
  onDeletePost,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"calendar" | "ai_generator" | "simulator">(
    "ai_generator"
  );

  // AI Generator state
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("TikTok");
  const [selectedService, setSelectedService] = useState<string>("Acrylic Extensions");
  const [selectedTone, setSelectedTone] = useState<string>("Viral & Scroll-stopping");
  const [selectedSeason, setSelectedSeason] = useState<string>("Payday Weekend & Month-End");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<MarketingIdea[]>(DEFAULT_MARKETING_IDEAS);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Scheduling Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MarketingPost | null>(null);
  const [postPlatform, setPostPlatform] = useState<SocialPlatform>("TikTok");
  const [postDate, setPostDate] = useState(new Date().toISOString().split("T")[0]);
  const [postTime, setPostTime] = useState("18:30");
  const [postTitle, setPostTitle] = useState("");
  const [postHook, setPostHook] = useState("");
  const [postCaption, setPostCaption] = useState("");
  const [postHashtags, setPostHashtags] = useState("#SANails #NailTok #AcrylicNailsSA");
  const [postFormat, setPostFormat] = useState("Before & After Transformation");
  const [postStatus, setPostStatus] = useState<"draft" | "scheduled" | "posted">("scheduled");

  // Phone Simulator state
  const [simulatedPost, setSimulatedPost] = useState<MarketingPost | null>(
    posts[0] || null
  );

  // Cooldown timer to prevent rate limit quota exhaustion
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Trigger Gemini API for marketing ideas
  const handleGenerateIdeas = async () => {
    if (isGenerating || cooldown > 0) return;
    setIsGenerating(true);
    setGenerationNotice(null);
    try {
      const response = await fetch("/api/gemini/marketing-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: selectedPlatform,
          serviceFocus: selectedService,
          tone: selectedTone,
          season: selectedSeason,
        }),
      });

      const data = await response.json();
      if (data.ideas && data.ideas.length > 0) {
        setGeneratedIdeas(data.ideas);
      }
      if (data.notice) {
        setGenerationNotice(data.notice);
      }
    } catch (err) {
      console.warn("Marketing idea generator notice:", err);
    } finally {
      setIsGenerating(false);
      setCooldown(5); // 5 second cooldown to respect free tier rate limits
    }
  };

  const handleAddIdeaToCalendar = (idea: MarketingIdea) => {
    const newPost: MarketingPost = {
      id: `post-${Date.now()}`,
      platform: idea.platform,
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      scheduledTime: idea.bestPostingTime.includes("18:30") ? "18:30" : "12:30",
      title: idea.title,
      hook: idea.hook,
      caption: idea.caption,
      hashtags: idea.hashtags,
      format: idea.format,
      status: "scheduled",
      bestPostingTime: idea.bestPostingTime,
      serviceFocus: selectedService,
    };
    onAddPost(newPost);
    setActiveSubTab("calendar");
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) return;

    const tagsArray = postHashtags
      .split(" ")
      .map((t) => t.trim())
      .filter((t) => t.startsWith("#"));

    if (editingPost) {
      onUpdatePost({
        ...editingPost,
        platform: postPlatform,
        scheduledDate: postDate,
        scheduledTime: postTime,
        title: postTitle.trim(),
        hook: postHook.trim(),
        caption: postCaption.trim(),
        hashtags: tagsArray.length ? tagsArray : ["#SANails"],
        format: postFormat,
        status: postStatus,
      });
    } else {
      const newPost: MarketingPost = {
        id: `post-${Date.now()}`,
        platform: postPlatform,
        scheduledDate: postDate,
        scheduledTime: postTime,
        title: postTitle.trim(),
        hook: postHook.trim(),
        caption: postCaption.trim(),
        hashtags: tagsArray.length ? tagsArray : ["#SANails"],
        format: postFormat,
        status: postStatus,
      };
      onAddPost(newPost);
    }
    setIsModalOpen(false);
  };

  const handleOpenEdit = (p: MarketingPost) => {
    setEditingPost(p);
    setPostPlatform(p.platform);
    setPostDate(p.scheduledDate);
    setPostTime(p.scheduledTime);
    setPostTitle(p.title);
    setPostHook(p.hook);
    setPostCaption(p.caption);
    setPostHashtags(p.hashtags.join(" "));
    setPostFormat(p.format);
    setPostStatus(p.status);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingPost(null);
    setPostPlatform("TikTok");
    setPostDate(new Date().toISOString().split("T")[0]);
    setPostTime("18:30");
    setPostTitle("");
    setPostHook("");
    setPostCaption("");
    setPostHashtags("#SANails #NailTok #NailInspo #SouthAfricaNails");
    setPostFormat("Before & After Timelapse");
    setPostStatus("scheduled");
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    const rows = posts.map((p) => ({
      "Platform": p.platform,
      "Title": p.title,
      "Scheduled Date": p.scheduledDate,
      "Scheduled Time": p.scheduledTime,
      "Hook": p.hook,
      "Format": p.format,
      "Status": p.status,
      "Caption": p.caption,
      "Hashtags": p.hashtags.join(" "),
    }));
    exportToCSV(`nail_marketing_calendar_${new Date().toISOString().split("T")[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900">Marketing & TikTok Suite</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Powered
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Generate viral TikTok & Instagram nail video ideas, schedule peak posting times for South African audiences, and copy captions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            title="Export marketing schedule to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Calendar</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Post</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => setActiveSubTab("ai_generator")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeSubTab === "ai_generator"
              ? "bg-stone-900 text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <Sparkles className="w-4 h-4 text-rose-300" />
          <span>AI Idea & Hook Generator</span>
        </button>

        <button
          onClick={() => setActiveSubTab("calendar")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeSubTab === "calendar"
              ? "bg-stone-900 text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Scheduled Dates & Times ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("simulator")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeSubTab === "simulator"
              ? "bg-stone-900 text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Social Media Simulator</span>
        </button>
      </div>

      {/* South African Peak Posting Hours Advice Banner */}
      <div className="p-4 rounded-2xl bg-stone-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-stone-100">Optimal South African (SAST) Posting Times</h4>
            <p className="text-xs text-stone-400 mt-0.5">
              Target these daily peak engagement windows for nail videos & booking calls:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="font-bold text-rose-300">07:30 - 09:00</div>
            <div className="text-[10px] text-stone-400">Morning Commute</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="font-bold text-rose-300">12:30 - 13:45</div>
            <div className="text-[10px] text-stone-400">Lunch Scrolling</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="font-bold text-emerald-400 font-extrabold">18:30 - 20:30 🔥</div>
            <div className="text-[10px] text-stone-400">Evening Prime Peak</div>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: AI GENERATOR */}
      {activeSubTab === "ai_generator" && (
        <div className="space-y-6">
          {/* Controls Card */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Customize AI Marketing Prompt
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Social Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as SocialPlatform)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50"
                >
                  <option value="TikTok">TikTok (Viral Video)</option>
                  <option value="Instagram">Instagram (Reels & Feed)</option>
                  <option value="WhatsApp Status">WhatsApp Status (Direct Bookings)</option>
                  <option value="Facebook">Facebook Salon Page</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Treatment / Service Focus
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50"
                >
                  <option value="Acrylic Extensions">Acrylic Full Sets & Ombré</option>
                  <option value="BIAB & Gel Overlays">BIAB Natural Builder Gel</option>
                  <option value="Glazed Donut & Chrome Art">Chrome & 3D Luxury Nail Art</option>
                  <option value="Spa Pedicures">Deluxe Spa Pedicures</option>
                  <option value="Payday Specials & Packages">Payday Weekend Specials</option>
                  <option value="Matric Dance / Bridal">Matric Dance & Bridal Nails</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Content Vibe & Tone
                </label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50"
                >
                  <option value="Viral & Scroll-stopping">Viral & High Hook (3-sec)</option>
                  <option value="Aesthetic & ASMR">Satisfying ASMR & Aesthetic</option>
                  <option value="Educational & Nail Care">Educational & Apex Architecture</option>
                  <option value="High-End Luxury">High-End Luxury Studio</option>
                  <option value="Humorous & Relatable">Relatable Nail Tech Diaries</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  South African Context / Season
                </label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50"
                >
                  <option value="Payday Weekend & Month-End">Payday Weekend Month-End</option>
                  <option value="Matric Dance Season">Matric Dance Season</option>
                  <option value="Summer & Festive Holiday">Summer & Festive Holiday</option>
                  <option value="Autumn / Winter Moody Nails">Autumn & Winter Warm Tones</option>
                  <option value="Spring Pastel Fresh Starts">Spring Pastel Fresh Starts</option>
                  <option value="Bridal Wedding Season">Bridal Wedding Season</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              {generationNotice ? (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{generationNotice}</span>
                </div>
              ) : (
                <div className="text-[11px] text-stone-400">
                  Select your platform and treatment focus, then click generate.
                </div>
              )}

              <button
                onClick={handleGenerateIdeas}
                disabled={isGenerating || cooldown > 0}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                <span>
                  {isGenerating
                    ? "Brainstorming with Gemini AI..."
                    : cooldown > 0
                    ? `Ready in ${cooldown}s`
                    : "Generate Fresh Viral Ideas"}
                </span>
              </button>
            </div>
          </div>

          {/* Generated Ideas Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedIdeas.map((idea, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Badge Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-md bg-stone-900 text-white">
                      {idea.platform}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Clock className="w-3 h-3" />
                      {idea.bestPostingTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-stone-900 text-base leading-snug">
                    {idea.title}
                  </h3>

                  {/* 3-sec Hook Box */}
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/70">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-0.5">
                      🎣 3-Second Scroll-Stopping Hook
                    </div>
                    <div className="text-xs font-semibold text-rose-950 italic">
                      "{idea.hook}"
                    </div>
                  </div>

                  {/* Format & Audio Idea */}
                  <div className="text-xs text-stone-600">
                    <strong className="text-stone-800 font-semibold">Video Format:</strong> {idea.format}
                  </div>

                  {/* Caption & Hashtags */}
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-700 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                    {idea.caption}
                  </div>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1">
                    {idea.hashtags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() =>
                      handleCopyText(
                        `${idea.caption}\n\n${idea.hashtags.join(" ")}`,
                        `idea-${index}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 p-1.5"
                  >
                    {copiedId === `idea-${index}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Caption</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleAddIdeaToCalendar(idea)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-stone-900 hover:bg-stone-800 text-white transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Add to Calendar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: CALENDAR & SCHEDULED POSTS */}
      {activeSubTab === "calendar" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-stone-900 text-white">
                      {post.platform}
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        post.status === "posted"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-stone-900 text-sm leading-snug">
                    {post.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {post.scheduledDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {post.scheduledTime} SAST
                    </span>
                  </div>

                  {post.hook && (
                    <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs text-rose-950 font-medium">
                      <strong>Hook:</strong> {post.hook}
                    </div>
                  )}

                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                    {post.caption}
                  </p>

                  <div className="flex flex-wrap gap-1 text-[11px] text-stone-400 font-medium">
                    {post.hashtags.slice(0, 4).join(" ")}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSimulatedPost(post);
                      setActiveSubTab("simulator");
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-900"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Preview Phone</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(post)}
                      className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
              <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="font-semibold text-stone-800 text-sm">No scheduled marketing posts</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Generate ideas with Gemini AI or schedule your own TikTok & Instagram posting dates and times.
              </p>
              <button
                onClick={() => setActiveSubTab("ai_generator")}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-xl"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-300" />
                Generate AI Ideas
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: PHONE SIMULATOR */}
      {activeSubTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Post Selection List */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="font-bold text-stone-900 text-sm">Select Post to Preview & Export</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {posts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSimulatedPost(p)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    simulatedPost?.id === p.id
                      ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900/10"
                      : "border-stone-200 bg-white hover:bg-stone-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                      {p.platform}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {p.scheduledDate} @ {p.scheduledTime}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-stone-900 truncate">
                    {p.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulated Mobile Mockup Screen */}
          <div className="lg:col-span-7 flex justify-center">
            {simulatedPost ? (
              <div className="w-[330px] rounded-[38px] bg-stone-950 p-4 text-white shadow-2xl border-4 border-stone-800 relative overflow-hidden flex flex-col justify-between min-h-[560px]">
                {/* Mock Camera Notch */}
                <div className="w-28 h-4 bg-stone-900 rounded-full mx-auto mb-2"></div>

                {/* Visual Content Placeholder with Aesthetic Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-rose-950/40 to-stone-950 -z-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl mb-3 shadow-inner">
                    💅
                  </div>
                  <div className="p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-rose-200 max-w-[260px]">
                    "{simulatedPost.hook}"
                  </div>
                  <div className="text-[10px] text-stone-400 mt-2">
                    {simulatedPost.format}
                  </div>
                </div>

                {/* Right Side Social Action Icons (TikTok/Reels style) */}
                <div className="self-end space-y-4 pr-1 mt-auto mb-16 z-10 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-base">
                      ❤️
                    </div>
                    <span className="text-[10px] font-bold mt-0.5">3.4k</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-base">
                      💬
                    </div>
                    <span className="text-[10px] font-bold mt-0.5">142</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-base">
                      🔖
                    </div>
                    <span className="text-[10px] font-bold mt-0.5">890</span>
                  </div>
                </div>

                {/* Bottom Overlay: Account, Caption, Audio */}
                <div className="z-10 space-y-2 bg-gradient-to-t from-black via-black/80 to-transparent p-3 -mx-4 -mb-4 pt-8 rounded-b-[34px]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-500 font-bold text-[11px] flex items-center justify-center">
                      LC
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        @{salon.salonName.toLowerCase().replace(/\s+/g, "")}
                      </div>
                      <div className="text-[10px] text-stone-400">{salon.city}</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-200 line-clamp-3 leading-relaxed">
                    {simulatedPost.caption}
                  </p>

                  <div className="text-[10px] text-rose-300 font-semibold truncate">
                    {simulatedPost.hashtags.join(" ")}
                  </div>

                  {/* 1-Tap Copy / Share Action */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleCopyText(
                          `${simulatedPost.caption}\n\n${simulatedPost.hashtags.join(" ")}`,
                          "sim-post"
                        )
                      }
                      className="flex-1 py-2 text-xs font-bold rounded-xl bg-white text-stone-900 hover:bg-stone-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {copiedId === "sim-post" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Caption & Tags</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-stone-400">
                Select a post to view preview.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Schedule Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-900">
                {editingPost ? "Edit Scheduled Post" : "Schedule New Social Media Post"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Platform
                  </label>
                  <select
                    value={postPlatform}
                    onChange={(e) => setPostPlatform(e.target.value as SocialPlatform)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200"
                  >
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp Status">WhatsApp Status</option>
                    <option value="Facebook">Facebook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={postDate}
                    onChange={(e) => setPostDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Posting Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={postTime}
                    onChange={(e) => setPostTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Post Concept Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4-Week Rebuild & Cuticle Care"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  3-Second Hook (On-Screen Text)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stop doing this to your natural nails! 🛑💅"
                  value={postHook}
                  onChange={(e) => setPostHook(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Caption & Call to Action (Include ZAR Price)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write caption, mention salon location, R prices, and WhatsApp link."
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Trending Hashtags
                </label>
                <input
                  type="text"
                  value={postHashtags}
                  onChange={(e) => setPostHashtags(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Format
                  </label>
                  <input
                    type="text"
                    value={postFormat}
                    onChange={(e) => setPostFormat(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Status
                  </label>
                  <select
                    value={postStatus}
                    onChange={(e) => setPostStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="posted">Posted</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs"
                >
                  {editingPost ? "Save Changes" : "Save to Calendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
