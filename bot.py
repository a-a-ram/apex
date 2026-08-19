import os
import sys
import asyncio
import discord
from discord.ext import commands
from aiohttp import web

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

TOKEN = os.environ.get("DISCORD_TOKEN")
PORT = int(os.environ.get("PORT", 8080))

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

        # 1. Grant Intermediate Role (Unlocks #rules)
        if rules_role:
            try:
                await user.add_roles(rules_role)
            except Exception as e:
                print(f"Role error: {e}")

        # 2. Log Dossier to #owner-vault (Owner only)
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

        # 3. Ephemeral Success Confirmation -> Guide to Step 2 (#rules)
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

        # Grant Full Verified Role & Cleanup Temporary Roles
        if verified_role:
            try:
                await user.add_roles(verified_role)
                if rules_role and rules_role in user.roles:
                    await user.remove_roles(rules_role)
                if new_arrival and new_arrival in user.roles:
                    await user.remove_roles(new_arrival)
            except Exception as e:
                print(f"Role upgrade error: {e}")

        # Ephemeral confirmation
        welcome_mention = welcome_ch.mention if welcome_ch else "#welcome"
        await interaction.response.send_message(
            f"🎉 **Congratulations {user.mention}!** You are now a **Verified Pilot** ✈️🤖.\n\n"
            f"All 60+ channels, prompt drops, and automation labs are now unlocked!\n"
            f"Head to {welcome_mention} and <#1539371349301133455> to choose your AI roles.",
            ephemeral=True
        )

        # 1-on-1 Creator Welcome DM
        try:
            embed_dm = discord.Embed(
                title="✈️ Welcome to AI Pilot | Personal Welcome from the Creator",
                description=(
                    f"Hey **{user.display_name}**! ✈️🤖\n\n"
                    "I'm the creator behind **AI Pilot**. Thank you for verifying and joining our community of practical AI builders!\n\n"
                    "### 🚀 3 Quick Tips to Get Started:\n"
                    "1. **📇 Check Your Profile:** Type `t!profile` in <#1539598589192437760> to view your stats and rank.\n"
                    "2. **🎁 Claim Daily Credits:** Type `t!daily` in <#1539598589192437760> to keep your streak alive.\n"
                    "3. **⭐ Reward Builders:** When someone helps you solve a prompt or workflow error, thank them with `t!rep @user`!\n\n"
                    "If you ever have ideas for upcoming YouTube tutorials, drop them in <#1539371413616730154>.\n\n"
                    "Let's let AI do the heavy lifting! 🚀"
                ),
                color=0x28D7FE
            )
            embed_dm.set_footer(text="AI Pilot • youtube.com/@theai-pilot")
            await user.send(embed=embed_dm)
        except Exception:
            pass

# =============================================================================
# 4. LIGHTWEIGHT HEALTH CHECK SERVER FOR RENDER 24/7 HOSTING
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
    print(f"Health server listening on port {PORT}")

# =============================================================================
# 5. BOT EVENTS
# =============================================================================
@bot.event
async def on_ready():
    bot.add_view(PersistentVerifyView())
    bot.add_view(PersistentRulesView())
    print(f"Logged in as {bot.user.name} ({bot.user.id})")
    print("AI Pilot 24/7 Cloud Bot is Ready! Registered Persistent Verify & Rules Views.")

    # 1. Update #verify with Step 1 Embed & Button
    ch_verify = discord.utils.get(bot.get_all_channels(), name="verify")
    if ch_verify:
        await ch_verify.purge(limit=10)
        embed_v = discord.Embed(
            title="🛡️ AI Pilot Gateway | Step 1: Verification & Onboarding",
            description=(
                "Welcome to **AI Pilot** ✈️🤖!\n\n"
                "To ensure a safe, high-signal community and protect against spam, all newcomers begin here.\n\n"
                "### 📋 What You'll Be Asked:\n"
                "• **Full Name / Creator Handle** (Required)\n"
                "• **Phone Number** (Required)\n"
                "• **Email Address** (Optional — for templates & drops)\n"
                "• **Date of Birth / AI Background** (Required)\n\n"
                "🔒 *Your details are securely submitted to the confidential **Owner Vault** and remain 100% private from other members and staff.*\n\n"
                "### 🛫 Step-by-Step Flow:\n"
                "1️⃣ **Step 1:** Click the button below to submit your details.\n"
                "2️⃣ **Step 2:** Agree to Flight Standards in **#rules**.\n"
                "3️⃣ **Step 3:** Enter **#welcome** and unlock all 60+ channels!"
            ),
            color=0x22C55E
        )
        embed_v.set_footer(text="AI Pilot Security Core • Step 1 of 2")
        await ch_verify.send(embed=embed_v, view=PersistentVerifyView())
        print("Updated #verify with persistent Step 1 verification button.")

    # 2. Update #rules with Step 2 Embed & Agreement Button
    ch_rules = discord.utils.get(bot.get_all_channels(), name="rules")
    if ch_rules:
        await ch_rules.purge(limit=10)
        embed_r = discord.Embed(
            title="📜 AI Pilot Community Flight Standards | Step 2",
            description=(
                "Welcome to Step 2 of onboarding. Please review our community flight standards below.\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                "**1️⃣ Mutual Respect & Professionalism**\n"
                "Treat all members with respect. No harassment, discrimination, or hostile arguments.\n\n"
                "**2️⃣ High-Signal Chat & Channel Hygiene**\n"
                "Keep discussions in their respective channels. Avoid message spam and bot commands in discussion areas.\n\n"
                "**3️⃣ No Unsolicited Self-Promotion / DM Advertising**\n"
                "Cold pitching, DM ads, and unauthorized affiliate links result in an immediate ban.\n\n"
                "**4️⃣ Responsible AI Usage & Content Integrity**\n"
                "Strictly NO NSFW, deceptive deepfakes, or malicious exploits. Always test prompts before sharing.\n\n"
                "**5️⃣ Privacy & API Keys Security**\n"
                "Never share private API keys, client tokens, or passwords.\n\n"
                "**6️⃣ Staff Authority & Support**\n"
                "Follow staff guidance. For help, visit <#1539371357920297030>.\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                "### 🔓 Ready to Unlock the Server?\n"
                "Click **`✅ I Agree to Flight Standards`** below to complete onboarding and unlock all 60+ channels!"
            ),
            color=0x8B5CF6
        )
        embed_r.set_footer(text="AI Pilot Flight Standards • Step 2 of 2")
        await ch_rules.send(embed=embed_r, view=PersistentRulesView())
        print("Updated #rules with persistent Step 2 agreement button.")

async def main():
    asyncio.create_task(start_web_server())
    await bot.start(TOKEN)

if __name__ == "__main__":
    asyncio.run(main())
