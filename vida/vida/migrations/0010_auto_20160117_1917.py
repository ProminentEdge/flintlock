# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0009_track'),
    ]

    operations = [
        migrations.AlterField(
            model_name='track',
            name='entity_type',
            field=models.IntegerField(default=0, choices=[(0, b'Unknown'), (1, b'Person'), (2, b'Vehicle')]),
        ),
        migrations.AlterField(
            model_name='track',
            name='force_type',
            field=models.IntegerField(default=0, choices=[(0, b'Unknown'), (1, b'Blue'), (2, b'Red'), (3, b'Green')]),
        ),
    ]
