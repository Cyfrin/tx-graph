# react-svg-digraph


# Run locally

Run `postgres`
```shell
docker run --name rust-postgres-db \
--rm \
-e POSTGRES_PASSWORD=password \
-e POSTGRES_USER=postgres \
-e POSTGRES_DB=dev \
-p 5432:5432 \
-d postgres

# Optional persistent data storage
-v pgdata:/var/lib/postgresql/data \
```

Run `api` server
```
cargo install sqlx-cli --no-default-features --features native-tls,postgres

DATABASE_URL=postgres://<username>:<password>@<host>:<port>/<database>

cd api

sqlx database create
sqlx migrate run
cargo sqlx prepare

cargo run

# Build and run using docker
docker build . -t tx-graph-api
docker run --name tx-api --rm -p 8080:8080 --network host --env-file .env tx-graph-api

# Execute this command to create new migration file
sqlx migrate add create_table_contracts
```

Run `ui`
```shell
npm run dev
```
