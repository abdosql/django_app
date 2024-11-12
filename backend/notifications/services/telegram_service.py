import logging
import telegram
from django.conf import settings

logger = logging.getLogger(__name__)

class TelegramService:
    def __init__(self):
        self.bot = telegram.Bot(token=settings.TELEGRAM_BOT_TOKEN)

    def send_message(self, chat_id, message):
        """Send message via Telegram"""
        try:
            self.bot.send_message(
                chat_id=chat_id,
                text=message,
                parse_mode=telegram.ParseMode.MARKDOWN
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send Telegram message to {chat_id}: {str(e)}")
            return False 