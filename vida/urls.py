from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.views.generic import TemplateView
from .vida_core.forms import VIDAPasswordResetForm
from .vida_core.views import ForgotUsername, logout, AuthorizeView
from .firestation.api import StaffingResource, FireStationResource, FireDepartmentResource
from .vida.api import PersonResource, ShelterResource, TrackResource, FormResource, ReportResource, LatestTrack, \
    NoteResource, CurrentUserResource
from .vida.views import PersonIndexView, PersonDetailView, ShelterDetailView, CommonOperatingPicture, Reports, \
    EmbeddableCOP
from fileservice.api import FileItemResource
from tastypie.api import Api
from firestation.views import Home

admin.autodiscover()
v1_api = Api(api_name='v1')
v1_api.register(StaffingResource())
v1_api.register(FireStationResource())
v1_api.register(FireDepartmentResource())
v1_api.register(PersonResource())
v1_api.register(ShelterResource())
v1_api.register(FileItemResource())
v1_api.register(TrackResource())
v1_api.register(LatestTrack())
v1_api.register(NoteResource())
v1_api.register(FormResource())
v1_api.register(ReportResource())
v1_api.register(CurrentUserResource())


urlpatterns = patterns('',
    url(r'^$', EmbeddableCOP.as_view(), name='firestation_home'),
    url(r'^full$', CommonOperatingPicture.as_view(), name='firestation_full'),
    url(r'^embed$', EmbeddableCOP.as_view(), name='firestation_embed'),
    (r'^api/', include(v1_api.urls)),
    url(r'^', include('vida.firestation.urls')),
    url(r'^', include('vida.vida.urls')),
    (r'^accounts/', include('registration.backends.default.urls')),
    url(r'^login/$', 'social.apps.django_app.views.auth', name='login', kwargs={'backend': 'google-oauth2'}),
    url(r'^password-reset/$', 'django.contrib.auth.views.password_reset',
        name='password_reset',
        kwargs={'template_name': 'registration/password/password_reset_form.html',
                'password_reset_form': VIDAPasswordResetForm}),
    url(r'^password-reset/done/$', 'django.contrib.auth.views.password_reset_done',
        name='password_reset_done',
        kwargs={'template_name': 'registration/password/password_reset_done.html'}),
    url(r'^password-reset/confirm/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})$',
        'django.contrib.auth.views.password_reset_confirm', name='password_reset_confirm',
        kwargs={'template_name': 'registration/password/password_reset_confirm.html'}),
    url(r'^password-reset/complete/$', 'django.contrib.auth.views.password_reset_complete',
        name='password_reset_complete', kwargs={'template_name': 'registration/password/password_reset_complete.html'}),
    url(r'^password-change/$', 'django.contrib.auth.views.password_change', name='password_change',
        kwargs={'template_name': 'registration/password/password_change.html'}),
    url(r'^password-change/done/$', 'django.contrib.auth.views.password_change_done', name='password_change_done',
        kwargs={'template_name': 'registration/password/password_change_done.html'}),
    url(r'^forgot-username/$', ForgotUsername.as_view(), name='forgot_username'),
    url(r'^forgot-username/done/$', TemplateView.as_view(template_name='registration/username_sent.html'), name='username_sent'),
    url(r'^logout/$', logout, name='logout'),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^autocomplete/', include('autocomplete_light.urls')),
    url(r'^persons/$', PersonIndexView.as_view(), name='persons_list'),
    url(r'^persons/(?P<pk>[0-9]+)/$', PersonDetailView.as_view(), name='persons_detail'),
    url(r'^shelters/(?P<pk>[0-9]+)/$', ShelterDetailView.as_view(), name='shelter_detail'),
    url(r'^mobile/authorize/$', AuthorizeView.as_view(), name='authorize-mobile'),
    url('', include('social.apps.django_app.urls', namespace='social')),
    url(r'^common-operating-picture/$', CommonOperatingPicture.as_view(), name='cop'),
    url(r'^reports/$', Reports.as_view(), name='reports')
)

