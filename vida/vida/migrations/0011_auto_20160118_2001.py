# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0010_auto_20160117_1917'),
    ]

    operations = [
        migrations.AlterField(
            model_name='track',
            name='user',
            field=models.CharField(default='admin', max_length=50, blank=True),
            preserve_default=False,
        ),
    ]
