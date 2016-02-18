# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


def outstation_to_from(apps, schema_editor):
    report = apps.get_model("vida", "report")
    for aReport in report.objects.all():
        outstation_keys = filter(lambda n: 'outstation' in n.lower(), aReport.data.keys())
        for key in outstation_keys:
            aReport.data['From'] = aReport.data[key]
            del aReport.data[key]
        aReport.save()


class Migration(migrations.Migration):

    dependencies = [
        ('vida', '0028_auto_20160213_0115'),
    ]

    operations = [
        migrations.RunPython(outstation_to_from),
    ]
