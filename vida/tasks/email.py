from vida.celery import app
from django.core.mail import send_mail as django_send_mail

@app.task(queue='email')
def send_mail(email):
    """
    Asynchronously sends an email.
    """
    return email.send()


@app.task(queue='email')
def send_email(*args, **kwargs):
    """
    Asynchronously sends an email.
    """
    return django_send_mail(*args, **kwargs)
