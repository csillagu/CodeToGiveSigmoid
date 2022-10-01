from django.conf.urls import url

from .views import ChairLampEndpoint

urlpatterns =[
    url(r'^chairlamp/(\w|d){32}$', ChairLampEndpoint.as_view()),
]