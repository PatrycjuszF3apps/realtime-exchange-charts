# Dockerfile – Ubuntu 24.04 – Node.js 22 LTS
FROM ubuntu:24.04

ARG UID=1000
ARG GID=1000

SHELL ["/bin/bash", "-c"]

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 LC_ALL=C.UTF-8 \
    TERM=xterm-256color

# System tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gnupg2 curl wget ca-certificates \
        build-essential git mc nano \
    && rm -rf /var/lib/apt/lists/*

# Node.js 22.x LTS
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# Create non-root user
RUN userdel -r ubuntu 2>/dev/null || true && groupdel ubuntu 2>/dev/null || true
RUN groupadd -g ${GID} dev && \
    useradd -u ${UID} -g ${GID} -m -s /bin/bash dev

RUN sed -i 's/^#force_color_prompt=yes/force_color_prompt=yes/' /home/dev/.bashrc && \
    echo "alias ll='ls -alF'" >> /home/dev/.bashrc

WORKDIR /app
RUN chown -R dev:dev /app

COPY --chown=dev:dev package.json package-lock.json* ./

USER dev

CMD ["/bin/bash"]
