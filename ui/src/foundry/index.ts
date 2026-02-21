import * as TxTypes from "../types/tx"
import * as FileTypes from "../types/file"
import { Tests, JsonFile } from "./types"
// ABI of console.sol is empty so import from here
import CONSOLE_ABI from "./console.json"

const CONSOLE_ADDR = "0x000000000000000000636f6e736f6c652e6c6f67"

const LABELS: Record<string, string> = {
  "0x7109709ecfa91a80626ff3989d68f67f5b1dd12d": "Vm",
  [CONSOLE_ADDR]: "console",
}

function dfs<A>(
  start: A,
  get: (a: A) => A[],
  f: (i: number, d: number, a: A) => void,
) {
  const q: [number, A][] = [[0, start]]

  let i = 0
  while (q.length > 0) {
    const [d, a] = q.pop() as [number, A]

    f(i, d, a)
    i++

    const next = get(a)
    // Reverse
    for (let j = next.length - 1; j >= 0; j--) {
      q.push([d + 1, next[j]])
    }
  }
}

// Zero out immutable variable byte ranges in a hex bytecode string
function mask(
  bytecode: string,
  refs: Record<string, Array<{ start: number; length: number }>>,
): string {
  const buf = [...bytecode]
  for (const positions of Object.values(refs)) {
    for (const { start, length } of positions) {
      // skip "0x"
      const hexStart = 2 + start * 2
      const hexLen = length * 2
      for (let i = hexStart; i < hexStart + hexLen; i++) {
        buf[i] = "0"
      }
    }
  }
  return buf.join("")
}

// Build TxCall
export function getTrace(mem: FileTypes.MemStore): TxTypes.TxCall | null {
  // @ts-ignore
  const tests: Tests = mem.get("trace")?.[0]?.data
  if (!tests) {
    return null
  }

  const txCalls: TxTypes.TxCall[] = []

  // key = path/to/test:TestContractName
  for (const [, { test_results }] of Object.entries(tests)) {
    for (const [, test] of Object.entries(test_results)) {
      for (const [step, { arena }] of test.traces) {
        if (step == "Setup" || step == "Execution") {
          const stack: TxTypes.TxCall[] = []
          // Create a nested TxCall
          dfs(
            arena[0].idx,
            (a) => arena[a].children,
            (i, d, a) => {
              const { trace } = arena[a]
              const call: TxTypes.TxCall = {
                from: trace.caller,
                to: trace.address,
                type: trace.kind,
                input: trace.data,
                output: trace.output,
                gas: trace.gas_limit.toString(),
                gasUsed: trace.gas_used.toString(),
                value: trace.value,
                error: trace.success ? "" : "error",
                calls: [],
              }

              while (stack.length >= d + 1) {
                stack.pop()
              }
              const parent = stack[stack.length - 1]
              if (parent?.calls) {
                parent.calls.push(call)
              }
              stack.push(call)
            },
          )
          txCalls.push(stack[0])
        }
      }
    }
  }

  const txCall: TxTypes.TxCall = {
    from: "foundry test",
    to: txCalls[0]?.from || "",
    type: "CALL",
    input: "",
    output: "",
    gas: "",
    gasUsed: "",
    value: "",
    calls: txCalls,
  }

  return txCall
}

export function getContracts(
  mem: FileTypes.MemStore,
  addrs: string[],
): TxTypes.ContractInfo<string>[] {
  // @ts-ignore
  const tests: Tests = mem.get("trace")?.[0]?.data
  if (!tests) {
    return []
  }

  const abis = mem.get("abi") || []
  // contract name => ABI
  const files = new Map<string, JsonFile>(
    abis.map((f) => [f.name, f.data as JsonFile]),
  )
  const addrToAbi = new Map<string, { name: string; abi: TxTypes.AbiEntry[] }>()
  const bytecodeToAbi = new Map<
    string,
    { name: string; abi: TxTypes.AbiEntry[] }
  >()
  // Contracts with immutable variables - need fuzzy matching
  const immutableBytecodes: Array<{
    bytecode: string
    name: string
    abi: TxTypes.AbiEntry[]
    refs: Record<string, Array<{ start: number; length: number }>>
  }> = []
  const selectorToAbis = new Map<
    string,
    Array<{ name: string; abi: TxTypes.AbiEntry[] }>
  >()
  const addrToSelectors = new Map<string, Set<string>>()

  // Map label to ABI
  for (const [addr, label] of Object.entries(LABELS)) {
    const { abi } =
      label == "console"
        ? { abi: CONSOLE_ABI }
        : files.get(`${label}.json`) || {}
    if (abi) {
      addrToAbi.set(addr, { name: label, abi })
    }
  }

  // Map deployed bytecode to ABI
  for (const [name, file] of files) {
    const bytecode = file?.deployedBytecode?.object
    // 0x
    if (bytecode?.length > 2) {
      const contractName = name.replace(".json", "")
      const refs = file?.deployedBytecode?.immutableReferences
      if (refs && Object.keys(refs).length > 0) {
        immutableBytecodes.push({
          bytecode,
          name: contractName,
          abi: file?.abi,
          refs,
        })
      } else {
        bytecodeToAbi.set(bytecode, {
          name: contractName,
          abi: file?.abi,
        })
      }
    }
  }

  // Map selector to ABI
  for (const [name, file] of files) {
    for (const [, selector] of Object.entries(file?.methodIdentifiers || {})) {
      if (!selectorToAbis.has(selector)) {
        selectorToAbis.set(selector, [])
      }
      const abis = selectorToAbis.get(selector)
      if (abis) {
        abis.push({
          name: name.replace(".json", ""),
          abi: file?.abi,
        })
      }
    }
  }

  // Map address to ABI
  for (const [testPath, { test_results }] of Object.entries(tests)) {
    for (const [, test] of Object.entries(test_results)) {
      if (test.labeled_addresses) {
        for (const [addr, name] of Object.entries(test.labeled_addresses)) {
          const { abi } = files.get(`${name}.json`) || {}
          if (abi) {
            addrToAbi.set(addr, { name, abi })
          }
        }
      }

      for (const [step, { arena }] of test.traces) {
        switch (step) {
          case "Deployment": {
            // Test contract name
            const name = testPath.split(":")[1]
            const addr = arena[0].trace.address
            const { abi } = files.get(`${name}.json`) || {}
            if (abi) {
              addrToAbi.set(addr, { name, abi })
            }
            break
          }
          case "Setup":
          case "Execution": {
            // Find deployed contracts, match to deployed bytecode
            for (const a of arena) {
              if (a.trace.kind == "CREATE" || a.trace.kind == "CREATE2") {
                if (!addrToAbi.has(a.trace.address)) {
                  // Exact match (no immutables)
                  const exact = bytecodeToAbi.get(a.trace.output)
                  if (exact) {
                    addrToAbi.set(a.trace.address, exact)
                    continue
                  }
                  // Fuzzy match - zero out immutable byte ranges then compare
                  for (const entry of immutableBytecodes) {
                    if (a.trace.output.length !== entry.bytecode.length) {
                      continue
                    }
                    const masked = mask(a.trace.output, entry.refs)
                    if (masked == entry.bytecode) {
                      addrToAbi.set(a.trace.address, {
                        name: entry.name,
                        abi: entry.abi,
                      })
                      break
                    }
                  }
                }
              }
            }
            break
          }
          default: {
            break
          }
        }

        // Map address to selectors
        for (const a of arena) {
          if (a.trace.kind == "CALL" || a.trace.kind == "STATICCALL") {
            const selector = a.trace.data.slice(2, 10)
            if (selector) {
              if (!addrToSelectors.has(a.trace.address)) {
                addrToSelectors.set(a.trace.address, new Set())
              }
              addrToSelectors.get(a.trace.address)?.add(selector)
            }
          }
        }
      }
    }
  }

  // Map address to ABI
  for (const addr of addrs) {
    if (addrToAbi.get(addr)) {
      continue
    }

    const selectors = addrToSelectors.get(addr)
    if (!selectors) {
      continue
    }

    // Select ABI with highest match to selectors that were
    // actually called on an address
    let bestMatch: { name: string; abi: TxTypes.AbiEntry[] } | null = null
    let bestCount = 0

    for (const [name, file] of files) {
      const methodSelectors = new Set(
        Object.values(file?.methodIdentifiers || {}),
      )
      let count = 0
      for (const s of selectors) {
        if (methodSelectors.has(s)) count++
      }
      if (count > bestCount) {
        bestCount = count
        bestMatch = { name: name.replace(".json", ""), abi: file?.abi }
      }
    }

    if (bestMatch && bestCount > 0) {
      addrToAbi.set(addr, bestMatch)
    }
  }

  return addrs.map((addr) => {
    const val = addrToAbi.get(addr)
    if (val) {
      return {
        chain: "foundry-test",
        address: addr,
        name: val.name,
        abi: val.abi || null,
      }
    } else {
      return {
        chain: "foundry-test",
        address: addr,
      }
    }
  })
}
