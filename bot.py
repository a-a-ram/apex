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
# 1. 4-FIELD EXCLUSIVE ONBOARDING MODAL
# =============================================================================
class PilotOnboardingModal(discord.ui.Modal, title="✈️ AI Pilot Verification Gateway"):
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
        
        verified_role = discord.utils.get(guild.roles, name="✈️ Verified Pilot")
        new_arrival = discord.utils.get(guild.roles, name="🛰️ New Arrival")

        # 1. Grant Verified Role
        if verified_role:
            try:
                await user.add_roles(verified_role)
                if new_arrival and new_arrival in user.roles:
                    await user.remove_roles(new_arrival)
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

        # 3. Ephemeral Success Confirmation
        await interaction.response.send_message(
            f"✅ **Verification Complete!** Welcome aboard **AI Pilot** ✈️🤖, {user.mention}!\n"
            "All community channels, prompt libraries, and automation labs are now unlocked for you.\n"
            "Head over to <#1539371349301133455> to select your AI specialty roles!",
            ephemeral=True
        )

        # 4. Personal 1-on-1 Creator DM
        try:
            embed_dm = discord.Embed(
                title="✈️ Welcome to AI Pilot | Personal Welcome from the Creator",
                description=(
                    f"Hey **{self.full_name.value}**! ✈️🤖\n\n"
                    "I'm the creator behind **AI Pilot**. Thank you for verifying and joining our community of practical AI builders!\n\n"
                    "### 🚀 3 Quick Tips to Get the Most Out of the Server:\n"
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
            pass  # User has DMs closed

# =============================================================================
# 2. PERSISTENT VERIFICATION BUTTON VIEW
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
# 3. LIGHTWEIGHT HEALTH CHECK SERVER FOR RENDER 24/7 HOSTING
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
# 4. BOT EVENTS
# =============================================================================
@bot.event
async def on_ready():
    bot.add_view(PersistentVerifyView())
    print(f"Logged in as {bot.user.name} ({bot.user.id})")
    print(f"AI Pilot 24/7 Cloud Bot is Ready! Registered Persistent Verify View.")

    # Post / refresh the official verification embed in #verify
    ch_verify = discord.utils.get(bot.get_all_channels(), name="verify")
    if ch_verify:
        await ch_verify.purge(limit=10)
        embed_v = discord.Embed(
            title="🛡️ AI Pilot Gateway | Pilot Verification & Onboarding",
            description=(
                "Welcome to **AI Pilot** ✈️🤖!\n\n"
                "To ensure a high-signal environment for builders and protect against spam, all newcomers must complete the exclusive onboarding gateway.\n\n"
                "### 📋 What You'll Be Asked:\n"
                "• **Full Name / Creator Handle** (Required)\n"
                "• **Phone Number** (Required)\n"
                "• **Email Address** (Optional — for templates & drops)\n"
                "• **Date of Birth / AI Background** (Required)\n\n"
                "🔒 *Your details are securely submitted to the confidential **Owner Vault** and remain 100% private from other members and staff.*\n\n"
                "### 🔓 Instant Access:\n"
                "Click the button below to open the onboarding form and unlock all 60+ channels!"
            ),
            color=0x22C55E
        )
        embed_v.set_footer(text="AI Pilot Security Core • 24/7 Cloud Verification")
        await ch_verify.send(embed=embed_v, view=PersistentVerifyView())
        print("Updated #verify with persistent verification modal button.")

async def main():
    asyncio.create_task(start_web_server())
    await bot.start(TOKEN)

if __name__ == "__main__":
    asyncio.run(main())
