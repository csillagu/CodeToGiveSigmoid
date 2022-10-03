from django.urls import re_path as url

from .views import ChairLampEndpoint, ToulousePieronEndpoint, BourdonEndpoint

urlpatterns =[
    url(r'^chairlamp/(\w|d){32}$', ChairLampEndpoint.as_view()),
    url(r'^toulousepieron/(\w|d){32}$', ToulousePieronEndpoint.as_view()),
    url(r'^bourdon/(\w|d){32}$', BourdonEndpoint.as_view()),
]