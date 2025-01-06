import logging
import asyncio
from telegram import Bot
from telegram.constants import ParseMode
from django.conf import settings

logger = logging.getLogger(__name__)

class TelegramService:
    def __init__(self):
        self.bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)

    def send_message(self, chat_id, message):
        """Send message via Telegram"""
        try:
            # Run the async send_message in the event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(self._async_send_message(chat_id, message))
            loop.close()
            return True
        except Exception as e:
            logger.error(f"Failed to send Telegram message to {chat_id}: {str(e)}")
            return False

    async def _async_send_message(self, chat_id, message):
        """Async method to send message via Telegram"""
        await self.bot.send_message(
            chat_id=chat_id,
            text=message,
            parse_mode=ParseMode.MARKDOWN
        ) 