# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0016_auto_20160203_1355'),
    ]

    operations = [
        migrations.AddField(
            model_name='form',
            name='color',
            field=models.CharField(blank=True, max_length=10, null=True, choices=[(b'#001F3F', b'Navy'), (b'#0074D9', b'Blue'), (b'#7FDBFF', b'Aqua'), (b'#39CCCC', b'Teal'), (b'#3D9970', b'Olive'), (b'#2ECC40', b'Green'), (b'#01FF70', b'Lime'), (b'#FFDC00', b'Yellow'), (b'#FF851B', b'Orange'), (b'#FF4136', b'Red'), (b'#F012BE', b'Fuchsia'), (b'#B10DC9', b'Purple'), (b'#85144B', b'Maroon'), (b'#FFFFFF', b'White'), (b'#DDDDDD', b'Silver'), (b'#AAAAAA', b'Gray'), (b'#111111', b'Black')]),
        ),
    ]
