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

sqlx database create
sqlx migrate run

# Create new migration file
sqlx migrate add create_table_contracts

```

### Memo

https://app.blocksec.com/explorer/tx/eth/0x69b09bf5d3bf96cc8bb4871d5423512738dc112684aecb33ea40cc15c71ea3f6

https://www.quicknode.com/docs/ethereum/debug_traceTransaction

https://github.com/openchainxyz/openchain-monorepo/tree/main
