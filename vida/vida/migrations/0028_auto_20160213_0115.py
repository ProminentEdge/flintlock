# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0027_auto_20160211_2200'),
    ]

    operations = [
        migrations.AlterField(
            model_name='report',
            name='status',
            field=models.CharField(default=b'SUBMITTED', max_length=25, choices=[(b'SUBMITTED', b'SUBMITTED'), (b'PENDING', b'PENDING'), (b'APPROVED', b'APPROVED'), (b'REJECTED', b'REJECTED')]),
        ),
    ]
