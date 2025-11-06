# react-svg-digraph

```shell
docker run --name rust-postgres-db \
--rm \
-e POSTGRES_PASSWORD=password \
-e POSTGRES_USER=postgres \
-e POSTGRES_DB=dev \
-p 5432:5432 \
-d postgres

-v pgdata:/var/lib/postgresql/data \

cargo install sqlx-cli --no-default-features --features native-tls,postgres

DATABASE_URL=postgres://<username>:<password>@<host>:<port>/<database>

cd api

sqlx database create
sqlx migrate run
cargo sqlx prepare

docker build .

# Create new migration file
sqlx migrate add create_table_contracts

```

