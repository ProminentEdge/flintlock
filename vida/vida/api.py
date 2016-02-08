from django.conf.urls import url
from tastypie.resources import ALL, ALL_WITH_RELATIONS
from tastypie.utils import trailing_slash
from tastypie.authentication import BasicAuthentication, Authentication, SessionAuthentication, MultiAuthentication,\
    ApiKeyAuthentication
from tastypie.authorization import Authorization
from tastypie import fields
from django.contrib.auth import get_user_model
from django.db.models import Q
from tastypie.resources import Resource
from tastypie.contrib.gis.resources import ModelResource

import helpers
import os
import requests, json

User = get_user_model()

from vida.fileservice.helpers import get_gallery_file
from vida.vida.models import Person
from vida.vida.models import Shelter, Track, Report, Form, Note




class UserResource(ModelResource):
    class Meta:
        queryset = User.objects.all()
        fields = ['id', 'username', 'first_name', 'last_name']
        resource_name = 'user'
        authentication = MultiAuthentication(SessionAuthentication(), ApiKeyAuthentication(), BasicAuthentication())
        authorization = Authorization()


class CurrentUserResource(ModelResource):

    class Meta:
        queryset = User.objects.all()
        fields = ['username', 'first_name', 'last_name', 'is_superuser']
        allowed_methods = ['get']
        include_resource_uri = False
        resource_name = 'current-user'
        authentication = MultiAuthentication(SessionAuthentication(), ApiKeyAuthentication(), BasicAuthentication())
        authorization = Authorization()

    def dispatch_list(self, request, **kwargs):
        """
        A view for handling the various HTTP methods (GET/POST/PUT/DELETE) over
        the entire list of resources.

        Relies on ``Resource.dispatch`` for the heavy-lifting.
        """
        return self.dispatch('detail', request, **kwargs)

    def obj_get(self, bundle, **kwargs):
        """
        Fetches an individual object on the resource.

        This needs to be implemented at the user level. If the object can not
        be found, this should raise a ``NotFound`` exception.

        ``ModelResource`` includes a full working version specific to Django's
        ``Models``.
        """
        return bundle.request.user

    def determine_format(self, request):
        return 'application/json'



class VidaUserMixin(ModelResource):
    user = fields.ToOneField(UserResource, 'user',  full=True, blank=True, null=True)

    def hydrate(self, bundle):
        if isinstance(bundle.data.get('user'), dict):
            bundle.data['user'] = bundle.request.user

        elif isinstance(bundle.data.get('user'), unicode):
            try:
                bundle.data['user'] = User.objects.get(username=bundle.data.get('user'))
            except User.DoesNotExist:
                pass

        elif not bundle.data.get('user'):
            bundle.data['user'] = bundle.request.user

        return super(VidaUserMixin, self).hydrate(bundle)


class TrackResource(VidaUserMixin):

    force_color = fields.CharField(attribute='force_color', blank=True, null=True, readonly=True)

    class Meta:
        queryset = Track.objects.all()
        fields = ['id', 'user', 'mayday', 'geom', 'timestamp']
        include_resource_uri = False
        allowed_methods = ['get', 'post', 'put', 'delete']
        always_return_data = True
        authentication = MultiAuthentication(SessionAuthentication(), ApiKeyAuthentication(), BasicAuthentication())
        authorization = Authorization()
        filtering = {
            'modified': ['exact', 'range', 'gt', 'gte', 'lt', 'lte'],
            'timestamp': ['exact', 'range', 'gt', 'gte', 'lt', 'lte'],
        }

    def determine_format(self, request):
        return 'application/json'

    def deserialize(self, request, data, format=None):
        if not format:
            format = request.META.get('CONTENT_TYPE', 'application/json')

        if format == 'application/x-www-form-urlencoded':
            return request.POST

        return super(ModelResource, self).deserialize(request, data, format)


class LatestTrack(TrackResource):

    force_color = fields.CharField(attribute='force_color', blank=True, null=True, readonly=True)

    class Meta(TrackResource.Meta):
        resource_name = 'latest-tracks'
        queryset = Track.objects.filter(user__isnull=False).order_by('user', '-timestamp').distinct('user')
        allowed_methods = ['get']


class FormResource(VidaUserMixin):

    class Meta:
        queryset = Form.objects.all()
        fields = ['user', 'timestamp', 'schema', 'color', 'modified']
        include_resource_uri = True
        allowed_methods = ['get']
        always_return_data = True
        authentication = MultiAuthentication(SessionAuthentication(), ApiKeyAuthentication(), BasicAuthentication())
        authorization = Authorization()
        filtering = {
            'modified': ['exact', 'range', 'gt', 'gte', 'lt', 'lte'],
            'timestamp': ['exact', 'range', 'gt', 'gte', 'lt', 'lte'],
        }

    def determine_format(self, request):
        return 'application/json'

    def deserialize(self, request, data, format=None):
        if not format:
            format = request.META.get('CONTENT_TYPE', 'application/json')

        if format == 'application/x-www-form-urlencoded':
            return request.POST

        return super(ModelResource, self).deserialize(request, data, format)


class NoteResource(ModelResource):
    author = fields.ToOneField(UserResource, 'author',  full=True, blank=True, null=True)

    class Meta:
        fields = ['id', 'author', 'note', 'created', 'modified']
        queryset = Note.objects.all()
        authentication = MultiAuthentication(SessionAuthentication(), ApiKeyAuthentication(), BasicAuthentication())
        authorization = Authorization()
        always_return_data = True
        filtering = {
            'modified': ['exact', 'range', 'gt', 'gte', 'lt', 'lte'],
            'created': ['exact', 'range', 'gt', 'gte', 'lt', 'lte'],
        }

    def determine_format(self, request):
        return 'application/json'

    def hydrate_author(self, bundle):
        """
        Set's the note's author to the user making the request.
        """
        if not bundle.obj.author:
            bundle.obj.author = bundle.request.user

        return bundle

    def save(self, bundle, skip_errors=False):
        bundle = super(NoteResource, self).save(bundle, skip_errors=False)

        report = bundle.data.get('report__id')

        if report:
            try:
                report_obj = Report.objects.get(id=report)
                bundle.obj.report_set.add(report_obj)
            except Report.DoesNotExist:
                return bundle

        return bundle


class ReportResource(VidaUserMixin):
    form = fields.ForeignKey(FormResource, 'form', null=True)
    notes = fields.ToManyField(NoteResource, 'notes', full=True, null=True, readonly=True)
    data = fields.DictField(attribute='data', null=True, blank=True)

    class Meta:
        queryset = Report.objects.all()
        fields = ['id', 'user', 'modified', 'timestamp', 'form', 'data', 'geom', 'status', 'notes']
        include_resource_uri = False
        allowed_methods = ['get', 'post', 'put']
        always_return_data = True
        authentication = MultiAuthentication(SessionAuthentication(), ApiKeyAuthentication(), BasicAuthentication())
        authorization = Authorization()
        filtering = {
            'modified': ['exact', 'range', 'gt', 'gte', 'lt', 'lte'],
            'timestamp': ['exact', 'range', 'gt', 'gte', 'lt', 'lte'],
        }

    def determine_format(self, request):
        return 'application/json'

    def save(self, bundle, skip_errors=False):
        if bundle.via_uri:
            return bundle

        self.is_valid(bundle)

        if bundle.errors and not skip_errors:
            from tastypie.exceptions import ImmediateHttpResponse
            raise ImmediateHttpResponse(response=self.error_response(bundle.request, bundle.errors))

        # Check if they're authorized.
        if bundle.obj.pk:
            self.authorized_update_detail(self.get_object_list(bundle.request), bundle)
        else:
            self.authorized_create_detail(self.get_object_list(bundle.request), bundle)

        # Save FKs just in case.
        self.save_related(bundle)

        # Save the main object.
        obj_id = self.create_identifier(bundle.obj)

        if obj_id not in bundle.objects_saved or bundle.obj._state.adding:
            # FLINTLOCK custom to support tracking who authorized a report
            bundle.obj.save(author=bundle.request.user)
            bundle.objects_saved.add(obj_id)

        # Now pick up the M2M bits.
        m2m_bundle = self.hydrate_m2m(bundle)
        self.save_m2m(m2m_bundle)

        return bundle


    def deserialize(self, request, data, format=None):
        if not format:
            format = request.META.get('CONTENT_TYPE', 'application/json')

        if format == 'application/x-www-form-urlencoded':
            return request.POST

        return super(ModelResource, self).deserialize(request, data, format)



class PersonResource(ModelResource):
    created_by = fields.ToOneField(UserResource, 'created_by',  full=True, blank=True, null=True)

    class Meta:
        def filter_custom_query(url_args):
            """Build Custom filter that searches all relevant fields"""
            number_val = None
            string_val = None
            try:
                string_val = url_args.pop('custom_query')[0]

                if helpers.is_int_str(string_val):
                    number_val = int(string_val)
            except KeyError:
                return None

            custom_query = (
                Q(family_name__icontains=string_val) |
                Q(given_name__icontains=string_val) |
                Q(mothers_given_name__icontains=string_val) |
                Q(fathers_given_name__icontains=string_val) |
                Q(description__icontains=string_val) |
                Q(notes__icontains=string_val) |
                Q(shelter_id__exact=string_val) |
                Q(barcode__exact=string_val)
            )

            if number_val:
                custom_query = (
                    (
                        Q(age__gte=number_val-10) &
                        Q(age__lte=number_val+10)
                    ) |
                    Q(description__icontains=number_val) |
                    Q(notes__icontains=string_val) |
                    Q(shelter_id__exact=string_val) |
                    Q(barcode__exact=string_val) |
                    Q(id__exact=number_val)
                )
            return custom_query

        queryset = Person.objects.all()
        excludes = ['start_date', 'stop_date']
        authentication = MultiAuthentication(SessionAuthentication(), ApiKeyAuthentication(), BasicAuthentication())
        authorization = Authorization()
        filtering = {
            'family_name': ALL,
            'given_name': ALL,
            'mothers_given_name': ALL,
            'fathers_given_name': ALL,
            'description': ALL,
            'notes': ALL,
            'barcode': ALL,
            'age': ALL,
            'shelter_id': ALL_WITH_RELATIONS,
            'slug': ALL,
        }
        custom_filters = {'custom_query': filter_custom_query}

    def determine_format(self, request):
        return 'application/json'

    def prepend_urls(self):
        """ Add the following array of urls to the Tileset base urls """
        return [
            url(r"^(?P<resource_name>%s)/auto_populate%s$" %
                (self._meta.resource_name, trailing_slash()),
                self.wrap_view('auto_populate'), name="api_auto_populate"),
        ]

    def auto_populate(self, request, **kwargs):
        # method check to avoid bad requests
        self.method_check(request, allowed=['get'])

        files = os.listdir('/vida/samples/photos/')

        res = {'Status': 'Pictures Uploaded: '}

        # reset the OpenBR Gallery
        if os.path.isfile(get_gallery_file()):
            os.remove(get_gallery_file())

        ctr = 0
        length = files.__len__()
        with open('/vida/samples/MOCK_DATA.json') as personDB:
            _personDB = json.load(personDB)
            db_size = len(_personDB) - 1 # indexing
            person_index = 0
            for file in files:
                with open('/vida/samples/photos/' + file, 'rb') as f:
                    url = helpers.get_network_ip('eth1')
                    response = requests.post('http://' + url + '/api/v1/fileservice/', data={'index': 'false'}, files={'file': f}, auth=('admin', 'admin'))
                    if response.status_code == 201:
                        # Picture successfully uploaded
                        pictureFilename = json.loads(response._content)['name']

                        # Separate gender
                        isFemale = False
                        if 'female' in file:
                            isFemale = True
                        while True:
                            if person_index > db_size: # just in case
                                person_index = 0

                            # *Try* and match up a gender specific picture to the correct gender
                            thisGender = _personDB[person_index]['gender']
                            if isFemale:
                                if thisGender == 'Male':
                                    person_index += 1
                                elif thisGender == 'Female':
                                    break
                                else:
                                    break
                            else:
                                if thisGender == 'Female':
                                    person_index += 1
                                elif thisGender == 'Male':
                                    break
                                else:
                                    break

                        # Get person information
                        uploadJSON = '{"given_name":"' + _personDB[person_index]['given_name'] + '", "street_and_number":"' + _personDB[person_index]['street_and_number'] + '",'
                        uploadJSON += '"family_name":"' + _personDB[person_index]['family_name'] + '", "gender":"' + _personDB[person_index]['gender'] + '", '
                        if 'fathers_given_name' in _personDB[person_index]:
                            uploadJSON += '"fathers_given_name":"' + _personDB[person_index]['fathers_given_name'] + '", '
                        if 'mothers_given_name' in _personDB[person_index]:
                            uploadJSON += '"mothers_given_name":"' + _personDB[person_index]['mothers_given_name'] + '", '
                        uploadJSON += '"age":"' + str(_personDB[person_index]['age']) + '", "date_of_birth":" ' + _personDB[person_index]['date_of_birth'] + '", '
                        uploadJSON += '"city":"' + _personDB[person_index]['city'] + '", "phone_number":" ' + _personDB[person_index]['phone_number'] + '", '
                        if 'province_or_state' in _personDB[person_index]:
                            uploadJSON += '"province_or_state":"' + _personDB[person_index]['province_or_state'] + '", '
                        uploadJSON += '"pic_filename":"' + pictureFilename + '"'
                        uploadJSON += '}'
                        person_index += 1 # move forward in _nameDB
                        headers = {'Content-type':'application/json', 'Content-length':len(uploadJSON), 'Accept':'application/json'}
                        postResponse = requests.post('http://' + url + '/api/v1/person/', data=uploadJSON, headers=headers, auth=('admin', 'admin'))
                        if (postResponse.status_code != 201):
                            raise self.create_response(request, response)

                res['Status'] += file
                ctr += 1
                if (ctr != length):
                    res['Status'] += ' || '


        response = self.create_response(request, res)
        return response


    def build_filters(self, filters=None):
        """Allow for building of custom filters based on url keyword."""
        custom_filters = self._meta.custom_filters
        custom_queries = {}

        for filter_id, filter_method in custom_filters.iteritems():
            built_filter = filter_method(filters)
            if built_filter:
                custom_queries[filter_id] = built_filter

        orm_filters = super(PersonResource, self).build_filters(filters)
        for query_id, query in custom_queries.iteritems():
            orm_filters[query_id] = query
        return orm_filters

    def apply_filters(self, request, applicable_filters):
        """Allow for the application of custom filters built in the build_filters method"""
        custom_built_queries = [filter_id for filter_id in self._meta.custom_filters.keys()]
        post_filters = []
        for key in applicable_filters.keys():
            if key in custom_built_queries:
                post_filters.append(applicable_filters.pop(key))

        filtered = super(PersonResource, self).apply_filters(request, applicable_filters)
        for post_filter in post_filters:
            filtered = filtered.filter(post_filter)

        return filtered


class ShelterResource(ModelResource):
    created_by = fields.ToOneField(UserResource, 'created_by',  full=True, blank=True, null=True)

    class Meta:
        queryset = Shelter.objects.all()
        authentication = MultiAuthentication(SessionAuthentication(), ApiKeyAuthentication(), BasicAuthentication())

    def determine_format(self, request):
        return 'application/json'
