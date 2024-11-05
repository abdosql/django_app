from django.db import migrations, models
import django.core.validators

class Migration(migrations.Migration):
    dependencies = [
        ('monitoring', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='reading',
            name='battery_power',
        ),
        migrations.AddField(
            model_name='reading',
            name='battery_level',
            field=models.FloatField(
                default=100,
                help_text='Battery level percentage (0-100)',
                validators=[
                    django.core.validators.MinValueValidator(0),
                    django.core.validators.MaxValueValidator(100)
                ]
            ),
        ),
    ] 