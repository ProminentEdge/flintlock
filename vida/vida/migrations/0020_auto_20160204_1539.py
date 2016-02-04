# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime
from django.utils.timezone import utc
import django.contrib.gis.db.models.fields


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0019_auto_20160204_1447'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='report',
            options={'ordering': ('-timestamp',), 'get_latest_by': 'timestamp'},
        ),
        migrations.AddField(
            model_name='form',
            name='modified',
            field=models.DateTimeField(default=datetime.datetime(2016, 2, 4, 21, 38, 51, 759042, tzinfo=utc), auto_now=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='note',
            name='modified',
            field=models.DateTimeField(default=datetime.datetime(2016, 2, 4, 21, 38, 59, 898793, tzinfo=utc), auto_now=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='report',
            name='modified',
            field=models.DateTimeField(default=datetime.datetime(2016, 2, 4, 21, 39, 12, 112506, tzinfo=utc), auto_now=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='track',
            name='modified',
            field=models.DateTimeField(default=datetime.datetime(2016, 2, 4, 21, 39, 17, 77116, tzinfo=utc), auto_now=True),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='report',
            name='geom',
            field=django.contrib.gis.db.models.fields.PointField(default=b'POINT(0.0 0.0)', srid=4326),
        ),
    ]
