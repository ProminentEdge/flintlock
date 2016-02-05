# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0022_auto_20160205_0736'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='track',
            name='user'
        ),

        migrations.AddField(
            model_name='track',
            name='user',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL, blank=True, null=True),
        ),
    ]
