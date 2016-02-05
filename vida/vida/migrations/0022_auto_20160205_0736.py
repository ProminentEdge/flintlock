# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0021_profile'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='force_type',
            field=models.CharField(default=b'FRIENDLY', max_length=40, choices=[(b'FRIENDLY', b'FRIENDLY'), (b'OTHER', b'OTHER'), (b'ENEMY', b'ENEMY')]),
        ),
    ]
