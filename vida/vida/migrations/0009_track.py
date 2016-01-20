# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings
import django.contrib.gis.db.models.fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('vida', '0008_auto_20151209_0954'),
    ]

    operations = [
        migrations.CreateModel(
            name='Track',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('entity_type', models.IntegerField(default=0, max_length=100, blank=True, choices=[(0, b'Unknown'), (1, b'Person'), (2, b'Vehicle')])),
                ('force_type', models.IntegerField(default=0, max_length=100, blank=True, choices=[(0, b'Unknown'), (1, b'Blue'), (2, b'Red'), (3, b'Green')])),
                ('geom', django.contrib.gis.db.models.fields.PointField(default=b'POINT(0.0 0.0)', srid=4326)),
                ('user', models.ForeignKey(blank=True, to=settings.AUTH_USER_MODEL, null=True)),
            ],
        ),
    ]
