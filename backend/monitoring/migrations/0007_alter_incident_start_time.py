# Generated by Django 4.2 on 2025-01-06 16:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('monitoring', '0006_remove_alert_monitoring__alert_t_3d4874_idx_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='incident',
            name='start_time',
            field=models.DateTimeField(),
        ),
    ]
