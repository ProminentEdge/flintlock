# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0013_auto_20160201_1648'),
    ]

    operations = [
        migrations.CreateModel(
            name='Note',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('note', models.TextField()),
            ],
        ),
        migrations.AddField(
            model_name='report',
            name='status',
            field=models.CharField(default=b'SUBMITTED', max_length=25, choices=[(b'SUBMITTED', b'SUBMITTED'), (b'APPROVED', b'APPROVED'), (b'REJECTED', b'REJECTED')]),
        ),
        migrations.AddField(
            model_name='report',
            name='notes',
            field=models.ManyToManyField(to='vida.Note', blank=True),
        ),
    ]
