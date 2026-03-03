import { Precompile } from "./types/tx"

export const PRECOMPILES: Record<string, Precompile> = {
  "0x0000000000000000000000000000000000000001": {
    name: "ecrecover",
    abi: [
      {
        type: "function",
        name: "ecrecover",
        inputs: [
          { type: "bytes32", name: "hash" },
          { type: "uint8", name: "v" },
          { type: "bytes32", name: "r" },
          { type: "bytes32", name: "s" },
        ],
        outputs: [{ type: "address", name: "signer" }],
      },
    ],
  },
  "0x0000000000000000000000000000000000000002": {
    name: "sha256",
    abi: [
      {
        type: "function",
        name: "sha256",
        inputs: [{ type: "bytes", name: "data" }],
        outputs: [{ type: "bytes32", name: "hash" }],
      },
    ],
  },
  "0x0000000000000000000000000000000000000003": {
    name: "ripemd160",
    abi: [
      {
        type: "function",
        name: "ripemd160",
        inputs: [{ type: "bytes", name: "data" }],
        outputs: [{ type: "bytes20", name: "hash" }],
      },
    ],
  },
  "0x0000000000000000000000000000000000000004": {
    name: "identity",
    abi: [
      {
        type: "function",
        name: "identity",
        inputs: [{ type: "bytes", name: "data" }],
        outputs: [{ type: "bytes", name: "data" }],
      },
    ],
  },
  "0x0000000000000000000000000000000000000005": {
    name: "modexp",
    abi: [
      {
        type: "function",
        name: "modexp",
        inputs: [
          { type: "uint256", name: "Bsize" },
          { type: "uint256", name: "Esize" },
          { type: "uint256", name: "Msize" },
          { type: "bytes", name: "BEM" },
        ],
        outputs: [{ type: "bytes", name: "result" }],
      },
    ],
  },
  "0x0000000000000000000000000000000000000006": {
    name: "ecadd",
    abi: [
      {
        type: "function",
        name: "ecadd",
        inputs: [
          { type: "uint256", name: "x1" },
          { type: "uint256", name: "y1" },
          { type: "uint256", name: "x2" },
          { type: "uint256", name: "y2" },
        ],
        outputs: [
          { type: "uint256", name: "x" },
          { type: "uint256", name: "y" },
        ],
      },
    ],
  },
  "0x0000000000000000000000000000000000000007": {
    name: "ecmul",
    abi: [
      {
        type: "function",
        name: "ecmul",
        inputs: [
          { type: "uint256", name: "x1" },
          { type: "uint256", name: "y1" },
          { type: "uint256", name: "s" },
        ],
        outputs: [
          { type: "uint256", name: "x" },
          { type: "uint256", name: "y" },
        ],
      },
    ],
  },
  "0x0000000000000000000000000000000000000008": {
    name: "ecpairing",
    abi: [
      {
        type: "function",
        name: "ecpairing",
        inputs: [{ type: "bytes", name: "pairs" }],
        outputs: [{ type: "bool", name: "success" }],
      },
    ],
  },
  "0x0000000000000000000000000000000000000009": {
    name: "blake2f",
    abi: [
      {
        type: "function",
        name: "blake2f",
        inputs: [
          { type: "uint32", name: "rounds" },
          { type: "bytes64", name: "h" },
          { type: "bytes128", name: "m" },
          { type: "bytes16", name: "t" },
          { type: "bool", name: "f" },
        ],
        outputs: [{ type: "bytes64", name: "h" }],
      },
    ],
  },
}
