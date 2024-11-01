import logging
import telegram
from django.conf import settings
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

class TelegramService:
    def __init__(self):
        self.bot = telegram.Bot(token=settings.TELEGRAM_BOT_TOKEN)

    async def send_message(self, chat_id, message):
        try:
            await self.bot.send_message(
                chat_id=chat_id,
                text=message,
                parse_mode=telegram.ParseMode.HTML
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send Telegram message: {str(e)}")
            return False

    async def broadcast_alert(self, operators, message):
        results = []
        for operator in operators:
            if operator.telegram_id:
                result = await self.send_message(operator.telegram_id, message)
                results.append((operator, result))
        return results

    def _format_alert_message(self, alert):
        return f"""
🚨 <b>Alert: {alert.type}</b>
Severity: {alert.severity}
Message: {alert.message}
Time: {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
        """ 