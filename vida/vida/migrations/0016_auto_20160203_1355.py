# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import jsonfield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0015_auto_20160203_0828'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='note',
            options={'ordering': ['-created']},
        ),
        migrations.AlterField(
            model_name='report',
            name='data',
            field=jsonfield.fields.JSONField(),
        ),
    ]
