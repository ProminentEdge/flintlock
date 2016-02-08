from django.test import TestCase

import json
from datetime import timedelta
from urlparse import urlsplit, urlunsplit
from django.contrib.auth import get_user_model, authenticate
from django.core import mail
from django.core.management import call_command
from django.core.urlresolvers import reverse, resolve
from django.test import Client, TestCase
from django.utils import timezone
from .models import Report, Note, BLUE, Track, Form
from django.contrib.gis.geos import Point
from django.core import mail
User = get_user_model()


class VidaTests(TestCase):
    fixtures = ['test_forgot.json']

    def test_auth_required(self):
        c = Client()
        response = c.get(reverse('firestation_home'))
        self.assertEqual(response.status_code, 302)

        u = User.objects.create(username='test')
        u.set_password('test')
        u.save()

        c.login(username='test', password='test')
        response = c.get(reverse('firestation_home'))
        self.assertEqual(response.status_code, 200)


    def test_approval(self):
        u = User.objects.create(username='test')
        report = Report.objects.create()
        self.assertEqual(report.status, 'SUBMITTED')
        self.assertFalse(report.notes.all())

        report = Report.objects.first()
        self.assertTrue(report.id)
        self.assertTrue(report._original_status)

        report.status = 'REJECTED'
        report.save(author=u)

        self.assertTrue(report.notes.all())
        self.assertEqual(report.notes.first().author, u)

        r = Report()
        r.status = 'REJECTED'
        r.save()

    def test_approval_api(self):
        u = User.objects.create(username='test')
        u.set_password('test')
        u.save()
        payload =  {
        "data": {"test": 123},
        "form": None,
        "geom": {
          "coordinates": [
            38.8,
            -77.014
          ],
          "type": "Point"
        },
        "timestamp": "2016-02-03T08:35:39.968849"
        }

        c = Client()
        c.login(username='test', password='test')
        response = c.get('/api/v1/report/')
        self.assertEqual(response.status_code, 200)

        response = c.post('/api/v1/report/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 201)

        payload = json.loads(response.content)
        self.assertIn('user', payload)
        payload['status'] = 'APPROVED'


        response = c.put('/api/v1/report/{id}/'.format(id=payload['id']),
                         data=json.dumps(payload), content_type='application/json')

        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        rep = Report.objects.get(id=payload['id'])
        self.assertEqual(rep.notes.first().author, u)

    def test_api_json(self):
        u = User.objects.create(username='test')
        u.set_password('test')
        u.save()
        payload =  {
        "data": {"test": 123},
        "form": None,
        "geom": {
          "coordinates": [
            38.8,
            -77.014
          ],
          "type": "Point"
        },
        "timestamp": "2016-02-03T08:35:39.968849"
        }

        c = Client()
        c.login(username='test', password='test')

        response = c.get('/api/v1/report/')
        self.assertEqual(response.status_code, 200)

        response = c.post('/api/v1/report/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 201)

        response = c.get('/api/v1/report/1/')
        self.assertEqual(response.status_code, 200)
        js = json.loads(response.content)
        self.assertTrue(isinstance(js['data'], dict))
        self.assertEqual(js['user']['username'], 'test')

    def test_note_api(self):
        u = User.objects.create(username='test')
        u.set_password('test')
        u.save()
        payload =  {
        "data": {"test": 123},
        "form": None,
        "geom": {
          "coordinates": [
            38.8,
            -77.014
          ],
          "type": "Point"
        },
        "timestamp": "2016-02-03T08:35:39.968849"
        }

        c = Client()
        c.login(username='test', password='test')

        response = c.get('/api/v1/report/')
        self.assertEqual(response.status_code, 200)

        response = c.post('/api/v1/report/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 201)

        # ensure the object is returned
        payload = json.loads(response.content)
        self.assertTrue(payload['id'])

        note =  {
        "note": "testing post",
        "report__id": Report.objects.first().id
        }

        response = c.post('/api/v1/note/', data=json.dumps(note), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Note.objects.last().note, note['note'])
        self.assertIn(Report.objects.first(), Note.objects.last().report_set.all())
        self.assertEqual(Note.objects.last().author, u)

    def test_force_type(self):
        user = User.objects.create(username='test')
        user.set_password('test')
        user.save()

        self.assertTrue(user.profile)
        self.assertEqual(user.profile.force_type, 'FRIENDLY')
        self.assertEqual(user.profile.force_color, BLUE)

    def test_tracks_api(self):
        user = User.objects.create(username='test')
        user.set_password('test')
        user.save()

        c = Client()
        c.login(username='test', password='test')

        response = c.get('/api/v1/track/')
        self.assertEqual(response.status_code, 200)


        payload = {
            "geom": {
                "coordinates": [
                    -77.3344,
                    38.799
                ],
                "type": "Point"
            },
            "mayday": False,
            "timestamp": "2016-02-04T09:24:21.453610",
            "user": "test"
        }

        response = c.post('/api/v1/track/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        js = json.loads(response.content)
        self.assertEqual(js['user']['username'], user.username)
        self.assertEqual(js['force_color'], BLUE)

    def test_notification(self):
        user = User.objects.create(username='test', first_name='first', last_name='last', email='test@aol.com')
        user.set_password('test')
        user.save()
        schema = {
          "title": "Request For Information (RFI)",
          "description": "Request For Information",
          "type": "object",
          "properties": {
            "Unit/Outstation": {
              "type": "string",
              "enum": [
                "Bakel",
                "Thies",
                "Dakar",
                "Podor",
                "Atar"
              ]
            }
          },
          "required": []
        }

        form = Form.objects.create(emails='test@aol.com, sdf@aol.com', schema=schema, color='#FF4136')
        report = Report.objects.create(data={"test": 123}, form=form, geom=Point(-77.234, 39.23432), user=user)
        self.assertEqual(len(mail.outbox), 2)

        note = Note.objects.create(note='testing', author=user)
        self.assertEqual(len(mail.outbox), 2)

        report.notes.add(note)
        self.assertEqual(len(mail.outbox), 4)