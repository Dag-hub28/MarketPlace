# Stage 1 - Build React frontend
FROM node:20-alpine as builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
ENV NODE_ENV=production
RUN npm run build

# Stage 2 - Django backend
FROM python:3.11

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .

COPY --from=builder /frontend/dist ./dist

EXPOSE 8000

ENV SECRET_KEY=temp-build-key-not-for-production

RUN python manage.py collectstatic --noinput

CMD ["sh", "-c", "python manage.py migrate && gunicorn backend.wsgi:application --bind 0.0.0.0:8000"]