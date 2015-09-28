from tastypie.resources import ModelResource, ALL
from tastypie.authentication import BasicAuthentication
from tastypie.authorization import Authorization
from tastypie import fields
from django.contrib.auth import get_user_model
from django.db.models import Q

from vida.vida.models import Person
from vida.vida.models import Shelter


class UserResource(ModelResource):
    class Meta:
        queryset = get_user_model().objects.all()
        fields = ['username', 'first_name', 'last_name']
        resource_name = 'created_by'


class PersonResource(ModelResource):
    created_by = fields.ToOneField(UserResource, 'created_by',  full=True, blank=True, null=True)

    class Meta:
        def filter_custom_age(url_args):
            """Build Custom filter to match age between a max and min if it is set"""
            try:
                age = int(url_args.pop('age_about') [0])
            except KeyError:
                return None

            age_query = (
                Q(age__gte=age-10) &
                Q(age__lte=age+10)
            )
            return age_query

        queryset = Person.objects.all()
        excludes = ['start_date', 'stop_date']
        authentication = BasicAuthentication()
        authorization = Authorization()
        filtering = {
            'family_name': ALL,
            'given_name': ALL,
            'mothers_given_name': ALL,
            'fathers_given_name': ALL,
            'description': ALL,
            'barcode': ALL,
            'age': ALL,
        }
        custom_filters = {'age_about': filter_custom_age}

    def determine_format(self, request):
        return 'application/json'

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
        authentication = BasicAuthentication()

    def determine_format(self, request):
        return 'application/json'