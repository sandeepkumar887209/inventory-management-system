from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0008_laptop_generation'),
    ]

    operations = [
        migrations.AddField(
            model_name='laptop',
            name='asset_tag',
            field=models.CharField(max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='laptop',
            name='color',
            field=models.CharField(max_length=50, blank=True, default=''),
            preserve_default=False,
        ),
    ]