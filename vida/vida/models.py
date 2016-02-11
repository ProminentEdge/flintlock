from django.conf import settings
from django.contrib.gis.db import models
import json
from django.db.models.signals import post_init, post_save, m2m_changed
from jsonfield import JSONField
from django.contrib.auth.models import User
from multi_email_field.fields import MultiEmailField
from django.template import Template, Context
from django.template.loader import get_template
from vida.tasks.email import send_email
from django.utils.functional import cached_property

RED = getattr(settings, 'RED_COLOR', '#FF4136')
GREEN = getattr(settings, 'GREEN_COLOR', '#2ECC40')
BLUE = getattr(settings, 'BLUE_COLOR', '#0074D9')


class Profile(models.Model):

    FORCE_CHOICES = (
        ('FRIENDLY', 'FRIENDLY'),
        ('OTHER', 'OTHER'),
        ('ENEMY', 'ENEMY'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    force_type = models.CharField(max_length=40, choices=FORCE_CHOICES, default='FRIENDLY')

    def __unicode__(self):
        return getattr(self.user, 'username', 'No User')

    @property
    def force_color(self):

        if self.force_type == 'ENEMY':
            return RED

        if self.force_type == 'OTHER':
            return GREEN

        return BLUE

def create_profile(sender, instance, **kwargs):

    if kwargs["created"]:
        user = instance
        profile = Profile(user=user)
        profile.save()

post_save.connect(create_profile, sender=User)


class Note(models.Model):

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
    note = models.TextField()
    notify = models.BooleanField(default=True, null=False, blank=False, editable=False)

    class Meta:
        ordering = ['-created']

class NoteLogger(models.Model):

    TRACK_FIELDS = []
    NOTE_STRING = 'The following fields were updated:<br /><br />'

    notes = models.ManyToManyField(Note, blank=True)

    def add_track_save_note(self, author=None):
        field_track = {}
        for field in self.TRACK_FIELDS:
            value = getattr(self, field)
            orig_value = getattr(self, '_original_%s' % field, None)
            if value != orig_value and orig_value:
                field_track[field] = [orig_value, value]

        if field_track:
            for k, v in field_track.iteritems():
                note_str = self.NOTE_STRING
                note_str += ('<b>{field}:</b> <i>{orig_value}</i> '
                             '<b>&rarr;</b> {value}<br />').format(
                    field=k,
                    orig_value=v[0],
                    value=v[1],
                )

            note = Note.objects.create(note=note_str, author=author, notify=False)
            self.notes.add(note)

    def save(self, *args, **kwargs):
        add_track = bool(self.pk)
        author = kwargs.pop('author', None)
        super(NoteLogger, self).save(*args, **kwargs)

        if add_track:
            self.add_track_save_note(author=author)

    class Meta:
        abstract = True


class Track(models.Model):
    """
    A device can report its location which is referred to as a Track by the application.
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
    mayday = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    geom = models.PointField(srid=4326, default='POINT(0.0 0.0)')
    objects = models.GeoManager()

    def __unicode__(self):
        return unicode(self.user)

    @property
    def force_color(self):
        if not self.user:
            return BLUE

        return self.user.profile.force_color


class Form(models.Model):
    """
    A data-driver way of creating a form. the schema describes the fields, their types, order, etc of the form
    """

    COLOR_CHOICES = (
        ('#001F3F', 'Navy'),
        ('#0074D9', 'Blue'),
        ('#7FDBFF', 'Aqua'),
        ('#39CCCC', 'Teal'),
        ('#3D9970', 'Olive'),
        ('#2ECC40', 'Green'),
        ('#01FF70', 'Lime'),
        ('#FFDC00', 'Yellow'),
        ('#FF851B', 'Orange'),
        ('#FF4136', 'Red'),
        ('#F012BE', 'Fuchsia'),
        ('#B10DC9', 'Purple'),
        ('#85144B', 'Maroon'),
        ('#FFFFFF', 'White'),
        ('#DDDDDD', 'Silver'),
        ('#AAAAAA', 'Gray'),
        ('#111111', 'Black')
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    schema = models.TextField(null=False, blank=False)
    color = models.CharField(max_length=10, choices=COLOR_CHOICES, blank=True, null=True, verbose_name='Map icon color')
    emails = MultiEmailField(null=True, blank=True)
    order = models.IntegerField(null=True, blank=True, help_text='Number used for sorting forms on clients.')

    class Meta:
        ordering = ('order', '-timestamp')
        index_together = [
            ['order', 'timestamp'],
        ]

    @cached_property
    def title(self):
        try:
            schema = json.loads(self.schema)
            return schema.get('title', '<no title>')
        except TypeError:
            return

    def __unicode__(self):
        schema_dict = json.loads(self.schema)
        title = '<no title>'
        if 'title' in schema_dict:
            title = schema_dict['title']
        return u'id={}, {}'.format(self.id, title)


class Report(NoteLogger, models.Model):
    """
    Each report is an 'instance' of a Form. The schema of the form is used to present a form to the user. The data
    filled out by the user becomes a report.
    """
    TRACK_FIELDS = ('status',)
    NOTE_STRING = 'The approval status for this report has been changed:<br /><br />'

    STATUS_CHOICES = [
        ('SUBMITTED', 'SUBMITTED'),
        ('APPROVED', 'APPROVED'),
        ('REJECTED', 'REJECTED'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    form = models.ForeignKey('Form', null=True, blank=True)
    data = JSONField(null=False, blank=False)
    geom = models.PointField(srid=4326, default='POINT(0.0 0.0)')
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='SUBMITTED')
    objects = models.GeoManager()


    class Meta:
        get_latest_by = 'timestamp'
        ordering = ("-timestamp",)

    @property
    def url(self):
        return 'http://cop.imagerytool.net/?showReport={0}'.format(self.id)

def timelog_post_init(sender, instance, **kwargs):
    if instance.pk:
        for field in instance.TRACK_FIELDS:
            setattr(instance, '_original_%s' % field, getattr(instance, field))


def send_report_emails(sender, **kwargs):

    # Only send emails for the post_add action from the m2m sender.
    if sender == Report.notes.through:
        if not kwargs.get('action') == 'post_add':
            return

        if hasattr(kwargs.get('model'), 'notify') and not all(kwargs.get('model').objects.filter(id__in=kwargs['pk_set'])
                .values_list('notify', flat=True)):
            return

    instance = kwargs.get('instance')

    if not isinstance(instance, Report):
        return

    created = kwargs.get('created', False)

    form_type = getattr(instance.form, 'title', 'Report') or 'Report'
    subject = 'Flintlock 2016: New {0} Submitted'.format(form_type)
    template = 'vida/report_created'

    if not created:
        subject = 'Flintlock 2016: {0} #{1} has been updated.'.format(form_type, instance.id)
        template = 'vida/report_updated'

    emails = [getattr(instance.user, 'email', None)] + [getattr(note.author, 'email', None) for note in instance.notes.all()]

    if instance.form and instance.form.emails:
        emails += instance.form.emails
        emails += [getattr(instance.form.user, 'email', None)]

    context = Context({'instance': instance})

    for email in set(emails):
        if email:
            send_email.delay(subject, get_template(template + '.txt').render(context),
                             settings.SERVER_EMAIL,
                             [email],
                             fail_silently=False,
                             html_message=get_template(template + '.html').render(context))


post_init.connect(
    timelog_post_init,
    sender=Report,
    dispatch_uid='vida.signals.timelog_post_init',
)

post_save.connect(
    send_report_emails,
    sender=Report,
    dispatch_uid='vida.signals.send_email',
)

m2m_changed.connect(
    send_report_emails,
    sender=Report.notes.through,
    dispatch_uid='vida.signals.send_email_m2m',
)

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
    objects = models.GeoManager()

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