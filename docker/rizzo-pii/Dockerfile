# Rizzo-PII: the service that removes personal data from a plan's text before it can go to Google.
# https://github.com/Rizzo-AI-Academy/rizzo-pii (MIT; the image also carries PyMuPDF, AGPL, unmodified).
#
# Same recipe as the upstream Dockerfile, but built from a PINNED commit of the repository and a
# PINNED model revision, so the image is the same tomorrow as today. To update: change both ARGs,
# rebuild, run tests/plan-import.test.cjs and the check in docs/research/rizzo-pii-valutazione.md.
#
#   docker build -t rizzo-pii docker/rizzo-pii
#
# CPU only; the model is baked in and HF_HUB_OFFLINE=1: nothing leaves at run time. No authentication:
# reach it only over the private network of the compose files, never publish its port.
FROM python:3.11-slim AS base

ARG RIZZO_COMMIT=9057eeff88bdf0444e5d3361cf0766b60c5b8a95
ARG MODEL_REPO=rizzoaiacademy/rizzo-pii-0.3B
ARG MODEL_REVISION=v1.5.0

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      libgomp1 ca-certificates git \
 && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip \
 && pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.13.0" \
 && pip install "transformers==5.14.1" tokenizers safetensors flask pymupdf gunicorn huggingface_hub

RUN python -c "from huggingface_hub import snapshot_download; \
snapshot_download('$MODEL_REPO', revision='$MODEL_REVISION', \
local_dir='/app/models/rizzo-pii-0.3B-v1.5.0', \
allow_patterns=['*.json','*.safetensors','*.txt','*.model'])"

# Only the application, at the pinned commit.
WORKDIR /app
RUN git clone --quiet --filter=blob:none https://github.com/Rizzo-AI-Academy/rizzo-pii.git /tmp/src \
 && git -C /tmp/src checkout --quiet "$RIZZO_COMMIT" \
 && mkdir -p /app/src && cp -r /tmp/src/src/app /app/src/app \
 && rm -rf /tmp/src

RUN useradd --create-home --uid 10001 app && chown -R app:app /app
USER app
ENV HOME=/home/app

ENV PII_HOST=0.0.0.0 \
    PII_PORT=5005 \
    HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1

EXPOSE 5005

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD python -c "import os,urllib.request,sys; \
sys.exit(0 if urllib.request.urlopen(f\"http://127.0.0.1:{os.environ['PII_PORT']}/health\", timeout=4).status==200 else 1)"

# One worker: the model is in memory once (about 1.2 GB per worker); threads give the parallelism.
CMD ["sh", "-c", "exec gunicorn --chdir /app/src/app --bind ${PII_HOST}:${PII_PORT} --workers 1 --threads 4 --timeout 600 --graceful-timeout 30 --access-logfile - --error-logfile - app:app"]
