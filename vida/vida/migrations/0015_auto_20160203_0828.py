# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings
from django.utils.timezone import utc
import datetime


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('vida', '0014_auto_20160203_0739'),
    ]

    operations = [
        migrations.AddField(
            model_name='note',
            name='author',
            field=models.ForeignKey(blank=True, to=settings.AUTH_USER_MODEL, null=True),
        ),
        migrations.AddField(
            model_name='note',
            name='created',
            field=models.DateTimeField(default=datetime.datetime(2016, 2, 3, 14, 28, 3, 911336, tzinfo=utc), auto_now_add=True),
            preserve_default=False,
        ),
    ]
