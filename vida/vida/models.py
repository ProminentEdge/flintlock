from django.conf import settings
from django.contrib.gis.db import models
from django.contrib.gis.geos import Point
import helpers


class Track(models.Model):
    """
    A device can report its location which is referred to as a Track by the application.
    """
    ENTITY_TYPE_CHOICES = [
        (0, 'Unknown'),
        (1, 'Person'),
        (2, 'Vehicle')]

    FORCE_TYPE_CHOICES = [
        (0, 'Unknown'),
        (1, 'Blue'),
        (2, 'Red'),
        (3, 'Green')]

    #user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
    user = models.CharField(blank=True, null=False, max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
    entity_type = models.IntegerField(null=False, blank=False, choices=ENTITY_TYPE_CHOICES, default=0)
    force_type = models.IntegerField(null=False, blank=False, choices=FORCE_TYPE_CHOICES, default=0)
    geom = models.PointField(srid=4326, default='POINT(0.0 0.0)')

    def __unicode__(self):
        return unicode(self.user)


class Form(models.Model):
    """
    A data-driver way of creating a form. the schema describes the fields, their types, order, etc of the form
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    schema = models.TextField(null=False, blank=False)


class Report(models.Model):
    """
    Each report is an 'instance' of a Form. The schema of the form is used to present a form to the user. The data
    filled out by the user becomes a report.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    form = models.ForeignKey('Form', null=True, blank=True)
    data = models.TextField(null=False, blank=False)
    geom = models.PointField(srid=4326, default='POINT(0.0 0.0)')


class Shelter(models.Model):

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)

    # time travel / verioning fields
    #start_date = models.DateTimeField(blank=True)
    #stop_date = models.DateTimeField(blank=True)

    # basic
    name = models.CharField(blank=True, max_length=50)
    description = models.TextField(blank=True)

    # address
    street_and_number = models.CharField(blank=True, max_length=100)
    neighborhood = models.CharField(blank=True, max_length=50)
    city = models.CharField(blank=True, max_length=50)
    province_or_state = models.CharField(blank=True, max_length=50)

    site_details = models.CharField(blank=True, max_length=200)

    notes = models.TextField(blank=True)
    geom = models.PointField(srid=4326, default='POINT(0.0 0.0)')
    uuid = models.CharField(blank=False, max_length=100)

    def __unicode__(self):
        return self.name


class Person(models.Model):

    HEALTH_TREATMENT_CHOICES = [
        (0, 'Unknown'),
        (1, 'None'),
        (2, 'In Progress'),
        (3, 'Completed')]

    STATUS_CHOICES = [
        (0, 'Unknown'),
        (1, 'Displaced'),
        (2, 'Lost'),
        (3, 'Found')]

    GENDER_CHOICES = [
        (0, 'Unknown'),
        (1, 'Male'),
        (2, 'Female'),
        (3, 'Other')]

    SHELTER_CHOICES = [] # will be created dynamically, this is to init shelter_id to have choices

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # time travel / versioning fields
    start_date = models.DateTimeField(null=True)
    stop_date = models.DateTimeField(null=True)

    # basic
    family_name = models.CharField(blank=True, max_length=50)
    given_name = models.CharField(blank=False, max_length=50)
    gender = models.CharField(blank=True, max_length=20)
    age = models.CharField(blank=True, max_length=10)
    mothers_given_name = models.CharField(blank=True, max_length=50)
    fathers_given_name = models.CharField(blank=True, max_length=50)
    date_of_birth = models.CharField(blank=True, max_length=50)

    description = models.TextField(blank=True)

    # address
    street_and_number = models.CharField(blank=True, max_length=100)
    neighborhood = models.CharField(blank=True, max_length=50)
    city = models.CharField(blank=True, max_length=50)
    province_or_state = models.CharField(blank=True, max_length=50)

    phone_number = models.CharField(blank=True, max_length=40)

    # this will store a uuid of the shelter on creation (can be used for database indexing)
    shelter_id = models.CharField(blank=True, max_length=100, choices=SHELTER_CHOICES, default='None')

    notes = models.TextField(blank=True)

    barcode = models.CharField(null=True, blank=True, max_length=100)

    injury = models.CharField(blank=True, max_length=100)
    nationality = models.CharField(blank=True, max_length=100)
    status = models.CharField(blank=True, max_length=100)

    pic_filename = models.CharField(null=True, blank=True, max_length=50)

    def __init__(self, *args, **kwargs):
        super(Person, self).__init__(*args, **kwargs)
        SHELTER_CHOICES = []
        for i, shelter in enumerate(Shelter.objects.all()):
            SHELTER_CHOICES.append('')  # will create index for list, dynamically updating the size
            SHELTER_CHOICES[i] = (shelter.uuid, shelter.name)   # overwrite that index with choice (as tuple)
        self._meta.get_field_by_name('shelter_id')[0]._choices = SHELTER_CHOICES

    def __unicode__(self):
        return self.given_name