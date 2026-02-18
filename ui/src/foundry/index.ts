import * as TxTypes from "../types/tx"
import * as FileTypes from "../types/file"
import { Tests, JsonFile } from "./types"

const LABELS: Record<string, string> = {
  "0x7109709ecfa91a80626ff3989d68f67f5b1dd12d": "Vm",
  "0x000000000000000000636f6e736f6c652e6c6f67": "console",
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

// Build TxCall
export function getTrace(mem: FileTypes.MemStore): TxTypes.TxCall | null {
  // @ts-ignore
  const tests: Tests = mem.get("trace")?.[0]?.data
  if (!tests) {
    return null
  }

  const txCalls: TxTypes.TxCall[] = []

  // key = path/to/test:TestContractName
  for (const [_, { test_results }] of Object.entries(tests)) {
    for (const [_, test] of Object.entries(test_results)) {
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
): TxTypes.ContractInfo[] {
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

  // Map label to ABI
  for (const [addr, label] of Object.entries(LABELS)) {
    const { abi } = files.get(`${label}.json`) || {}
    if (abi) {
      addrToAbi.set(addr, { name: label, abi })
    }
  }

  // Map deployed bytecode to ABI
  for (const [name, file] of files) {
    const bytecode = file?.deployedBytecode?.object
    // 0x
    if (bytecode?.length > 2) {
      bytecodeToAbi.set(bytecode, {
        name: name.replace(".json", ""),
        abi: file?.abi,
      })
    }
  }

  // Map address to ABI
  for (const [testContractName, { test_results }] of Object.entries(tests)) {
    for (const [_, test] of Object.entries(test_results)) {
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
            // Test contract address
            const name = testContractName.split(":")[1]
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
                  const { name, abi } = bytecodeToAbi.get(a.trace.output) || {}
                  if (name && abi) {
                    addrToAbi.set(a.trace.address, { name, abi })
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
      }

      // TODO: match interface by func selector (if only one func selector matches)
    }
  }

  // TODO: remove
  console.log("ADDR ABI", addrToAbi)

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
