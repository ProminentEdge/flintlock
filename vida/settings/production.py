import os
from vida.settings.base import *


AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME', 'flintlock-static')
STATIC_URL = '/static/'
DEBUG = False
AWS_QUERYSTRING_AUTH = False
EMAIL_USE_TLS = True

try:
    from local_settings import *  # noqa
except ImportError:
    pass