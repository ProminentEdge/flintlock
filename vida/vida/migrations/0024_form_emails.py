# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import multi_email_field.fields


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0023_auto_20160205_0741'),
    ]

    operations = [
        migrations.AddField(
            model_name='form',
            name='emails',
            field=multi_email_field.fields.MultiEmailField(null=True, blank=True),
        ),
    ]
