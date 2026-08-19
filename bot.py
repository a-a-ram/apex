import os
import sys
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
    "staff-resources": 1539371634568466543
}

intents = discord.Intents.default()
intents.guilds = True
intents.members = True
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

# =============================================================================
# PROGRESSIVE GOAL MILESTONES LADDER (100 -> 150 -> 200 -> 250 -> 500...)
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
# 1. STEP 1: 4-FIELD ONBOARDING MODAL
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
# 2. STEP 1 BUTTON VIEW (In #verify)
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

# =============================================================================
# 3. STEP 2 RULES AGREEMENT BUTTON VIEW (In #rules)
# =============================================================================
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
            f"Head to {welcome_mention} and <#1539371349301133455> to choose your AI roles and view the Contribution Roadmap.",
            ephemeral=True
        )

        try:
            embed_dm = discord.Embed(
                title="✈️ Welcome to AI Pilot | Personal Welcome from the Creator",
                description=(
                    f"Hey **{user.display_name}**! ✈️🤖\n\n"
                    "I'm the creator behind **AI Pilot**. Thank you for verifying and joining our community of practical AI builders!\n\n"
                    "### 🚀 How to Level Up & Earn Achievement Badges:\n"
                    "• **🧠 AI Builder Role:** Active 7+ days + Level 5 + share 3 prompts/workflows in forums.\n"
                    "• **⭐ Contributor Role:** Active 14+ days + Level 10 + 10+ peer reps (`t!rep`) + Starboard feature.\n"
                    "• **🛡️ Moderator Invitation:** Active 20+ days across 30 days to receive a private staff invitation!\n\n"
                    "### 🎮 Quick Start:\n"
                    "1. Type `t!profile` in <#1539598589192437760> to check your profile.\n"
                    "2. Type `t!daily` in <#1539598589192437760> to claim daily credits.\n\n"
                    "Let's let AI do the heavy lifting! 🚀"
                ),
                color=0x28D7FE
            )
            embed_dm.set_footer(text="AI Pilot • youtube.com/@theai-pilot")
            await user.send(embed=embed_dm)
        except Exception:
            pass

# =============================================================================
# 4. MODERATOR APPLICATION MODAL
# =============================================================================
class ModApplicationModal(discord.ui.Modal, title="🛡️ Moderator Application | AI Pilot"):
    experience = discord.ui.TextInput(
        label="Why do you want to moderate AI Pilot?",
        placeholder="Describe your background, Discord mod experience, or AI expertise...",
        style=discord.TextStyle.paragraph,
        required=True,
        max_length=500
    )
    availability = discord.ui.TextInput(
        label="Timezone & Daily Availability",
        placeholder="e.g. EST / GMT+5:30 • 2-3 hours daily",
        required=True,
        max_length=100
    )
    scenario = discord.ui.TextInput(
        label="How would you handle a toxic member/spammer?",
        placeholder="Step-by-step actions following server flight standards...",
        style=discord.TextStyle.paragraph,
        required=True,
        max_length=500
    )

    async def on_submit(self, interaction: discord.Interaction):
        user = interaction.user
        vault_ch = discord.utils.get(interaction.guild.channels, name="owner-vault")
        if vault_ch:
            embed_app = discord.Embed(
                title="🛡️ NEW MODERATOR CANDIDATE APPLICATION",
                color=0x8B5CF6,
                timestamp=discord.utils.utcnow()
            )
            embed_app.set_thumbnail(url=user.display_avatar.url)
            embed_app.add_field(name="👤 Applicant", value=f"{user.mention} (`{user.name}` | ID: `{user.id}`)", inline=False)
            embed_app.add_field(name="🕒 Timezone & Availability", value=self.availability.value, inline=False)
            embed_app.add_field(name="🎯 Motivation & Experience", value=self.experience.value, inline=False)
            embed_app.add_field(name="🚨 Conflict Handling Scenario", value=self.scenario.value, inline=False)
            embed_app.set_footer(text="Confidential Owner Review • Assigned Only by Owner")
            await vault_ch.send(embed=embed_app)

        await interaction.response.send_message(
            "✅ **Application Submitted!** Your application has been sent directly to the **Server Owner** for confidential review. Thank you for your dedication!",
            ephemeral=True
        )

# =============================================================================
# 5. STAGGERED MULTI-TIME DAILY DISPATCHERS (5 Different Times Throughout Day)
# =============================================================================

# [Slot 1: 09:00 AM IST / 03:30 UTC] — AI Pilot Updates & AI News
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

# [Slot 2: 12:00 PM IST / 06:30 UTC] — Prompt Library Drop
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

# [Slot 3: 03:00 PM IST / 09:30 UTC] — Automation Lab & Workflow Blueprint
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

# [Slot 4: 06:00 PM IST / 12:30 UTC] — Creator Studio & Visual AI
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

# [Slot 5: 09:00 PM IST / 15:30 UTC] — Tools Spotlight & Daily AI Trivia Challenge
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
# 6. MEMBER JOIN & LEAVE (PROGRESSIVE GOAL AUTO-UPDATER)
# =============================================================================
@bot.event
async def on_member_join(member):
    await update_goal_counter(member.guild)

@bot.event
async def on_member_remove(member):
    await update_goal_counter(member.guild)

# =============================================================================
# 7. LIGHTWEIGHT HEALTH CHECK SERVER FOR RENDER 24/7 HOSTING
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
# 8. BOT EVENTS
# =============================================================================
@bot.event
async def on_ready():
    bot.add_view(PersistentVerifyView())
    bot.add_view(PersistentRulesView())
    
    # Start all 5 staggered loops
    loops = [
        morning_intel_dispatch,
        midday_prompt_dispatch,
        afternoon_automation_dispatch,
        evening_creator_dispatch,
        night_tools_and_trivia_dispatch
    ]
    for lp in loops:
        if not lp.is_running():
            lp.start()

    if bot.guilds:
        await update_goal_counter(bot.guilds[0])
    print(f"Logged in as {bot.user.name} ({bot.user.id})")
    print("AI Pilot 24/7 Cloud Bot & 5 Staggered Daily Content Engines are Live!")

async def main():
    asyncio.create_task(start_web_server())
    await bot.start(TOKEN)

if __name__ == "__main__":
    asyncio.run(main())
