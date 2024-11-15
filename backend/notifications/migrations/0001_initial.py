# Generated by Django 4.2 on 2024-11-11 15:56

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('monitoring', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Operator',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('telegram_id', models.CharField(blank=True, max_length=100, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('priority', models.IntegerField(choices=[(1, 'Primary'), (2, 'Secondary'), (3, 'Tertiary')], default=1)),
                ('notification_preferences', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['priority', 'name'],
            },
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[('EMAIL', 'Email'), ('TELEGRAM', 'Telegram'), ('SMS', 'SMS')], max_length=20)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('SENT', 'Sent'), ('FAILED', 'Failed'), ('DELIVERED', 'Delivered'), ('READ', 'Read')], default='PENDING', max_length=20)),
                ('message', models.TextField()),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('delivered_at', models.DateTimeField(blank=True, null=True)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('error_message', models.TextField(blank=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('alert', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='monitoring.alert')),
                ('incident', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='monitoring.incident')),
                ('operator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='notifications.operator')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['status', 'created_at'], name='notificatio_status_9a4505_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['operator', 'created_at'], name='notificatio_operato_caf721_idx'),
        ),
    ]
