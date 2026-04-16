import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from jobs.models import Job

products = Job.objects.filter(title='Smartphone')
for p in products:
    print(f'Product: {p.title}')
    print(f'Image field value: {repr(p.image)}')
    print(f'Image field name: {p.image.name if p.image else "None"}')
    print(f'Image URL field: {p.image_url}')
    print('---')
