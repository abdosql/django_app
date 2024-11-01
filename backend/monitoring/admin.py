from django.contrib import admin
from .models import Reading, Alert

@admin.register(Reading)
class ReadingAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'temperature', 'humidity', 'power_status', 'battery_power')
    list_filter = ('power_status', 'battery_power')
    search_fields = ('temperature', 'humidity')

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'type', 'severity', 'is_active')
    list_filter = ('type', 'severity', 'is_active')
    search_fields = ('message',) 