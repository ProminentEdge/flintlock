# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0026_auto_20160211_2127'),
    ]

    operations = [
        migrations.AlterField(
            model_name='form',
            name='order',
            field=models.IntegerField(help_text=b'Number used for sorting forms on clients.', null=True, blank=True),
        ),
        migrations.AlterIndexTogether(
            name='track',
            index_together=set([('user', 'timestamp')]),
        ),
    ]
