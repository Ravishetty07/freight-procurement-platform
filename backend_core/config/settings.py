"""
Django settings for config project.
"""

import os
from pathlib import Path
from django.urls import reverse_lazy
import dj_database_url
from datetime import timedelta
import sys
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(os.path.join(BASE_DIR, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-(#pq-f$(b_o@j1kn%9im$etcckq=^h3vduvzmoyxh^vv##(w2h'

DEBUG = True

ALLOWED_HOSTS = ['*', '.onrender.com']

# Application definition
INSTALLED_APPS = [
    'daphne',
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    'whitenoise.runserver_nostatic',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third Party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'storages',
    
    # 🚀 PORTED FROM MAINTAINEX: Push Notifications
    'fcm_django', 

    # Custom Apps
    'apps.users',
    'apps.rfqs',
    'apps.chat',
    'apps.analytics',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database Setup
DATABASES = {
    'default': dj_database_url.config(
        default='postgresql://postgres.bdqdbjmfxiyhmetafybn:4NE5xtTz8zT5bMp8@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
        conn_max_age=600
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------
# MEDIA / STATIC FILE STORAGE CONFIGURATION
# ---------------------------------------------------------
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

if os.environ.get('RENDER'):
    # PRODUCTION: Supabase S3 for Media
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = 'freight-media'
    AWS_S3_ENDPOINT_URL = os.environ.get('AWS_S3_ENDPOINT_URL')
    
    AWS_S3_REGION_NAME = 'ap-southeast-1' 
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = 'public-read'
    AWS_S3_ADDRESSING_STYLE = 'path'
else:
    # LOCAL DEVELOPMENT
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Allow Django to find the 'apps' folder
sys.path.insert(0, os.path.join(BASE_DIR, 'apps'))

ASGI_APPLICATION = "config.asgi.application"

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = True 
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    'https://freight-procurement-platform.onrender.com',
    'https://frontendclient-ruby.vercel.app', 
]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

CORS_ALLOWED_ORIGINS = [
    'https://frontendclient-ruby.vercel.app',
    'https://freight-procurement-platform.onrender.com',
]

# REST Framework & JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

AUTH_USER_MODEL = 'users.User'

# ---------------------------------------------------------
# 🚀 PORTED FROM MAINTAINEX: FIREBASE CONFIG
# ---------------------------------------------------------
import firebase_admin
from firebase_admin import credentials

CREDS_PATH = os.path.join(BASE_DIR, "service-account.json")
if os.path.exists(CREDS_PATH) and not firebase_admin._apps:
    cred = credentials.Certificate(CREDS_PATH)
    firebase_admin.initialize_app(cred)

FCM_DJANGO_SETTINGS = {
    "FCM_SERVER_KEY": None,
}

# ---------------------------------------------------------
# 🚀 SUPERCHARGED UNFOLD ADMIN UI 
# ---------------------------------------------------------
UNFOLD = {
    "SITE_TITLE": "FreightOS Admin",
    "SITE_HEADER": "FreightOS Command Center",
    "SITE_URL": "/",
    "DASHBOARD_CALLBACK": "apps.analytics.dashboard.dashboard_callback",
    
    # Matched exactly to your Frontend's Orange Theme (#EF7D00)
    "COLORS": {
        "primary": {
            "50": "255 247 237",
            "100": "255 237 213",
            "200": "254 215 170",
            "300": "253 186 116",
            "400": "251 146 60",
            "500": "239 125 0", # Core Brand Orange
            "600": "234 88 12",
            "700": "194 65 12",
            "800": "154 52 18",
            "900": "124 45 18",
        },
    },
    
    # Feature added: Global Search & Grouped Menus
    "SIDEBAR": {
        "show_search": True, 
        "show_all_applications": True,
        "navigation": [
            {
                "title": "Freight Logistics",
                "separator": True,
                "items": [
                    {
                        "title": "Tendered RFQs",
                        "icon": "inventory_2",
                        "link": reverse_lazy("admin:rfqs_rfq_changelist"),
                    },
                    {
                        "title": "Shipment Lanes",
                        "icon": "local_shipping",
                        "link": reverse_lazy("admin:rfqs_shipment_changelist"),
                    },
                     {
                        "title": "Vendor Bids & Contracts",
                        "icon": "gavel",
                        "link": reverse_lazy("admin:rfqs_bid_changelist"),
                    },
                ],
            },
            {
                "title": "Platform Management",
                "separator": True,
                "items": [
                    {
                        "title": "System Users",
                        "icon": "group",
                        "link": reverse_lazy("admin:users_user_changelist"),
                    },
                    {
                        "title": "Verified Vendors",
                        "icon": "store",
                        "link": reverse_lazy("admin:users_vendorprofile_changelist"),
                    },
                ],
            },
        ],
    },
    
    # Feature added: Quick Access Profile Menu
    "USER_MENU": [
        {
            "title": "View Live Site",
            "icon": "language",
            "link": "https://frontendclient-ruby.vercel.app",
        }
    ]
}

if os.environ.get('REDIS_URL'):
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [os.environ.get('REDIS_URL')],
            },
        }
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer"
        }
    }