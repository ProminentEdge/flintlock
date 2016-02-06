# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0024_form_emails'),
    ]

    operations = [
        migrations.AddField(
            model_name='note',
            name='notify',
            field=models.BooleanField(default=True, editable=False),
        ),
    ]
