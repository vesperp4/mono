# One-shot HLS packaging job, run as an Azure Container Apps Job per uploaded
# recording. Downloads a source MP4 from Blob, packages the fixed rendition
# ladder, uploads the HLS output back to Blob.
FROM alpine:3.20

RUN apk add --no-cache bash ffmpeg curl libc6-compat \
  && curl -fsSL https://aka.ms/downloadazcopy-v10-linux -o /tmp/azcopy.tgz \
  && tar -xzf /tmp/azcopy.tgz -C /tmp --strip-components=1 \
  && mv /tmp/azcopy /usr/local/bin/azcopy \
  && rm -rf /tmp/azcopy.tgz

COPY package.sh /usr/local/bin/package.sh
RUN chmod +x /usr/local/bin/package.sh

ENTRYPOINT ["/usr/local/bin/package.sh"]
