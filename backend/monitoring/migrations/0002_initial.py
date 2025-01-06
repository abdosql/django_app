# Generated by Django 4.2 on 2024-12-25 22:04

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('notifications', '0001_initial'),
        ('monitoring', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='incidenttimelineevent',
            name='operator',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='notifications.operator'),
        ),
        migrations.AddField(
            model_name='incidentcomment',
            name='incident',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='monitoring.incident'),
        ),
        migrations.AddField(
            model_name='incidentcomment',
            name='operator',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='notifications.operator'),
        ),
        migrations.AddField(
            model_name='incident',
            name='alert',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='incidents', to='monitoring.alert'),
        ),
        migrations.AddField(
            model_name='incident',
            name='assigned_to',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_incidents', to='notifications.operator'),
        ),
        migrations.AddField(
            model_name='incident',
            name='device',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='incidents', to='monitoring.device'),
        ),
        migrations.AddField(
            model_name='incident',
            name='resolved_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_incidents', to='notifications.operator'),
        ),
        migrations.AddField(
            model_name='alert',
            name='device',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='alerts', to='monitoring.device'),
        ),
        migrations.AddField(
            model_name='alert',
            name='reading',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='alerts', to='monitoring.reading'),
        ),
        migrations.AddField(
            model_name='alert',
            name='resolved_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_alerts', to='notifications.operator'),
        ),
        migrations.AddIndex(
            model_name='reading',
            index=models.Index(fields=['device', 'timestamp'], name='monitoring__device__aa54d5_idx'),
        ),
        migrations.AddIndex(
            model_name='incident',
            index=models.Index(fields=['status', 'start_time'], name='monitoring__status_74828a_idx'),
        ),
        migrations.AddIndex(
            model_name='incident',
            index=models.Index(fields=['device', 'start_time'], name='monitoring__device__ab144a_idx'),
        ),
        migrations.AddIndex(
            model_name='alert',
            index=models.Index(fields=['alert_type', 'timestamp'], name='monitoring__alert_t_3d4874_idx'),
        ),
        migrations.AddIndex(
            model_name='alert',
            index=models.Index(fields=['device', 'timestamp'], name='monitoring__device__fa620c_idx'),
        ),
    ]
