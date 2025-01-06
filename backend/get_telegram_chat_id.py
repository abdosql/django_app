import os
import django
import asyncio
from telegram import Bot

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.conf import settings

async def get_chat_id():
    print("\nGetting Telegram chat updates...")
    bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
    
    try:
        updates = await bot.get_updates()
        if updates:
            for update in updates:
                if update.message:
                    chat_id = update.message.chat.id
                    username = update.message.chat.username
                    print(f"\nFound chat:")
                    print(f"Username: {username}")
                    print(f"Chat ID: {chat_id}")
        else:
            print("\nNo updates found. Please make sure you have:")
            print("1. Started a chat with your bot")
            print("2. Sent at least one message to the bot")
    except Exception as e:
        print(f"\nError getting updates: {str(e)}")
    finally:
        await bot.close()

if __name__ == '__main__':
    asyncio.run(get_chat_id()) 