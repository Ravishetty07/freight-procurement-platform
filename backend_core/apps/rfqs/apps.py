from django.apps import AppConfig

class RfqsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.rfqs'

    def ready(self):
        import apps.rfqs.signals # <--- Add this line