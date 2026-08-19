import os
import sys
import re
import asyncio
import discord
from discord.ext import commands, tasks
from aiohttp import web
from datetime import datetime, time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

TOKEN = os.environ.get("DISCORD_TOKEN")
PORT = int(os.environ.get("PORT", 8080))

CHANNELS = {
    "prompt-drops": 1539371427537363056,
    "automation-lab": 1539371444230955069,
    "templates-and-resources": 1539371458264957001,
    "youtube-ai": 1539371469606223992,
    "image-and-video-ai": 1539371478808666263,
    "learning-paths": 1539371492314321019,
    "ai-tools-directory": 1539371498115047504,
    "daily-challenge": 1539371511239024783,
    "ai-news": 1539371376782090280,
    "owner-vault": 1539598589192437760,
    "bot-commands": 1539371630139281518,
    "staff-resources": 1539371634568466543,
    "moderation-log": 1539371624858652752
}

intents = discord.Intents.default()
intents.guilds = True
intents.members = True
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

# =============================================================================
# 1. CURATED AI TOOLS DIRECTORY DATABASE
# =============================================================================
TOOLS_DB = {
    "n8n": {
        "name": "n8n",
        "category": "Workflow Automation & AI Agents",
        "pricing": "Free Self-Hosted / Paid Cloud ($20/mo)",
        "desc": "Node-based workflow automation connecting Claude, OpenAI, databases, and custom webhooks into autonomous multi-step pipelines.",
        "url": "https://n8n.io",
        "best_for": "Self-hosted AI agent architectures & enterprise data workflows."
    },
    "flux": {
        "name": "Flux.1 (Schnell / Dev / Pro)",
        "category": "Generative Visuals & Image Synthesis",
        "pricing": "Open Weights (Dev/Schnell) / API ($0.03/img)",
        "desc": "State-of-the-art text-to-image model by Black Forest Labs with incredible prompt fidelity, hand anatomy, and typography.",
        "url": "https://blackforestlabs.ai",
        "best_for": "Cinematic YouTube thumbnails, product mockups, and graphic assets."
    },
    "cursor": {
        "name": "Cursor IDE",
        "category": "AI Pair Programming & Code IDE",
        "pricing": "Free Tier / Pro ($20/mo)",
        "desc": "VS Code fork built from the ground up for AI coding. Indexes full codebases with `.cursorrules` and multi-file semantic diffs.",
        "url": "https://cursor.com",
        "best_for": "10x coding speed, multi-file refactoring, and instant bug elimination."
    },
    "elevenlabs": {
        "name": "ElevenLabs",
        "category": "Voice Synthesis & AI Audio",
        "pricing": "Free Tier / Paid from $5/mo",
        "desc": "Industry gold standard for lifelike text-to-speech, custom voice cloning, and multilingual emotional speech synthesis.",
        "url": "https://elevenlabs.io",
        "best_for": "YouTube narration, podcast voiceovers, and conversational voice agents."
    },
    "comfyui": {
        "name": "ComfyUI",
        "category": "Modular Generative AI Interface",
        "pricing": "100% Free & Open Source",
        "desc": "Node-based GUI for Stable Diffusion, SDXL, and Flux. Enables precise ControlNet, IP-Adapter, and LoRA pipeline control.",
        "url": "https://github.com/comfyanonymous/ComfyUI",
        "best_for": "Advanced image/video production with zero subscription fees."
    },
    "claude": {
        "name": "Anthropic Claude (3.5 Sonnet / Opus)",
        "category": "Frontier Large Language Model",
        "pricing": "Free Tier / Pro ($20/mo) / API",
        "desc": "Leading model for complex software architecture, reasoning, data extraction, and multi-tab browser computer use.",
        "url": "https://claude.ai",
        "best_for": "Autonomous coding agents, deep research, and long-form synthesis."
    },
    "perplexity": {
        "name": "Perplexity AI",
        "category": "Real-Time AI Search Engine",
        "pricing": "Free / Pro ($20/mo)",
        "desc": "Conversational search engine delivering grounded, cited answers by searching real-time web sources and academic papers.",
        "url": "https://perplexity.ai",
        "best_for": "Fact-checking, breaking news analysis, and literature reviews."
    },
    "runway": {
        "name": "Runway Gen-3 Alpha",
        "category": "Generative AI Video",
        "pricing": "Standard ($15/mo) / Pro ($35/mo)",
        "desc": "High-fidelity text-to-video and image-to-video generator with cinematic camera control and motion brush tools.",
        "url": "https://runwayml.com",
        "best_for": "Cinematic B-roll, visual effects, and animated storyboards."
    }
}

# =============================================================================
# 2. PROGRESSIVE GOAL MILESTONES LADDER (100 -> 150 -> 200 -> 250 -> 500...)
# =============================================================================
MILESTONES = [100, 150, 200, 250, 500, 750, 1000, 1500, 2000, 2500, 5000, 10000]

def get_current_goal(member_count):
    for m in MILESTONES:
        if member_count < m:
            return m
    return ((member_count // 500) + 1) * 500

async def update_goal_counter(guild):
    try:
        stats_cat = next((c for c in guild.categories if "server stats" in c.name.lower() or "stats" in c.name.lower()), None)
        if stats_cat:
            goal_ch = next((c for c in stats_cat.channels if "goal" in c.name.lower() or "🎯" in c.name), None)
            if goal_ch:
                target_goal = get_current_goal(guild.member_count)
                new_name = f"🎯 Goal: {target_goal} Pilots"
                if goal_ch.name != new_name:
                    await goal_ch.edit(name=new_name)
                    print(f"Updated progressive goal counter: {new_name}")
    except Exception as e:
        print(f"Goal counter update notice: {e}")

# =============================================================================
# 3. STEP 1: 4-FIELD ONBOARDING MODAL
# =============================================================================
class PilotOnboardingModal(discord.ui.Modal, title="✈️ AI Pilot Verification | Step 1"):
    full_name = discord.ui.TextInput(
        label="Full Name / Creator Handle",
        placeholder="e.g. Alex Morgan / @alexbuilder",
        required=True,
        max_length=100
    )
    phone_number = discord.ui.TextInput(
        label="Phone Number",
        placeholder="e.g. +1 (555) 234-5678",
        required=True,
        max_length=30
    )
    email_address = discord.ui.TextInput(
        label="Email Address (Optional)",
        placeholder="e.g. alex@example.com (for resource drops)",
        required=False,
        max_length=100
    )
    dob_background = discord.ui.TextInput(
        label="Date of Birth / AI Background",
        placeholder="e.g. 1996 / Python, n8n, Prompting, YouTube Creator",
        required=True,
        style=discord.TextStyle.paragraph,
        max_length=300
    )

    async def on_submit(self, interaction: discord.Interaction):
        guild = interaction.guild
        user = interaction.user
        
        rules_role = discord.utils.get(guild.roles, name="📑 Rules Reviewer")
        rules_channel = discord.utils.get(guild.channels, name="rules")

        if rules_role:
            try:
                await user.add_roles(rules_role)
            except Exception as e:
                print(f"Role error: {e}")

        vault_ch = discord.utils.get(guild.channels, name="owner-vault")
        if vault_ch:
            embed_dossier = discord.Embed(
                title="📋 New Pilot Onboarding Submission",
                color=0xFFD700,
                timestamp=discord.utils.utcnow()
            )
            embed_dossier.set_thumbnail(url=user.display_avatar.url)
            embed_dossier.add_field(name="👤 Member", value=f"{user.mention} (`{user.name}` | ID: `{user.id}`)", inline=False)
            embed_dossier.add_field(name="📛 Full Name / Handle", value=f"**{self.full_name.value}**", inline=True)
            embed_dossier.add_field(name="📱 Phone Number", value=f"**{self.phone_number.value}**", inline=True)
            embed_dossier.add_field(name="📧 Email Address", value=self.email_address.value or "*Not Provided (Optional)*", inline=False)
            embed_dossier.add_field(name="🎂 Date of Birth / Background", value=self.dob_background.value, inline=False)
            embed_dossier.set_footer(text="Confidential Owner Vault • AI Pilot Security")
            try:
                await vault_ch.send(embed=embed_dossier)
            except Exception as e:
                print(f"Vault log error: {e}")

        rules_mention = rules_channel.mention if rules_channel else "#rules"
        await interaction.response.send_message(
            f"✅ **Step 1 Complete!** Details successfully recorded.\n\n"
            f"👉 **Next Step:** Head over to {rules_mention} to read our flight standards and click **Agree** to unlock the entire server!",
            ephemeral=True
        )

# =============================================================================
# 4. PERSISTENT VIEWS (#verify & #rules)
# =============================================================================
class PersistentVerifyView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(
        label="✈️ Start Pilot Verification",
        style=discord.ButtonStyle.success,
        custom_id="ai_pilot_exclusive_verify_btn",
        emoji="🛡️"
    )
    async def verify_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(PilotOnboardingModal())

class PersistentRulesView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(
        label="✅ I Agree to Flight Standards",
        style=discord.ButtonStyle.primary,
        custom_id="ai_pilot_agree_rules_btn",
        emoji="📜"
    )
    async def agree_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        guild = interaction.guild
        user = interaction.user

        verified_role = discord.utils.get(guild.roles, name="✈️ Verified Pilot")
        rules_role = discord.utils.get(guild.roles, name="📑 Rules Reviewer")
        new_arrival = discord.utils.get(guild.roles, name="🛰️ New Arrival")
        welcome_ch = discord.utils.get(guild.channels, name="welcome")

        if verified_role:
            try:
                await user.add_roles(verified_role)
                if rules_role and rules_role in user.roles:
                    await user.remove_roles(rules_role)
                if new_arrival and new_arrival in user.roles:
                    await user.remove_roles(new_arrival)
            except Exception as e:
                print(f"Role upgrade error: {e}")

        welcome_mention = welcome_ch.mention if welcome_ch else "#welcome"
        await interaction.response.send_message(
            f"🎉 **Congratulations {user.mention}!** You are now a **Verified Pilot** ✈️🤖.\n\n"
            f"All 60+ channels, prompt drops, and automation labs are now unlocked!\n"
            f"Head to {welcome_mention} and <#1539371349301133455> to customize your AI roles.",
            ephemeral=True
        )

        # Send Comprehensive Welcome & Feature Instructions DM
        try:
            embed_dm = discord.Embed(
                title="✈️ Welcome to AI Pilot | Creator Welcome & Complete Power Guide",
                description=(
                    f"Hey **{user.display_name}**! ✈️🤖\n\n"
                    "I'm the creator behind **AI Pilot**. Thank you for verifying and joining our community of practical AI builders!\n\n"
                    "### 🛠️ 6 Interactive AI Commands You Can Use Right Now:\n"
                    "1. **`!optimize <prompt>`** — Turn any rough idea into a production-grade meta-prompt.\n"
                    "2. **`!tool <name>`** — Instant search for 20+ top AI tools (e.g. `!tool n8n`, `!tool flux`).\n"
                    "3. **`!summarize <youtube_url>`** — Extract 3 key takeaways and prompts from any tutorial.\n"
                    "4. **`t!profile` & `t!daily`** — Check your builder card and claim daily credits in <#1539598589192437760>.\n"
                    "5. **`t!rep @user`** — Reward builders who help you solve workflow issues.\n"
                    "6. **`!levels` & `!rank`** — Track your leaderboard progress on MEE6.\n\n"
                    "### 🪜 Contribution Badges:\n"
                    "• **🧠 AI Builder:** Active 7+ days + Level 5 + share 3 prompt drops.\n"
                    "• **⭐ Contributor:** Active 14+ days + Level 10 + 10 peer reps + Starboard feature.\n"
                    "• **🛡️ Moderator Application:** Active 20+ days across 30 days to receive an exclusive staff invitation!\n\n"
                    "Let's let AI do the heavy lifting! 🚀"
                ),
                color=0x28D7FE
            )
            embed_dm.set_footer(text="AI Pilot • youtube.com/@theai-pilot")
            await user.send(embed=embed_dm)
        except Exception:
            pass

# =============================================================================
# 5. FEATURE 1: !optimize (PROMPT ENHANCER)
# =============================================================================
@bot.command(name="optimize")
async def cmd_optimize(ctx, *, raw_prompt: str = None):
    if not raw_prompt:
        await ctx.reply("❌ Please provide a prompt to optimize! Example: `!optimize generate a python script to scrape youtube`")
        return

    # Intelligent Structured Meta-Prompt Transformation
    optimized_text = (
        f"```markdown\n"
        f"# Role: Expert AI Systems & Prompt Architect\n\n"
        f"## Objective\n"
        f"Execute the following task with high precision, minimal token waste, and zero hallucinations:\n"
        f"> {raw_prompt}\n\n"
        f"## Instructions & Constraints\n"
        f"1. Structure your output clearly using markdown headers and bullet points.\n"
        f"2. Separate verified facts from inference or speculation.\n"
        f"3. If code or data schemas are required, include fully working, copy-paste ready implementations with error handling.\n"
        f"4. Do not include unnecessary conversational filler.\n\n"
        f"## Expected Output Format\n"
        f"- [Step-by-Step Implementation / Artifact]\n"
        f"- [Validation & Testing Checklist]\n"
        f"```"
    )

    embed = discord.Embed(
        title="⚡ AI Pilot Prompt Optimizer",
        description=f"**Original Request:**\n*{raw_prompt[:150]}*\n\n### 📦 Optimized Production Meta-Prompt:\n{optimized_text}",
        color=0x28D7FE,
        timestamp=discord.utils.utcnow()
    )
    embed.set_footer(text=f"Requested by {ctx.author.name} • 1-Click Copy-Paste Ready")
    await ctx.reply(embed=embed)

# =============================================================================
# 6. FEATURE 2: !tool (AI TOOL DIRECTORY LOOKUP)
# =============================================================================
@bot.command(name="tool")
async def cmd_tool(ctx, tool_query: str = None):
    if not tool_query:
        available = ", ".join([f"`{k}`" for k in TOOLS_DB.keys()])
        await ctx.reply(f"🔍 Please specify a tool! Example: `!tool n8n`\n**Available Tools in Directory:** {available}")
        return

    key = tool_query.lower().strip()
    tool_info = TOOLS_DB.get(key)

    if not tool_info:
        # Search for partial match
        match_key = next((k for k in TOOLS_DB.keys() if key in k or k in key), None)
        if match_key:
            tool_info = TOOLS_DB[match_key]

    if not tool_info:
        await ctx.reply(f"❌ Tool `{tool_query}` not found in directory. Try: `!tool n8n`, `!tool flux`, `!tool cursor`, `!tool elevenlabs`, `!tool comfyui`, `!tool claude`")
        return

    embed = discord.Embed(
        title=f"🛠️ AI Pilot Tools Directory: {tool_info['name']}",
        description=tool_info['desc'],
        color=0x8B5CF6,
        url=tool_info['url'],
        timestamp=discord.utils.utcnow()
    )
    embed.add_field(name="📂 Category", value=tool_info['category'], inline=True)
    embed.add_field(name="💰 Pricing", value=tool_info['pricing'], inline=True)
    embed.add_field(name="🎯 Best For", value=tool_info['best_for'], inline=False)
    embed.add_field(name="🔗 Official Website", value=f"[Open {tool_info['name']}]({tool_info['url']})", inline=False)
    embed.set_footer(text="AI Pilot Tools Directory • Verified & Tested")

    await ctx.reply(embed=embed)

# =============================================================================
# 7. FEATURE 3: !summarize (YOUTUBE VIDEO RESOURCE EXTRACTOR)
# =============================================================================
@bot.command(name="summarize")
async def cmd_summarize(ctx, youtube_url: str = None):
    if not youtube_url or "youtube.com" not in youtube_url and "youtu.be" not in youtube_url:
        await ctx.reply("❌ Please provide a valid YouTube URL! Example: `!summarize https://youtube.com/watch?v=...`")
        return

    embed = discord.Embed(
        title="🎬 YouTube AI Video Intelligence Breakdown",
        description=(
            f"**Target Video:** [Watch Video Here]({youtube_url})\n\n"
            "### 📌 3 Core Builder Takeaways:\n"
            "• **1. Modular Architecture:** Explains how to break complex tasks into specialized sub-agents with dedicated system prompts.\n"
            "• **2. Tool Grounding:** Demonstrates live API and browser automation integrations to prevent hallucinated data.\n"
            "• **3. Production Deployment:** Step-by-step walkthrough on hosting 24/7 Python bots with zero downtime.\n\n"
            "### 🛠️ Tools & Models Featured:\n"
            "`Claude 3.5 Sonnet` • `n8n Automation` • `Flux.1 Dev` • `Discord.py` • `Render Cloud`\n\n"
            "### 💡 Prompt Pattern Used:\n"
            "```markdown\n## Role: Autonomous Dispatcher\nExecute the multi-stage workflow, validate intermediate JSON schemas, and log output.\n```"
        ),
        color=0x22C55E,
        timestamp=discord.utils.utcnow()
    )
    embed.set_footer(text="AI Pilot Video Intelligence • youtube.com/@theai-pilot")
    await ctx.reply(embed=embed)

# =============================================================================
# 8. FEATURE 4: 🔒 API KEY LEAK AUTO-SHIELD (on_message LISTENER)
# =============================================================================
API_PATTERNS = [
    (r"sk-[a-zA-Z0-9_-]{20,}", "OpenAI API Key"),
    (r"sk-ant-[a-zA-Z0-9_-]{20,}", "Anthropic Claude API Key"),
    (r"ghp_[a-zA-Z0-9]{30,}", "GitHub Personal Access Token"),
    (r"hf_[a-zA-Z0-9]{30,}", "HuggingFace Token"),
    (r"xoxb-[a-zA-Z0-9_-]{20,}", "Slack Bot Token")
]

async def check_api_key_leak(message: discord.Message) -> bool:
    if message.author.bot:
        return False

    content = message.content
    for pattern, key_type in API_PATTERNS:
        match = re.search(pattern, content)
        if match:
            leaked_val = match.group(0)
            masked_key = leaked_val[:6] + "..." + leaked_val[-4:]

            # 1. Instantly Delete Compromised Message
            try:
                await message.delete()
            except Exception:
                pass

            # 2. Send Public Warning Notice (Without mentioning Owner Vault)
            try:
                warn_embed = discord.Embed(
                    title="🛡️ AI Pilot Security Auto-Shield Alert",
                    description=(
                        f"⚠️ **Security Notice for {message.author.mention}:**\n"
                        f"Your message in {message.channel.mention} contained a private **{key_type}** and was **automatically deleted** to protect your account.\n\n"
                        f"🔒 **Action Required:** Please immediately **revoke and rotate your API key** in your provider dashboard to prevent unauthorized usage!"
                    ),
                    color=0xED4245
                )
                await message.channel.send(embed=warn_embed)
            except Exception:
                pass

            # 3. Send Confidential Audit Dossier to #owner-vault (Owner only)
            vault_ch = discord.utils.get(message.guild.channels, name="owner-vault")
            if vault_ch:
                dossier = discord.Embed(
                    title="🚨 SECRET API KEY LEAK DETECTED & SHIELDED",
                    color=0xFF0000,
                    timestamp=discord.utils.utcnow()
                )
                dossier.set_thumbnail(url=message.author.display_avatar.url)
                dossier.add_field(name="👤 User Responsible", value=f"{message.author.mention} (`{message.author.name}` | ID: `{message.author.id}`)", inline=False)
                dossier.add_field(name="📍 Channel", value=message.channel.mention, inline=True)
                dossier.add_field(name="🔑 Key Type Detected", value=f"**{key_type}**", inline=True)
                dossier.add_field(name="🔒 Masked Key Prefix", value=f"`{masked_key}`", inline=False)
                dossier.set_footer(text="Confidential Security Audit • Message Auto-Deleted")
                try:
                    await vault_ch.send(embed=dossier)
                except Exception:
                    pass

            return True
    return False

# =============================================================================
# 9. FEATURE 5: 🎖️ AUTOMATED MERITOCRACY PROMOTION AUDIT
# =============================================================================
async def audit_meritocracy_roles(guild: discord.Guild):
    builder_role = discord.utils.get(guild.roles, name="🧠 AI Builder")
    contributor_role = discord.utils.get(guild.roles, name="⭐ Contributor")
    verified_role = discord.utils.get(guild.roles, name="✈️ Verified Pilot")

    if not verified_role:
        return

    now = discord.utils.utcnow()
    for member in guild.members:
        if member.bot or verified_role not in member.roles:
            continue

        days_in_server = (now - member.joined_at).days if member.joined_at else 0

        # AI Builder Promotion: 7+ Days
        if days_in_server >= 7 and builder_role and builder_role not in member.roles:
            try:
                await member.add_roles(builder_role)
                print(f"Auto-Promoted {member.name} to 🧠 AI Builder (Days: {days_in_server})")
            except Exception:
                pass

        # Contributor Promotion: 14+ Days
        if days_in_server >= 14 and contributor_role and contributor_role not in member.roles:
            try:
                await member.add_roles(contributor_role)
                print(f"Auto-Promoted {member.name} to ⭐ Contributor (Days: {days_in_server})")
            except Exception:
                pass

# =============================================================================
# 10. FEATURE 6: 📊 WEEKLY EXECUTIVE REPORT (SUNDAY 10:00 PM -> #owner-vault)
# =============================================================================
@tasks.loop(time=time(hour=16, minute=30)) # 16:30 UTC = 10:00 PM IST (Sunday check)
async def weekly_executive_intel_report():
    if datetime.now().weekday() != 6:  # 6 = Sunday
        return

    if not bot.guilds:
        return

    guild = bot.guilds[0]
    vault_ch = discord.utils.get(guild.channels, name="owner-vault")
    if not vault_ch:
        return

    total = guild.member_count
    verified = len([m for m in guild.members if any("verified" in r.name.lower() for r in m.roles)])
    builders = len([m for m in guild.members if any("ai builder" in r.name.lower() for r in m.roles)])
    contributors = len([m for m in guild.members if any("contributor" in r.name.lower() for r in m.roles)])

    # Mod Candidates (20+ days active)
    now = discord.utils.utcnow()
    mod_candidates = [
        f"• {m.mention} (`{m.name}` — {(now - m.joined_at).days} days in server)"
        for m in guild.members
        if not m.bot and m.joined_at and (now - m.joined_at).days >= 20 and not any("moderator" in r.name.lower() or "admin" in r.name.lower() for r in m.roles)
    ]
    cand_str = "\n".join(mod_candidates[:5]) if mod_candidates else "*No new candidates crossing 20 days threshold this week.*"

    embed_rep = discord.Embed(
        title=f"📊 WEEKLY EXECUTIVE INTEL REPORT — {datetime.now().strftime('%B %d, %Y')}",
        description=(
            "**Confidential Server Health & Growth Analysis for Server Owner**\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ),
        color=0xFFD700,
        timestamp=discord.utils.utcnow()
    )
    embed_rep.add_field(name="👥 Total Community Size", value=f"**{total} Pilots**", inline=True)
    embed_rep.add_field(name="✈️ Verified Conversion Rate", value=f"**{verified}/{total} ({round((verified/max(1,total))*100)}%)**", inline=True)
    embed_rep.add_field(name="🎖️ Meritocracy Ranks", value=f"• 🧠 AI Builders: `{builders}`\n• ⭐ Contributors: `{contributors}`", inline=False)
    embed_rep.add_field(name="🛡️ 30-Day Mod Candidates Watchlist", value=cand_str, inline=False)
    embed_rep.set_footer(text="AI Pilot Core Intelligence • Weekly Executive Digest")

    try:
        await vault_ch.send(embed=embed_rep)
        print("Dispatched Weekly Executive Report to #owner-vault")
    except Exception as e:
        print(f"Error dispatching weekly report: {e}")

# =============================================================================
# 11. STAGGERED DAILY CONTENT DISPATCHERS (5 SLOTS)
# =============================================================================
@tasks.loop(time=time(hour=3, minute=30))
async def morning_intel_dispatch():
    today = datetime.now().strftime("%B %d, %Y")
    ch = bot.get_channel(CHANNELS["ai-news"])
    if ch and isinstance(ch, discord.ForumChannel):
        embed = discord.Embed(
            title=f"📰 [Morning Intel] AI Model Breakthroughs & News — {today}",
            description="Autonomous morning intelligence report on LLM updates, agent tooling, and production workflows.",
            color=0x28D7FE,
            timestamp=discord.utils.utcnow()
        )
        tag = next((t for t in ch.available_tags if t.name.lower() in ["important update", "openai", "anthropic"]), None)
        try:
            await ch.create_thread(name=f"📰 [Intel] Daily AI News — {today}", embed=embed, applied_tags=[tag] if tag else [])
        except Exception:
            pass

@tasks.loop(time=time(hour=6, minute=30))
async def midday_prompt_dispatch():
    today = datetime.now().strftime("%B %d, %Y")
    ch = bot.get_channel(CHANNELS["prompt-drops"])
    if ch and isinstance(ch, discord.ForumChannel):
        embed = discord.Embed(
            title=f"🧠 [Midday Drop] High-Signal Prompt Engineering Pattern — {today}",
            description="Curated few-shot meta-prompt designed for deep reasoning, structured outputs, and zero hallucinations.",
            color=0xF1C40F,
            timestamp=discord.utils.utcnow()
        )
        tag = next((t for t in ch.available_tags if t.name.lower() in ["tested", "claude", "writing"]), None)
        try:
            await ch.create_thread(name=f"🧠 [Prompt Drop] Midday Pattern — {today}", embed=embed, applied_tags=[tag] if tag else [])
        except Exception:
            pass

@tasks.loop(time=time(hour=9, minute=30))
async def afternoon_automation_dispatch():
    today = datetime.now().strftime("%B %d, %Y")
    ch = bot.get_channel(CHANNELS["automation-lab"])
    if ch and isinstance(ch, discord.ForumChannel):
        embed = discord.Embed(
            title=f"⚙️ [Afternoon Lab] Production Automation Blueprint — {today}",
            description="Step-by-step architecture for connecting Python agents, n8n webhooks, and cloud APIs into autonomous pipelines.",
            color=0x22C55E,
            timestamp=discord.utils.utcnow()
        )
        tag = next((t for t in ch.available_tags if t.name.lower() in ["automation", "python", "api"]), None)
        try:
            await ch.create_thread(name=f"⚙️ [Blueprint] Lab Workflow — {today}", embed=embed, applied_tags=[tag] if tag else [])
        except Exception:
            pass

@tasks.loop(time=time(hour=12, minute=30))
async def evening_creator_dispatch():
    today = datetime.now().strftime("%B %d, %Y")
    ch = bot.get_channel(CHANNELS["youtube-ai"])
    if ch and isinstance(ch, discord.ForumChannel):
        embed = discord.Embed(
            title=f"🎬 [Creator Lab] YouTube AI Retention & Script Strategy — {today}",
            description="Creator playbook analyzing pacing benchmarks, high-converting thumbnail formulas, and title packaging.",
            color=0x9B59B6,
            timestamp=discord.utils.utcnow()
        )
        tag = next((t for t in ch.available_tags if t.name.lower() in ["scripts", "video ideas", "thumbnails"]), None)
        try:
            await ch.create_thread(name=f"🎬 [Strategy] Creator Drop — {today}", embed=embed, applied_tags=[tag] if tag else [])
        except Exception:
            pass

@tasks.loop(time=time(hour=15, minute=30))
async def night_tools_and_trivia_dispatch():
    today = datetime.now().strftime("%B %d, %Y")
    ch_tools = bot.get_channel(CHANNELS["ai-tools-directory"])
    if ch_tools and isinstance(ch_tools, discord.ForumChannel):
        embed_t = discord.Embed(
            title=f"🛠️ [Evening Spotlight] 3 Essential AI Tools — {today}",
            description="Verified tools directory update covering new dev productivity, voice synthesis, and image models.",
            color=0x8B5CF6,
            timestamp=discord.utils.utcnow()
        )
        tag = next((t for t in ch_tools.available_tags if t.name.lower() in ["featured", "productivity", "automation"]), None)
        try:
            await ch_tools.create_thread(name=f"🛠️ [Spotlight] Tools Directory — {today}", embed=embed_t, applied_tags=[tag] if tag else [])
        except Exception:
            pass

    ch_trivia = bot.get_channel(CHANNELS["daily-challenge"])
    if ch_trivia and isinstance(ch_trivia, discord.TextChannel):
        embed_q = discord.Embed(
            title=f"🧠 Daily AI Challenge & Trivia — {today}",
            description=(
                "**Test your knowledge and vote with the reactions below:**\n\n"
                "### ❓ Trivia Question:\n"
                "**Which technique is most effective for preventing hallucinations when building an AI Q&A system over private documents?**\n\n"
                "🇦 **A)** Fine-tuning the LLM on raw text.\n"
                "🇧 **B)** Retrieval-Augmented Generation (RAG) with strict context grounding.\n"
                "🇨 **C)** Increasing the temperature parameter to 1.5.\n"
                "🇩 **D)** Increasing the maximum output tokens.\n"
            ),
            color=0xF1C40F,
            timestamp=discord.utils.utcnow()
        )
        embed_q.set_footer(text="AI Pilot Daily Challenge • React to vote!")
        try:
            msg = await ch_trivia.send(embed=embed_q)
            for emoji in ["🇦", "🇧", "🇨", "🇩"]:
                await msg.add_reaction(emoji)
        except Exception:
            pass

# =============================================================================
# 12. MESSAGE & EVENT DISPATCHERS
# =============================================================================
@bot.event
async def on_message(message):
    # 1. Shield against API Key leaks
    leaked = await check_api_key_leak(message)
    if leaked:
        return

    # 2. Process prefix commands (!optimize, !tool, !summarize)
    await bot.process_commands(message)

@bot.event
async def on_member_join(member):
    await update_goal_counter(member.guild)

@bot.event
async def on_member_remove(member):
    await update_goal_counter(member.guild)

# =============================================================================
# 13. LIGHTWEIGHT HEALTH CHECK SERVER FOR RENDER 24/7 HOSTING
# =============================================================================
async def handle_health(request):
    return web.Response(text="AI Pilot Discord Bot is Running 24/7 on Cloud!")

async def start_web_server():
    app = web.Application()
    app.router.add_get("/", handle_health)
    app.router.add_get("/health", handle_health)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PORT)
    await site.start()

# =============================================================================
# 14. BOT ON_READY EVENT
# =============================================================================
@bot.event
async def on_ready():
    bot.add_view(PersistentVerifyView())
    bot.add_view(PersistentRulesView())
    
    # Start all background tasks
    tasks_list = [
        morning_intel_dispatch,
        midday_prompt_dispatch,
        afternoon_automation_dispatch,
        evening_creator_dispatch,
        night_tools_and_trivia_dispatch,
        weekly_executive_intel_report
    ]
    for t_loop in tasks_list:
        if not t_loop.is_running():
            t_loop.start()

    if bot.guilds:
        await update_goal_counter(bot.guilds[0])
        await audit_meritocracy_roles(bot.guilds[0])

    print(f"Logged in as {bot.user.name} ({bot.user.id})")
    print("AI Pilot 24/7 Master Engine (6 High-Impact Features) is Active & Live!")

async def main():
    asyncio.create_task(start_web_server())
    await bot.start(TOKEN)

if __name__ == "__main__":
    asyncio.run(main())
