# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0012_form_report'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='track',
            name='entity_type',
        ),
        migrations.RemoveField(
            model_name='track',
            name='force_type',
        ),
        migrations.AddField(
            model_name='track',
            name='mayday',
            field=models.BooleanField(default=False),
        ),
    ]
