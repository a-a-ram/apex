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
    "ai-news": 1539371376782090280,
    "ai-tools": 1539371498115047504,
    "daily-challenge": 1539371511239024783,
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
# 4. MODERATOR APPLICATION MODAL & COMMAND
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
# 5. DAILY 8:00 PM AUTOMATED DISPATCHER
# =============================================================================
async def dispatch_daily_intel():
    today_str = datetime.now().strftime("%B %d, %Y")

    forum_news = bot.get_channel(CHANNELS["ai-news"])
    if forum_news and isinstance(forum_news, discord.ForumChannel):
        tag_match = next((t for t in forum_news.available_tags if t.name.lower() in ["important update", "openai", "anthropic", "google"]), None)
        applied = [tag_match] if tag_match else []
        embed_news = discord.Embed(
            title=f"📰 Daily AI Intel & Model Breakthroughs — {today_str}",
            description=(
                "Here are today's top curated practical AI developments and high-signal updates for builders:\n\n"
                "### 1️⃣ OpenAI & Next-Gen Reasoning Models\n"
                "• **Chain-of-Thought Optimization:** Advancements in structured multi-step reasoning models for automated code debugging and complex logic.\n"
                "• **Practical Takeaway:** Reduces prompt iteration cycles for complex data extraction and agent tasks.\n\n"
                "### 2️⃣ Anthropic Claude Context & Tool Calling\n"
                "• **Agentic Workflows:** Expanded computer use and automated browser execution capabilities.\n"
                "• **Practical Takeaway:** Ideal for multi-step browser automation and end-to-end research pipelines.\n\n"
                "### 3️⃣ Open-Source Visual & Generative AI\n"
                "• **Flux & ComfyUI LoRA Pipelines:** Community breakthroughs in character consistency and 4K photorealism rendering.\n"
                "• **Practical Takeaway:** Faster thumbnail generation and cinematic B-roll production."
            ),
            color=0x28D7FE,
            timestamp=discord.utils.utcnow()
        )
        embed_news.set_footer(text="AI Pilot Daily Intel • Curated Practical AI")
        try:
            await forum_news.create_thread(
                name=f"📰 [Daily Intel] AI Industry Digest — {today_str}",
                embed=embed_news,
                applied_tags=applied
            )
        except Exception:
            pass

    forum_tools = bot.get_channel(CHANNELS["ai-tools"])
    if forum_tools and isinstance(forum_tools, discord.ForumChannel):
        tag_match = next((t for t in forum_tools.available_tags if t.name.lower() in ["featured", "productivity", "automation"]), None)
        applied = [tag_match] if tag_match else []
        embed_tools = discord.Embed(
            title=f"🛠️ Featured AI Tools of the Day — {today_str}",
            description=(
                "Discover today's top curated tools to level up your workflow:\n\n"
                "### ⚡ Tool 1: n8n (Next-Gen AI Agent Automation)\n"
                "• **Category:** Workflow Automation & Autonomous AI Agents\n"
                "• **Pricing:** Free Self-Hosted / Paid Cloud\n"
                "• **Best For:** Connecting Claude, OpenAI, databases, and webhooks into visual multi-step systems.\n"
                "• **Website:** [n8n.io](https://n8n.io)\n\n"
                "### 🎨 Tool 2: Flux.1 Dev (State-of-the-Art Generative Visuals)\n"
                "• **Category:** Image Generation & Prompt Fidelity\n"
                "• **Pricing:** Open Weights / Cloud APIs\n"
                "• **Best For:** Ultra-crisp typography, anatomy accuracy, and YouTube thumbnail assets.\n"
                "• **Website:** [blackforestlabs.ai](https://blackforestlabs.ai)\n\n"
                "### 🎙️ Tool 3: ElevenLabs (Voice Cloning & Audio Agents)\n"
                "• **Category:** Text-to-Speech & Voice AI\n"
                "• **Pricing:** Free Tier / Commercial Plans\n"
                "• **Best For:** Studio-quality narration, multilingual dubbing, and conversational voice bots.\n"
                "• **Website:** [elevenlabs.io](https://elevenlabs.io)"
            ),
            color=0x8B5CF6,
            timestamp=discord.utils.utcnow()
        )
        embed_tools.set_footer(text="AI Pilot Tools Directory • Verified & Tested")
        try:
            await forum_tools.create_thread(
                name=f"🛠️ [Daily Spotlight] 3 Essential AI Tools — {today_str}",
                embed=embed_tools,
                applied_tags=applied
            )
        except Exception:
            pass

    ch_challenge = bot.get_channel(CHANNELS["daily-challenge"])
    if ch_challenge and isinstance(ch_challenge, discord.TextChannel):
        embed_trivia = discord.Embed(
            title=f"🧠 Daily AI Challenge & Trivia — {today_str}",
            description=(
                "**Welcome to today's community AI challenge!**\n"
                "Test your knowledge and vote with the reaction emojis below:\n\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                "### ❓ Trivia Question:\n"
                "**What does the 'Temperature' parameter primarily control in Large Language Models (LLMs)?**\n\n"
                "🇦 **A)** The speed at which tokens are generated per second.\n"
                "🇧 **B)** The randomness and creativity vs determinism of token selection.\n"
                "🇨 **C)** The maximum context window memory size.\n"
                "🇩 **D)** The floating-point precision of model weights.\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                "👉 **React below with 🇦, 🇧, 🇨, or 🇩 to cast your vote!**\n"
                "*The correct answer and explanation will be revealed in 24 hours!*"
            ),
            color=0xF1C40F,
            timestamp=discord.utils.utcnow()
        )
        embed_trivia.set_footer(text="AI Pilot Daily Challenge • React to vote!")
        try:
            msg = await ch_challenge.send(embed=embed_trivia)
            for emoji in ["🇦", "🇧", "🇨", "🇩"]:
                await msg.add_reaction(emoji)
        except Exception:
            pass

@tasks.loop(time=time(hour=14, minute=30))
async def scheduled_daily_8pm():
    await dispatch_daily_intel()

# =============================================================================
# 6. LIGHTWEIGHT HEALTH CHECK SERVER FOR RENDER 24/7 HOSTING
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
# 7. BOT EVENTS
# =============================================================================
@bot.event
async def on_ready():
    bot.add_view(PersistentVerifyView())
    bot.add_view(PersistentRulesView())
    if not scheduled_daily_8pm.is_running():
        scheduled_daily_8pm.start()
    print(f"Logged in as {bot.user.name} ({bot.user.id})")
    print("AI Pilot 24/7 Cloud Bot & Mod Application Engine is Active!")

async def main():
    asyncio.create_task(start_web_server())
    await bot.start(TOKEN)

if __name__ == "__main__":
    asyncio.run(main())
