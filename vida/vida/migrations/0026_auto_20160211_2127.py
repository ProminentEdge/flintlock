# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0025_note_notify'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='form',
            options={'ordering': ('order', '-timestamp')},
        ),
        migrations.AddField(
            model_name='form',
            name='order',
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.AlterIndexTogether(
            name='form',
            index_together=set([('order', 'timestamp')]),
        ),
    ]
