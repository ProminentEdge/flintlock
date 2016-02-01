from .forms import ForgotUsernameForm
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.views.generic import View, TemplateView
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from tastypie.models import ApiKey


class LoginRequiredMixin(object):
    """
    Requires users to be logged in before rendering a view.
    """

    @classmethod
    def as_view(cls, **initkwargs):
        view = super(LoginRequiredMixin, cls).as_view(**initkwargs)
        return login_required(view)


class JSONResponseMixin(object):
    """
    A mixin that can be used to render a JSON response.
    """
    def render_to_json_response(self, context, **response_kwargs):
        """
        Returns a JSON response, transforming 'context' to make the payload.
        """
        return JsonResponse(
            self.get_data(context),
            **response_kwargs
        )

    def get_data(self, context):
        """
        Returns an object that will be serialized as JSON by json.dumps().
        """
        return context


class JSONView(JSONResponseMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)


class AuthorizeView(LoginRequiredMixin, JSONView):
    """
    GET request returns the user's username and api key.
    """

    def get_context_data(self, **kwargs):

        try:
            api_key = self.request.user.api_key.key
        except ObjectDoesNotExist:
            ApiKey.objects.create(user=self.request.user)
            api_key = self.request.user.api_key.key

        return {'username': self.request.user.username,
                'apikey': api_key}

    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)


class ForgotUsername(View):
    form_class = ForgotUsernameForm
    template_name = 'registration/forgot_username.html'

    def get(self, request, *args, **kwargs):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request, *args, **kwargs):
        form = self.form_class(request.POST)
        if form.is_valid():
            user = User.objects.filter(email=form.cleaned_data['email']).first()
            if user:
                context = {'username': user.username,
                           'login': request.build_absolute_uri(reverse('login'))}
                form.send_mail('Your VIDA Username',
                               'registration/forgot_username_email.txt',
                               context,
                               settings.DEFAULT_FROM_EMAIL,
                               user.email)
            return HttpResponseRedirect(reverse('username_sent'))
        return render(request, self.template_name, {'form': form})


def logout(request):
    """
    Logs out the user.
    """
    auth_logout(request)
    return redirect('/')



