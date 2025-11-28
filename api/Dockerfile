FROM rust:1.88 as builder

WORKDIR /app

# Install necessary packages
RUN apt-get update && apt-get install -y \
    clang \
    lld \
    libssl-dev \
    pkg-config \
    build-essential

# Install sqlx-cli
# RUN cargo install sqlx-cli

COPY . .

# Enable offline mode for sqlx
ENV SQLX_OFFLINE=true

# Save queries
# RUN cargo sqlx prepare

RUN cargo build --release

FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/api /app/api
# Adjusted to match Goolge cloud run
EXPOSE 8080
CMD ["/app/api"]
